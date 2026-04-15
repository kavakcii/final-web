"use client";

import { useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/providers/ToastProvider";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      addToast("Şifre en az 6 karakter olmalıdır.", "error");
      return;
    }

    if (password !== confirmPassword) {
      addToast("Şifreler eşleşmiyor.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      addToast("Şifreniz başarıyla güncellendi!", "success");
      
      // 2 saniye sonra girişe yönlendir
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      addToast(error.message || "Bir hata oluştu.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7fa] p-4 font-sans">
      {/* Arka Plan Efektleri */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,139,0.1)] border border-white relative z-10"
      >
        <div className="text-center mb-10">
          <div className="bg-[#00008B] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[#0f172a] mb-3">Yeni Şifre Belirle</h1>
          <p className="text-slate-500 font-medium">Lütfen hesabınız için yeni ve güvenli bir şifre oluşturun.</p>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="text-green-600 w-10 h-10" />
            </div>
            <p className="text-green-700 font-semibold text-lg">İşlem Başarılı!</p>
            <p className="text-slate-500 text-sm mt-1">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Yeni Şifre</label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 pr-12 transition-all group-hover:bg-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Şifreyi Onayla</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-4 transition-all hover:bg-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#00008B] text-white font-bold py-4 rounded-2xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f7fa]">Yükleniyor...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
