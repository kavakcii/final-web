"use client";

import { useState } from "react";
import Image from "next/image";
import { FinAiLogo } from "@/components/ui/logo";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface Feature197Props {
  features?: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "FinAi ne işe yarar?",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop",
    description:
      "Karmaşık finansal verileri yapay zeka ile sizin için analiz eder. Portföyünüzün röntgenini çeker, fırsatları ve riskleri önceden göstererek kararlarınızı daha emin vermenizi sağlar.",
  },
  {
    id: 2,
    title: "Hangi piyasaları destekliyor?",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2426&auto=format&fit=crop",
    description:
      "BIST 100 hisseleri, TEFAS yatırım fonları ve altın gibi temel yatırım araçlarını tek platformda konsolide ederek takip etmenizi sağlar.",
  },
  {
    id: 3,
    title: "Verilerim güvende mi?",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2426&auto=format&fit=crop",
    description:
      "Banka seviyesinde şifreleme ve modern standartlar kullanarak verilerinizin izole kalmasını sağlıyoruz. Bilgileriniz sadece size aittir.",
  },
];

const FAQAccordionSection = ({ features = defaultFeatures }: Feature197Props) => {
  const [activeTabId, setActiveTabId] = useState<number | null>(1);

  const handleValueChange = (value: string) => {
    if (value) {
      const id = parseInt(value.replace("item-", ""), 10);
      setActiveTabId(id);
    } else {
      setActiveTabId(null);
    }
  };

  return (
    <section className="py-20 w-full" id="faq">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-[#00008B] mb-4 tracking-tight">Merak Ettikleriniz</h2>
          <p className="text-slate-500 text-lg sm:text-xl font-medium">Bize en sık sorulan sorular ve yanıtları.</p>
        </div>

        <div className="flex w-full items-start justify-between gap-12 bg-slate-50 p-8 md:p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="w-full md:w-1/2">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="item-1"
              onValueChange={handleValueChange}
            >
              {features.map((tab) => (
                <AccordionItem key={tab.id} value={`item-${tab.id}`} className="border-b-none border-slate-200">
                  <AccordionTrigger
                    className="cursor-pointer -mx-4 px-4 py-6 md:-mx-6 md:px-6 md:py-8 hover:bg-slate-100/50 active:bg-slate-100 active:scale-[0.98] rounded-2xl !no-underline transition-all group"
                  >
                    <h6
                      className={`text-xl md:text-2xl font-bold transition-colors text-left ${tab.id === activeTabId ? "text-[#00008B]" : "text-slate-500 md:group-hover:text-blue-600"}`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-1 text-slate-500 font-medium leading-relaxed pr-6">
                      {tab.description}
                    </p>

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="relative hidden w-1/2 overflow-hidden rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] md:block min-h-[400px]">
             {/* Statik Logo Alanı */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#00008B] to-blue-900 flex flex-col items-center justify-center">
                {/* Radial glow background for logo */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]" />
                
                <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10 transition-transform duration-700 hover:scale-105 z-10">
                    <FinAiLogo showText={false} className="w-20 h-auto text-white drop-shadow-md" />
                </div>
                <h3 className="mt-6 text-4xl font-black text-white tracking-tight z-10 drop-shadow-md">FinAi<span className="text-blue-400">.</span></h3>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { FAQAccordionSection };
