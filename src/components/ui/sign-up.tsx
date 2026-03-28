import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, AlertCircle, Loader, Eye, EyeOff, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { FinAiLogo } from "@/components/ui/logo";
import Link from "next/link";

// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"> 
        <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g>
    </svg>
);

// Animated Input Component (21st.dev style)
const PremiumInput = ({ label, type, placeholder, value, onChange, colSpan = 1, showToggle = false, toggleState, onToggle }: any) => {
    return (
        <div className={cn("relative group font-sans flex flex-col gap-1.5", colSpan === 2 ? "col-span-2" : "col-span-1")}>
            <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 ml-1 tracking-wide">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={cn(
                        "w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all duration-300",
                        "focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm",
                        showToggle ? "pr-12" : ""
                    )}
                />
                {showToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 transition-colors rounded-full"
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

    // AGREEMENTS
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [marketingAccepted, setMarketingAccepted] = useState(false);

    // UI STATE
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(initialMode);

    // MODAL STATE
    // 'closed' -> normal form state, 'loading' -> submitting, 'error' -> generic error
    const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // TOGGLE MODE
    const toggleAuthMode = () => {
        setIsLoginMode(!isLoginMode);
        setEmail(""); setPassword(""); setConfirmPassword("");
        setFirstName(""); setLastName(""); setPhone("");
        setTermsAccepted(false); setMarketingAccepted(false);
        setStatus("idle"); setErrorMessage("");
    };

    // Check for existing session on mount
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
            if (!email || !password || !firstName || !lastName || !phone) {
                setErrorMessage("Lütfen tüm alanları doldurunuz.");
                setStatus('error');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMessage("Şifreler eşleşmiyor!");
                setStatus('error');
                return;
            }
            if (!termsAccepted) {
                setErrorMessage("Hesap oluşturmak için kullanıcı sözleşmesini onaylamalısınız.");
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

            // SUCCESS - DIRECT LOGIN W/O CONFIRMATION (assuming dashboard setting disabled confirmation)
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
        <div className={cn("flex min-h-screen w-full font-sans tracking-tight", className)}>
            
            {/* === SPLIT: LEFT (FORM SIDE) - CLEAN, WHITE/LIGHT, AIRY === */}
            <div className="w-full lg:w-[45%] flex flex-col bg-white dark:bg-[#020817] p-8 sm:p-12 lg:p-16 xl:p-24 relative overflow-y-auto custom-scrollbar shadow-2xl z-20">
                
                {/* Back Button */}
                <Link href="/" className="group flex items-center gap-2 text-[13px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors absolute top-8 sm:top-12">
                    <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-slate-50 dark:group-hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" />
                    </div>
                    Ana Sayfaya Dön
                </Link>

                <div className="w-full max-w-[420px] mx-auto mt-16 sm:mt-8 relative h-full flex flex-col justify-center">
                    
                    {/* Header Animation */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={isLoginMode ? 'header-login' : 'header-register'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="text-left mb-8"
                        >
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 mb-2">
                                {isLoginMode ? "Tekrar Hoş Geldin." : "Ayrıcalığa Katıl."}
                            </h1>
                            <p className="text-slate-500 font-medium text-[15px]">
                                {isLoginMode 
                                    ? "Yatırımlarınızı yönetmeye kaldığınız yerden devam edin." 
                                    : "Yeni nesil yapay zeka asistanınla tanışmanın tam zamanı."}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* OAuth Area */}
                    <div className="flex flex-col gap-4 w-full">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020817] px-4 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:shadow-sm active:scale-[0.98]"
                        >
                            <GoogleIcon className="w-5 h-5 flex-shrink-0" />
                            Google ile Devam Et
                        </button>

                        <div className="relative flex items-center py-4">
                            <span className="w-full border-t border-slate-100 dark:border-slate-800"></span>
                            <span className="bg-white dark:bg-[#020817] px-4 text-xs font-semibold text-slate-400 uppercase tracking-widest shrink-0">Veya E-posta İle</span>
                            <span className="w-full border-t border-slate-100 dark:border-slate-800"></span>
                        </div>
                    </div>

                    {/* Main Auth Form Animation */}
                    <AnimatePresence mode="wait">
                        <motion.form
                            key={isLoginMode ? "form-login" : "form-register"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            onSubmit={handleFinalSubmit}
                            className="flex flex-col gap-5 w-full"
                        >
                            {!isLoginMode ? (
                                /* REGISTER FORM */
                                <div className="grid grid-cols-2 gap-5 w-full">
                                    <PremiumInput label="Ad" type="text" placeholder="Mehmet" value={firstName} onChange={(e: any) => setFirstName(e.target.value)} />
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

                                    <div className="col-span-2 space-y-4 mt-2 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className={cn("mt-0.5 w-5 h-5 rounded-[4px] border shrink-0 flex items-center justify-center transition-all duration-200", termsAccepted ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400")}>
                                                {termsAccepted && <Check className="w-3.5 h-3.5 text-white dark:text-slate-900 stroke-[3]" />}
                                            </div>
                                            <span className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                                <button type="button" className="text-slate-900 dark:text-slate-300 font-semibold hover:underline">Kullanım Şartları</button> ve <button type="button" className="text-slate-900 dark:text-slate-300 font-semibold hover:underline">Aydınlatma Metnini</button> okudum, anladım ve kabul ediyorum.
                                            </span>
                                        </label>
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <div className={cn("mt-0.5 w-5 h-5 rounded-[4px] border shrink-0 flex items-center justify-center transition-all duration-200", marketingAccepted ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-slate-400")}>
                                                {marketingAccepted && <Check className="w-3.5 h-3.5 text-white dark:text-slate-900 stroke-[3]" />}
                                            </div>
                                            <span className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                                Tarafıma finansal bülten ve teklifler için ticari elektronik ileti gönderilmesine onay veriyorum.
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                /* LOGIN FORM */
                                <div className="space-y-5 w-full">
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
                                        <button type="button" className="absolute right-0 top-0 text-[13px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">Şifremi Unuttum</button>
                                    </div>
                                </div>
                            )}

                            {/* Error Msg */}
                            <AnimatePresence>
                                {status === 'error' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border dark:border-red-500/20 rounded-xl text-sm font-medium mt-1">
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
                                className="group relative w-full flex items-center justify-center p-4 mt-2 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_20px_-10px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {status === 'loading' ? (
                                    <Loader className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>{isLoginMode ? "Giriş Yap" : "Hesap Oluştur"}</span>
                                )}
                            </button>

                            {/* Toggle Mode */}
                            <p className="text-center text-[14px] font-medium text-slate-500 mt-4">
                                {isLoginMode ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
                                <button type="button" onClick={toggleAuthMode} className="text-slate-900 dark:text-white font-bold hover:underline underline-offset-4 decoration-2">
                                    {isLoginMode ? "Hemen Kaydol" : "Giriş Yap"}
                                </button>
                            </p>
                        </motion.form>
                    </AnimatePresence>
                </div>
            </div>

            {/* === SPLIT: RIGHT (PREMIUM BRAND AREA) - DEEP NAVY AURA === */}
            <div className="hidden lg:flex w-[55%] relative items-center justify-center bg-gradient-to-br from-[#0a192f] via-[#050b14] to-black overflow-hidden pointer-events-none">
                
                {/* Abstract Background Noise & Grid */}
                <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
                
                {/* Glowing Orbs */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full mix-blend-screen -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg px-12 flex flex-col items-start justify-center text-left">
                    <div className="mb-10 w-24 h-24 bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center rounded-3xl backdrop-blur-xl">
                        <FinAiLogo showText={false} className="w-14 h-auto text-white" />
                    </div>
                    
                    <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight drop-shadow-sm">
                        Yapay zeka ile<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">akıllı yatırım</span> devri.
                    </h2>
                    
                    <p className="text-lg text-slate-400 font-medium leading-relaxed mb-12 max-w-md">
                        Portföyünüzün tüm potansiyelini keşfedin. Kişiselleştirilmiş içgörüler, detaylı analizler ve veri destekli stratejilerle finansal hedeflerinize emin adımlarla ilerleyin.
                    </p>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-[15px] font-semibold tracking-wide">AI Destekli Portföy Röntgeni</p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-[15px] font-semibold tracking-wide">BIST & TEFAS Fonları İzleme</p>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-[15px] font-semibold tracking-wide">Risksiz ve Şifreli Veri Altyapısı</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
