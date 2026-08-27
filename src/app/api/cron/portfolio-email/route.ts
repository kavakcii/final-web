import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateWeeklyReport, generateEmailHtml, Asset } from '@/lib/report-generator';

export const maxDuration = 120; // Increase timeout for AI processing (Next.js config)
export const dynamic = 'force-dynamic';

// Lazy-init admin client
let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) throw new Error('Supabase yapılandırması eksik');
        _supabaseAdmin = createClient(url, key);
    }
    return _supabaseAdmin;
}

interface PortfolioAsset {
    symbol: string;
    asset_type: string;
    quantity: number;
    avg_cost: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { userId, sendEmail = false, isCron = false } = body;

        // Current TR time (UTC+3)
        const trTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
        const currentDay = trTime.getDay(); // 0-6
        const currentHour = trTime.getHours();
        const currentDate = trTime.getDate();
        const currentMonth = trTime.getMonth();

        const targetUsers: {
            id: string;
            email: string;
            name: string;
            instructionLabel?: string;
            preferences?: {
                includeAnalysis: boolean;
                includePortfolioDetails: boolean;
                reportType?: string;
            }
        }[] = [];

        if (userId) {
            // Manual test / single run
            const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
            if (userData?.user) {
                targetUsers.push({
                    id: userData.user.id,
                    email: userData.user.email || '',
                    name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.first_name || 'Değerli Kullanıcı',
                    instructionLabel: 'Manuel Rapor',
                    preferences: {
                        includeAnalysis: body.includeAnalysis ?? true,
                        includePortfolioDetails: body.includePortfolioDetails ?? true,
                        reportType: body.reportType || 'basic'
                    }
                });
            }
        } else {
            // Automated run for all users matching timeframe
            const { data: portfolioUsers } = await getSupabaseAdmin().from('user_portfolios').select('user_id');
            const uniqueUserIds = [...new Set(portfolioUsers?.map(p => p.user_id) || [])];

            for (const uid of uniqueUserIds) {
                const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(uid);
                if (userData?.user?.email) {
                    const metadata = userData.user.user_metadata || {};
                    const instructions: any[] = metadata.report_instructions || [];

                    for (const inst of instructions) {
                        if (inst.frequency === 'none') continue;

                        if (isCron) {
                            // 1. Time Check (preferredTime e.g., '09:00')
                            const preferredHour = inst.preferredTime ? parseInt(inst.preferredTime.split(':')[0], 10) : 9;
                            if (currentHour !== preferredHour) continue;

                            // 2. Day/Date Check based on frequency
                            let shouldSend = false;
                            
                            if (inst.frequency === 'daily') {
                                shouldSend = true;
                            } else if (inst.frequency === 'weekly') {
                                const preferredDay = inst.preferredDay !== undefined ? inst.preferredDay : 1;
                                if (currentDay === preferredDay) shouldSend = true;
                            } else if (inst.frequency === 'biweekly') {
                                if (currentDate === 1 || currentDate === 15) shouldSend = true;
                            } else {
                                // For monthly, quarterly, semiannually, annually
                                const preferredDate = inst.preferredDate !== undefined ? inst.preferredDate : 1;

                                if (inst.frequency === 'monthly') {
                                    if (currentDate === preferredDate) shouldSend = true;
                                } else if (inst.frequency === 'quarterly') {
                                    if (currentDate === preferredDate && [0, 3, 6, 9].includes(currentMonth)) shouldSend = true;
                                } else if (inst.frequency === 'semiannually') {
                                    if (currentDate === preferredDate && [0, 6].includes(currentMonth)) shouldSend = true;
                                } else if (inst.frequency === 'annually') {
                                    if (currentDate === preferredDate && currentMonth === 0) shouldSend = true;
                                }
                            }

                            if (!shouldSend) continue;
                        }

                        targetUsers.push({
                            id: userData.user.id,
                            email: userData.user.email,
                            name: metadata.full_name || metadata.first_name || 'Değerli Kullanıcı',
                            instructionLabel: inst.label || 'Portföy Raporu',
                            preferences: {
                                includeAnalysis: inst.includeAnalysis ?? true,
                                includePortfolioDetails: inst.includePortfolioDetails ?? true,
                                reportType: inst.type || 'basic'
                            }
                        });
                    }
                }
            }
        }

        const stats = { sent: 0, total: targetUsers.length };
        let firstPreview = '';

        for (let i = 0; i < targetUsers.length; i++) {
            const user = targetUsers[i];

            // Throttling to respect Gemini API rate limits (15 RPM)
            if (i > 0) {
                console.log("Sleeping to prevent rate-limit...");
                await sleep(4000); // 4 seconds delay between user reports
            }

            const { data: dbAssets } = await getSupabaseAdmin()
                .from('user_portfolios')
                .select('symbol, asset_type, quantity, avg_cost')
                .eq('user_id', user.id);

            if (!dbAssets || dbAssets.length === 0) continue;

            // Group by symbol to prevent duplicates
            const groupedMap: Record<string, { symbol: string, amount: number, type: string }> = {};

            dbAssets.forEach(a => {
                const symbol = a.symbol.toUpperCase();
                if (!groupedMap[symbol]) {
                    let detectedType = a.asset_type.toLowerCase();
                    if (symbol.length === 3) detectedType = 'fund';

                    groupedMap[symbol] = {
                        symbol,
                        amount: 0,
                        type: detectedType === 'stock' ? 'stock' : detectedType === 'fund' ? 'fund' : detectedType === 'crypto' ? 'crypto' : 'gold'
                    };
                }
                groupedMap[symbol].amount += Number(a.quantity);
            });

            const mappedAssets: Asset[] = Object.values(groupedMap) as Asset[];
            console.log(`Generating report for ${user.email}:`, mappedAssets);

            // Generate report with daily, weekly, monthly pricing and causal AI explanation
            const reportData = await generateWeeklyReport(mappedAssets);

            // Generate responsive HTML
            const emailHtml = generateEmailHtml(reportData, user.name);

            if (!firstPreview) firstPreview = emailHtml;

            if (sendEmail) {
                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                    const fromEmail = process.env.RESEND_FROM_EMAIL || 'rapor@finalyatirim.com';
                    const res = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: `Yatırımcım <${fromEmail}>`,
                            to: [user.email],
                            subject: `📊 Yatırımcım — ${user.instructionLabel || 'FinAi Raporu'}`,
                            html: emailHtml,
                        }),
                    });

                    if (res.ok) {
                        stats.sent++;
                        console.log(`Email successfully sent to ${user.email}`);
                    } else {
                        const errText = await res.text();
                        console.error(`Resend API error sending to ${user.email}:`, errText);
                    }
                } else {
                    console.warn("RESEND_API_KEY is missing, skipping email sending.");
                }
            }
        }

        return NextResponse.json({ success: true, stats, htmlPreview: firstPreview });
    } catch (e: any) {
        console.error("Email API Route error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return await POST(new Request(req.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: true, isCron: true })
    }));
}
