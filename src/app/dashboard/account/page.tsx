"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Calendar, Briefcase, Save, Loader2, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountPage() {
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        age: "",
        experience: ""
    });

    useEffect(() => {
        const getProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                
                if (session?.user) {
                    const { user_metadata } = session.user;
                    setFormData({
                        full_name: user_metadata.full_name || "",
                        phone: user_metadata.phone || "",
                        age: user_metadata.age || "",
                        experience: user_metadata.experience || "beginner"
                    });
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    phone: formData.phone,
                    age: formData.age,
                    experience: formData.experience
                }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: "Hesap bilgileri başarıyla güncellendi." });
        } catch (error: any) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: "Güncelleme sırasında bir hata oluştu." });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white">Hesap Bilgileri</h1>
                <p className="text-slate-400">Profil bilgilerinizi buradan güncelleyebilirsiniz.</p>
            </div>

            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            İsim Soyisim
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Telefon Numarası
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Telefon Numaranız"
                        />
                    </div>

                    {/* Age */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Yaş
                        </label>
                        <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                            placeholder="Yaşınız"
                        />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Yatırım Deneyimi
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: "Yeni Başlayan", value: "beginner" },
                                { label: "Orta Seviye", value: "intermediate" },
                                { label: "Profesyonel", value: "advanced" }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, experience: opt.value })}
                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
                                        formData.experience === opt.value
                                            ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                            : "bg-black/50 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Area */}
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-lg flex items-center gap-3 ${
                                message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                        >
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <p className="text-sm font-medium">{message.text}</p>
                        </motion.div>
                    )}

                    <div className="pt-4 border-t border-white/10 flex justify-end">
                        <button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {updating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
