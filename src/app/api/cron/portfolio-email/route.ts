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
    const otherAssets = assets.filter(a => !['STOCK', 'FUND'].includes(a.asset_type));

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekRange = `${weekStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const renderAssetRows = (assetList: PortfolioAsset[]) => {
        if (assetList.length === 0) return '<tr><td colspan="3" style="padding: 12px; color: #94a3b8; font-size: 13px; text-align: center;">Henüz varlık yok</td></tr>';
        return assetList.map(a => `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #e2e8f0; font-weight: 600; font-size: 14px;">${a.symbol}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px; text-align: center;">${a.quantity} Adet</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px; text-align: right;">₺${(a.avg_cost * a.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            </tr>
        `).join('');
    };

    const renderAISection = () => {
        if (!aiAnalysis) return '';

        const renderAssetAnalysisRows = () => {
            return aiAnalysis.assetAnalyses.map(analysis => `
                <div style="background-color: #0d1b2a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="color: #3b82f6; font-weight: 700; font-size: 16px;">${analysis.symbol}</span>
                        <span style="background-color: ${analysis.trend === 'up' ? 'rgba(34, 197, 94, 0.2)' : analysis.trend === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)'}; color: ${analysis.trend === 'up' ? '#22c55e' : analysis.trend === 'down' ? '#ef4444' : '#94a3b8'}; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">
                            Puan: ${analysis.score}/10
                        </span>
                    </div>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0 0 8px; line-height: 1.5;">${analysis.reason}</p>
                    <div style="border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 8px;">
                         <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.4;">
                            <strong style="color: #60a5fa;">💡 Beklenti:</strong> ${analysis.outlook}
                         </p>
                    </div>
                </div>
            `).join('');
        };

        return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; margin-top: 10px;">
                <tr>
                    <td style="background: linear-gradient(135deg, #1e1b4b, #0f172a); border-radius: 12px; padding: 24px; border: 1px solid rgba(124, 58, 237, 0.3);">
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <span style="font-size: 20px; margin-right: 10px;">🤖</span>
                            <h3 style="margin: 0; color: #a78bfa; font-size: 18px; font-weight: 700;">FinAi Robotum Analizi</h3>
                        </div>
                        <div style="background-color: rgba(30, 41, 59, 0.6); border: 1px solid #334155; padding: 16px; margin-bottom: 16px; border-radius: 8px;">
                            <p style="color: #94a3b8; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 6px;">🌍 Piyasalar & Trendler</p>
                            <p style="color: #cbd5e1; font-size: 13px; margin: 0; line-height: 1.5;">${aiAnalysis.generalMarketOverview}</p>
                        </div>
                        <div style="background-color: rgba(139, 92, 246, 0.1); border-left: 3px solid #8b5cf6; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
                            <p style="color: #e2e8f0; font-size: 14px; margin: 0; line-height: 1.6;">${aiAnalysis.portfolioAssessment}</p>
                        </div>
                        <h4 style="color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Varlık Detayları</h4>
                        ${renderAssetAnalysisRows()}
                        <div style="margin-top: 20px; background-color: #0f172a; padding: 16px; border-radius: 8px;">
                            <p style="color: #fbbf24; font-size: 12px; font-weight: 700; margin: 0 0 8px; text-transform: uppercase;">⚡ Öneriler</p>
                            <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 13px;">
                                ${aiAnalysis.suggestions.map(s => `<li style="margin-bottom: 4px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                    </td>
                </tr>
            </table>
        `;
    };

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
                                    İşte <strong style="color: #94a3b8;">${weekRange}</strong> dönemi için hazırladığımız rapor:
                                </p>
                                ${renderAISection()}
                                ${includePortfolioDetails ? `
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1e3a5f, #0f2744); border-radius: 12px; padding: 20px; text-align: center; width: 50%; border: 1px solid rgba(59,130,246,0.2);">
                                            <p style="color: #64748b; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Toplam Varlık</p>
                                            <p style="color: #3b82f6; font-size: 28px; font-weight: 800; margin: 8px 0 0;">${assets.length}</p>
                                        </td>
                                        <td style="width: 12px;"></td>
                                        <td style="background: linear-gradient(135deg, #1a3a2a, #0f2618); border-radius: 12px; padding: 20px; text-align: center; width: 50%; border: 1px solid rgba(34,197,94,0.2);">
                                            <p style="color: #64748b; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Portföy Tipi</p>
                                            <p style="color: #22c55e; font-size: 14px; font-weight: 700; margin: 8px 0 0;">${stockAssets.length} Hisse • ${fundAssets.length} Fon</p>
                                        </td>
                                    </tr>
                                </table>
                                ${stockAssets.length > 0 ? `
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background: #0b1222; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                                    <tr>
                                        <td colspan="3" style="padding: 14px 16px; background: linear-gradient(90deg, #1e3a5f, #0f2744); border-bottom: 1px solid #1e293b;"><span style="color: #3b82f6; font-size: 13px; font-weight: 700;">📈 HİSSELER</span></td>
                                    </tr>
                                    ${renderAssetRows(stockAssets)}
                                </table>` : ''}
                                ${fundAssets.length > 0 ? `
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background: #0b1222; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
                                    <tr>
                                        <td colspan="3" style="padding: 14px 16px; background: linear-gradient(90deg, #1a3a2a, #0f2618); border-bottom: 1px solid #1e293b;"><span style="color: #22c55e; font-size: 13px; font-weight: 700;">🏦 FONLAR</span></td>
                                    </tr>
                                    ${renderAssetRows(fundAssets)}
                                </table>` : ''}
                                ` : ''}
                                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px auto 0;">
                                    <tr>
                                        <td align="center" style="background: linear-gradient(135deg, #2563eb, #3b82f6); border-radius: 12px;">
                                            <a href="https://finai.net.tr/dashboard/portfolio" target="_blank" style="display: inline-block; padding: 14px 40px; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">Portföyümü Görüntüle →</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #060f1d; padding: 24px 32px; text-align: center;">
                                <p style="color: #334155; font-size: 11px; margin: 0; line-height: 1.6;">© 2026 FinAl — Yapay Zeka ile Akıllı Yatırım</p>
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
        const { userId, sendEmail = false, includeAnalysis = false, includePortfolioDetails = true } = body;

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
            // Get specific user
            const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(userId);
            if (userData?.user) {
                targetUsers.push({
                    id: userData.user.id,
                    email: userData.user.email || '',
                    name: userData.user.user_metadata?.full_name || userData.user.user_metadata?.first_name || 'Değerli Kullanıcı',
                    instructionLabel: 'Manuel Rapor',
                    preferences: {
                        includeAnalysis,
                        includePortfolioDetails
                    }
                });
            }
        } else {
            // Get all unique user IDs from portfolios
            const { data: portfolioUsers, error } = await getSupabaseAdmin()
                .from('user_portfolios')
                .select('user_id');

            if (error) throw error;

            const uniqueUserIds = [...new Set(portfolioUsers?.map(p => p.user_id) || [])];

            for (const uid of uniqueUserIds) {
                const { data: userData } = await getSupabaseAdmin().auth.admin.getUserById(uid);
                if (userData?.user?.email) {
                    const metadata = userData.user.user_metadata || {};
                    const instructions: any[] = [];

                    if (Array.isArray(metadata.report_instructions)) {
                        instructions.push(...metadata.report_instructions);
                    } else if (metadata.report_settings && metadata.report_settings.frequency !== 'none') {
                        instructions.push({ ...metadata.report_settings, label: 'Genel Rapor' });
                    }

                    for (const inst of instructions) {
                        if (inst.frequency === 'none') continue;
                        targetUsers.push({
                            id: userData.user.id,
                            email: userData.user.email,
                            name: metadata.full_name || metadata.first_name || 'Değerli Kullanıcı',
                            instructionLabel: inst.label || 'Portföy Raporu',
                            preferences: {
                                includeAnalysis: inst.includeAnalysis ?? includeAnalysis,
                                includePortfolioDetails: inst.includePortfolioDetails ?? includePortfolioDetails
                            }
                        });
                    }
                }
            }
        }

        const results: { email: string; status: string; assetCount: number }[] = [];
        let previewHtml = '';

        for (const user of targetUsers) {
            const { data: assets, error: assetError } = await getSupabaseAdmin()
                .from('user_portfolios')
                .select('symbol, asset_type, quantity, avg_cost')
                .eq('user_id', user.id);

            if (assetError || !assets || assets.length === 0) {
                results.push({ email: user.email, status: 'skipped_no_assets', assetCount: 0 });
                continue;
            }

            const useAI = user.preferences?.includeAnalysis ?? includeAnalysis;
            const useTable = user.preferences?.includePortfolioDetails ?? includePortfolioDetails;

            let aiAnalysis: PortfolioAIAnalysis | null = null;
            if (useAI) {
                const reportAssets: Asset[] = assets.map(a => ({
                    symbol: a.symbol, amount: a.quantity,
                    type: a.asset_type === 'FUND' ? 'fund' : 'stock'
                }));
                const weeklyReport = await generateWeeklyReport(reportAssets);
                const analysisInput = weeklyReport.assets.map(a => ({
                    symbol: a.symbol, changePercent: a.changePercent,
                    type: assets.find(orig => orig.symbol === a.symbol)?.asset_type || 'STOCK'
                }));
                aiAnalysis = await analyzePortfolioWithAI(analysisInput);
            }

            const emailHtml = generatePortfolioEmailHtml(user.name, assets, aiAnalysis, useTable);

            if (results.length === 0) previewHtml = emailHtml;

            if (sendEmail) {
                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                    try {
                        const emailRes = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                from: 'FinAl <onboarding@resend.dev>',
                                to: [user.email],
                                subject: `📊 FinAl — ${user.instructionLabel || 'Portföy Raporu'}`,
                                html: emailHtml,
                            }),
                        });

                        if (emailRes.ok) {
                            results.push({ email: user.email, status: 'sent', assetCount: assets.length });
                        } else {
                            const errData = await emailRes.json().catch(() => ({}));
                            results.push({ email: user.email, status: `error: ${errData.message || 'Resend error'}`, assetCount: assets.length });
                        }
                    } catch (sendErr: any) {
                        results.push({ email: user.email, status: `error: ${sendErr.message}`, assetCount: assets.length });
                    }
                } else {
                    results.push({ email: user.email, status: 'skipped_no_resend_key', assetCount: assets.length });
                }
            } else {
                results.push({ email: user.email, status: 'preview_only', assetCount: assets.length });
            }
        }

        return NextResponse.json({ success: true, totalUsers: targetUsers.length, results, htmlPreview: previewHtml });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return await POST(new Request(req.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmail: true })
    }));
}
