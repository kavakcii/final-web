'use client';

import { useState } from 'react';
import { Bell, Sparkles, TrendingUp, AlertTriangle, Check, Trash2 } from 'lucide-react';

const mockNotifications = [
    {
        id: 1,
        title: 'Yeni Özellik: Portföy Analizi',
        description: 'Yapay zeka destekli portföy analiz modülü artık yayında. Hemen deneyin!',
        time: '2 saat önce',
        type: 'system',
        read: false,
    },
    {
        id: 2,
        title: 'Fiyat Alarmı: THYAO',
        description: 'Türk Hava Yolları hissesi belirlediğiniz 300 TL hedef fiyatına ulaştı.',
        time: '5 saat önce',
        type: 'alert',
        read: false,
    },
    {
        id: 3,
        title: 'Haftalık Piyasa Özeti',
        description: 'Geçen haftanın en çok kazandıranları ve bu haftanın beklentileri bülteni hazır.',
        time: '1 gün önce',
        type: 'news',
        read: true,
    },
    {
        id: 4,
        title: 'Güvenlik Uyarısı',
        description: 'Hesabınıza yeni bir cihazdan giriş yapıldı. Siz değilseniz şifrenizi değiştirin.',
        time: '2 gün önce',
        type: 'alert',
        read: true,
    },
    {
        id: 5,
        title: 'TEFAS Fon Verileri Güncellendi',
        description: 'Tüm yatırım fonlarının günlük getirileri sisteme işlendi.',
        time: '3 gün önce',
        type: 'system',
        read: true,
    },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filter, setFilter] = useState('all'); // all, unread, system, alert

    const getIcon = (type: string) => {
        switch (type) {
            case 'system': return <Sparkles className="w-5 h-5 text-purple-400" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            case 'news': return <TrendingUp className="w-5 h-5 text-blue-400" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.read;
        return n.type === filter;
    });

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-black text-white p-6 md:p-8 max-w-5xl mx-auto w-full">

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-white">Bildirimler</h1>
                    <p className="text-slate-400 mt-1">Sistem ve piyasa ile ilgili son gelişmeler.</p>
                </div>

                <div className="flex items-center space-x-2 bg-slate-900/50 p-1 rounded-lg border border-white/10">
                    {['all', 'unread', 'alert', 'system'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'unread' ? 'Okunmamış' : f === 'alert' ? 'Uyarılar' : 'Sistem'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <button
                    onClick={markAllRead}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                    <Check className="w-3 h-3" />
                    Tümünü okundu işaretle
                </button>
            </div>

            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`group relative flex items-start p-4 rounded-xl border transition-all duration-300 ${notification.read
                                    ? 'bg-transparent border-white/5 hover:bg-white/[0.02]'
                                    : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30 shadow-[0_0_15px_-5px_rgba(59,130,246,0.1)]'
                                }`}
                        >
                            <div className={`p-3 rounded-full mr-4 flex-shrink-0 ${notification.read ? 'bg-slate-800/50' : 'bg-slate-800'}`}>
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={`text-base font-semibold truncate ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                                        {notification.title}
                                    </h3>
                                    <span className="text-xs text-slate-500 whitespace-nowrap ml-2 flex-shrink-0">{notification.time}</span>
                                </div>
                                <p className={`text-sm leading-relaxed ${notification.read ? 'text-slate-500' : 'text-slate-300'}`}>
                                    {notification.description}
                                </p>
                            </div>

                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                                <button
                                    onClick={() => deleteNotification(notification.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {!notification.read && (
                                    <button
                                        onClick={() => {
                                            const newNotifs = notifications.map(n => n.id === notification.id ? { ...n, read: true } : n);
                                            setNotifications(newNotifs);
                                        }}
                                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                                        title="Okundu İşaretle"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {!notification.read && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-white/5 border-dashed">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Bildirim Yok</h3>
                        <p className="text-slate-500">Şu anda bu kriterlere uygun bildiriminiz bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
