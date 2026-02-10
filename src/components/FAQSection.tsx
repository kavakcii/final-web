"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "FinAl nedir ve nasıl çalışır?",
        answer: "FinAl, yapay zeka destekli bir finansal asistandır. Portföyünüzü analiz eder, piyasa verilerini tarar ve size kişiselleştirilmiş stratejiler sunar.",
    },
    {
        question: "Veriler ne kadar güncel?",
        answer: "Premium planda veriler anlık (canlı) olarak sunulur. Ücretsiz planda ise 15 dakika gecikmeli veri sağlanır.",
    },
    {
        question: "Mobilden kullanabilir miyim?",
        answer: "Evet! FinAl tamamen responsive (mobil uyumlu) bir tasarıma sahiptir. Telefonunuzdan veya tabletinizden tüm özelliklere erişebilirsiniz.",
    },
    {
        question: "İstediğim zaman iptal edebilir miyim?",
        answer: "Kesinlikle. Aboneliğinizi dilediğiniz zaman panonuzdan iptal edebilirsiniz. Herhangi bir taahhüt yoktur.",
    },
];

export function FAQSection() {
    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <AccordionItem key={idx} question={faq.question} answer={faq.answer} />
                ))}
            </div>
        </div>
    );
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-blue-900/20 rounded-xl bg-white/50 overflow-hidden hover:border-blue-900/40 transition-colors">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-6 py-4 text-left"
            >
                <span className="text-lg font-medium text-[#0a192f]">{question}</span>
                <div className={cn("p-1 rounded-full bg-blue-50 text-blue-600 transition-transform duration-300", isOpen && "rotate-45 bg-blue-100")}>
                    <Plus className="w-5 h-5" />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
