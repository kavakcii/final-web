import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertCircle, Loader, Eye, EyeOff, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { FinAiLogo } from "@/components/ui/logo";
import Link from "next/link";
import { LegalModal } from "@/components/ui/legal-modal";

// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"> 
        <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g>
    </svg>
);

// Animated Input Component
const PremiumInput = ({ label, type, placeholder, value, onChange, colSpan = 1, showToggle = false, toggleState, onToggle }: any) => {
    return (
        <div className={cn("relative group font-sans flex flex-col gap-1.5", colSpan === 2 ? "col-span-2" : "col-span-1")}>
            <label className="text-[13px] font-semibold text-slate-700 ml-1 tracking-wide">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={cn(
                        "w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300",
                        "focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm",
                        showToggle ? "pr-12" : ""
                    )}
                />
                {showToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 transition-colors rounded-full"
                    >
                        {toggleState ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
interface AuthComponentProps {
    brandName?: string;
    className?: string;
    onAuthSuccess?: () => void;
}

export const AuthComponent = ({ brandName = "FinAi", className, onAuthSuccess }: AuthComponentProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Check URL params if user requested register tab explicitly
    const requestedTab = searchParams?.get('tab');
    const initialMode = requestedTab !== 'register'; 

    // FORM STATE
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingAccepted, setMarketingAccepted] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(initialMode);

    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // LEGAL MODAL STATE
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [legalTab, setLegalTab] = useState<'terms' | 'kvkk'>('terms');

    const openLegal = (tab: 'terms' | 'kvkk') => {
        setLegalTab(tab);
        setIsLegalModalOpen(true);
    };

    const toggleAuthMode = () => {
        setIsLoginMode(!isLoginMode);
        setEmail(""); setPassword(""); setConfirmPassword("");
        setFirstName(""); setLastName(""); setPhone("");
        setTermsAccepted(false); setMarketingAccepted(false);
        setStatus("idle"); setErrorMessage("");
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                router.push("/dashboard");
            }
        };
        checkSession();
    }, [router]);

    const handleGoogleLogin = async () => {
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

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validations
        if (isLoginMode) {
            if (!email || !password) {
                setErrorMessage("Lütfen tüm alanları doldurunuz.");
                setStatus('error');
                return;
            }
        } else {
            if (!email || !password) {
                setErrorMessage("Lütfen e-posta ve şifrenizi giriniz.");
                setStatus('error');
                return;
            }
        }

        setStatus('loading');

        try {
            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            full_name: `${firstName} ${lastName}`,
                            phone: phone,
                            marketing_consent: marketingAccepted
                        }
                    }
                });

                if (error) {
                    if (error.message.includes("already registered")) {
                        setErrorMessage("Bu e-posta kayıtlı. Giriş yapmayı deneyin.");
                        setStatus('error');
                        return;
                    }
                    throw error;
                }
            }

            // SUCCESS - DIRECT LOGIN
            if (onAuthSuccess) onAuthSuccess();
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Auth error:", error);
            let msg = error.message || "Bilinmeyen bir hata oluştu.";
            if (msg.includes("rate limit") || msg.includes("Email rate limit exceeded")) {
                msg = "Sistemimizi korumak için oran sınırına takıldınız. Lütfen bekleyip tekrar deneyin.";
            } else if (msg.includes("Invalid login credentials") || msg.includes("Invalid login")) {
                msg = "Hatalı e-posta veya şifre girdiniz.";
            }

            setErrorMessage(msg);
            setStatus('error');
        }
    };

    return (
        <div className={cn("flex min-h-screen w-full font-sans tracking-tight items-center justify-center relative overflow-x-hidden p-4 sm:p-8 bg-[#f8fafc]", className)}>
            
            {/* === ULTRA PREMIUM LIGHT MESH BACKGROUND (Stripe / Vercel Style) === */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Abstract Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply pointer-events-none" />
                <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[130px] mix-blend-multiply pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[10%] w-[80vw] h-[80vw] rounded-full bg-sky-200/30 blur-[140px] mix-blend-multiply pointer-events-none" />
                
                {/* Tech / Finance Subtle Grid with Top Fade */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            </div>
            
            {/* Back Button (Floating outside the card) */}
            <Link href="/" className="group flex items-center gap-2 text-[14px] font-semibold text-slate-300 hover:text-white transition-colors absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white/10 transition-colors bg-white/5 backdrop-blur-md">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                Ana Sayfa
            </Link>

            {/* === FROSTED GLASS APPLE-STYLE CARD === */}
            <div className="relative z-10 w-full max-w-[480px] bg-white/80 backdrop-blur-3xl border border-white/50 rounded-[2rem] p-8 sm:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),_0_0_0_1px_rgba(255,255,255,0.4)_inset]">
                
                {/* Logo & Header */}
                <div className="flex flex-col items-center text-center mb-10 w-full">
                    <div className="mb-6 drop-shadow-xl hover:scale-105 transition-transform duration-500 cursor-default">
                        <FinAiLogo showText={false} className="w-16 h-auto" />
                    </div>
                    
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={isLoginMode ? 'header-login' : 'header-register'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 mb-2 tracking-tight">
                                {isLoginMode ? "Tekrar Hoş Geldin" : "Ayrıcalığa Katıl"}
                            </h1>
                            <p className="text-slate-500 font-medium text-[15px]">
                                {isLoginMode 
                                    ? "Yatırımlarını yönetmeye devam et." 
                                    : "Yeni nesil yapay zeka asistanınla tanış."}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Removed OAuth Area (Google Login and Divider) */}

                {/* Main Auth Form Animation */}
                <AnimatePresence mode="wait">
                    <motion.form
                        key={isLoginMode ? "form-login" : "form-register"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        onSubmit={handleFinalSubmit}
                        className="flex flex-col gap-4 w-full"
                    >
                        {!isLoginMode ? (
                            /* REGISTER FORM */
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <PremiumInput label="Ad" type="text" placeholder="Ahmet" value={firstName} onChange={(e: any) => setFirstName(e.target.value)} />
                                <PremiumInput label="Soyad" type="text" placeholder="Yılmaz" value={lastName} onChange={(e: any) => setLastName(e.target.value)} />
                                <PremiumInput label="Telefon" type="tel" placeholder="05XX XXX XX XX" value={phone} onChange={(e: any) => setPhone(e.target.value)} colSpan={2} />
                                <PremiumInput label="E-Posta" type="email" placeholder="ornek@mail.com" value={email} onChange={(e: any) => setEmail(e.target.value)} colSpan={2} />
                                <PremiumInput 
                                    label="Şifre" 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password} 
                                    onChange={(e: any) => setPassword(e.target.value)} 
                                    showToggle={true} 
                                    toggleState={showPassword} 
                                    onToggle={() => setShowPassword(!showPassword)}
                                    colSpan={2} 
                                />
                                <PremiumInput 
                                    label="Şifre (Tekrar)" 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={confirmPassword} 
                                    onChange={(e: any) => setConfirmPassword(e.target.value)} 
                                    showToggle={true} 
                                    toggleState={showConfirmPassword} 
                                    onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                    colSpan={2} 
                                />

                                <div className="col-span-2 space-y-3 mt-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className={cn("mt-0.5 w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition-all duration-200", termsAccepted ? "bg-slate-900 border-slate-900" : "border-slate-300 bg-white group-hover:border-slate-400")}>
                                            <input type="checkbox" className="hidden" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} />
                                            {termsAccepted && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>
                                        <span className="text-[12px] text-slate-500 font-medium leading-[1.4]">
                                            <button type="button" onClick={() => openLegal('terms')} className="text-slate-800 font-bold hover:underline">Kullanım Şartları</button> ve <button type="button" onClick={() => openLegal('kvkk')} className="text-slate-800 font-bold hover:underline">Aydınlatma Metnini</button> onaylıyorum.
                                        </span>
                                    </label>
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className={cn("mt-0.5 w-[18px] h-[18px] rounded-[5px] border shrink-0 flex items-center justify-center transition-all duration-200", marketingAccepted ? "bg-slate-900 border-slate-900" : "border-slate-300 bg-white group-hover:border-slate-400")}>
                                            <input type="checkbox" className="hidden" checked={marketingAccepted} onChange={() => setMarketingAccepted(!marketingAccepted)} />
                                            {marketingAccepted && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </div>
                                        <span className="text-[12px] text-slate-500 font-medium leading-[1.4]">
                                            Yenilikler için e-posta gönderilmesine izin veriyorum.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            /* LOGIN FORM */
                            <div className="space-y-4 w-full">
                                <PremiumInput label="E-Posta Adresi" type="email" placeholder="ornek@mail.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
                                
                                <div className="relative">
                                    <PremiumInput 
                                        label="Şifre" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        value={password} 
                                        onChange={(e: any) => setPassword(e.target.value)} 
                                        showToggle={true} 
                                        toggleState={showPassword} 
                                        onToggle={() => setShowPassword(!showPassword)} 
                                    />
                                    <button type="button" className="absolute right-1 -top-1 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Şifremi Unuttum</button>
                                </div>
                            </div>
                        )}

                        {/* Error Msg */}
                        <AnimatePresence>
                            {status === 'error' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold mt-1">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>{errorMessage}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="group relative w-full flex items-center justify-center p-4 mt-2 text-[15px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {status === 'loading' ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>{isLoginMode ? "Giriş Yap" : "Hesap Oluştur"}</span>
                            )}
                        </button>

                        {/* Toggle Mode */}
                        <p className="text-center text-[13px] font-semibold text-slate-500 mt-4">
                            {isLoginMode ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
                            <button type="button" onClick={toggleAuthMode} className="text-slate-900 font-bold hover:underline underline-offset-4 decoration-2">
                                {isLoginMode ? "Hemen Kaydol" : "Giriş Yap"}
                            </button>
                        </p>
                    </motion.form>
                </AnimatePresence>
            </div>
            <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} initialTab={legalTab} />
        </div>
    );
};
