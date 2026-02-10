"use client";

import { useState, useRef, useEffect } from "react";
import { AIInputWithLoading } from "@/components/ui/ai-input-with-loading";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function FinAlChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Merhaba! Ben FinAl Asistanı. Size nasıl yardımcı olabilirim? Yatırımlarınızı nasıl geliştirebileceğimizden bahsedelim mi?" }
    ]);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Real Gemini AI Logic
    const handleSendMessage = async (message: string) => {
        // 1. Add User Message
        const userMsg: Message = { role: "user", content: message };
        setMessages((prev) => [...prev, userMsg]);

        try {
            // 2. Call API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    history: messages.map(m => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: m.content }]
                    }))
                }),
            });

            if (!response.ok) throw new Error("API hatası");

            const data = await response.json();

            // 3. Add AI Response
            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Üzgünüm, şu an bağlantıda bir sorun var. Lütfen daha sonra tekrar deneyin." }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[380px] h-[600px] bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-sm">FinAl AI</h3>
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Çevrimiçi
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <Minimize2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex w-full",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                                            msg.role === "user"
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                            <AIInputWithLoading
                                id="chat-widget-input"
                                placeholder="Bir şeyler sorun... (Gemini Aktif)"
                                minHeight={44}
                                maxHeight={120}
                                loadingDuration={100} // Pure UI loading, real wait happens in async
                                onSubmit={handleSendMessage}
                                className="py-0"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                onClick={() => {
                    if (isMinimized) {
                        setIsMinimized(false);
                        setIsOpen(true);
                    } else {
                        setIsOpen(!isOpen);
                    }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "h-14 w-14 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 flex items-center justify-center text-white transition-all duration-300 hover:bg-blue-500",
                    isOpen && !isMinimized ? "rotate-90 bg-slate-700 hover:bg-slate-600" : ""
                )}
            >
                {isOpen && !isMinimized ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageSquare className="w-6 h-6" />
                )}
            </motion.button>
        </div>
    );
}
