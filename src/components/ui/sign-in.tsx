import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { LegalModal } from '@/components/ui/legal-modal';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);

const TypingText = ({ text }: { text: string }) => {
    const characters = Array.from(text);
    const container: Variants = {
      hidden: { opacity: 0 },
      visible: (i = 1) => ({
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 * i },
      }),
    };
  
    const child: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", damping: 12, stiffness: 200 },
      },
      hidden: {
        opacity: 0,
        y: 20,
        transition: { type: "spring", damping: 12, stiffness: 200 },
      },
    };
  
    return (
      <motion.div
        className="flex overflow-hidden text-3xl md:text-5xl font-bold tracking-tighter text-[#00008B]"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {characters.map((char, index) => (
          <motion.span variants={child} key={index}>
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          className="ml-1 w-1 h-8 md:h-12 bg-blue-600 rounded-full"
        />
      </motion.div>
    );
  };


// --- TYPE DEFINITIONS ---

export interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  features?: FeatureItem[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onToggleMode?: () => void;
  isLoginMode?: boolean;
  isVerifyingOtp?: boolean;
  isOtpSuccess?: boolean;
  onVerifyOtp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResendOtp?: () => void;
  resendTimer?: number;
  emailError?: string;
  emailValue?: string;
  onEmailChange?: (val: string) => void;
  isForgotPasswordMode?: boolean;
  onForgotPassword?: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancelForgotPassword?: () => void;
  isLoading?: boolean;
  isCheckingEmail?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-all duration-300 focus-within:border-blue-500/70 focus-within:bg-blue-500/10 ${className}`}>
    {children}
  </div>
);

const FeatureCard = ({ feature, delay }: { feature: FeatureItem, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-[20px] bg-white shadow-[0_10px_30px_rgba(0,0,139,0.08)] border border-slate-100 p-4 w-full h-full`}>
    <div className="flex-shrink-0 w-10 h-10 rounded-[14px] bg-[#00008B]/5 border border-[#00008B]/10 flex items-center justify-center text-[#00008B]">
      {feature.icon}
    </div>
    <div className="text-left flex-1 min-w-0 pr-1">
      <p className="font-bold text-[#00008B] text-[13px] leading-tight mb-1 truncate">{feature.title}</p>
      <p className="text-[#00008B]/80 font-medium text-[11px] leading-snug line-clamp-3">{feature.description}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">FinAi'ye Hoş Geldiniz</span>,
  description = "Hesabınıza giriş yapın ve yapay zeka destekli yatırım yolculuğunuza devam edin.",
  heroImageSrc,
  features = [],
  onSignIn,
  onResetPassword,
  onToggleMode,
  isLoginMode = true,
  isVerifyingOtp = false,
  isOtpSuccess = false,
  onVerifyOtp,
  onResendOtp,
  resendTimer = 0,
  emailError = "",
  emailValue = "",
  onEmailChange,
  isCheckingEmail = false,
  isForgotPasswordMode = false,
  onForgotPassword,
  onCancelForgotPassword,
  isLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // LEGAL MODAL STATE
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'kvkk'>('terms');

  // Şifre gücü hesaplama
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calculateStrength(passwordValue);
  const strengthColor = strength <= 25 ? "bg-red-500" : strength <= 50 ? "bg-orange-500" : strength <= 75 ? "bg-yellow-500" : "bg-green-500";
  const strengthText = strength <= 25 ? "Zayıf" : strength <= 50 ? "Orta" : strength <= 75 ? "İyi" : "Güçlü";

  // AUTOMATED LEGAL FLOW LOGIC
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent<HTMLFormElement> | null>(null);
  const [hasApprovedTerms, setHasApprovedTerms] = useState(false);
  const [hasApprovedKVKK, setHasApprovedKVKK] = useState(false);
  const [isAutoFlow, setIsAutoFlow] = useState(false);

  const openLegal = (tab: 'terms' | 'kvkk' = 'terms', auto: boolean = false) => {
      setLegalTab(tab);
      setIsAutoFlow(auto);
      setIsLegalModalOpen(true);
  };

  const handleActionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // ÖNCELİK 1: Eğer e-posta kontrol ediliyorsa bekle
    if (isCheckingEmail) return;

    // ÖNCELİK 2: Eğer e-posta hatası varsa (Zaten kayıtlı) MODALI ASLA AÇMA
    if (emailError) return;
    
    // Sadece kayıt modunda ve checkbox işaretli değilse süreci başlat
    if (!isLoginMode && !termsAccepted) {
      setPendingSubmitEvent(e);
      
      // İlk olarak kullanım koşullarını aç (Otomatik akışı başlat)
      if (!hasApprovedTerms) {
        openLegal('terms', true);
        return;
      }
      
      // Eğer koşullar onaylı ama KVKK değilse oradan başla (Otomatik akışı başlat)
      if (!hasApprovedKVKK) {
        openLegal('kvkk', true);
        return;
      }
    }

    // Giriş moduysa veya zaten onaylıysa direkt devam et
    onSignIn?.(e);
  };

  const handleLegalApprove = () => {
    if (legalTab === 'terms') {
      setHasApprovedTerms(true);
      
      // OTOMATİK AKIŞ: Koşullar bittiyse ve KVKK eksikse otomatik geç
      if (isAutoFlow && !hasApprovedKVKK) {
          setLegalTab('kvkk');
          return;
      }
    } else {
      setHasApprovedKVKK(true);
      
      // OTOMATİK AKIŞ: KVKK bittiyse ve Koşullar eksikse (nadir) geri dön
      if (isAutoFlow && !hasApprovedTerms) {
          setLegalTab('terms');
          return;
      }
    }

    // Modal'ı kapat
    setIsLegalModalOpen(false);

    // Her iki metin de onaylandığında çeki koy
    if ((legalTab === 'terms' ? true : hasApprovedTerms) && 
        (legalTab === 'kvkk' ? true : hasApprovedKVKK)) {
      setTermsAccepted(true);
      
      // EĞER OTOMATİK AKIŞTAYSAK: İşlemi devam ettir
      if (isAutoFlow && pendingSubmitEvent) {
          const event = pendingSubmitEvent;
          setTimeout(() => {
              onSignIn?.(event);
              setPendingSubmitEvent(null);
          }, 150);
      }
    }
  };

  const handleLegalReject = () => {
    setIsLegalModalOpen(false);
    setPendingSubmitEvent(null);
    setIsAutoFlow(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row font-sans w-full bg-background overflow-hidden relative">
      <Link href="/" className="absolute top-7 left-7 z-50 group flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all duration-300">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity">Ana Sayfa</span>
      </Link>
      {/* Light Gradient effect for FinAi branding */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none md:hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[130px] mix-blend-multiply" />
      </div>

      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 z-10 relative bg-background/80 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {isForgotPasswordMode ? <span className="font-light text-foreground tracking-tighter">Şifremi Unuttum</span> : isVerifyingOtp ? <span className="font-light text-foreground tracking-tighter">E-postanızı Doğrulayın</span> : isLoginMode ? title : <span className="font-light text-foreground tracking-tighter">Ayrıcalığa Katılın</span>}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {isForgotPasswordMode ? "Yeni şifre oluşturmak için kayıtlı e-posta adresinizi girin." : isVerifyingOtp ? "E-posta adresinize gönderilen 8 haneli güvenlik kodunu girin." : isLoginMode ? description : "Yeni nesil yapay zeka asistanınla hemen tanış."}
            </p>

            {isForgotPasswordMode ? (
              <form key="forgot-password" className="space-y-5" onSubmit={onForgotPassword}>
                <div className="animate-element animate-delay-200">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Kayıtlı E-Posta Adresi</label>
                  <GlassInputWrapper>
                    <input name="email" type="email" required placeholder="ornek@mail.com" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                  </GlassInputWrapper>
                </div>
                <button type="submit" disabled={isLoading} className="animate-element animate-delay-300 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50">
                  {isLoading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </button>
                <div className="animate-element animate-delay-400 text-center pt-2">
                  <a href="#" onClick={(e) => { e.preventDefault(); onCancelForgotPassword?.(); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Geri Dön</a>
                </div>
              </form>
            ) : isVerifyingOtp ? (
              <form key="otp" className="space-y-5" onSubmit={onVerifyOtp}>
                <div className="animate-element animate-delay-200">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Doğrulama Kodu</label>
                  <GlassInputWrapper>
                    <input name="otpCode" type="text" maxLength={8} required placeholder="" className="w-full bg-transparent text-center text-3xl font-bold tracking-[0.3em] p-4 rounded-2xl focus:outline-none" />
                  </GlassInputWrapper>
                </div>
                <button type="submit" disabled={isLoading || isOtpSuccess} className="animate-element animate-delay-300 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50">
                  {isLoading ? "Doğrulanıyor..." : "Hesabı Onayla"}
                </button>
                <div className="animate-element animate-delay-400 text-center text-base pt-2">
                  <button 
                    type="button" 
                    onClick={onResendOtp}
                    disabled={isLoading || resendTimer > 0}
                    className="text-blue-600 font-semibold hover:underline disabled:text-muted-foreground disabled:no-underline transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                  >
                    <span>Kodu Tekrar Gönder</span>
                    {resendTimer > 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs border border-blue-100 animate-pulse">
                        {resendTimer} sn
                      </span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
            <form key={isLoginMode ? "login" : "register"} className="space-y-5" onSubmit={handleActionSubmit}>
              {!isLoginMode && (
                <div className="grid grid-cols-2 gap-4 animate-element animate-delay-200">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Ad</label>
                    <GlassInputWrapper>
                      <input name="firstName" type="text" required placeholder="Adınız" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                    </GlassInputWrapper>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Soyad</label>
                    <GlassInputWrapper>
                      <input name="lastName" type="text" required placeholder="Soyadınız" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                    </GlassInputWrapper>
                  </div>
                </div>
              )}

              <div className={`animate-element ${isLoginMode ? "animate-delay-200" : "animate-delay-300"}`}>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">E-Posta Adresi</label>
                <GlassInputWrapper className={emailError && !isLoginMode ? "border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : ""}>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="ornek@mail.com" 
                    value={emailValue}
                    onChange={(e) => onEmailChange?.(e.target.value)}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" 
                  />
                </GlassInputWrapper>
                {emailError && !isLoginMode && (
                  <p className="text-[11px] text-red-500 font-bold mt-2 px-1 animate-pulse">
                     ⚠️ {emailError}
                  </p>
                )}
              </div>

              <div className={`animate-element ${isLoginMode ? "animate-delay-300" : "animate-delay-400"}`}>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Şifre</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>

                {/* Şifre Güç Barı (Sadece Kayıt Modunda) */}
                {!isLoginMode && passwordValue && (
                   <div className="mt-2 space-y-1.5 px-1 animate-element">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground">Şifre Gücü</span>
                        <span style={{ color: strength > 75 ? '#22c55e' : strength > 25 ? '#f59e0b' : '#ef4444' }}>{strengthText}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${strength}%` }}
                          className={`h-full ${strengthColor} transition-all duration-300`}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-tight">
                        En az 8 karakter, büyük harf, rakam ve sembol kullanın.
                      </p>
                   </div>
                )}
              </div>

              {!isLoginMode && (
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Şifre Tekrar</label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input name="confirmPassword" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                    </div>
                  </GlassInputWrapper>
                </div>
              )}

              {!isLoginMode && (
                <div className="animate-element animate-delay-400 px-1 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name="kvkk" 
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="custom-checkbox w-4 h-4 rounded border-slate-300 text-[#00008B] focus:ring-[#00008B] transition-all" 
                      />
                    </div>
                    <span className="text-[11px] leading-tight text-muted-foreground select-none">
                      <button type="button" onClick={() => openLegal('terms')} className="font-bold text-[#00008B] hover:underline">Kullanım Koşulları</button> ve <button type="button" onClick={() => openLegal('kvkk')} className="font-bold text-[#00008B] hover:underline">KVKK Aydınlatma Metnini</button> okudum, kabul ediyorum.
                    </span>
                  </label>
                </div>
              )}

              {isLoginMode && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="custom-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                    <span className="text-foreground/90 font-medium">Beni hatırla</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline font-medium text-blue-600 transition-colors">Şifremi unuttum</a>
                </div>
              )}

              <button type="submit" disabled={isLoading} className={`animate-element ${isLoginMode ? "animate-delay-600" : "animate-delay-700"} w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50`}>
                {isLoading ? "İşlem Yapılıyor..." : (isLoginMode ? "Giriş Yap" : "Hesap Oluştur")}
              </button>
            </form>
            )}

            {!isVerifyingOtp && !isForgotPasswordMode && (
              <p className="animate-element animate-delay-900 text-center font-medium text-sm text-muted-foreground pt-4">
                {isLoginMode ? "Yeni nesil yatırıma katılmak ister misin? " : "Zaten bir hesabın var mı? "}
                <a href="#" onClick={(e) => { e.preventDefault(); onToggleMode?.(); }} className="text-blue-600 font-semibold hover:underline transition-colors">
                   {isLoginMode ? "Hesap Oluştur" : "Giriş Yap"}
                </a>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Right column: hero image + features */}
      {heroImageSrc && (
        <section className="hidden md:flex flex-1 relative p-6 bg-background items-stretch overflow-hidden">
          <div className="w-full h-full flex flex-col gap-6 animate-slide-right animate-delay-300">
            {/* Logo Area - Top 70% height (flex-[2.33]) */}
            <div 
               className={`flex-[2.33] rounded-[40px] shadow-[0_20px_60px_rgba(0,0,139,0.06)] border border-slate-100 overflow-hidden flex items-center justify-center ${heroImageSrc.includes('logo') ? 'bg-white' : 'bg-cover bg-center'}`} 
               style={!heroImageSrc.includes('logo') ? { backgroundImage: `url(${heroImageSrc})` } : {}}
            >
               {heroImageSrc.includes('logo') ? (
                 <motion.img 
                   initial={{ scale: 0.8, opacity: 0, y: -30 }}
                   animate={{ scale: 1, opacity: 1, y: 0 }}
                   transition={{ duration: 1, ease: "easeOut" }}
                   src={heroImageSrc} 
                   alt="FinAi Logo" 
                   className="w-[45%] h-auto object-contain drop-shadow-[0_10px_35px_rgba(0,0,139,0.15)]" 
                 />
               ) : (
                 <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
               )}
            </div>

            {/* Features Area - Bottom 30% height (flex-1) */}
            {features.length > 0 && (
              <div className="flex-1 grid grid-cols-2 gap-4 px-2 w-full max-w-[750px] mx-auto content-center">
                {features.map((feature, index) => (
                    <div key={index} className="flex justify-center w-full">
                       <FeatureCard feature={feature} delay={`animate-delay-${1000 + (index * 200)}`} />
                    </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
        initialTab={legalTab} 
        onApprove={handleLegalApprove}
        onReject={handleLegalReject}
      />

      {/* SUCCESS OVERLAY WITH TYPING ANIMATION */}
      <AnimatePresence>
        {isOtpSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-white/95 backdrop-blur-xl"
          >
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20 mb-8"
              >
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.2 }}
                >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
              </motion.div>
              
              <TypingText text="FinAi'ye Hoş Geldiniz" />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-slate-500 font-medium"
              >
                Yatırım asistanınız hazırlanıyor...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
