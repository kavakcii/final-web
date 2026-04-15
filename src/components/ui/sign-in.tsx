import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
    </svg>
);


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
  isLoading?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-blue-500/70 focus-within:bg-blue-500/10">
    {children}
  </div>
);

const FeatureCard = ({ feature, delay }: { feature: FeatureItem, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-4 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-5 w-[260px]`}>
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
      {feature.icon}
    </div>
    <div className="text-sm leading-snug">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{feature.title}</p>
      <p className="mt-1.5 text-slate-500 dark:text-slate-400 font-medium text-[13px]">{feature.description}</p>
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
  isLoading = false
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row font-sans w-full bg-background overflow-hidden relative">
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
              {isLoginMode ? title : <span className="font-light text-foreground tracking-tighter">Ayrıcalığa Katılın</span>}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {isLoginMode ? description : "Yeni nesil yapay zeka asistanınla hemen tanış."}
            </p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">E-Posta Adresi</label>
                <GlassInputWrapper>
                  <input name="email" type="email" required placeholder="ornek@mail.com" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Şifre</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                  <span className="text-foreground/90 font-medium">Beni hatırla</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline font-medium text-blue-600 transition-colors">Şifremi unuttum</a>
              </div>

              <button type="submit" disabled={isLoading} className="animate-element animate-delay-600 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50">
                {isLoading ? "İşlem Yapılıyor..." : (isLoginMode ? "Giriş Yap" : "Hesap Oluştur")}
              </button>
            </form>

            <p className="animate-element animate-delay-900 text-center font-medium text-sm text-muted-foreground pt-4">
              {isLoginMode ? "Yeni nesil yatırıma katılmak ister misin? " : "Zaten bir hesabın var mı? "}
              <a href="#" onClick={(e) => { e.preventDefault(); onToggleMode?.(); }} className="text-blue-600 font-semibold hover:underline transition-colors">
                 {isLoginMode ? "Hesap Oluştur" : "Giriş Yap"}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:flex flex-1 relative p-4 bg-background items-center justify-center">
          <div 
             className={`animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.3)] overflow-hidden ${heroImageSrc.includes('logo') ? 'bg-white bg-[length:40%] bg-center bg-no-repeat' : 'bg-cover bg-center'}`} 
             style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
             {!heroImageSrc.includes('logo') && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>}
          </div>
          {features.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-5 px-8 w-full justify-center lg:px-12">
              {features.map((feature, index) => (
                  <div key={index} className={index === 0 ? "flex" : index === 1 ? "hidden xl:flex" : "hidden 2xl:flex"}>
                     <FeatureCard feature={feature} delay={`animate-delay-${1000 + (index * 200)}`} />
                  </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
