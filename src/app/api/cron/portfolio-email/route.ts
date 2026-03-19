import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { analyzePortfolioWithAI, PortfolioAIAnalysis } from '@/lib/ai-portfolio-analyzer';
import { generateWeeklyReport, Asset } from '@/lib/report-generator';

export const maxDuration = 60; // Increase timeout for AI processing
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

function generatePortfolioEmailHtml(userName: string, reportData: any): string {
    // Content wiped per user request. To be rewritten.
    return `
    <html>
    <body>
        <h1>Merhaba ${userName}</h1>
        <p>Gelişmiş rapor içeriğiniz hazırlanmaktadır.</p>
    </body>
    </html>
    `;
}




export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { userId, sendEmail = false, isCron = false, reportType = 'basic' } = body;

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
                            // 1. Time Check
                            const preferredHour = inst.preferredTime ? parseInt(inst.preferredTime.split(':')[0]) : 9;
                            if (currentHour !== preferredHour) continue;

                            // 2. Day/Date Check
                            let shouldSend = false;
                            if (inst.frequency === 'weekly') {
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

        for (const user of targetUsers) {
            const { data: dbAssets } = await getSupabaseAdmin()
                .from('user_portfolios')
                .select('symbol, asset_type, quantity, avg_cost')
                .eq('user_id', user.id);

            if (!dbAssets || dbAssets.length === 0) continue;

            // Group by symbol to avoid duplicates in the report
            const groupedMap: Record<string, { symbol: string, amount: number, type: string }> = {};

            dbAssets.forEach(a => {
                const symbol = a.symbol.toUpperCase();
                if (!groupedMap[symbol]) {
                    // Smart type detection: 3 letter uppercase usually means TEFAS fund
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
            console.log(`Analyzing portfolio for ${user.email}:`, mappedAssets);

            // Generate full report data (includes prices and Gemini analysis)
            const reportData = await generateWeeklyReport(mappedAssets);

            // If the report generator skipped analysis for some reason, ensure we have a fallback
            if (!reportData.structuredAnalysis && mappedAssets.length > 0) {
                console.warn("AI Analysis missed structured output, retrying/fallback needed.");
            }

            // Generate the sophisticated HTML
            const emailHtml = generatePortfolioEmailHtml(
                user.name,
                reportData
            );

            if (!firstPreview) firstPreview = emailHtml;

            if (sendEmail) {
                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'Yatırımcım <onboarding@resend.dev>',
                            to: [user.email],
                            subject: `📊 Yatırımcım — ${user.instructionLabel || 'Robotu Raporu'}`,
                            html: emailHtml,
                        }),
                    });
                    stats.sent++;
                }
            }
        }

        return NextResponse.json({ success: true, stats, htmlPreview: firstPreview });
    } catch (e: any) {
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
