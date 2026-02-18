import { Bot, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinAiLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const FinAiLogo = ({ className, size = "md" }: FinAiLogoProps) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-7 h-7",
        lg: "w-10 h-10"
    };

    return (
        <div className={cn("relative flex items-center justify-center shrink-0", sizeClasses[size], className)}>
            {/* Arka Plan Glow Efekti */}
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />

            {/* Ana Logo Kabuğu */}
            <div className="relative z-10 p-2 bg-gradient-to-br from-slate-900 to-black border border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/10 flex items-center justify-center w-full h-full">
                <Bot className={cn("text-blue-400", iconSizes[size])} />

                {/* Akıllı Işıltı (AI simgesi) */}
                <div className="absolute -top-1 -right-1">
                    <Sparkles className={cn("text-cyan-400 animate-bounce", size === "sm" ? "w-2 h-2" : "w-3.5 h-3.5")} />
                </div>

                {/* Alt Kısımda Yükseliş Çizgisi */}
                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border border-white/10">
                    <TrendingUp className={cn("text-emerald-400", size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5")} />
                </div>
            </div>
        </div>
    );
};
