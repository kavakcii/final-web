'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { cn } from '@/lib/utils';

interface DeleteAccountSectionProps {
    onDelete: () => Promise<void>;
}

export function DeleteAccountSection({ onDelete }: DeleteAccountSectionProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmInput, setConfirmInput] = useState('');

    const handleDelete = async () => {
        if (confirmInput.toLowerCase() !== 'sil') return;
        setIsDeleting(true);
        try {
            await onDelete();
        } catch (error) {
            console.error("Delete failed", error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-rose-50/40 p-6 md:p-8 transition-all hover:border-rose-300 group">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10">
                <div className="space-y-1">
                    <h3 className="text-base font-black text-rose-700 flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        Hesabı Kalıcı Olarak Sil
                    </h3>
                    <p className="text-xs text-rose-600/80 max-w-lg font-medium leading-relaxed">
                        Hesabınızı kalıcı olarak silmek istiyorsanız bu işlemi geri alamazsınız. Tüm portföy verileriniz ve tercihleriniz anında temizlenir.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowConfirm(true);
                        setConfirmInput('');
                    }}
                    className="shrink-0 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 active:scale-95"
                >
                    Hesabı Sil
                </button>
            </div>

            {/* Confirmation Overlay within the card */}
            {showConfirm && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6 text-center animate-in fade-in duration-200 rounded-3xl">
                    <div className="w-full max-w-md space-y-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <h4 className="text-base font-black text-[#00008B]">Hesabınızı Silmek Üzeresiniz</h4>
                        </div>

                        <p className="text-xs text-slate-600 font-medium">
                            Bu işlem <span className="text-rose-600 font-bold">geri alınamaz</span>. Onaylamak için kutucuğa <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-lg">sil</span> yazınız.
                        </p>

                        <div className="flex gap-2 justify-center w-full">
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="sil"
                                className="w-28 bg-white border-2 border-rose-300 rounded-xl px-3 py-2 text-center text-sm font-bold text-rose-700 placeholder:text-rose-300 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-200 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                Vazgeç
                            </button>
                            <LoadingButton
                                onClick={handleDelete}
                                isLoading={isDeleting}
                                disabled={confirmInput.toLowerCase() !== 'sil'}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-4 py-2 border-none shadow-md shadow-rose-600/30 disabled:opacity-50"
                            >
                                Hesabı Kalıcı Olarak Sil
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

