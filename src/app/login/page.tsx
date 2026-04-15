"use client";

import { SignInPage, FeatureItem } from "@/components/ui/sign-in";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useToast } from "@/components/providers/ToastProvider";
import { Users, BarChart3, ShieldCheck, Zap } from "lucide-react";

const platformFeatures: FeatureItem[] = [
  {
    icon: <Users size={18} />,
    title: "5,000+ Yatırımcı",
    description: "FinAi topluluğuna katılarak akıllı yatırımlara adım atın.",
  },
  {
    icon: <BarChart3 size={18} />,
    title: "Akıllı Analiz",
    description: "Portföyünüzü yapay zeka destekli içgörülerle büyütün.",
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Güvenli Altyapı",
    description: "Verileriniz üst düzey banka veritabanı standartlarında korunur.",
  },
  {
    icon: <Zap size={18} />,
    title: "Anında Bildirim",
    description: "Piyasa fırsatlarını yakalamak için gerçek zamanlı uyarılar alın.",
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // URL'de '?tab=register' varsa isLoginMode false olacak şekilde bailat.
  const isRegisterTab = searchParams.get('tab') === 'register';
  const [isLoginMode, setIsLoginMode] = useState(!isRegisterTab);

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const otpCode = formData.get("otpCode") as string;

    if (!otpCode || otpCode.length !== 6) {
      addToast("Lütfen 6 haneli doğrulama kodunu eksiksiz girin.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: otpCode,
        type: 'signup'
      });

      if (error) throw error;
      if (data.session) {
         router.push("/dashboard");
         addToast("Hesabınız doğrulandı, hoş geldiniz!", "success");
      } else {
         addToast("Doğrulama başarılı ancak oturum açılamadı. Lütfen giriş yapın.", "success");
         setIsVerifyingOtp(false);
         setIsLoginMode(true);
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      addToast("Doğrulama kodu hatalı veya süresi geçmiş olabilir.", "error");
    } finally {
      setIsLoading(false);
    }
  };

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
          router.push("/dashboard");
      } else {
          const firstName = formData.get("firstName") as string;
          const lastName = formData.get("lastName") as string;
          
          const { data, error } = await supabase.auth.signUp({ 
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

          if (data.user && !data.session) {
             // Opsiyonel e-posta onayı (OTP) aktif demektir
             setVerificationEmail(email);
             setIsVerifyingOtp(true);
             addToast("E-postanıza 6 haneli bir doğrulama kodu gönderildi.", "success");
             return; // Dashboard'a yönlendirmeyi atla
          } else {
             // OTP kapalıysa direkt dashboard'a at
             router.push("/dashboard");
          }
      }
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
      isVerifyingOtp={isVerifyingOtp}
      onVerifyOtp={handleVerifyOtp}
      isLoading={isLoading}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-background"><div className="animate-pulse flex space-x-4"><div className="rounded-full bg-slate-200 h-10 w-10"></div><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div></div></div></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
