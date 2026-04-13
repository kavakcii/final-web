"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
    {
        question: "FinAi nedir?",
        answer: "FinAi, BIST hisseleri ve TEFAS fonlarınızı tek bir panoda takip etmenizi sağlayan, AI destekli bir portföy yönetim platformudur.",
    },
    {
        question: "Hangi varlıkları takip edebilirim?",
        answer: "BIST 100 hisselerini ve TEFAS yatırım fonlarını portföyünüze ekleyerek canlı fiyatlarla takip edebilirsiniz.",
    },
    {
        question: "Mobil uyumlu mu?",
        answer: "Evet. FinAi tüm cihazlarda sorunsuz çalışan responsive bir tasarıma sahiptir.",
    },
    {
        question: "Aboneliğimi iptal edebilir miyim?",
        answer: "Evet, aboneliğinizi dilediğiniz zaman hesap ayarlarınızdan iptal edebilirsiniz.",
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
