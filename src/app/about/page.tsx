"use client";

import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Brain,
  TrendingUp,
  ShieldCheck,
  Target,
  Sparkles,
  Award,
  ArrowRight,
  BookOpen,
  LineChart,
  Lightbulb,
  CheckCircle2
} from "lucide-react";
import { FinAiLogo } from "@/components/ui/logo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-[#00008B]">
      {/* Navbar */}
      <Navbar />

      <main className="flex-grow pt-28 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-100/50 via-indigo-50/40 to-transparent blur-[100px] pointer-events-none -z-10" />

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-[#00008B]/10 text-xs font-bold text-[#00008B] uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00008B]" />
              Hakkımızda & Vizyonumuz
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]"
            >
              Yatırımda Karmaşaya Son, <br />
              <span className="text-[#00008B]">Bilinçli Geleceğe Güçlü Adım.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-xl text-slate-600 font-medium leading-relaxed"
            >
              FinAi; finansal okuryazarlık seviyesi ne olursa olsun her bireyin kendi adına güvenle, 
              rasyonel verilere dayanarak sağlam adımlar atabilmesi ve yatırımlarını yapay zeka ile 
              şeffafça yönetebilmesi için kuruldu.
            </motion.p>
          </div>
        </section>

        {/* KURUCUNUN NOTU & BİZ KİMİZ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border-2 border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#00008B] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shadow-[#00008B]/20 shrink-0">
                SK
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-[#00008B]">Salih KAVAKCI</h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mt-0.5">FinAi Kurucusu</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-white rounded-full border border-slate-200 text-[#00008B] shadow-sm self-start sm:self-auto">
                    <Award className="w-3.5 h-3.5 text-[#00008B]" /> Kurucu Mesajı
                  </span>
                </div>

                <div className="space-y-4 text-slate-700 font-medium leading-relaxed text-base sm:text-lg">
                  <p>
                    "Yatırım dünyasına ilk adımını atan bir bireyin karşılaştığı en büyük engel bilginin azlığı değil; 
                    anlaşılmaz finansal jargonlar, karmaşık grafikler ve kulaktan dolma yönlendirmelerin yarattığı güvensizlik hissidir."
                  </p>
                  <p>
                    "FinAi’yi kurarken temel amacımız; finansal okuryazarlık seviyesi hiç olmayan veya yeni başlayan birinin dahi, 
                    <strong> 'Ben neye yatırım yapıyorum?', 'Bu hisse veya fon neden yükseliyor/düşüyor?', 'Alacağım kararın arkasında hangi somut veri var?'</strong> 
                    sorularına saniyeler içinde net, Türkçe ve doğrusal cümlelerle yanıt bulabilmesini sağlamaktı."
                  </p>
                  <p>
                    "FinAi sadece bir portföy takip aracı değil; yapay zeka desteğiyle veriyi anlaşılır kılan, karmaşık piyasa dinamiklerini 
                    yatırımcının lehine çeviren ve ülkemizin finansal okuryazarlık bilincini zirveye taşımayı hedefleyen güvenilir bir yol arkadaşıdır."
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* MİSYON & VİZYON GRID */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MİSYONUMUZ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white border-2 border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#00008B] mb-6 shadow-sm">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Misyonumuz</h3>
                <p className="text-slate-600 font-medium leading-relaxed text-base">
                  Yatırım dünyasına yeni giren veya girmek isteyen herkesin, finansal okuryazarlık düzeyi ne olursa olsun kendi adına 
                  sağlam, bilinçli ve rasyonel adımlar atmasını sağlamak. Yatırımcının neye yatırım yaptığını, varlıklarının değerini neyin 
                  etkilediğini şeffafça anlatarak, yatırım yaparken finansal okuryazarlığını da organik olarak geliştirmesine rehberlik etmek.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-[#00008B] shrink-0" />
                  <span>Finansal okuryazar olmasanız bile yatırıma güvenle başlama imkanı</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-[#00008B] shrink-0" />
                  <span>Her adımda neyin neden yapıldığını açıklayan yapay zeka</span>
                </div>
              </div>
            </motion.div>

            {/* VİZYONUMUZ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-[#00008B] to-[#1e3a8a] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white mb-6 shadow-sm">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Vizyonumuz</h3>
                <p className="text-white/90 font-medium leading-relaxed text-base">
                  FinAi platformunu Türkiye’de tasarruf ve yatırım yapan milyonlarca insana ulaştırmak; 
                  yapay zeka destekli akıllı piyasa analizini herkes için standart hale getirerek, 
                  ülkemizin finansal okuryazarlık seviyesini zirveye taşımak.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>Milyonlarca yatırımcıya ulaşan finansal bilinç ve yetkinlik hareketi</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>Yapay zeka gücüyle herkes için rasyonel ve erişilebilir piyasa analitiği</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TEMEL DEĞERLERİMİZ VE İLKELERİMİZ */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Temel Değerlerimiz ve İlkelerimiz
            </h2>
            <p className="text-slate-600 font-medium text-base sm:text-lg">
              FinAi olarak attığımız her adımda ve geliştirdiğimiz her algoritmada değişmez 4 temel ilkeye bağlı kalıyoruz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Değer 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-[#00008B] flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#00008B] mb-2">Veriye Dayalı Rasyonellik</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Duygusal ve kulaktan dolma kararlar yerine, tamamen matematiksel korelasyonlara ve doğrulanmış piyasa verilerine dayanıyoruz.
              </p>
            </motion.div>

            {/* Değer 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-[#00008B] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#00008B] mb-2">Yapay Zeka ve Şeffaflık</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Yapay zekanın sunduğu tüm analizlerde neyin nereden geldiğini açık ve net cümlelerle açıklayarak paylaşıyoruz.
              </p>
            </motion.div>

            {/* Değer 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-[#00008B] flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#00008B] mb-2">Veriyi Lehe Çevirme</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Piyasadaki karmaşık veri yığınlarını sadeleştirerek yatırımcının kendi stratejisi adına birer avantaja dönüştürmesini sağlıyoruz.
              </p>
            </motion.div>

            {/* Değer 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100/70 text-[#00008B] flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-[#00008B] mb-2">Finansal Okuryazarlık</h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Kullanıcının platformu kullandıkça piyasayı daha iyi okuyan, bilinçli ve bağımsız bir yatırımcı haline gelmesini destekliyoruz.
              </p>
            </motion.div>
          </div>
        </section>

        {/* NEYİ DEĞİŞTİRİYORUZ (GELENEKSEL VS FINAI) */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-24">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">FinAi ile Neyi Değiştiriyoruz?</h3>
                <p className="text-slate-400 text-sm sm:text-base font-medium">
                  Geleneksel karmaşık süreçleri yapay zeka ile modern ve anlaşılır bir deneyime dönüştürüyoruz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Geleneksel */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Eski / Geleneksel Yaklaşım</span>
                  <ul className="space-y-3 text-sm text-slate-300 font-medium">
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Kulaktan dolma tüyolarla plansız ve duygusal kararlar.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Karmaşık Excel tabloları ve dağınık aracı kurum ekranları.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-red-400 font-bold">✕</span>
                      <span>Hangi hissenin ne iş yaptığını ve riskini tam bilmeden yatırım yapma.</span>
                    </li>
                  </ul>
                </div>

                {/* FinAi */}
                <div className="bg-blue-600/20 border border-blue-400/30 rounded-2xl p-6 space-y-4">
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">FinAi ile Yeni Dönem</span>
                  <ul className="space-y-3 text-sm text-white font-medium">
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-400 font-bold">✓</span>
                      <span>Yapay zeka destekli, veriye dayalı rasyonel ve şeffaf içgörüler.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-400 font-bold">✓</span>
                      <span>BIST ve TEFAS portföyünü tek bir akıllı ekranda anlık kontrol etme.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-blue-400 font-bold">✓</span>
                      <span>Yatırım yaptıkça finansal okuryazarlığı geliştiren eğitici rehberlik.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA (EYLEME ÇAĞRI) */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Finansal Geleceğinizi Bilinçle Yönetmeye Hazır Mısınız?
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg max-w-2xl mx-auto">
            FinAi’ye hemen ücretsiz katılın; yatırımlarınızı yapay zeka gücüyle takip edin, finansal kararlarınızı sağlam temellere oturtun.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?tab=register"
              className="w-full sm:w-auto px-8 py-4 bg-[#00008B] hover:bg-black text-white font-bold rounded-full shadow-xl shadow-[#00008B]/20 transition-all flex items-center justify-center gap-2 text-base tracking-wide"
            >
              Hemen Ücretsiz Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-[#00008B] font-bold rounded-full border border-slate-200 transition-all text-base tracking-wide"
            >
              Özellikleri İncele
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
