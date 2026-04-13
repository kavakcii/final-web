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
        <div className={cn("relative flex items-center justify-center shrink-0 group", sizeClasses[size], className)} title="FinAi - Zeki Yatırım Asistanı">
            
            <svg width="100%" height="100%" viewBox="25 15 65 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-500 drop-shadow-md">
                {/* Background Soft Glow */}
                <circle cx="58" cy="55" r="30" fill="#2563eb" opacity="0.15" filter="blur(8px)" className="group-hover:opacity-30 transition-opacity duration-500" />
                
                {/* Bottom Loop / Folded Ribbon */}
                <path 
                  d="M48 40C48 40 42 50 38 60C34 70 38 80 45 87C52 94 65 87 65 75C65 63 55 53 48 40Z" 
                  fill="url(#finAiLogoGradMain)" 
                />
                
                {/* Top Bar */}
                <path 
                  d="M32 25L82 23C85 23 88 27 86 31L78 43C76 47 72 48 68 48H36C32 48 29 45 30 41L32 25Z" 
                  fill="url(#finAiLogoGradTop)" 
                />
                
                {/* Accent Point */}
                <path 
                  d="M45 87L50 95L55 87H45Z" 
                  fill="#1e40af" 
                />

                <defs>
                  <linearGradient id="finAiLogoGradTop" x1="30" y1="25" x2="80" y2="45" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="finAiLogoGradMain" x1="40" y1="45" x2="65" y2="85" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e40af" />
                    <stop offset="1" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
            </svg>

        </div>
    );
};
