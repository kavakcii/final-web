'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, Mail, Send, Clock, CheckCircle, AlertCircle, Eye, Bell, BellOff, Bot, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/providers/UserProvider';

type EmailFrequency = 'weekly' | 'biweekly' | 'monthly' | 'none';

const FREQUENCY_LABELS: Record<EmailFrequency, string> = {
    weekly: 'Her Hafta (Pazartesi)',
    biweekly: 'İki Haftada Bir',
    monthly: 'Ayda Bir',
    none: 'Kapalı',
};

const FREQUENCY_ICONS: Record<EmailFrequency, string> = {
    weekly: '📅',
    biweekly: '📆',
    monthly: '🗓️',
    none: '🔕',
};

export default function ReportsPage() {
    const { email: userEmail } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [frequency, setFrequency] = useState<EmailFrequency>('weekly');
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastSent, setLastSent] = useState<string | null>(null);

    // Content Options
    const [includeAnalysis, setIncludeAnalysis] = useState(false);
    const [includePortfolioDetails, setIncludePortfolioDetails] = useState(true);

    // Load saved preferences
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedFreq = localStorage.getItem('portfolioEmailFrequency');
            if (savedFreq) setFrequency(savedFreq as EmailFrequency);

            const savedLastSent = localStorage.getItem('portfolioEmailLastSent');
            if (savedLastSent) setLastSent(savedLastSent);

            const savedAnalysis = localStorage.getItem('portfolioIncludeAnalysis');
            if (savedAnalysis) setIncludeAnalysis(savedAnalysis === 'true');

            const savedDetails = localStorage.getItem('portfolioIncludeDetails');
            if (savedDetails) setIncludePortfolioDetails(savedDetails === 'true');
        }
    }, []);

    // Save frequency preference
    const handleFrequencyChange = (freq: EmailFrequency) => {
        setFrequency(freq);
        if (typeof window !== 'undefined') {
            localStorage.setItem('portfolioEmailFrequency', freq);
        }
    };

    // Save content preferences
    const handleAnalysisChange = (checked: boolean) => {
        setIncludeAnalysis(checked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('portfolioIncludeAnalysis', String(checked));
        }
    };

    const handleDetailsChange = (checked: boolean) => {
        setIncludePortfolioDetails(checked);
        if (typeof window !== 'undefined') {
            localStorage.setItem('portfolioIncludeDetails', String(checked));
        }
    };

    // Generate preview
    const handlePreview = async () => {
        setIsLoading(true);
        setSendResult(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum bulunamadı');

            const res = await fetch('/api/cron/portfolio-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sendEmail: false,
                    includeAnalysis,
                    includePortfolioDetails
                }),
            });

            const data = await res.json();
            if (data.success && data.htmlPreview) {
                setPreviewHtml(data.htmlPreview);
            } else {
                throw new Error(data.error || 'Önizleme oluşturulamadı');
            }
        } catch (err: any) {
            setSendResult({ type: 'error', message: err.message || 'Bir hata oluştu' });
        } finally {
            setIsLoading(false);
        }
    };

    // Send email now
    const handleSendNow = async () => {
        setIsSending(true);
        setSendResult(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum bulunamadı');

            const res = await fetch('/api/cron/portfolio-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sendEmail: true,
                    includeAnalysis,
                    includePortfolioDetails
                }),
            });

            const data = await res.json();
            if (data.success) {
                // Check results specifically for the current user
                const userResult = data.results?.find((r: any) => r.email === userEmail) || data.results?.[0];

                if (userResult?.status === 'sent') {
                    const now = new Date().toLocaleString('tr-TR');
                    setLastSent(now);
                    localStorage.setItem('portfolioEmailLastSent', now);
                    setSendResult({ type: 'success', message: `E-posta başarıyla ${userResult.email} adresine gönderildi!` });
                } else if (userResult?.status === 'skipped_no_assets') {
                    setSendResult({ type: 'error', message: 'Portföyünüzde varlık bulunamadı. Önce portföyünüze varlık ekleyin.' });
                } else if (userResult?.status === 'skipped_no_resend_key') {
                    setSendResult({ type: 'error', message: 'Server tarafında E-posta API anahtarı eksik.' });
                } else if (userResult?.status?.startsWith('error')) {
                    const errorMsg = userResult.status.replace('error: ', '');
                    setSendResult({ type: 'error', message: `Gönderim Başarısız: ${errorMsg}` });
                } else {
                    setSendResult({ type: 'error', message: 'Bilinmeyen bir durum oluştu. Sonuç alınamadı.' });
                }

                if (data.htmlPreview) {
                    setPreviewHtml(data.htmlPreview);
                }
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setSendResult({ type: 'error', message: err.message || 'E-posta gönderilemedi' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bot className="w-8 h-8 text-purple-500" />
                        FinAi Robotum
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Yapay zeka destekli haftalık portföy analizi ve robot bildirimleri.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-medium transition-all border border-white/10 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Önizle
                    </button>
                    <button
                        onClick={handleSendNow}
                        disabled={isSending}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Analizi Başlat & Gönder
                    </button>
                </div>
            </div>

            {/* Status Message */}
            <AnimatePresence>
                {sendResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${sendResult.type === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        {sendResult.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{sendResult.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Content Preferences */}
                    <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10 rounded-full" />

                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-purple-400" />
                            İçerik Tercihleri
                        </h3>

                        {/* AI Option */}
                        <div className="flex items-start gap-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-purple-500/30 transition-colors cursor-pointer mb-3" onClick={() => handleAnalysisChange(!includeAnalysis)}>
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeAnalysis}
                                    onChange={(e) => handleAnalysisChange(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500/50"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">Detaylı Portföy Analizi</span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">AI</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Her bir varlık için neden-sonuç ilişkisine dayalı detaylı yorum, puanlama ve gelecek beklentisi.
                                </p>
                            </div>
                        </div>

                        {/* Portfolio Details Option */}
                        <div className="flex items-start gap-4 p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer" onClick={() => handleDetailsChange(!includePortfolioDetails)}>
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includePortfolioDetails}
                                    onChange={(e) => handleDetailsChange(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">Portföy Varlık Tablosu</span>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">Tablo</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Portföyünüzdeki varlıkların listesi, anlık fiyatları, toplam tutar ve kar/zarar durumu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Frequency Selection */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Otomatik Gönderim Sıklığı
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">FinAi Robotum analizleri ne sıklıkla göndersin?</p>
                        <div className="space-y-2">
                            {(Object.keys(FREQUENCY_LABELS) as EmailFrequency[]).map((freq) => (
                                <button
                                    key={freq}
                                    onClick={() => handleFrequencyChange(freq)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border ${frequency === freq
                                        ? 'bg-blue-600/20 border-blue-500/40 text-white'
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <span className="text-lg">{FREQUENCY_ICONS[freq]}</span>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">{FREQUENCY_LABELS[freq]}</span>
                                    </div>
                                    {frequency === freq && (
                                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email Info */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-400" />
                            Robot Durumu
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Hedef E-posta</span>
                                <span className="text-slate-300 font-medium">{userEmail || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Program</span>
                                <span className="text-blue-400 font-medium">{FREQUENCY_LABELS[frequency]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Son Çalışma</span>
                                <span className="text-slate-300 font-medium">{lastSent || 'Henüz yok'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Durum</span>
                                <span className={`font-medium flex items-center gap-1 ${frequency !== 'none' ? 'text-green-400' : 'text-slate-500'}`}>
                                    {frequency !== 'none' ? <><Bell className="w-3 h-3" /> Aktif</> : <><BellOff className="w-3 h-3" /> Pasif</>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Preview */}
                <div className="lg:col-span-2">
                    {previewHtml ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/30 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                            style={{ height: '800px' }}
                        >
                            <div className="bg-slate-800/50 border-b border-white/5 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                    </div>
                                    <span className="text-slate-400 text-sm font-medium">FinAi Robot İzleme Ekranı</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Bot className="w-3.5 h-3.5" />
                                    AI processing completed
                                </div>
                            </div>
                            <iframe
                                srcDoc={previewHtml}
                                className="w-full flex-1 border-0"
                                title="Email Preview"
                                style={{ background: '#0a0e1a' }}
                            />
                        </motion.div>
                    ) : (
                        <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center p-12" style={{ height: '600px' }}>
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 relative">
                                <Bot className="w-10 h-10 text-slate-600" />
                                {includeAnalysis && (
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-purple-500 rounded-full animate-pulse border-2 border-slate-800" />
                                )}
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">FinAi Robotum</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Portföyünüzü analiz ettirmek ve rapor sonucunu görmek için <strong>"Önizle"</strong> veya <strong>"Analizi Başlat"</strong> butonuna tıklayın.
                                {includeAnalysis && (
                                    <span className="block mt-2 text-purple-400 text-sm">✨ Yapay Zeka Detaylı Analizi Aktif</span>
                                )}
                            </p>
                            <button
                                onClick={handlePreview}
                                disabled={isLoading}
                                className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                Analiz Önizlemesi Oluştur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
