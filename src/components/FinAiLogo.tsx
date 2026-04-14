import Image from "next/image";
import { cn } from "@/lib/utils";

interface FinAiLogoProps {
    className?: string;
    size?: "sm" | "md" | "lg";
}

export const FinAiLogo = ({ className, size = "md" }: FinAiLogoProps) => {
    const sizeClasses = {
        sm: 32,
        md: 48,
        lg: 64
    };

    const targetSize = sizeClasses[size];

    return (
        <div className={cn("relative flex items-center justify-center shrink-0 group", className)} title="FinAi - Zeki Yatırım Asistanı" style={{ width: targetSize, height: targetSize }}>
            <svg width="100%" height="100%" viewBox="25 10 70 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-105 transition-transform duration-500 drop-shadow-lg">
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
                <path d="M45 87L50 95L55 87H45Z" fill="#1e40af" />
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
