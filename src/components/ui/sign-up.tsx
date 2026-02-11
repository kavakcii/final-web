"use client";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback, createContext, Children } from "react";
// Importing class-variance-authority for the built-in button component
import { cva, type VariantProps } from "class-variance-authority";
// Importing icons from lucide-react
import { ArrowRight, Mail, Gem, Lock, Eye, EyeOff, ArrowLeft, X, AlertCircle, PartyPopper, Loader, User, Calendar, Briefcase } from "lucide-react";
// Importing animation components from framer-motion
import { AnimatePresence, motion, useInView, Variants, Transition } from "framer-motion";
import { TypewriterEffect } from "./typewriter-effect";
import { supabase } from "@/lib/supabase";

import { useRouter } from "next/navigation";

// --- CONFETTI LOGIC ---
// import type { ReactNode } from "react"
import type { GlobalOptions as ConfettiGlobalOptions, CreateTypes as ConfettiInstance, Options as ConfettiOptions } from "canvas-confetti"
import confetti from "canvas-confetti"

type Api = { fire: (options?: ConfettiOptions) => void }
export type ConfettiRef = Api | null
const ConfettiContext = createContext<Api>({} as Api)

const Confetti = forwardRef<ConfettiRef, React.ComponentPropsWithRef<"canvas"> & { options?: ConfettiOptions; globalOptions?: ConfettiGlobalOptions; manualstart?: boolean }>((props, ref) => {
    const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, ...rest } = props
    const instanceRef = useRef<ConfettiInstance | null>(null)
    const canvasRef = useCallback((node: HTMLCanvasElement) => {
        if (node !== null) {
            if (instanceRef.current) return
            instanceRef.current = confetti.create(node, { ...globalOptions, resize: true })
        } else {
            if (instanceRef.current) {
                instanceRef.current.reset()
                instanceRef.current = null
            }
        }
    }, [globalOptions])
    const fire = useCallback((opts = {}) => instanceRef.current?.({ ...options, ...opts }), [options])
    const api = useMemo(() => ({ fire }), [fire])
    useImperativeHandle(ref, () => api, [api])
    useEffect(() => { if (!manualstart) fire() }, [manualstart, fire])
    return <canvas ref={canvasRef} {...rest} />
})
Confetti.displayName = "Confetti";

// --- THEME-AWARE SVG GRADIENT BACKGROUND WITH SUBTLE ANIMATION ---
export const GradientBackground = () => (
    <>
        <style>
            {` @keyframes float1 { 0% { transform: translate(0, 0); } 50% { transform: translate(-10px, 10px); } 100% { transform: translate(0, 0); } } @keyframes float2 { 0% { transform: translate(0, 0); } 50% { transform: translate(10px, -10px); } 100% { transform: translate(0, 0); } } `}
        </style>
        <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="absolute top-0 left-0 w-full h-full">
            <defs>
                <linearGradient id="rev_grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.8 }} /><stop offset="100%" style={{ stopColor: 'var(--color-chart-3)', stopOpacity: 0.6 }} /></linearGradient>
                <linearGradient id="rev_grad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: 'var(--color-chart-4)', stopOpacity: 0.9 }} /><stop offset="50%" style={{ stopColor: 'var(--color-secondary)', stopOpacity: 0.7 }} /><stop offset="100%" style={{ stopColor: 'var(--color-chart-1)', stopOpacity: 0.6 }} /></linearGradient>
                <radialGradient id="rev_grad3" cx="50%" cy="50%" r="50%"><stop offset="0%" style={{ stopColor: 'var(--color-destructive)', stopOpacity: 0.8 }} /><stop offset="100%" style={{ stopColor: 'var(--color-chart-5)', stopOpacity: 0.4 }} /></radialGradient>
                <filter id="rev_blur1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="35" /></filter>
                <filter id="rev_blur2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="25" /></filter>
                <filter id="rev_blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="45" /></filter>
            </defs>
            <g style={{ animation: 'float1 20s ease-in-out infinite' }}>
                <ellipse cx="200" cy="500" rx="250" ry="180" fill="url(#rev_grad1)" filter="url(#rev_blur1)" transform="rotate(-30 200 500)" />
                <rect x="500" y="100" width="300" height="250" rx="80" fill="url(#rev_grad2)" filter="url(#rev_blur2)" transform="rotate(15 650 225)" />
            </g>
            <g style={{ animation: 'float2 25s ease-in-out infinite' }}>
                <circle cx="650" cy="450" r="150" fill="url(#rev_grad3)" filter="url(#rev_blur3)" opacity="0.7" />
                <ellipse cx="50" cy="150" rx="180" ry="120" fill="var(--color-accent)" filter="url(#rev_blur2)" opacity="0.8" />
            </g>
        </svg>
    </>
);


// --- CHILD COMPONENTS ---
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6"> <g fillRule="evenodd" fill="none"> <g fillRule="nonzero" transform="translate(3, 2)"> <path fill="#4285F4" d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"></path> <path fill="#34A853" d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"></path> <path fill="#FBBC05" d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"></path> <path fill="#EB4335" d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"></path> </g> </g></svg>);

const DefaultLogo = () => (<div className="bg-primary text-primary-foreground rounded-md p-1.5"> <Gem className="h-4 w-4" /> </div>);

// Helper for input styling
const InputField = ({ label, type, placeholder, value, onChange, colSpan = 1 }: any) => (
    <div className={cn("space-y-2", colSpan === 2 ? "col-span-2" : "col-span-1")}>
        <label className="text-sm font-medium text-slate-200">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
    </div>
);

// --- MAIN COMPONENT ---
interface AuthComponentProps {
    logo?: React.ReactNode;
    brandName?: string;
    className?: string;
    isTransparent?: boolean;
    onAuthSuccess?: () => void;
}

export const AuthComponent = ({ logo = <DefaultLogo />, brandName = "FinAl", className, isTransparent = false, onAuthSuccess }: AuthComponentProps) => {
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
    const [isLoginMode, setIsLoginMode] = useState(false); // DEFAULT TO REGISTER

    // MODAL STATE
    const [modalStatus, setModalStatus] = useState<'closed' | 'loading' | 'error' | 'success'>('closed');
    const [modalErrorMessage, setModalErrorMessage] = useState('');
    const confettiRef = useRef<ConfettiRef>(null);
    const router = useRouter();

    // TOGGLE MODE
    const toggleAuthMode = () => {
        setIsLoginMode(!isLoginMode);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setTermsAccepted(false);
        setMarketingAccepted(false);
        setModalStatus("closed");
        setModalErrorMessage("");
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard/portfolio`
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google login error:", error);
        }
    };

    // Check for existing session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                // Directly redirect without showing success modal
                router.push("/dashboard");
            }
        };
        checkSession();
    }, []);

    const fireSideCanons = () => {
        const fire = confettiRef.current?.fire;
        if (fire) {
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
            const particleCount = 50;
            fire({ ...defaults, particleCount, origin: { x: 0, y: 1 }, angle: 60 });
            fire({ ...defaults, particleCount, origin: { x: 1, y: 1 }, angle: 120 });
        }
    };

    const handleForgotPassword = async () => {
        if (modalStatus === 'loading') return;
        
        if (!email) {
            setModalErrorMessage("Lütfen şifrenizi sıfırlamak için e-posta adresinizi giriniz.");
            setModalStatus('error');
            return;
        }
        setModalStatus('loading');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            setModalErrorMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen kutunuzu kontrol ediniz.");
            setModalStatus('success');
        } catch (error: any) {
            console.error("Forgot password error:", error);
            let errorMessage = error.message || "Şifre sıfırlama e-postası gönderilemedi.";
            if (errorMessage.includes("rate limit") || errorMessage.includes("Email rate limit exceeded")) {
                errorMessage = "Güvenlik nedeniyle çok fazla deneme yapıldı. Lütfen bir süre bekleyip tekrar deneyin.";
            }
            setModalErrorMessage(errorMessage);
            setModalStatus('error');
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLoginMode) {
             if (!email || !password) {
                 setModalErrorMessage("Lütfen tüm alanları doldurunuz.");
                 setModalStatus('error');
                 return;
             }
        } else {
            // Register Validation
            if (!email || !password || !firstName || !lastName || !phone) {
                 setModalErrorMessage("Lütfen tüm alanları doldurunuz.");
                 setModalStatus('error');
                 return;
            }
            if (password !== confirmPassword) {
                setModalErrorMessage("Şifreler uyuşmuyor!");
                setModalStatus('error');
                return;
            }
            if (!termsAccepted) {
                setModalErrorMessage("Lütfen Kullanıcı Aydınlatma Metni'ni onaylayınız.");
                setModalStatus('error');
                return;
            }
        }

        setModalStatus('loading');

        try {
            if (isLoginMode) {
                // LOGIN FLOW
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
            } else {
                // REGISTER FLOW
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
                        setModalErrorMessage("Bu hesap zaten kayıtlı! Lütfen giriş yapınız.");
                        setModalStatus('error');
                        return;
                    }
                    throw error;
                }
            }

            // Success
            if (onAuthSuccess) {
                onAuthSuccess();
            }
            router.push("/dashboard");

        } catch (error: any) {
            console.error("Auth error:", error);
            let errorMessage = error.message || "Bir hata oluştu.";

            // Translate common Supabase errors
            if (errorMessage.includes("rate limit") || errorMessage.includes("Email rate limit exceeded")) {
                errorMessage = "Çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.";
            } else if (errorMessage.includes("Invalid login credentials")) {
                errorMessage = "Hatalı e-posta veya şifre.";
            }

            setModalErrorMessage(errorMessage);
            setModalStatus('error');
        }
    };

    const closeModal = () => {
        setModalStatus('closed');
        setModalErrorMessage('');
    };

    useEffect(() => {
        if (modalStatus === 'success' && !isLoginMode) {
            fireSideCanons();
        }
    }, [modalStatus, isLoginMode]);



    return (
        <div className={cn("relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#020817]", className)}>
            <Confetti ref={confettiRef} className="absolute left-0 top-0 z-0 size-full" onMouseEnter={() => { fireSideCanons(); }} />
            <div className="absolute inset-0 z-0 opacity-40"><GradientBackground /></div>

            <div className="relative z-10 w-full max-w-[480px] p-6">
                <AnimatePresence mode="wait">
                    {modalStatus === 'success' ? (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl"
                        >
                            {modalErrorMessage ? (
                                <>
                                    <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-white mb-2">E-posta Gönderildi</h2>
                                    <p className="text-slate-400 mb-4">{modalErrorMessage}</p>
                                    <button 
                                        onClick={closeModal} 
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                                    >
                                        Tamam
                                    </button>
                                </>
                            ) : (
                                <>
                                    <PartyPopper className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h2 className="text-2xl font-bold text-white mb-2">Hoşgeldin!</h2>
                                    <p className="text-slate-400">Giriş başarılı, yönlendiriliyorsunuz...</p>
                                </>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={isLoginMode ? "login" : "register"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                        >
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {isLoginMode ? "Tekrar Hoşgeldiniz" : "Yeni hesap oluşturun"}
                                </h1>
                                <p className="text-slate-400">
                                    {isLoginMode ? "Hesabınız yok mu? " : "Hesabınız var mı? "}
                                    <button onClick={toggleAuthMode} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                        {isLoginMode ? "Kayıt olun" : "Giriş yapın"}
                                    </button>
                                </p>
                            </div>

                            <form onSubmit={handleFinalSubmit} className="space-y-4">
                                {!isLoginMode ? (
                                    // REGISTER FORM
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField 
                                            label="İsim" 
                                            type="text" 
                                            value={firstName} 
                                            onChange={(e: any) => setFirstName(e.target.value)} 
                                        />
                                        <InputField 
                                            label="Soyisim" 
                                            type="text" 
                                            value={lastName} 
                                            onChange={(e: any) => setLastName(e.target.value)} 
                                        />
                                        
                                        <InputField 
                                            label="Telefon numarası" 
                                            type="tel" 
                                            colSpan={2}
                                            value={phone} 
                                            onChange={(e: any) => setPhone(e.target.value)} 
                                        />
                                        
                                        <InputField 
                                            label="E-mail adresi" 
                                            type="email" 
                                            colSpan={2}
                                            value={email} 
                                            onChange={(e: any) => setEmail(e.target.value)} 
                                        />
                                        
                                        <InputField 
                                            label="Şifre" 
                                            type="password" 
                                            value={password} 
                                            onChange={(e: any) => setPassword(e.target.value)} 
                                        />
                                        <InputField 
                                            label="Şifre tekrarı" 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={(e: any) => setConfirmPassword(e.target.value)} 
                                        />

                                        <div className="col-span-2 space-y-3 mt-2">
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? "bg-blue-600 border-blue-600" : "border-slate-600 group-hover:border-slate-500"}`}>
                                                    {termsAccepted && <ArrowRight className="w-3 h-3 text-white rotate-[-45deg] mt-[-2px]" />}
                                                    <input type="checkbox" className="hidden" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                                                </div>
                                                <span className="text-sm text-slate-400 flex-1">
                                                    <button type="button" className="text-white hover:underline">Kullanıcı Aydınlatma Metni'ni</button> okudum.*
                                                </span>
                                            </label>

                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${marketingAccepted ? "bg-blue-600 border-blue-600" : "border-slate-600 group-hover:border-slate-500"}`}>
                                                    {marketingAccepted && <ArrowRight className="w-3 h-3 text-white rotate-[-45deg] mt-[-2px]" />}
                                                    <input type="checkbox" className="hidden" checked={marketingAccepted} onChange={(e) => setMarketingAccepted(e.target.checked)} />
                                                </div>
                                                <span className="text-sm text-slate-400 flex-1">
                                                    {brandName} tarafından ticari elektronik ileti gönderilmesine <span className="text-white hover:underline">izin veriyorum.</span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    // LOGIN FORM
                                    <div className="space-y-4">
                                        <InputField 
                                            label="E-mail adresi" 
                                            type="email" 
                                            value={email} 
                                            onChange={(e: any) => setEmail(e.target.value)} 
                                        />
                                        <InputField 
                                            label="Şifre" 
                                            type="password" 
                                            value={password} 
                                            onChange={(e: any) => setPassword(e.target.value)} 
                                        />
                                        <div className="flex justify-end">
                                            <button 
                                                type="button" 
                                                onClick={handleForgotPassword}
                                                disabled={modalStatus === 'loading'}
                                                className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Şifremi unuttum?
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {modalStatus === 'error' && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {modalErrorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={modalStatus === 'loading'}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                >
                                    {modalStatus === 'loading' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader className="w-5 h-5 animate-spin" />
                                            İşleniyor...
                                        </span>
                                    ) : (
                                        isLoginMode ? "Giriş Yap" : "Kayıt Ol"
                                    )}
                                </button>


                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
