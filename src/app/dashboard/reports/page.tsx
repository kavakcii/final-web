'use client';

import { useState } from 'react';
import { FileText, Sparkles, Calendar, ArrowRight, Loader2, Download, Share2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [reportHtml, setReportHtml] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        try {
            // Call our existing API route with timeout protection
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

            const res = await fetch('/api/cron/weekly-report', { 
                method: 'POST',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Sunucu hatası: ${res.status}`);
            }

            const data = await res.json();
            
            if (data.success) {
                setReportHtml(data.htmlPreview);
                setReportData(data.data);
            } else {
                alert('Rapor oluşturulamadı: ' + data.error);
            }
        } catch (error: any) {
            console.error(error);
            if (error.name === 'AbortError') {
                alert('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.');
            } else {
                alert('Bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        Haftalık Bültenler
                    </h1>
                    <p className="text-slate-400 mt-2">
                        Yapay zeka destekli portföy analizleriniz ve piyasa özetleri.
                    </p>
                </div>
                
                <button 
                    onClick={handleGenerateReport}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Analiz Hazırlanıyor...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            <span>Yeni Talimat Oluştur</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Report List (History) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-400" />
                            Geçmiş Raporlar
                        </h3>
                        <div className="space-y-3">
                            {/* Mock Data for History */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-slate-300">Haftalık Bülten #{100 - i}</span>
                                        <span className="text-xs text-slate-500">{i * 7} gün önce</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className={`px-2 py-0.5 rounded-full ${i === 1 ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                                            {i === 1 ? '+%2.4 Kazanç' : '-%0.8 Kayıp'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-white font-semibold mb-2">E-posta Aboneliği</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Bu raporların her Pazartesi sabahı e-postanıza gelmesini ister misiniz?
                        </p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            Aboneliği Yönet
                        </button>
                    </div>
                </div>

                {/* Right Column: Report Preview */}
                <div className="lg:col-span-2">
                    {reportHtml ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl overflow-hidden shadow-2xl h-[800px] flex flex-col"
                        >
                            <div className="bg-slate-50 border-b p-4 flex justify-between items-center">
                                <div className="text-slate-700 font-medium text-sm">
                                    Önizleme Modu
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="İndir">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors" title="Paylaş">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <iframe 
                                srcDoc={reportHtml} 
                                className="w-full flex-1 border-0 bg-white" 
                                title="Report Preview"
                            />
                        </motion.div>
                    ) : (
                        <div className="bg-slate-900/30 border border-white/5 rounded-2xl h-[600px] flex flex-col items-center justify-center text-center p-8 border-dashed border-slate-700">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Henüz Bir Rapor Seçilmedi</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">
                                Yeni bir rapor oluşturmak için yukarıdaki butonu kullanın veya soldaki listeden geçmiş raporları seçin.
                            </p>
                            <button 
                                onClick={handleGenerateReport}
                                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 transition-colors"
                            >
                                Şimdi Oluştur <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
