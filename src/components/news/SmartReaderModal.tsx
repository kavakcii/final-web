"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Brain, Loader2, AlertCircle, ExternalLink, Sparkles, TrendingUp, Check, Copy } from "lucide-react";
import { useState } from "react";

interface SmartReaderModalProps {
    url: string | null;
    isLoading: boolean;
    error: string | null;
    articleData: {
        title: string;
        body: string;
        sourceUrl: string;
        keyPoints?: string[];
        marketImpact?: string;
    } | null;
    onClose: () => void;
}

export function SmartReaderModal({ url, isLoading, error, articleData, onClose }: SmartReaderModalProps) {
    const [copied, setCopied] = useState(false);

    if (!url) return null;

    const handleCopy = () => {
        if (url && typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Modal Top Header */}
                    <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#00008B] flex items-center justify-center text-white shadow-md shadow-[#00008B]/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-[#00008B]">FinAi Akıllı Okuma Odası</h2>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 fill-current" /> AI Destekli İstihbarat & Tam Metin
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopy}
                                className="p-2 text-slate-400 hover:text-[#00008B] hover:bg-slate-50 rounded-xl transition-all"
                                title="Bağlantıyı Kopyala"
                            >
                                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-[#00008B] hover:bg-slate-50 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <div className="relative">
                                    <Loader2 className="w-12 h-12 text-[#00008B] animate-spin" />
                                    <Brain className="w-6 h-6 text-[#00008B] absolute inset-0 m-auto animate-pulse" />
                                </div>
                                <p className="text-[#00008B] font-bold animate-pulse text-sm">
                                    Haber kazınıyor ve FinAi yapay zeka özeti çıkarılıyor...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center text-center py-20">
                                <AlertCircle className="w-16 h-16 text-rose-400 mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Haber Metnine Ulaşılamadı</h3>
                                <p className="text-slate-400 mb-8 max-w-md text-sm">{error}</p>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-8 py-3.5 bg-[#00008B] text-white rounded-2xl font-black shadow-lg hover:bg-[#0808a3] transition-all flex items-center gap-2"
                                >
                                    Orijinal Kaynakta Oku <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        ) : articleData ? (
                            <article className="max-w-3xl mx-auto space-y-8">
                                <h1 className="text-2xl md:text-3xl font-black text-[#00008B] leading-tight tracking-tight">
                                    {articleData.title}
                                </h1>

                                {/* AI Executive Summary & Market Impact Card */}
                                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-blue-700 fill-blue-700" />
                                        <h3 className="text-sm font-black text-[#00008B] uppercase tracking-wider">
                                            FinAi 30 Saniyelik Yönetici Özeti
                                        </h3>
                                    </div>

                                    {articleData.keyPoints && articleData.keyPoints.length > 0 && (
                                        <ul className="space-y-3">
                                            {articleData.keyPoints.map((point, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                                                    <span className="w-5 h-5 rounded-full bg-[#00008B] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                                        {idx + 1}
                                                    </span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {articleData.marketImpact && (
                                        <div className="pt-4 border-t border-blue-200/60 flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-[#00008B] uppercase tracking-wider">
                                                    Piyasaya & Portföye Olası Etki
                                                </h4>
                                                <p className="text-xs font-medium text-slate-600 mt-1 leading-relaxed">
                                                    {articleData.marketImpact}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Full Article Content */}
                                <div className="space-y-5 text-slate-700 leading-relaxed font-medium text-base md:text-lg border-t border-slate-100 pt-6">
                                    {articleData.body.split('\n\n').map((para, i) => (
                                        <p key={i} className="leading-relaxed">
                                            {para}
                                        </p>
                                    ))}
                                </div>

                                {/* Bottom Footer */}
                                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6">
                                    <a
                                        href={articleData.sourceUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-[#00008B] hover:underline flex items-center gap-1.5"
                                    >
                                        Haberin Orijinal Web Kaynağı <ExternalLink className="w-3.5 h-3.5" />
                                    </a>

                                    <button
                                        onClick={onClose}
                                        className="w-full sm:w-auto px-8 py-3 bg-slate-100 text-[#00008B] hover:bg-slate-200 rounded-2xl font-black text-xs transition-colors"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </article>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
