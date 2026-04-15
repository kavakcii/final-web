"use client";

import { SignInPage, FeatureItem } from "@/components/ui/sign-in";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Users, BarChart3, ShieldCheck, Zap } from "lucide-react";

const platformFeatures: FeatureItem[] = [
  {
    icon: <Users size={20} />,
    title: "5,000+ Yatırımcı",
    description: "FinAi topluluğuna katılarak akıllı yatırımlara adım atın.",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Akıllı Analiz",
    description: "Portföyünüzü yapay zeka destekli içgörülerle büyütün.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Güvenli Altyapı",
    description: "Verileriniz üst düzey banka veritabanı standartlarında korunur.",
  },
  {
    icon: <Zap size={20} />,
    title: "Anında Bildirim",
    description: "Piyasa fırsatlarını yakalamak için gerçek zamanlı uyarılar alın.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      addToast("Lütfen e-posta ve şifrenizi girin.", "error");
      return;
    }

    if (!isLoginMode) {
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      
      if (!firstName || !lastName || !confirmPassword) {
        addToast("Lütfen isim, soyisim ve şifre onayı alanlarını doldurun.", "error");
        return;
      }
      
      if (password !== confirmPassword) {
        addToast("Şifreleriniz eşleşmiyor, lütfen kontrol edin.", "error");
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
      } else {
          const firstName = formData.get("firstName") as string;
          const lastName = formData.get("lastName") as string;
          
          const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: {
                first_name: firstName,
                last_name: lastName,
                full_name: `${firstName} ${lastName}`
              }
            }
          });
          if (error) {
            if (error.message.includes("already registered")) {
                throw new Error("Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.");
            }
            throw error;
          }
      }
      
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      let msg = error.message || "Bilinmeyen bir hata oluştu.";
      if (msg.includes("Invalid login credentials")) {
          msg = "Hatalı e-posta veya şifre girdiniz.";
      }
      addToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    addToast("Şifre sıfırlama henüz eklenmedi", "success");
  };

  return (
    <SignInPage
      heroImageSrc="/logo.png"
      features={platformFeatures}
      onSignIn={handleAuth}
      onResetPassword={handleResetPassword}
      onToggleMode={() => setIsLoginMode(!isLoginMode)}
      isLoginMode={isLoginMode}
      isLoading={isLoading}
    />
  );
}
