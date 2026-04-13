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
        quote: "Portföyümü tek bir yerden yönetmek büyük kolaylık. Hisse ve fon performansımı anlık takip ediyorum.",
        tags: [{ text: "Öne Çıkan", type: "featured" }, { text: "Portföy", type: "default" }],
        stats: [{ icon: TrendingUp, text: "Aktif Kullanıcı" }, { icon: Clock, text: "6 Aydır Üye" }],
        avatarGradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    },
    {
        id: "2",
        initials: "MD",
        name: "Mehmet Demir",
        role: "",
        quote: "BIST hisselerimi ve TEFAS fonlarımı tek panoda görmek çok pratik. Grafiklerdeki performans takibi çok net.",
        tags: [{ text: "BIST", type: "default" }, { text: "TEFAS", type: "default" }],
        stats: [{ icon: Zap, text: "Canlı Veri" }, { icon: ShieldCheck, text: "Doğrulanmış" }],
        avatarGradient: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
        id: "3",
        initials: "ZK",
        name: "Zeynep Kaya",
        role: "",
        quote: "AI asistanı portföyümle ilgili sorularıma hızlıca yanıt veriyor. Korelasyon analizi özelliği çok faydalı.",
        tags: [{ text: "Bireysel", type: "default" }, { text: "AI Asistan", type: "featured" }],
        stats: [{ icon: Star, text: "Beğendim" }, { icon: Activity, text: "Aktif" }],
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
                        Kullanıcılarımız FinAi deneyimlerini paylaşıyor.
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
