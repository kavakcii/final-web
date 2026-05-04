"use client";

import { BehavioralTest } from "@/components/BehavioralTest";
import { Brain, ShieldCheck, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function BehavioralPage() {
    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F8FAFC] min-h-screen">
            {/* Header Section */}
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#00008B]/5 border border-[#00008B]/10 rounded-full w-fit">
                    <Brain className="w-3 h-3 text-[#00008B]" />
                    <span className="text-[10px] font-black text-[#00008B] uppercase tracking-widest">Davranışsal Finans Modülü</span>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                    Yatırımcı <span className="text-[#00008B]">Karakteri</span> Testi
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-2xl">
                    Piyasa fırtınasında nasıl kararlar veriyorsunuz? 60 saniyelik bu canlı simülasyonla gerçek risk karakterinizi keşfedin.
                </p>
            </div>

            {/* Steps Info */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Target, title: "Sermaye", desc: "Size verilen 100.000 ₺'yi yönetin." },
                    { icon: Zap, title: "Hızlı Karar", desc: "Anlık grafik değişimlerine tepki verin." },
                    { icon: ShieldCheck, title: "Analiz", desc: "Psikolojik profilinizi anında alın." }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                            <item.icon className="w-6 h-6 text-[#00008B]" />
                        </div>
                        <div>
                            <p className="font-black text-slate-900 text-sm">{item.title}</p>
                            <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Simulation Component */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pb-20"
            >
                <BehavioralTest />
            </motion.div>

            {/* Pro Tips */}
            <div className="max-w-4xl mx-auto bg-blue-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Brain className="w-10 h-10" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black italic mb-2 tracking-tight">FinAi Bilgi Notu</h4>
                        <p className="text-blue-100 text-sm leading-relaxed font-medium">
                            Bu test, "Behavioral Finance" (Davranışsal Finans) teorilerini temel alır. 
                            Finansal başarının %20'si teknik bilgi, %80'si ise psikolojik dayanıklılıktır. 
                            Test sonunda size en uygun portföy modelini bu sonuçlara göre güncelleyeceğiz.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
