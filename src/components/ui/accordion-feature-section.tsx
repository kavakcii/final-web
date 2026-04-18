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
      "BIST hisseleri ve TEFAS fonlarınızı tek bir panoda takip etmenizi sağlar. AI asistan ile portföyünüzü analiz edebilir, korelasyon analizleri yapabilir ve piyasa haberlerini izleyebilirsiniz.",
  },
  {
    id: 2,
    title: "Hangi varlıkları takip edebilirim?",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2426&auto=format&fit=crop",
    description:
      "BIST 100 hisselerini ve TEFAS yatırım fonlarını portföyünüze ekleyerek canlı fiyatlarla takip edebilirsiniz.",
  },
  {
    id: 3,
    title: "Verilerim güvende mi?",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2426&auto=format&fit=crop",
    description:
      "Verileriniz Supabase altyapısında güvenle saklanır. Hesabınıza sadece siz erişebilirsiniz.",
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
          <p className="text-[#00008B]/60 text-lg sm:text-xl font-medium uppercase tracking-widest text-[13px]">Bize en sık sorulan sorular ve yanıtları.</p>
        </div>

        <div className="flex w-full flex-col md:flex-row items-center md:items-start justify-between gap-12 bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-xl shadow-[#00008B]/5">
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
                      className={`text-xl md:text-2xl font-bold transition-colors text-left ${tab.id === activeTabId ? "text-[#00008B]" : "text-[#00008B]/40 md:group-hover:text-[#00008B]"}`}
                    >
                      {tab.title}
                    </h6>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mt-1 text-[#00008B]/70 font-medium leading-relaxed pr-6">
                      {tab.description}
                    </p>

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          
          <div className="hidden md:flex w-1/2 items-center justify-center min-h-[300px]">
             {/* Sadece Fotoğraf / Logo Alanı */}
             <Image 
                src="/logo.png" 
                alt="FinAi Logo" 
                width={250} 
                height={250} 
                className="object-contain" 
             />
          </div>
        </div>
      </div>
    </section>
  );
};

export { FAQAccordionSection };
