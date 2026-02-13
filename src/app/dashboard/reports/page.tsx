'use client';

import { useState, useEffect } from 'react';
import { FileText, Sparkles, Loader2, Mail, Send, Clock, CheckCircle, AlertCircle, Eye, Bell, BellOff, Bot, BrainCircuit, ListChecks, CalendarClock, Settings2, Plus, ArrowRight, X, ChevronRight, Save, Trash2, CalendarDays, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/providers/UserProvider';

type EmailFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually' | 'none';

interface ReportInstruction {
    id: string;
    label: string;
    frequency: EmailFrequency;
    includeAnalysis: boolean;
    includePortfolioDetails: boolean;
    preferredDay?: number;
    preferredDate?: number;
    preferredTime?: string;
    createdAt: string;
}

const FREQUENCY_LABELS: Record<EmailFrequency, string> = {
    weekly: 'Her Hafta',
    biweekly: 'Her 15 Günde Bir',
    monthly: 'Her Ay',
    quarterly: '3 Ayda Bir',
    semiannually: '6 Ayda Bir',
    annually: 'Yılda 1',
    none: 'Devre Dışı',
};

const FREQUENCY_ICONS: Record<EmailFrequency, string> = {
    weekly: '📅',
    biweekly: '📆',
    monthly: '🗓️',
    quarterly: '📊',
    semiannually: '🌓',
    annually: '🎆',
    none: '🔕',
};

const DAYS = [
    { id: 1, label: 'Pazartesi' },
    { id: 2, label: 'Salı' },
    { id: 3, label: 'Çarşamba' },
    { id: 4, label: 'Perşembe' },
    { id: 5, label: 'Cuma' },
    { id: 6, label: 'Cumartesi' },
    { id: 0, label: 'Pazar' },
];

const TIMES = ['09:00', '15:00', '18:00', '21:00'];
const MONTH_DATES = Array.from({ length: 28 }, (_, i) => i + 1);

export default function ReportsPage() {
    const { email: userEmail } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastSent, setLastSent] = useState<string | null>(null);

    // Multiple Instructions State
    const [instructions, setInstructions] = useState<ReportInstruction[]>([]);

    // Editing / Wizard States
    const [isEditing, setIsEditing] = useState(false);
    const [showPreviewSelector, setShowPreviewSelector] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [setupStep, setSetupStep] = useState(1); // 1: Content, 2: Frequency
    const [tempLabel, setTempLabel] = useState('');
    const [tempFreq, setTempFreq] = useState<EmailFrequency>('weekly');
    const [tempAnalysis, setTempAnalysis] = useState(false);
    const [tempDetails, setTempDetails] = useState(true);
    const [tempDay, setTempDay] = useState<number>(1);
    const [tempDate, setTempDate] = useState<number>(1);
    const [tempTime, setTempTime] = useState<string>('09:00');

    // Load saved preferences from Supabase Metadata
    useEffect(() => {
        const loadPreferences = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata) {
                if (Array.isArray(user.user_metadata.report_instructions)) {
                    setInstructions(user.user_metadata.report_instructions);
                }
                else if (user.user_metadata.report_settings) {
                    const old = user.user_metadata.report_settings;
                    if (old.frequency !== 'none') {
                        const migrated: ReportInstruction = {
                            id: 'migrated-local-1',
                            label: 'Eski Talimat',
                            frequency: old.frequency === 'biweekly' ? 'biweekly' : (old.frequency as any),
                            includeAnalysis: old.includeAnalysis || false,
                            includePortfolioDetails: old.includePortfolioDetails ?? true,
                            preferredDay: 1,
                            preferredDate: 1,
                            preferredTime: '09:00',
                            createdAt: old.updatedAt || new Date().toISOString()
                        };
                        setInstructions([migrated]);
                    }
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
            let newInstructions = [...instructions];

            const instructionData: ReportInstruction = {
                id: editingId || `report-${Date.now()}`,
                label: tempLabel || (tempAnalysis ? 'AI Analiz Raporu' : 'Portföy Özeti'),
                frequency: tempFreq,
                includeAnalysis: tempAnalysis,
                includePortfolioDetails: tempDetails,
                preferredDay: tempFreq === 'weekly' ? tempDay : undefined,
                preferredDate: (tempFreq === 'monthly' || tempFreq === 'quarterly' || tempFreq === 'semiannually' || tempFreq === 'annually') ? tempDate : undefined,
                preferredTime: tempTime,
                createdAt: new Date().toISOString()
            };

            if (editingId) {
                newInstructions = newInstructions.map(inst => inst.id === editingId ? instructionData : inst);
            } else {
                newInstructions.push(instructionData);
            }

            const { error } = await supabase.auth.updateUser({
                data: {
                    report_instructions: newInstructions,
                    report_settings: null
                }
            });

            if (error) throw error;

            setInstructions(newInstructions);
            setIsEditing(false);
            setEditingId(null);
            setSendResult({ type: 'success', message: 'Yatırım talimatınız başarıyla kaydedildi! Robotunuz aktif.' });

        } catch (err) {
            console.error("Talimat kaydedilemedi:", err);
            setSendResult({ type: 'error', message: 'Talimat kaydedilirken bir hata oluştu.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInstruction = async (id: string) => {
        if (!confirm('Bu talimatı silmek istediğinize emin misiniz?')) return;

        setIsSaving(true);
        try {
            const newInstructions = instructions.filter(inst => inst.id !== id);
            const { error } = await supabase.auth.updateUser({
                data: { report_instructions: newInstructions }
            });
            if (error) throw error;
            setInstructions(newInstructions);
            setSendResult({ type: 'success', message: 'Talimat silindi.' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const startNewInstruction = () => {
        setSetupStep(1);
        setIsEditing(true);
        setEditingId(null);
        setTempLabel('');
        setTempFreq('weekly');
        setTempAnalysis(false);
        setTempDetails(true);
        setTempDay(1);
        setTempDate(1);
        setTempTime('09:00');
    };

    const startEditInstruction = (inst: ReportInstruction) => {
        setSetupStep(1);
        setIsEditing(true);
        setEditingId(inst.id);
        setTempLabel(inst.label);
        setTempFreq(inst.frequency);
        setTempAnalysis(inst.includeAnalysis);
        setTempDetails(inst.includePortfolioDetails);
        setTempDay(inst.preferredDay ?? 1);
        setTempDate(inst.preferredDate ?? 1);
        setTempTime(inst.preferredTime ?? '09:00');
    };

    // New Preview Trigger
    const triggerPreviewChoice = () => {
        if (instructions.length === 0 && !isEditing) {
            setSendResult({ type: 'error', message: 'Önizleme için önce bir talimat oluşturmalısınız.' });
            return;
        }
        setShowPreviewSelector(true);
    };

    // Actual Preview Logic
    const handlePreview = async (analysis: boolean, details: boolean) => {
        setIsLoading(true);
        setSendResult(null);
        setShowPreviewSelector(false);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum bulunamadı');

            const res = await fetch('/api/cron/portfolio-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    sendEmail: false,
                    includeAnalysis: analysis,
                    includePortfolioDetails: details
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

    // Send email now (Manual trigger)
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
                    includeAnalysis: isEditing ? tempAnalysis : true,
                    includePortfolioDetails: isEditing ? tempDetails : true
                }),
            });

            const data = await res.json();
            if (data.success) {
                const now = new Date().toLocaleString('tr-TR');
                setLastSent(now);
                localStorage.setItem('portfolioEmailLastSent', now);
                setSendResult({ type: 'success', message: `Analiz raporu başarıyla e-posta adresinize gönderildi!` });
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setSendResult({ type: 'error', message: err.message || 'E-posta gönderilemedi' });
        } finally {
            setIsSending(false);
        }
    };

    const isDateRequired = ['monthly', 'quarterly', 'semiannually', 'annually'].includes(tempFreq);

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
                        Yatırım asistanınız sizin için piyasaları izler ve raporlar hazırlar.
                    </p>
                </div>

                <div className="flex gap-3 relative">
                    <button
                        onClick={triggerPreviewChoice}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/10 disabled:opacity-50 shadow-xl"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                        Önizleme Oluştur
                    </button>

                    {/* Preview Choice Popover */}
                    <AnimatePresence>
                        {showPreviewSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full mt-3 right-0 w-72 bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-[100]"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MousePointer2 className="w-3 h-3" /> Talimat Seçin
                                    </h4>
                                    <button onClick={() => setShowPreviewSelector(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                                </div>

                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                    {isEditing && (
                                        <button
                                            onClick={() => handlePreview(tempAnalysis, tempDetails)}
                                            className="w-full text-left p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                                        >
                                            <span className="block text-[11px] font-bold text-purple-400">Şu anki Düzenleme</span>
                                            <span className="text-[10px] text-slate-400 leading-tight">Wizard'da yaptığınız ayarları önizle.</span>
                                        </button>
                                    )}
                                    {instructions.map(inst => (
                                        <button
                                            key={inst.id}
                                            onClick={() => handlePreview(inst.includeAnalysis, inst.includePortfolioDetails)}
                                            className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <span className="block text-[11px] font-bold text-white group-hover:text-purple-400 transition-colors">{inst.label}</span>
                                                <span className="text-[9px] text-slate-500">{inst.includeAnalysis ? '🤖 AI Analiz' : '📊 Tablo Raporu'}</span>
                                            </div>
                                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white" />
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SETTINGS COLUMN */}
                <div className="lg:col-span-1 space-y-6">

                    {/* INSTRUCTIONS LIST */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ListChecks className="w-4 h-4" />
                                Aktif Talimatlar ({instructions.length})
                            </h3>
                            {!isEditing && (
                                <button
                                    onClick={startNewInstruction}
                                    className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all flex items-center gap-1.5 font-bold"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Yeni Ekle
                                </button>
                            )}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {instructions.length === 0 && !isEditing ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center"
                                >
                                    <BellOff className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                    <p className="text-xs text-slate-500 italic">Henüz aktif bir talimatınız bulunmuyor.</p>
                                </motion.div>
                            ) : (
                                instructions.map((inst) => (
                                    <motion.div
                                        key={inst.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-slate-900/60 border border-white/5 rounded-2xl p-4 hover:border-purple-500/30 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{inst.label}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">
                                                        {FREQUENCY_LABELS[inst.frequency]}
                                                        {inst.frequency === 'weekly' && inst.preferredDay !== undefined && ` (${DAYS.find(d => d.id === inst.preferredDay)?.label})`}
                                                        {['monthly', 'quarterly', 'semiannually', 'annually'].includes(inst.frequency) && inst.preferredDate !== undefined && ` (Ayın ${inst.preferredDate}. günü)`}
                                                    </span>
                                                    {inst.preferredTime && (
                                                        <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> {inst.preferredTime}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => startEditInstruction(inst)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                                                    <Settings2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDeleteInstruction(inst.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* WIZARD */}
                    <AnimatePresence>
                        {isEditing && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-950/90 border-2 border-purple-500/40 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl shadow-purple-500/10"
                            >
                                <div className="absolute top-0 right-0 p-2">
                                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <div className="flex gap-2 mb-4">
                                        <div className={`h-1.5 flex-1 rounded-full ${setupStep >= 1 ? 'bg-purple-500' : 'bg-slate-800'}`} />
                                        <div className={`h-1.5 flex-1 rounded-full ${setupStep >= 2 ? 'bg-purple-500' : 'bg-slate-800'}`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">
                                        {editingId ? 'Talimatı Düzenle' : 'Yeni Talimat Oluştur'}
                                    </h3>
                                </div>

                                {setupStep === 1 ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Talimat Başlığı</label>
                                            <input
                                                type="text"
                                                placeholder="Örn: Haftalık AI Analizim"
                                                value={tempLabel}
                                                onChange={(e) => setTempLabel(e.target.value)}
                                                className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">İçerik Tercihleri</label>
                                            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tempAnalysis ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-900 border-white/5'}`}>
                                                <input type="checkbox" checked={tempAnalysis} onChange={(e) => { setTempAnalysis(e.target.checked); if (e.target.checked) setTempDetails(false); }} className="mt-1" />
                                                <div>
                                                    <span className="block font-bold text-white text-xs">Yapay Zeka Analizi</span>
                                                    <span className="text-[10px] text-slate-500">Piyasa yorumları.</span>
                                                </div>
                                            </label>
                                            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${tempDetails ? 'bg-blue-500/10 border-blue-500/30' : tempAnalysis ? 'opacity-40 cursor-not-allowed bg-slate-900' : 'bg-slate-900 border-white/5'}`}>
                                                <input type="checkbox" checked={tempDetails} disabled={tempAnalysis} onChange={(e) => setTempDetails(e.target.checked)} className="mt-1" />
                                                <div>
                                                    <span className="block font-bold text-white text-xs">Portföy Tablosu</span>
                                                    <span className="text-[10px] text-slate-500">Varlık listesi.</span>
                                                </div>
                                            </label>
                                        </div>

                                        <button onClick={() => setSetupStep(2)} className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                                            Devam Et <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Gönderim Sıklığı</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(Object.keys(FREQUENCY_LABELS) as EmailFrequency[]).filter(f => f !== 'none').map((freq) => (
                                                    <button
                                                        key={freq}
                                                        onClick={() => setTempFreq(freq)}
                                                        className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${tempFreq === freq ? 'bg-blue-600/10 border-blue-500/40 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}
                                                    >
                                                        <span className="text-sm">{FREQUENCY_ICONS[freq]}</span>
                                                        <span className="text-[10px] font-bold leading-tight">{FREQUENCY_LABELS[freq]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {tempFreq === 'weekly' && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest">Hangi Gün?</label>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {DAYS.map((day) => (
                                                        <button key={day.id} onClick={() => setTempDay(day.id)} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${tempDay === day.id ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                                                            {day.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {isDateRequired && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest flex items-center gap-2">
                                                    <CalendarDays className="w-3 h-3" /> Ayın Kaçıncı Günü Gönderilsin?
                                                </label>
                                                <div className="grid grid-cols-7 gap-1">
                                                    {MONTH_DATES.map((date) => (
                                                        <button
                                                            key={date}
                                                            onClick={() => setTempDate(date)}
                                                            className={`py-1.5 rounded-md border text-[10px] font-bold transition-all ${tempDate === date ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/20'}`}
                                                        >
                                                            {date}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest">Hangi Saat?</label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {TIMES.map((time) => (
                                                    <button key={time} onClick={() => setTempTime(time)} className={`py-2 rounded-lg border text-[10px] font-bold transition-all ${tempTime === time ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>

                                        <div className="flex gap-2 mt-6">
                                            <button onClick={() => setSetupStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-bold border border-white/10 transition-all">Geri</button>
                                            <button onClick={handleSaveInstruction} disabled={isSaving} className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Kaydet & Bitir
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* SEND NOW SECTION */}
                    {!isEditing && (
                        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-white/10 rounded-2xl p-6 shadow-xl shadow-indigo-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <Send className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-base font-bold text-white tracking-tight">Anlık Gönderim</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                                Otomatik raporu beklemeden istediğiniz an güncel verilerle bir rapor oluşturup e-posta alabilirsiniz.
                            </p>
                            <button
                                onClick={handleSendNow}
                                disabled={isSending}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                Şimdi Rapor Gönder
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: PREVIEW AREA */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                        {sendResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className={`flex items-center gap-3 p-4 rounded-xl border ${sendResult.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                            >
                                {sendResult.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span className="text-sm font-bold">{sendResult.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {previewHtml ? (
                        <div className="bg-slate-950/50 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[750px] relative">
                            <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                                    </div>
                                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Canlı Önizleme</span>
                                </div>
                                <button onClick={() => setPreviewHtml(null)} className="text-slate-500 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <iframe srcDoc={previewHtml} className="w-full flex-1 border-0" title="Email Preview" style={{ background: '#0a0e1a' }} />
                        </div>
                    ) : (
                        <div className="bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-12 h-[600px]">
                            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                <Bot className="w-10 h-10 text-slate-700" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Rapor Önizleme Alanı</h3>
                            <p className="text-slate-500 max-w-sm mx-auto text-sm">
                                Yukarıdaki "Önizleme Oluştur" butonuna basarak hangi talimatınızın nasıl görüneceğini seçebilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
