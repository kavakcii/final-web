"use client";

import { useState, useEffect } from 'react';
import { 
    Bell, Sparkles, TrendingUp, Check, Trash2, Calendar as CalendarIcon, 
    ArrowRight, Settings, Sliders, ShieldCheck, Clock, CheckCircle2,
    Plus, Search, X
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useWebPush } from '@/lib/useWebPush';
import { ECONOMIC_CALENDAR_CATALOG } from '@/lib/calendar-catalog';

export default function NotificationsPage() {
    const { permissionStatus, registerAndSubscribe, toggleFollowIndicator } = useWebPush();
    const [activeTab, setActiveTab] = useState<'notifications' | 'followed' | 'settings'>('notifications');

    // Real Notification Logs History
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Followed Indicators List
    const [followedIndicators, setFollowedIndicators] = useState<string[]>([]);
    const [loadingFollowed, setLoadingFollowed] = useState(true);

    // Notification Preferences State (6 Options)
    const [preferences, setPreferences] = useState({
        min_30_before: false,
        min_10_before: true,
        on_release: true,
        on_update: true,
        on_revision: true,
        daily_morning_summary: true
    });
    const [savingPref, setSavingPref] = useState(false);
    const [prefSuccessMsg, setPrefSuccessMsg] = useState(false);

    // Test Push State
    const [sendingTestPush, setSendingTestPush] = useState(false);
    const [testPushStatus, setTestPushStatus] = useState<{ success?: boolean; message?: string } | null>(null);

    // Add Indicator Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [addingIndicator, setAddingIndicator] = useState<string | null>(null);

    // Extract Unique Available Indicators from Catalog
    const availableIndicators = Array.from(
        new Set(ECONOMIC_CALENDAR_CATALOG.map(item => item.event))
    ).map(eventName => {
        const item = ECONOMIC_CALENDAR_CATALOG.find(e => e.event === eventName);
        return {
            name: eventName,
            country: item?.country || 'Küresel',
            flag: item?.flag || '🌐',
            impact: item?.impact || 'medium'
        };
    });

    const handleAddIndicator = async (indicatorName: string) => {
        setAddingIndicator(indicatorName);
        try {
            await toggleFollowIndicator(indicatorName);
            if (!followedIndicators.includes(indicatorName)) {
                setFollowedIndicators(prev => [...prev, indicatorName]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAddingIndicator(null);
        }
    };

    const handleSendTestPush = async () => {
        setSendingTestPush(true);
        setTestPushStatus(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setTestPushStatus({ success: false, message: 'Lütfen önce giriş yapın.' });
                return;
            }

            const res = await fetch('/api/notifications/test-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const json = await res.json();
            if (json.success) {
                setTestPushStatus({ success: true, message: json.message || 'Test bildirimi gönderildi!' });
            } else {
                setTestPushStatus({ success: false, message: json.error || 'Test bildirimi gönderilemedi.' });
            }
        } catch (e: any) {
            setTestPushStatus({ success: false, message: e.message });
        } finally {
            setSendingTestPush(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoadingNotifications(false);
                setLoadingFollowed(false);
                return;
            }

            const token = session.access_token;

            // Fetch Real Notification Logs
            try {
                const resNotif = await fetch('/api/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const jsonNotif = await resNotif.json();
                if (jsonNotif.success) {
                    setNotifications(jsonNotif.notifications || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingNotifications(false);
            }

            // Fetch Followed Indicators
            try {
                const resFol = await fetch('/api/indicators/followed', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const jsonFol = await resFol.json();
                if (jsonFol.success) {
                    setFollowedIndicators(jsonFol.followed || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingFollowed(false);
            }

            // Fetch Preferences
            try {
                const resPref = await fetch('/api/notifications/preferences', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const jsonPref = await resPref.json();
                if (jsonPref.success && jsonPref.preferences) {
                    setPreferences(jsonPref.preferences);
                }
            } catch (e) {
                console.error(e);
            }
        };

        loadData();
    }, []);

    const handleSavePreferences = async () => {
        setSavingPref(true);
        setPrefSuccessMsg(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch('/api/notifications/preferences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(preferences)
            });
            const json = await res.json();
            if (json.success) {
                setPrefSuccessMsg(true);
                setTimeout(() => setPrefSuccessMsg(false), 3000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSavingPref(false);
        }
    };

    const handleUnfollow = async (name: string) => {
        await toggleFollowIndicator(name);
        setFollowedIndicators(prev => prev.filter(i => i !== name));
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 text-[#00008B] w-full mx-auto p-4 sm:p-6 md:p-8 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#00008B] tracking-tight">Bildirim Merkezi</h1>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Takip ettiğiniz ekonomik göstergeler ve duyuru geçmişiniz.</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-slate-200 p-1.5 rounded-2xl border border-slate-300">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'notifications' 
                                ? 'bg-[#00008B] text-white shadow-sm' 
                                : 'text-slate-600 hover:text-[#00008B]'
                        }`}
                    >
                        Bildirim Geçmişi
                    </button>
                    <button
                        onClick={() => setActiveTab('followed')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'followed' 
                                ? 'bg-[#00008B] text-white shadow-sm' 
                                : 'text-slate-600 hover:text-[#00008B]'
                        }`}
                    >
                        Takip Ettiklerim ({followedIndicators.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === 'settings' 
                                ? 'bg-[#00008B] text-white shadow-sm' 
                                : 'text-slate-600 hover:text-[#00008B]'
                        }`}
                    >
                        Ayarlar
                    </button>
                </div>
            </div>

            {/* TAB 1: BİLDİRİM GEÇMİŞİ */}
            {activeTab === 'notifications' && (
                <div className="space-y-3">
                    {loadingNotifications ? (
                        <div className="py-16 text-center text-xs font-bold text-slate-400">
                            Bildirim geçmişi yükleniyor...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 p-6 shadow-sm">
                            <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center mx-auto text-[#00008B]">
                                <Bell className="w-7 h-7" />
                            </div>
                            <h3 className="text-base font-black text-[#00008B]">Henüz Bildiriminiz Bulunmuyor</h3>
                            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                Ekonomik takvimdeki göstergeleri takip ederek açıklanma anında ve yaklaştığında anlık web bildirimleri alabilirsiniz.
                            </p>
                            <Link
                                href="/dashboard/economic-calendar"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-sm hover:bg-[#0808a3] transition-all"
                            >
                                Ekonomik Takvime Git <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const isSystemOrSummary = !item.event_id || 
                                item.event_id.startsWith('daily_summary') || 
                                item.event_id.includes('test') || 
                                item.notification_type === 'daily_summary';

                            const targetUrl = isSystemOrSummary 
                                ? '/dashboard/economic-calendar'
                                : `/dashboard/economic-calendar/${encodeURIComponent(item.event_id)}`;

                            return (
                                <Link
                                    key={item.id}
                                    href={targetUrl}
                                    className="p-4 rounded-3xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex items-start justify-between gap-4 group shadow-xs"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[#00008B]">
                                            <Bell className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-[#00008B] leading-snug group-hover:text-blue-600 transition-colors">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                {item.body}
                                            </p>
                                            <span className="text-[10px] font-bold text-slate-400 block pt-1 font-mono">
                                                {new Date(item.sent_at).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#00008B] transition-colors shrink-0">
                                        <ArrowRight className="w-4 h-4" />
                                    </span>
                                </Link>
                            );
                        })
                    )}
                </div>
            )}

            {/* TAB 2: TAKİP ETTİKLERİM */}
            {activeTab === 'followed' && (
                <div className="space-y-4">
                    {/* Header Action Bar */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-xs">
                        <div>
                            <h3 className="text-sm font-black text-[#00008B]">Takip Edilen Ekonomik Göstergeler</h3>
                            <p className="text-xs text-slate-500 font-medium">Seçtiğiniz göstergeler açıklandığında veya yaklaşırken bildirim alırsınız.</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-sm hover:bg-[#0808a3] transition-all flex items-center gap-1.5 shrink-0"
                        >
                            <Plus className="w-4 h-4" /> Gösterge Ekle
                        </button>
                    </div>

                    {loadingFollowed ? (
                        <div className="py-16 text-center text-xs font-bold text-slate-400">
                            Takip edilen göstergeler yükleniyor...
                        </div>
                    ) : followedIndicators.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 p-6 shadow-sm">
                            <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-3xl flex items-center justify-center mx-auto text-[#00008B]">
                                <CalendarIcon className="w-7 h-7" />
                            </div>
                            <h3 className="text-base font-black text-[#00008B]">Takip Edilen Gösterge Yok</h3>
                            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                                Aşağıdaki buton veya ekonomik takvim üzerindeki "Takip Et" butonunu kullanarak takip etmek istediğiniz göstergeleri ekleyebilirsiniz.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#00008B] text-white font-bold text-xs shadow-sm hover:bg-[#0808a3] transition-all"
                            >
                                <Plus className="w-4 h-4" /> Hemen Gösterge Ekle
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {followedIndicators.map((indName, idx) => {
                                const nextEvent = ECONOMIC_CALENDAR_CATALOG.find(e => e.event === indName || e.event.includes(indName));

                                return (
                                    <div
                                        key={idx}
                                        className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs flex flex-col justify-between"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 uppercase">
                                                    Takip Ediliyor ✓
                                                </span>
                                                <h4 className="text-sm font-black text-[#00008B] leading-snug mt-1.5">
                                                    {indName}
                                                </h4>
                                            </div>
                                            <button
                                                onClick={() => handleUnfollow(indName)}
                                                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-[11px] font-bold transition-all"
                                            >
                                                Takipten Çıkar
                                            </button>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                {nextEvent ? `Sonraki: ${nextEvent.dateFormatted} · ${nextEvent.time}` : 'Düzenli Yayın'}
                                            </span>
                                            {nextEvent && (
                                                <Link
                                                    href={`/dashboard/economic-calendar/${encodeURIComponent(nextEvent.id || nextEvent.event)}`}
                                                    className="font-bold text-[#00008B] hover:underline flex items-center gap-0.5 text-[11px]"
                                                >
                                                    İncele <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: BİLDİRİM AYARLARI */}
            {activeTab === 'settings' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-150">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#00008B]">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#00008B]">Bildirim Zamanlaması ve Tercihler</h3>
                            <p className="text-xs text-slate-500 font-bold">Takip ettiğiniz ekonomik göstergeler için ne zaman bildirim alacağınızı seçin.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/60 border border-blue-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] flex items-center gap-1.5">
                                    ☀️ Günlük Sabah Özeti (08:00 TSİ)
                                </span>
                                <span className="text-[11px] text-slate-600 font-medium block mt-0.5">Her sabah 08:00'de günün makro haber manşeti, açıklanacak takvim olayları ve takip ettiğiniz göstergelerin özeti cebinize gelir.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.daily_morning_summary}
                                onChange={(e) => setPreferences({ ...preferences, daily_morning_summary: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] block">Veri Açıklanmadan 10 Dakika Önce</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Piyasa duyurusu yaklaşırken cihazınıza uyarı gönderilir (Varsayılan Açık).</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.min_10_before}
                                onChange={(e) => setPreferences({ ...preferences, min_10_before: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] block">Veri Açıklanmadan 30 Dakika Önce</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Önceden hazırlık yapmak isteyenler için erken bildirim.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.min_30_before}
                                onChange={(e) => setPreferences({ ...preferences, min_30_before: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] block">Veri Açıklandığı Anda</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Resmi gerçekleşen rakam ve piyasa beklentisi anında cebinize gelir.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.on_release}
                                onChange={(e) => setPreferences({ ...preferences, on_release: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] block">Veri Güncellendiğinde</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Yayın öncesi tarih, saat veya beklenti rakamları güncellendiğinde anında haber verilir.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.on_update}
                                onChange={(e) => setPreferences({ ...preferences, on_update: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-blue-300 transition-all">
                            <div>
                                <span className="text-xs font-black text-[#00008B] block">Veri Revize Edildiğinde</span>
                                <span className="text-[11px] text-slate-500 font-medium block">Resmi kurumlar tarafından geçmiş gerçekleşen rakamlar revize edilirse anında haber verilir.</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.on_revision}
                                onChange={(e) => setPreferences({ ...preferences, on_revision: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B]"
                            />
                        </label>
                    </div>

                    <div className="pt-4 border-t border-slate-150 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {prefSuccessMsg ? (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tercihleriniz başarıyla kaydedildi.
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-slate-400">
                                    Tarayıcı İzni: {permissionStatus === 'granted' ? '✅ İzin Verildi' : '⚠️ İzin Bekleniyor'}
                                </span>
                            )}
                            <button
                                onClick={handleSendTestPush}
                                disabled={sendingTestPush}
                                className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#00008B] font-bold text-xs border border-blue-200 transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Kendi cihazınıza anlık Web Push test bildirimi gönderin"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                {sendingTestPush ? 'Gönderiliyor...' : 'Test Bildirimi Gönder'}
                            </button>
                        </div>
                        <button
                            onClick={handleSavePreferences}
                            disabled={savingPref}
                            className="px-5 py-2.5 rounded-2xl bg-[#00008B] text-white font-black text-xs shadow-md hover:bg-[#0808a3] transition-all disabled:opacity-50"
                        >
                            {savingPref ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
                        </button>
                    </div>

                    {testPushStatus && (
                        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                            testPushStatus.success 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            <span>{testPushStatus.success ? '✅' : '⚠️'}</span>
                            <span>{testPushStatus.message}</span>
                        </div>
                    )}
                </div>
            )}

            {/* ADD INDICATOR MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white text-[#00008B] rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-base font-black text-[#00008B]">Ekonomik Gösterge Ekle</h3>
                                <p className="text-xs text-slate-500 font-medium">Takip etmek istediğiniz göstergeyi arayın ve listenize ekleyin.</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Gösterge adı veya ülke ara (Örn: TÜFE, Faiz, ABD...)"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#00008B] focus:outline-none focus:border-[#00008B] focus:ring-2 focus:ring-[#00008B]/10"
                                />
                            </div>
                        </div>

                        {/* Indicator List */}
                        <div className="p-4 space-y-2 overflow-y-auto flex-1">
                            {availableIndicators
                                .filter(ind => 
                                    !searchQuery || 
                                    ind.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                    ind.country.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((ind, idx) => {
                                    const isAlreadyFollowed = followedIndicators.includes(ind.name);
                                    const isProcessing = addingIndicator === ind.name;

                                    return (
                                        <div
                                            key={idx}
                                            className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-3 bg-white"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xl shrink-0">{ind.flag}</span>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-black text-[#00008B] truncate">
                                                        {ind.name}
                                                    </h4>
                                                    <span className="text-[10px] font-bold text-slate-500 block">
                                                        {ind.country}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleAddIndicator(ind.name)}
                                                disabled={isProcessing}
                                                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                                                    isAlreadyFollowed
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                                        : 'bg-[#00008B] text-white hover:bg-[#0808a3] shadow-xs'
                                                }`}
                                            >
                                                {isProcessing ? (
                                                    'İşleniyor...'
                                                ) : isAlreadyFollowed ? (
                                                    '✓ Takip Ediliyor'
                                                ) : (
                                                    '+ Takip Et'
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-5 py-2 rounded-xl bg-[#00008B] text-white font-bold text-xs"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
