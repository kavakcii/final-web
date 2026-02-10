'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button'; // Assuming this exists from previous steps
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
        // If success, usually redirects, so loading state might persist until redirect.
    };

    return (
        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-black p-6 transition-all hover:border-red-500/40 group">
            <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative flex items-center justify-between z-10">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium text-red-500 flex items-center gap-2">
                        <Trash2 className="w-5 h-5" />
                        Hesap Silme
                    </h3>
                    <p className="text-sm text-red-500/70 max-w-md">
                        Hesabınızı kalıcı olarak silmek istiyorsanız bu işlemi geri alamazsınız. Tüm verileriniz anında temizlenir.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowConfirm(true);
                        setConfirmInput('');
                    }}
                    className="relative inline-flex h-10 items-center justify-center overflow-hidden rounded-md bg-red-600/10 px-6 font-medium text-red-500 transition-all duration-300 hover:bg-red-600 hover:text-white border border-red-500/20 hover:border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                    <span className="mr-2">Hesabı Sil</span>
                </button>
            </div>

            {/* Confirmation Overlay within the card */}
            {showConfirm && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 text-center animate-inFadeIn duration-300">
                    <div className="w-full max-w-md space-y-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.2)] animate-pulse">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white">Hesabınızı Silmek Üzeresiniz</h4>
                        </div>

                        <p className="text-sm text-slate-400">
                            Bu işlem <span className="text-red-400 font-semibold">geri alınamaz</span>. Onaylamak için kutucuğa <span className="font-mono text-white bg-white/10 px-1 rounded">sil</span> yazınız.
                        </p>

                        <div className="flex gap-2 justify-center w-full">
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={(e) => setConfirmInput(e.target.value)}
                                placeholder="sil"
                                className="w-24 bg-black border border-white/20 rounded-md px-3 py-2 text-center text-white placeholder:text-white/20 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Vazgeç
                            </button>
                            <LoadingButton
                                onClick={handleDelete}
                                isLoading={isDeleting}
                                disabled={confirmInput.toLowerCase() !== 'sil'}
                                className="bg-red-600 hover:bg-red-700 text-white border-none shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:shadow-[0_0_25px_rgba(220,38,38,0.6)]"
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
