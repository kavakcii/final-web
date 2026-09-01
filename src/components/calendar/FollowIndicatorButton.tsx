"use client";

import { useState } from 'react';
import { Bell, BellOff, Check, Loader2, Info } from 'lucide-react';
import { useWebPush } from '@/lib/useWebPush';

interface FollowIndicatorButtonProps {
    indicatorName: string;
    compact?: boolean;
}

export default function FollowIndicatorButton({ indicatorName, compact = false }: FollowIndicatorButtonProps) {
    const { isFollowing, toggleFollowIndicator, userSession, permissionStatus, isSupported } = useWebPush();
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDeniedInfo, setShowDeniedInfo] = useState(false);

    const followed = isFollowing(indicatorName);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!userSession) {
            setShowLoginModal(true);
            return;
        }

        if (permissionStatus === 'denied' && !followed) {
            setShowDeniedInfo(true);
        }

        setLoading(true);
        try {
            await toggleFollowIndicator(indicatorName);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all ${
                    compact 
                        ? 'px-2.5 py-1 text-[10px]' 
                        : 'px-3.5 py-1.5 text-xs'
                } ${
                    followed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-white text-[#00008B] border border-slate-200 hover:bg-blue-50 hover:border-blue-300 shadow-xs'
                }`}
                title={followed ? 'Takipten Çık' : 'Bu göstergeyi takip et ve bildirim al'}
            >
                {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : followed ? (
                    <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Takip Ediliyor</span>
                    </>
                ) : (
                    <>
                        <Bell className="w-3.5 h-3.5 text-[#00008B]" />
                        <span>Takip Et</span>
                    </>
                )}
            </button>

            {/* Login Prompt Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white text-[#00008B] p-6 rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#00008B]">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-[#00008B]">Giriş Yapmanız Gerekiyor</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Göstergeleri takip edebilmek ve açıklanma anında bildirim alabilmek için kullanıcı hesabınıza giriş yapmalısınız.
                            </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-all"
                            >
                                Vazgeç
                            </button>
                            <a
                                href="/login"
                                className="flex-1 py-2 rounded-xl bg-[#00008B] text-white font-black text-xs hover:bg-[#0808a3] transition-all text-center"
                            >
                                Giriş Yap
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Permission Denied Info Banner */}
            {showDeniedInfo && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white text-[#00008B] p-6 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                <BellOff className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#00008B]">Tarayıcı Bildirim İzni Engellenmiş</h3>
                                <p className="text-xs text-slate-500 font-medium">FinAi Bildirim Rehberi</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            Gösterge hesabınızda takip ediliyor. Ancak tarayıcınız FinAi için bildirim iznini engellediği için anlık web push bildirimleri cihazınıza ulaşamayabilir.
                            <br /><br />
                            Bildirim almak için tarayıcı adres çubuğundaki kilit (🔒) ikonuna tıklayarak FinAi bildirimlerine izin verebilirsiniz.
                        </p>
                        <button
                            onClick={() => setShowDeniedInfo(false)}
                            className="w-full py-2 rounded-xl bg-[#00008B] text-white font-black text-xs"
                        >
                            Anladım
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
