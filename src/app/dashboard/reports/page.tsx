'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, Mail, Send, Clock, CheckCircle, AlertCircle, Eye, Bell, BellOff, Bot, BrainCircuit, ListChecks, CalendarClock, Settings2, Plus, ArrowRight, X, ChevronRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/providers/UserProvider';

type EmailFrequency = 'weekly' | 'biweekly' | 'monthly' | 'none';

const FREQUENCY_LABELS: Record<EmailFrequency, string> = {
    weekly: 'Her Hafta (Pazartesi)',
    biweekly: 'İki Haftada Bir',
    monthly: 'Ayda Bir',
    none: 'Devre Dışı',
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
    const [isSaving, setIsSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastSent, setLastSent] = useState<string | null>(null);

    // Active Persistence States
    const [frequency, setFrequency] = useState<EmailFrequency>('none');
    const [includeAnalysis, setIncludeAnalysis] = useState(false);
    const [includePortfolioDetails, setIncludePortfolioDetails] = useState(true);

    // Editing / Wizard States
    const [isEditing, setIsEditing] = useState(false);
    const [setupStep, setSetupStep] = useState(1); // 1: Content, 2: Frequency
    const [tempFreq, setTempFreq] = useState<EmailFrequency>('weekly');
    const [tempAnalysis, setTempAnalysis] = useState(false);
    const [tempDetails, setTempDetails] = useState(true);

    // Load saved preferences from Supabase Metadata
    useEffect(() => {
        const loadPreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata?.report_settings) {
                const settings = user.user_metadata.report_settings;
                if (settings.frequency) {
                    setFrequency(settings.frequency);
                    setTempFreq(settings.frequency);
                }
                if (settings.includeAnalysis !== undefined) {
                    setIncludeAnalysis(settings.includeAnalysis);
                    setTempAnalysis(settings.includeAnalysis);
                }
                if (settings.includePortfolioDetails !== undefined) {
                    setIncludePortfolioDetails(settings.includePortfolioDetails);
                    setTempDetails(settings.includePortfolioDetails);
                }
            }

            if (typeof window !== 'undefined') {
                const savedLastSent = localStorage.getItem('portfolioEmailLastSent');
                if (savedLastSent) setLastSent(savedLastSent);
            }
        };
        loadPreferences();
    }, []);

    // Save final preferences to Supabase
    const handleSaveInstruction = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    report_settings: {
                        frequency: tempFreq,
                        includeAnalysis: tempAnalysis,
                        includePortfolioDetails: tempDetails,
                        updatedAt: new Date().toISOString()
                    }
                }
            });

            if (error) throw error;

            setFrequency(tempFreq);
            setIncludeAnalysis(tempAnalysis);
            setIncludePortfolioDetails(tempDetails);
            setIsEditing(false);
            setSendResult({ type: 'success', message: 'Yeni yatırım talimatınız başarıyla kaydedildi! Robotunuz aktif.' });

        } catch (err) {
            console.error("Ayarlar kaydedilemedi:", err);
            setSendResult({ type: 'error', message: 'Talimat kaydedilirken bir hata oluştu.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelInstruction = async () => {
        if (!confirm('Otomatik gönderim talimatını iptal etmek istediğinize emin misiniz?')) return;

        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    report_settings: {
                        frequency: 'none',
                        updatedAt: new Date().toISOString()
                    }
                }
            });
            if (error) throw error;
            setFrequency('none');
            setTempFreq('none');
            setSendResult({ type: 'success', message: 'Tüm otomatik gönderim talimatları iptal edildi.' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const startNewInstruction = () => {
        setSetupStep(1);
        setIsEditing(true);
        // Reset temp states to current or reasonable defaults
        setTempFreq(frequency === 'none' ? 'weekly' : frequency);
        setTempAnalysis(includeAnalysis);
        setTempDetails(includePortfolioDetails);
    };

    // UI Helpers
    const getInstructionSummary = () => {
        if (frequency === 'none') return "Şu an aktif bir gönderim talimatınız bulunmuyor.";

        let contentText = "";
        if (includeAnalysis && includePortfolioDetails) contentText = "Yapay Zeka Analizi ve Portföy Tablosu";
        else if (includeAnalysis) contentText = "Detaylı Yapay Zeka Analizi";
        else if (includePortfolioDetails) contentText = "Portföy Varlık Tablosu";

        return `${FREQUENCY_LABELS[frequency]} olarak ${contentText} raporu alacaksınız.`;
    };

    // Preview Logic
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
                    includeAnalysis: isEditing ? tempAnalysis : includeAnalysis,
                    includePortfolioDetails: isEditing ? tempDetails : includePortfolioDetails
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

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Bot className="w-8 h-8 text-purple-500" />
                        FinAi Robotum
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Yatırım asistanınız sizin yerinize piyasaları izler ve raporlar.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePreview}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/10 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Analizi Şimdi Önizle
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SETTINGS / WIZARD COLUMN */}
                <div className="lg:col-span-1 space-y-6">

                    {/* TOP STATUS / CREATE BUTTON */}
                    {!isEditing ? (
                        <div className={`p-6 rounded-2xl border transition-all ${frequency !== 'none'
                                ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 shadow-lg shadow-green-500/5'
                                : 'bg-slate-900/40 border-slate-800'
                            }`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-base font-bold flex items-center gap-2 ${frequency !== 'none' ? 'text-green-400' : 'text-slate-400'}`}>
                                    {frequency !== 'none' ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                    {frequency !== 'none' ? 'Aktif Yatırım Talimatı' : 'Aktif Talimat Yok'}
                                </h3>
                                {frequency !== 'none' && (
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                )}
                            </div>

                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                {getInstructionSummary()}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={startNewInstruction}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    {frequency === 'none' ? 'Yeni Talimat Oluştur' : 'Talimatı Düzenle'}
                                </button>
                                {frequency !== 'none' && (
                                    <button
                                        onClick={handleCancelInstruction}
                                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-500/20 transition-all"
                                        title="Durdur"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* WIZARD CARD */
                        <div className="bg-slate-900/60 border-2 border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex gap-2 mb-4">
                                    <div className={`h-1.5 flex-1 rounded-full ${setupStep >= 1 ? 'bg-purple-500' : 'bg-slate-800'}`} />
                                    <div className={`h-1.5 flex-1 rounded-full ${setupStep >= 2 ? 'bg-purple-500' : 'bg-slate-800'}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {setupStep === 1 ? <Bot className="w-5 h-5 text-purple-400" /> : <Clock className="w-5 h-5 text-blue-400" />}
                                    {setupStep === 1 ? 'İçerik Seçimi' : 'Gönderim Sıklığı'}
                                </h3>
                                <p className="text-sm text-slate-400 mt-1">
                                    {setupStep === 1 ? 'Raporunuzda neler yer almalı?' : 'Robotunuz ne zaman çalışmalı?'}
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {setupStep === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-3"
                                    >
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${tempAnalysis ? 'bg-purple-500/10 border-purple-500/40' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
                                            <input
                                                type="checkbox"
                                                checked={tempAnalysis}
                                                onChange={(e) => {
                                                    setTempAnalysis(e.target.checked);
                                                    if (e.target.checked) setTempDetails(false);
                                                }}
                                                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800 text-purple-500 focus:ring-purple-500/30"
                                            />
                                            <div>
                                                <span className="block font-bold text-white text-sm">Detaylı Yapay Zeka Analizi</span>
                                                <span className="text-xs text-slate-400">Piyasa neden-sonuç analizi ve ileriye dönük beklentiler.</span>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${tempDetails ? 'bg-blue-500/10 border-blue-500/40' : tempAnalysis ? 'opacity-40 cursor-not-allowed bg-slate-900 border-white/5' : 'bg-slate-900 border-white/5 hover:border-white/10'}`}>
                                            <input
                                                type="checkbox"
                                                checked={tempDetails}
                                                disabled={tempAnalysis}
                                                onChange={(e) => setTempDetails(e.target.checked)}
                                                className="mt-1 h-5 w-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/30"
                                            />
                                            <div>
                                                <span className="block font-bold text-white text-sm">Portföy Varlık Tablosu</span>
                                                <span className="text-xs text-slate-400">Varlık listesi ve maliyetler. {tempAnalysis && <span className="text-yellow-500 font-bold">(AI ile kapalı)</span>}</span>
                                            </div>
                                        </label>

                                        <button
                                            onClick={() => setSetupStep(2)}
                                            disabled={!tempAnalysis && !tempDetails}
                                            className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            Sonraki Adım
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-2"
                                    >
                                        {(Object.keys(FREQUENCY_LABELS) as EmailFrequency[]).filter(f => f !== 'none').map((freq) => (
                                            <button
                                                key={freq}
                                                onClick={() => setTempFreq(freq)}
                                                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${tempFreq === freq ? 'bg-blue-600/20 border-blue-500/40 text-white' : 'bg-slate-900 border-white/5 text-slate-400'}`}
                                            >
                                                <span className="text-lg">{FREQUENCY_ICONS[freq]}</span>
                                                <span className="text-sm font-bold">{FREQUENCY_LABELS[freq]}</span>
                                                {tempFreq === freq && <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />}
                                            </button>
                                        ))}

                                        <div className="flex gap-2 mt-6">
                                            <button
                                                onClick={() => setSetupStep(1)}
                                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold border border-white/10 transition-all"
                                            >
                                                Geri
                                            </button>
                                            <button
                                                onClick={handleSaveInstruction}
                                                disabled={isSaving}
                                                className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 border border-green-400/20"
                                            >
                                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                Talimatı Kaydet
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* SEND NOW SECTION (SECONDARY) */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Send className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Anlık Analiz</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 font-medium">
                            Otomatik raporu beklemeden hemen şimdi güncel bir analiz raporu oluşturup e-posta adresinize gönderebilirsiniz.
                        </p>
                        <button
                            onClick={handleSendNow}
                            disabled={isSending}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                            Şimdi Analiz Gönder
                        </button>
                    </div>

                    {/* Email Stats */}
                    <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                            <ListChecks className="w-4 h-4" />
                            İstatistikler
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <span className="block text-[10px] text-slate-500 uppercase">Son Gönderim</span>
                                <span className="block text-xs text-slate-300 font-bold mt-1">{lastSent || 'Yok'}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                <span className="block text-[10px] text-slate-500 uppercase">Hedef</span>
                                <span className="block text-xs text-slate-300 font-bold mt-1 truncate" title={userEmail || ''}>{userEmail || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: PREVIEW AREA */}
                <div className="lg:col-span-2">
                    <AnimatePresence>
                        {sendResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${sendResult.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                            >
                                {sendResult.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-bold">{sendResult.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {previewHtml ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/30 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[700px]"
                        >
                            <div className="bg-slate-800/50 border-b border-white/5 p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/40" />
                                    </div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Canlı İzleme</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">RENDER_MODE: HTML_IFRAME</div>
                            </div>
                            <iframe srcDoc={previewHtml} className="w-full flex-1 border-0" title="Email Preview" style={{ background: '#0a0e1a' }} />
                        </motion.div>
                    ) : (
                        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-12 h-[600px]">
                            <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 relative">
                                <Bot className="w-12 h-12 text-slate-600" />
                                <div className="absolute top-0 right-0 w-5 h-5 bg-purple-500 rounded-full animate-bounce border-4 border-[#0a0e1a]" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 italic tracking-tight">Bekleme Ekranı</h3>
                            <p className="text-slate-400 max-w-sm mx-auto mb-8 text-sm">
                                Robotuzun üreteceği raporu burada canlı olarak izleyebilirsiniz. Henüz bir önizleme üretilmedi.
                            </p>
                            <button
                                onClick={handlePreview}
                                disabled={isLoading}
                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold transition-all disabled:opacity-50 py-2 border-b border-purple-400/30"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                                Şimdi Bir Rapor Oluştur & Önizle
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
