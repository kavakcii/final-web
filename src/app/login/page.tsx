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
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isOtpSuccess, setIsOtpSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const otpCode = formData.get("otpCode") as string;

    if (!otpCode || otpCode.length < 8) {
      addToast("Lütfen 8 haneli doğrulama kodunu eksiksiz girin.", "error");
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
         setIsOtpSuccess(true);
         // 1.5 saniye bekletme (FinAi'ye hoşgeldiniz mesajını görmesi için)
         setTimeout(() => {
           router.push("/dashboard");
           addToast("Hesabınız doğrulandı, hoş geldiniz!", "success");
         }, 1500);
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

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
      });

      if (error) throw error;
      
      setResendTimer(45);
      addToast("Doğrulama kodu tekrar gönderildi.", "success");
    } catch (error: any) {
      console.error("Resend Error:", error);
      addToast(error.message || "Kod gönderilemedi.", "error");
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
      const rawFirstName = formData.get("firstName") as string;
      const rawLastName = formData.get("lastName") as string;
      const confirmPassword = formData.get("confirmPassword") as string;
      const kvkk = formData.get("kvkk") as string;

      // İsimleri Otomatik Düzeltme
      const formatName = (n: string) => n.trim().charAt(0).toUpperCase() + n.trim().slice(1).toLowerCase();
      const formatSurname = (n: string) => n.trim().toUpperCase();

      const firstName = rawFirstName ? formatName(rawFirstName) : "";
      const lastName = rawLastName ? formatSurname(rawLastName) : "";

      if (!kvkk) {
        addToast("Lütfen Kullanım Koşulları ve KVKK metnini onaylayın.", "error");
        return;
      }
      
      // Katı İsim ve Soyisim Kontrolü
      const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]{2,}$/;
      
      // Rastgele Karakter Dizisi Kontrolü (Gelişmiş)
      const isRandomPattern = (str: string) => {
        const lower = str.toLowerCase().replace(/\s/g, '');
        // 1. Aynı harfin 3 kez üst üste tekrarlanması (aaaa, bbbb)
        if (/(.)\1\1/.test(lower)) return true;
        // 2. Sesli harf içermemesi (asdf, ghjk gibi anlamsız girişleri engeller)
        if (!/[aeıioöuü]/.test(lower)) return true;
        // 3. Çok yaygın klavye dizileri
        const commonPatterns = ['asdf', 'qwerty', 'zxcv', 'jklm'];
        if (commonPatterns.some(p => lower.includes(p))) return true;
        return false;
      };

      if (!firstName || !lastName || !confirmPassword) {
        addToast("Lütfen tüm alanları doldurun.", "error");
        return;
      }
      
      if (!nameRegex.test(firstName) || isRandomPattern(firstName)) {
        addToast("Lütfen anlamlı bir isim giriniz (Örn: Salih).", "error");
        return;
      }

      if (!nameRegex.test(lastName) || isRandomPattern(lastName)) {
        addToast("Lütfen anlamlı bir soyisim giriniz (Örn: KAVAKCI).", "error");
        return;
      }

      if (password.length < 8) {
        addToast("Şifreniz en az 8 karakter ve güçlü olmalıdır.", "error");
        return;
      }

      if (password !== confirmPassword) {
        addToast("Şifreleriniz eşleşmiyor.", "error");
        return;
      }
      
      formData.set("firstName", firstName);
      formData.set("lastName", lastName);
    }

    setIsLoading(true);
    try {
      if (isLoginMode) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            // Şifre Yanlış Kontrolü
            if (error.message.includes("Invalid login credentials")) {
               throw new Error("Hatalı e-posta veya şifre girdiniz.");
            }
            throw error;
          }
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
            if (error.message.includes("already registered") || error.message.includes("User already registered")) {
                throw new Error("Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.");
            }
            throw error;
          }

          // Supabase bazen sessizce başarılı döner ama identities boşsa kullanıcı zaten vardır
          if (data.user && data.user.identities && data.user.identities.length === 0) {
            throw new Error("Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın.");
          }

          if (data.user && !data.session) {
             // Opsiyonel e-posta onayı (OTP) aktif demektir
             setVerificationEmail(email);
             setIsVerifyingOtp(true);
             setResendTimer(45);
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

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;

    if (!email) {
      addToast("Lütfen e-posta adresinizi girin.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, 
      });

      if (error) throw error;
      
      addToast("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.", "success");
      setIsForgotPasswordMode(false);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      addToast(error.message || "Bir hata oluştu, lütfen tekrar deneyin.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = () => {
    setIsForgotPasswordMode(true);
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
      isOtpSuccess={isOtpSuccess}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={handleResendOtp}
      resendTimer={resendTimer}
      isForgotPasswordMode={isForgotPasswordMode}
      onForgotPassword={handleForgotPassword}
      onCancelForgotPassword={() => setIsForgotPasswordMode(false)}
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
