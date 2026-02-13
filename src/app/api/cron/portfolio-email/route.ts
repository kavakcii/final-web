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

function generatePortfolioEmailHtml(userName: string, assets: PortfolioAsset[], aiAnalysis: PortfolioAIAnalysis | null = null, includePortfolioDetails: boolean = true): string {
    const stockAssets = assets.filter(a => a.asset_type === 'STOCK');
    const fundAssets = assets.filter(a => a.asset_type === 'FUND');

    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #0a0e1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0e1a; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #0a192f 0%, #1e3a5f 50%, #2563eb 100%); padding: 40px 32px; text-align: center;">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td style="background: rgba(59,130,246,0.2); border: 1px solid rgba(59,130,246,0.4); border-radius: 12px; padding: 10px 14px;">
                                            <span style="font-size: 22px;">📊</span>
                                        </td>
                                        <td style="padding-left: 14px;">
                                            <span style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Fin</span><span style="color: #3b82f6; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Al</span>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Portföy Raporu</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #0f172a; padding: 32px;">
                                <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 4px;">Merhaba <strong style="color: #ffffff;">${userName}</strong> 👋</p>
                                <p style="color: #64748b; font-size: 14px; margin: 0 0 24px; line-height: 1.6;">
                                    Zamanladığınız raporunuz hazır:
                                </p>
                                <!-- AI Content Placeholder Render -->
                                ${aiAnalysis ? '<!-- AI Analysis Here -->' : ''}
                                ${includePortfolioDetails ? `
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1e3a5f, #0f2744); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(59,130,246,0.2);">
                                            <p style="color: #64748b; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Toplam Varlık</p>
                                            <p style="color: #3b82f6; font-size: 28px; font-weight: 800; margin: 8px 0 0;">${assets.length}</p>
                                        </td>
                                    </tr>
                                </table>` : ''}
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto 0;">
                                    <tr>
                                        <td align="center" style="background: linear-gradient(135deg, #2563eb, #3b82f6); border-radius: 12px;">
                                            <a href="https://finai.net.tr/dashboard/portfolio" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">Detaylar İçin Tıklayın →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #060f1d; padding: 24px 32px; text-align: center; color: #334155; font-size: 11px;">
                                © 2026 FinAl — Robotunuz Sizin İçin Çalışıyor
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
                            // 1. Time Check (Always check if current hour matches preferred hour)
                            // inst.preferredTime is "HH:mm"
                            const preferredHour = inst.preferredTime ? parseInt(inst.preferredTime.split(':')[0]) : 9;
                            if (currentHour !== preferredHour) continue;

                            // 2. Day/Date Check
                            let shouldSend = false;
                            if (inst.frequency === 'weekly') {
                                const preferredDay = inst.preferredDay !== undefined ? inst.preferredDay : 1; // Default Monday
                                if (currentDay === preferredDay) shouldSend = true;
                            } else if (inst.frequency === 'biweekly') {
                                if (currentDate === 1 || currentDate === 15) shouldSend = true;
                            } else if (inst.frequency === 'monthly') {
                                if (currentDate === 1) shouldSend = true;
                            } else if (inst.frequency === 'quarterly') {
                                if (currentDate === 1 && [0, 3, 6, 9].includes(currentMonth)) shouldSend = true;
                            } else if (inst.frequency === 'semiannually') {
                                if (currentDate === 1 && [0, 6].includes(currentMonth)) shouldSend = true;
                            } else if (inst.frequency === 'annually') {
                                if (currentDate === 1 && currentMonth === 0) shouldSend = true;
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
            const { data: assets } = await getSupabaseAdmin().from('user_portfolios').select('symbol, asset_type, quantity, avg_cost').eq('user_id', user.id);
            if (!assets || assets.length === 0) continue;

            // ... generation logic ...
            const emailHtml = generatePortfolioEmailHtml(user.name, assets, null, user.preferences?.includePortfolioDetails);
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
                            subject: `📊 FinAl — ${user.instructionLabel || 'Raporunuz'}`,
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
