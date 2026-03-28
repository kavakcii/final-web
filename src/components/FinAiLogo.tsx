import { cn } from "@/lib/utils";

interface FinAiLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const FinAiLogo = ({ className, size = "md" }: FinAiLogoProps) => {
    // Klişe robot ve borsa grafikleri yerine, ultra-minimalist ve felsefik bir 'FA' monogramı.
    // 'F' harfi sağlamlık ve güveni, kesişen eğik çizgi ve mavi nokta ise 'A' (Artifical Intelligence)
    // zekasını, minimalizmi ve yükselişi simgeler. 

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    };

    return (
        <div className={cn("relative flex items-center justify-center shrink-0", sizeClasses[size], className)} title="FinAi - Zeki Yatırım Asistanı">
            
            {/* Minimalist Beyaz Kanvas (White Ink Konsepti) */}
            <div className="relative z-10 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-center w-full h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 group">
                
                <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-500 p-1">
                    
                    {/* Network Web */}
                    <g stroke="currentColor" className="text-blue-900/40 dark:text-blue-300/30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 30 15 Q 10 30 15 50 T 25 85" />
                        <path d="M 30 15 Q 50 5 70 20" />
                        <path d="M 70 20 Q 80 40 60 50" />
                        <path d="M 60 50 Q 50 70 25 85" />
                        <path d="M 15 50 Q 40 40 60 50" />
                        <path d="M 25 85 Q 40 95 60 70" />
                        
                        <line x1="15" y1="50" x2="30" y2="15" />
                        <line x1="30" y1="50" x2="70" y2="20" />
                        <line x1="30" y1="85" x2="60" y2="50" />
                        <line x1="15" y1="50" x2="30" y2="85" />
                        <line x1="45" y1="35" x2="30" y2="50" />
                        <line x1="45" y1="35" x2="70" y2="20" />
                    </g>

                    {/* Core 'F' Structure */}
                    <g stroke="currentColor" className="text-blue-950 dark:text-blue-100" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="30" y1="15" x2="30" y2="85" />
                        <line x1="30" y1="15" x2="70" y2="20" />
                        <line x1="30" y1="50" x2="60" y2="50" />
                    </g>

                    {/* Nodes */}
                    <g fill="currentColor" className="text-blue-950 dark:text-blue-300">
                        <circle cx="30" cy="15" r="5" />
                        <circle cx="30" cy="50" r="5" />
                        <circle cx="25" cy="85" r="4.5" />
                        <circle cx="70" cy="20" r="5" />
                        <circle cx="60" cy="50" r="5" />
                        
                        <circle cx="15" cy="50" r="3" className="text-blue-800/60 dark:text-blue-400/60" />
                        <circle cx="45" cy="35" r="3" className="text-blue-800/60 dark:text-blue-400/60" />
                        <circle cx="60" cy="70" r="2.5" className="text-blue-800/60 dark:text-blue-400/60" />
                    </g>
                </svg>

            </div>
            
            {/* Çok ince, elit arkadan parlayan mavi aura (opsiyonel derinlik) */}
            <div className="absolute inset-0 bg-blue-600/5 dark:bg-blue-500/10 blur-xl rounded-full -z-10 group-hover:bg-blue-600/10 transition-colors duration-500" />
        </div>
    );
};
