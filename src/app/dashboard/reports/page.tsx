'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Calendar, Loader2, Mail, Send, Clock, CheckCircle, AlertCircle, Users, Eye, Bell, BellOff } from 'lucide-react';
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
    const { email: userEmail, userName } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [frequency, setFrequency] = useState<EmailFrequency>('weekly');
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastSent, setLastSent] = useState<string | null>(null);

    // Load saved preferences
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('portfolioEmailFrequency');
            if (saved) setFrequency(saved as EmailFrequency);
            const savedLastSent = localStorage.getItem('portfolioEmailLastSent');
            if (savedLastSent) setLastSent(savedLastSent);
        }
    }, []);

    // Save frequency preference
    const handleFrequencyChange = (freq: EmailFrequency) => {
        setFrequency(freq);
        if (typeof window !== 'undefined') {
            localStorage.setItem('portfolioEmailFrequency', freq);
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
                body: JSON.stringify({ userId: user.id, sendEmail: false }),
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
                body: JSON.stringify({ userId: user.id, sendEmail: true }),
            });

            const data = await res.json();
            if (data.success) {
                const sentCount = data.results?.filter((r: any) => r.status === 'sent').length || 0;
                const noKeyCount = data.results?.filter((r: any) => r.status === 'skipped_no_resend_key').length || 0;

                if (noKeyCount > 0) {
                    setSendResult({ type: 'error', message: 'Resend API anahtarı yapılandırılmamış. .env dosyasına RESEND_API_KEY ekleyin.' });
                } else if (sentCount > 0) {
                    const now = new Date().toLocaleString('tr-TR');
                    setLastSent(now);
                    localStorage.setItem('portfolioEmailLastSent', now);
                    setSendResult({ type: 'success', message: `E-posta başarıyla ${userEmail} adresine gönderildi!` });
                } else {
                    setSendResult({ type: 'error', message: 'Portföyünüzde varlık bulunamadı. Önce portföyünüze varlık ekleyin.' });
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
                        <Mail className="w-8 h-8 text-blue-500" />
                        Portföy E-posta Bildirimi
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Portföyünüzdeki varlıkların haftalık özetini e-posta olarak alın.
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
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Şimdi Gönder
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

                    {/* Frequency Selection */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            Gönderim Sıklığı
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Portföy özetinizi ne sıklıkla almak istiyorsunuz?</p>
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
                            Bildirim Bilgisi
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Alıcı</span>
                                <span className="text-slate-300 font-medium">{userEmail || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Sıklık</span>
                                <span className="text-blue-400 font-medium">{FREQUENCY_LABELS[frequency]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Son Gönderim</span>
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

                    {/* How it works */}
                    <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-3">📌 Nasıl Çalışır?</h3>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">1.</span>
                                Portföyünüze hisse ve fon ekleyin
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">2.</span>
                                Gönderim sıklığını seçin
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">3.</span>
                                Her dönem otomatik olarak portföy özetiniz e-posta adresinize gönderilir
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5">4.</span>
                                <strong>"Şimdi Gönder"</strong> ile anında test edin
                            </li>
                        </ul>
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
                                    <span className="text-slate-400 text-sm font-medium">E-posta Önizleme</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Mail className="w-3.5 h-3.5" />
                                    {userEmail}
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
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Mail className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">E-posta Önizleme</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Portföyünüzdeki varlıkların e-posta olarak nasıl görüneceğini görmek için <strong>"Önizle"</strong> butonuna tıklayın.
                            </p>
                            <button
                                onClick={handlePreview}
                                disabled={isLoading}
                                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                Önizlemeyi Oluştur
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
