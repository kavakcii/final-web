"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Pricing } from "@/components/ui/pricing";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { ModernPricingPage } from "@/components/ui/animated-glassy-pricing";
import { FAQSection } from "@/components/FAQSection";
import { InfiniteMovingCards } from "@/components/ui/InfiniteMovingCards";
import { FinAlChatWidget } from "@/components/FinAlChatWidget";
import {
  Brain,
  ShieldCheck,
  Zap,
  Globe,
  Check,
  X as XIcon,
  TrendingUp,
  Target
} from "lucide-react";

export default function Home() {
  const testimonialsData = [
    {
      id: 1,
      initials: 'AY',
      name: 'Ahmet Y.',
      role: 'Bireysel Yatırımcı',
      quote: "FinAl sayesinde portföyümdeki gizli riskleri anında fark ettim ve zamanında önlem aldım. Harika bir asistan!",
      tags: [{ text: 'Premium', type: 'featured' as const }, { text: 'BIST', type: 'default' as const }],
      stats: [{ icon: TrendingUp, text: '%35 Kar' }, { icon: ShieldCheck, text: 'Güvenli' }],
      avatarGradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
    {
      id: 2,
      initials: 'ZK',
      name: 'Zeynep K.',
      role: 'Finans Analisti',
      quote: "Borsa verilerini bu kadar sade ve net analiz eden başka bir uygulama yok. İşimi yarı yarıya hafifletti.",
      tags: [{ text: 'Kurumsal', type: 'featured' as const }, { text: 'Analiz', type: 'default' as const }],
      stats: [{ icon: Brain, text: 'AI Destekli' }, { icon: Zap, text: 'Hızlı' }],
      avatarGradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      id: 3,
      initials: 'MT',
      name: 'Mehmet T.',
      role: 'Kripto Trader',
      quote: "Yapay zeka önerileriyle piyasa düşerken bile bütçemi korumayı başardım. Kesinlikle tavsiye ederim.",
      tags: [{ text: 'Trader', type: 'featured' as const }, { text: 'Kripto', type: 'default' as const }],
      stats: [{ icon: Target, text: 'Tam İsabet' }, { icon: Globe, text: '7/24' }],
      avatarGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      id: 4,
      initials: 'EB',
      name: 'Elif B.',
      role: 'Yazılım Mühendisi',
      quote: "Premium özellikler parasını sonuna kadar hak ediyor. Anlık bildirimler hayat kurtarıyor.",
      tags: [{ text: 'Premium', type: 'featured' as const }, { text: 'Mobil', type: 'default' as const }],
      stats: [{ icon: Check, text: 'Onaylı' }],
      avatarGradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    },
    {
      id: 5,
      initials: 'CD',
      name: 'Caner D.',
      role: 'Girişimci',
      quote: "Karmaşık tablolar yerine net sinyaller vermesi çok iyi. Global piyasaları takip etmek artık çok kolay.",
      tags: [{ text: 'Global', type: 'default' as const }],
      stats: [{ icon: Globe, text: 'Dünya Çapında' }],
      avatarGradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    }
  ];

  const pricingPlans = [
    {
      name: "Classic",
      price: "100",
      yearlyPrice: "80",
      period: "ay",
      features: [
        "Temel Piyasa Verileri",
        "Sınırlı Varlık Takibi (5 Adet)",
        "Günlük Özet",
      ],
      description: "Başlangıç seviyesi yatırımcılar için ideal.",
      buttonText: "Hemen Başla",
      href: "#",
      isPopular: false,
    },
    {
      name: "Premium",
      price: "250",
      yearlyPrice: "200",
      period: "ay",
      features: [
        "Canlı Borsa Verileri (Anlık)",
        "Sınırsız Varlık Takibi",
        "Yapay Zeka Destekli Analiz",
        "Portföy Risk Raporu",
        "7/24 Asistan Desteği"
      ],
      description: "Profesyonellar gibi yatırım yapın.",
      buttonText: "Premium'a Geç",
      href: "#",
      isPopular: true,
    },
  ];

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-slate-50 text-slate-900">
      {/* Dynamic Background Effect (Optimized for Light) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-white to-white" />

      <Navbar />

      {/* AI Chat Widget */}
      <FinAlChatWidget />

      <main className="flex-1">
        {/* HERO SECTION: Biz Kimiz? */}
        <section id="hero" className="snap-start h-screen flex flex-col justify-center relative pt-20 pb-8 px-6 text-center shrink-0 [scroll-snap-stop:always] overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-medium text-sm animate-fade-in shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Yatırımın Geleceği
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0a192f] drop-shadow-sm">
              Biz <span className="text-blue-600">FinAl</span>'iz.
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Yatırım dünyasındaki karmaşayı, yapay zeka teknolojisiyle netliğe kavuşturan yeni nesil bir finansal asistanız.
            </p>

            <p className="text-lg text-slate-500 max-w-3xl mx-auto">
              Amacımız, her seviyeden yatırımcının profesyonel fon yöneticileri kadar donanımlı kararlar almasını sağlamak. Veri yığınlarını anlamlı stratejilere dönüştürüyoruz.
            </p>
          </div>

          <div className="mt-12 w-full overflow-hidden bg-[#0a192f] py-8 shadow-2xl border-y border-blue-900 relative z-30">
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />
            <InfiniteMovingCards items={testimonialsData} direction="right" speed="slow" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
        </section>

        {/* FEATURES: Neler Yapabiliriz? */}
        <section id="features" className="snap-start h-screen flex flex-col justify-center py-8 bg-white border-y border-slate-200 shrink-0 [scroll-snap-stop:always] overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0a192f] mb-4">Neler Yapabiliriz?</h2>
              <p className="text-slate-500 text-lg">FinAl sizin için 7/24 çalışır.</p>
            </div>

            <BentoGrid className="max-w-6xl mx-auto">
              <BentoGridItem
                title="Akıllı Portföy Yönetimi"
                description="Hisse, Altın ve Fonlarınızı tek yerden takip edin, anlık kar/zarar durumunuzu görün."
                header={<div className="relative w-full h-full min-h-[160px] rounded-xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2426&auto=format&fit=crop" alt="Portfolio" fill className="object-cover transition-transform duration-500 hover:scale-110" /></div>}
                icon={<Target className="h-5 w-5 text-blue-500" />}
                className="md:col-span-2"
              />
              <BentoGridItem
                title="Piyasa Analizi"
                description="BIST 100 ve küresel piyasaları anlık tarar."
                header={<div className="relative w-full h-full min-h-[160px] rounded-xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=2426&auto=format&fit=crop" alt="Market" fill className="object-cover transition-transform duration-500 hover:scale-110" /></div>}
                icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                className="md:col-span-1"
              />
              <BentoGridItem
                title="Risk Raporlama"
                description="Portföyünüzdeki riskleri önceden tespit eder."
                header={<div className="relative w-full h-full min-h-[160px] rounded-xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2426&auto=format&fit=crop" alt="Risk" fill className="object-cover transition-transform duration-500 hover:scale-110" /></div>}
                icon={<ShieldCheck className="h-5 w-5 text-red-500" />}
                className="md:col-span-1"
              />
              <BentoGridItem
                title="AI Destekli Öngörü"
                description="Gemini yapay zekası ile geleceğe yönelik stratejiler geliştirin."
                header={<div className="relative w-full h-full min-h-[160px] rounded-xl overflow-hidden"><Image src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2426&auto=format&fit=crop" alt="AI" fill className="object-cover transition-transform duration-500 hover:scale-110" /></div>}
                icon={<Brain className="h-5 w-5 text-purple-500" />}
                className="md:col-span-2"
              />
            </BentoGrid>
          </div>
        </section>

        {/* COMPARISON: Planlar Arasındaki Fark */}
        <section id="pricing" className="snap-start h-screen flex flex-col justify-center shrink-0 [scroll-snap-stop:always] overflow-hidden relative">
          <ModernPricingPage
            title="Şeffaf Fiyatlandırma"
            subtitle="Size en uygun planı seçin ve kazanmaya başlayın."
            plans={[
              {
                planName: 'Başlangıç',
                description: 'Yatırım dünyasına giriş yapın.',
                price: '0',
                features: ['15 Dk Gecikmeli Veri', 'Tek Portföy Hakkı', 'Temel Analiz Araçları', 'Günlük Piyasa Özeti'],
                buttonText: 'Hemen Başla',
                buttonVariant: 'primary'
              },
              {
                planName: 'Standart',
                description: 'Bilinçli yatırımcılar için.',
                price: '299',
                features: ['Canlı Borsa Verisi', 'Sınırsız Portföy', 'AI Haber Analizi', 'Gelişmiş Grafikler'],
                buttonText: 'Seç',
                isPopular: true,
                buttonVariant: 'primary'
              },
              {
                planName: 'Premium',
                description: 'Profesyonellerin tercihi.',
                price: '499',
                features: ['Derinlikli (L1) Veri', 'AI Alım/Satım Sinyalleri', 'Risk Yönetim Raporu', 'Algo-Trading Desteği'],
                buttonText: 'Premium Ol',
                buttonVariant: 'primary'
              },
            ]}
            showAnimatedBackground={false}
          />
        </section>

        {/* FAQ Section */}
        <section className="snap-start h-screen flex flex-col justify-between pt-24 bg-slate-50 shrink-0 [scroll-snap-stop:always] overflow-hidden">
          <div className="flex-1 flex flex-col justify-center px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#0a192f] mb-4">Sıkça Sorulan Sorular</h2>
              <p className="text-slate-600 text-lg">Aklınıza takılan soruların yanıtları.</p>
            </div>
            <FAQSection />
          </div>

          <div className="mt-auto w-full">
            <Footer />
          </div>
        </section>

      </main>
    </div>
  );
}
