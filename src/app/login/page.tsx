"use client";

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80",
    name: "Ayşe Yılmaz",
    handle: "@ayseyilmaz",
    text: "FinAi sayesinde yatırımlarımı çok daha bilinçli ve stressiz yönetiyorum. Kesinlikle tavsiye ederim!"
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&q=80",
    name: "Mehmet Demir",
    handle: "@mdemir_fin",
    text: "Araştırma ve analiz süreçleri inanılmaz hızlandı. Temiz tasarımı ve güçlü özellikleriyle harika bir platform."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&q=80",
    name: "Zeynep Kaya",
    handle: "@zeynepinvest",
    text: "Kullanıcı deneyimi çok akıcı. Yeni başlayanlardan profesyonellere kadar herkese hitap eden yatırım asistanı."
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
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      isLoading={isLoading}
    />
  );
}
