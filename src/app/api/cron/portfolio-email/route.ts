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

function generatePortfolioEmailHtml(userName: string, reportData: any, includeAnalysis: boolean = true, includePortfolioDetails: boolean = true): string {
    const { assets, aiSummary, portfolioScore, weeklyChangePercent, structuredAnalysis } = reportData;

    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 32px; overflow: hidden; background-color: #0f172a; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 50px 100px -20px rgba(0,0,0,0.8);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 60px 40px; text-align: center;">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="background: rgba(255,255,255,0.15); border-radius: 20px; padding: 16px; backdrop-filter: blur(10px);">
                                            <span style="font-size: 32px;">🤖</span>
                                        </td>
                                    </tr>
                                </table>
                                <h1 style="color: #ffffff; font-size: 36px; font-weight: 900; margin: 24px 0 8px; letter-spacing: -1.5px;">Fin<span style="color: #bfdbfe;">AI</span> Robotum</h1>
                                <p style="color: #dbeafe; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; font-weight: 700; opacity: 0.9; margin: 0;">HAFTALIK PORTFÖY RAPORU</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 48px 40px;">
                                <p style="color: #f1f5f9; font-size: 20px; margin: 0 0 12px; font-weight: 600;">Merhaba ${userName} 👋</p>
                                
                                <!-- Summary Cards -->
                                <div style="margin: 24px 0 40px;">
                                    <h3 style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; font-weight: 800;">PORTFÖY DURUMU</h3>
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="48%" style="background: #1e293b; border-radius: 24px; padding: 28px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                                <p style="color: #64748b; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Genel Puan</p>
                                                <p style="color: #3b82f6; font-size: 40px; font-weight: 900; margin: 0;">${portfolioScore}<span style="font-size: 16px; color: #475569;">/10</span></p>
                                            </td>
                                            <td width="4%"></td>
                                            <td width="48%" style="background: #1e293b; border-radius: 24px; padding: 28px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                                                <p style="color: #64748b; font-size: 11px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Haftalık Değişim</p>
                                                <p style="color: ${weeklyChangePercent >= 0 ? '#10b981' : '#f43f5e'}; font-size: 36px; font-weight: 900; margin: 0;">
                                                    ${weeklyChangePercent >= 0 ? '+' : ''}${weeklyChangePercent.toFixed(2)}%
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                ${includeAnalysis && structuredAnalysis ? `
                                <!-- Market Overview -->
                                <div style="margin-bottom: 40px;">
                                    <h3 style="color: #ffffff; font-size: 16px; margin: 0 0 16px; font-weight: 700;">Geçen Hafta Ne Oldu?</h3>
                                    <p style="color: #94a3b8; font-size: 15px; line-height: 1.8; margin: 0;">
                                        ${structuredAnalysis.marketOverview}
                                    </p>
                                </div>

                                <!-- Portfolio Commentary -->
                                <div style="background: rgba(139, 92, 246, 0.1); border-left: 4px solid #8b5cf6; padding: 24px; border-radius: 0 24px 24px 0; margin-bottom: 48px;">
                                    <p style="color: #e2e8f0; font-size: 15px; line-height: 1.8; margin: 0;">
                                        ${structuredAnalysis.portfolioAssessment}
                                    </p>
                                </div>

                                <!-- Detailed Asset Analysis -->
                                <h3 style="color: #ffffff; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 24px; font-weight: 800;">VARLIK DETAYLARI</h3>
                                
                                ${structuredAnalysis.assetAnalyses.map((analysis: any) => `
                                <div style="background: #1e293b; border-radius: 24px; padding: 32px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 24px;">
                                    <div style="margin-bottom: 16px;">
                                        <span style="color: #3b82f6; font-size: 20px; font-weight: 900; margin-right: 12px;">${analysis.symbol}</span>
                                        <span style="background: ${analysis.score >= 7 ? '#065f46' : analysis.score >= 5 ? '#92400e' : '#7f1d1d'}; color: #ffffff; font-size: 11px; padding: 4px 10px; border-radius: 8px; font-weight: 800; text-transform: uppercase;">
                                            Puan: ${analysis.score}/10
                                        </span>
                                    </div>
                                    <p style="color: #e2e8f0; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
                                        ${analysis.reason}
                                    </p>
                                    <div style="padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05);">
                                        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0;">
                                            <span style="font-size: 16px; margin-right: 6px;">💡</span>
                                            <strong style="color: #60a5fa;">Beklenti:</strong> ${analysis.outlook}
                                        </p>
                                    </div>
                                </div>
                                `).join('')}
                                ` : ''}

                                <!-- CTA -->
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 48px auto 0;">
                                    <tr>
                                        <td align="center" style="background: #3b82f6; border-radius: 20px; box-shadow: 0 20px 40px -10px rgba(59,130,246,0.5);">
                                            <a href="https://finai.net.tr/dashboard/portfolio" target="_blank" style="display: inline-block; padding: 20px 56px; color: #ffffff; font-size: 16px; font-weight: 800; text-decoration: none; letter-spacing: 0.5px;">Portföyümü Yönet →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #020617; padding: 40px; text-align: center;">
                                <p style="color: #475569; font-size: 11px; margin: 0 0 20px; line-height: 1.8;">
                                    Bu analizler robotumuz tarafından oluşturulmuştur ve yatırım tavsiyesi değildir.<br>
                                    © 2026 FinAl Labs. Sizin İçin Akıllı Yatırım.
                                </p>
                                <div style="height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 20px;"></div>
                                <p style="color: #334155; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">
                                    AI Destekli Finansal Özgürlük
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}




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

        let targetUsers: {
            id: string;
            email: string;
            name: string;
            instructionLabel?: string;
            preferences?: {
                includeAnalysis: boolean;
                includePortfolioDetails: boolean;
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
                        includePortfolioDetails: body.includePortfolioDetails ?? true
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
                                includePortfolioDetails: inst.includePortfolioDetails ?? true
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
                reportData,
                user.preferences?.includeAnalysis ?? true,
                user.preferences?.includePortfolioDetails ?? true
            );

            if (!firstPreview) firstPreview = emailHtml;

            if (sendEmail) {
                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            from: 'FinAl <onboarding@resend.dev>',
                            to: [user.email],
                            subject: `📊 FinAl — ${user.instructionLabel || 'Robotu Raporu'}`,
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
