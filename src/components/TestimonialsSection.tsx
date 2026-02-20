"use client";
import { TestimonialStack, Testimonial } from "@/components/ui/glass-testimonial-swiper";
import { motion } from "framer-motion";
import { Users, TrendingUp, ShieldCheck, Zap, Globe, Clock, Star, Activity, PieChart } from "lucide-react";

// Adapted Turkish Testimonials Data
const testimonialsData: Testimonial[] = [
    {
        id: "1",
        initials: "AY",
        name: "Ayşe Yılmaz",
        role: "",
        quote: "FinAi sayesinde birikimlerimi nasıl değerlendireceğimi öğrendim. Özellikle fon analizleri ve yapay zeka önerileri çok başarılı.",
        tags: [{ text: "Öne Çıkan", type: "featured" }, { text: "Yatırım Fonu", type: "default" }],
        stats: [{ icon: TrendingUp, text: "%45 Kar Artışı" }, { icon: Clock, text: "6 Aydır Üye" }],
        avatarGradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    },
    {
        id: "2",
        initials: "MD",
        name: "Mehmet Demir",
        role: "",
        quote: "Portföyümü tek bir yerden takip etmek büyük kolaylık. Altın ve döviz yatırımlarımın performansını grafiklerle görmek çok net.",
        tags: [{ text: "Altın", type: "default" }, { text: "Döviz", type: "default" }],
        stats: [{ icon: Zap, text: "Anlık Veri" }, { icon: ShieldCheck, text: "Doğrulanmış" }],
        avatarGradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
        id: "3",
        initials: "ZK",
        name: "Zeynep Kaya",
        role: "",
        quote: "Yapay zeka asistanı finansal özgürlüğüm için harika ipuçları veriyor. Karmaşık terimler yerine anlaşılır özetler sunması çok iyi.",
        tags: [{ text: "Bireysel", type: "default" }, { text: "Yapay Zeka", type: "featured" }],
        stats: [{ icon: Star, text: "5 Yıldız" }, { icon: Activity, text: "Aktif Kullanıcı" }],
        avatarGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    {
        id: "4",
        initials: "CÖ",
        name: "Caner Öztürk",
        role: "",
        quote: "TEFAS fonlarını analiz ederken kayboluyordum, şimdi en iyi fonları saniyeler içinde bulup portföyüme ekleyebiliyorum.",
        tags: [{ text: "TEFAS", type: "default" }, { text: "Analiz", type: "featured" }],
        stats: [{ icon: ShieldCheck, text: "Güvenli" }, { icon: Globe, text: "Kapsamlı" }],
        avatarGradient: "linear-gradient(135deg, #ec4899, #d946ef)",
    },
    {
        id: "5",
        initials: "EY",
        name: "Emre Yıldız",
        role: "",
        quote: "Sade ve şık arayüzü sayesinde kullanımı çok keyifli. Karmaşık banka uygulamalarından sıkılanlar için birebir.",
        tags: [{ text: "Kullanıcı Dostu", type: "default" }, { text: "Web", type: "default" }],
        stats: [{ icon: PieChart, text: "Portföy Analizi" }, { icon: Users, text: "Topluluk" }],
        avatarGradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    }
];

export const TestimonialsSection = () => {
    return (
        <section id="testimonials" className="bg-transparent py-24 relative overflow-hidden">
            {/* Background Gradient Spot for aesthetics */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="container z-10 mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[700px] mx-auto mb-16"
                >
                    <div className="flex justify-center">
                        <div className="border border-blue-500/30 bg-blue-500/10 text-blue-300 py-1 px-4 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
                            Sizden Gelenler
                        </div>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center text-white mb-6">
                        Kullanıcılarımız Ne Diyor?
                    </h2>
                    <p className="text-center text-slate-400 text-lg leading-relaxed">
                        Binlerce bireysel ve kurumsal yatırımcı, FinAi ile finansal özgürlük yolculuğunda bir adım öne geçiyor.
                    </p>
                </motion.div>

                {/* New Glass Stack Swiper */}
                <div className="relative w-full flex items-center justify-center py-10">
                    <TestimonialStack testimonials={testimonialsData} />
                </div>
            </div>
        </section>
    );
};
