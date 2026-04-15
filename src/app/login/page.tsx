"use client";

import { SignInPage, FeatureItem } from "@/components/ui/sign-in";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Users, BarChart3, ShieldCheck } from "lucide-react";

const platformFeatures: FeatureItem[] = [
  {
    icon: <Users size={20} />,
    title: "5,000+ Aktif Yatırımcı",
    description: "FinAi topluluğuna katılarak akıllı yatırımlara adım atın.",
  },
  {
    icon: <BarChart3 size={20} />,
    title: "Akıllı Analizler",
    description: "Portföyünüzü yapay zeka destekli detaylı içgörülerle büyütün.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Güvenli Altyapı",
    description: "Verileriniz uçtan uca şifreleme ve banka standartlarında korunur.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      addToast("Lütfen tüm alanları doldurun.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleResetPassword = () => {
    // Implement forgot password navigation or modal
    addToast("Şifre sıfırlama henüz eklenmedi", "success");
  };

  const handleCreateAccount = () => {
    addToast("Kayıt olma sayfasına yönlendiriliyorsunuz (UI henüz entegre edilmedi).", "success");
    // Implement Register toggle if needed
  };

  return (
    <SignInPage
      heroImageSrc="/logo.png"
      features={platformFeatures}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading}
    />
  );
}
