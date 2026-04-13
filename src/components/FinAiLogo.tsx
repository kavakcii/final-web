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
            <Image
                src="/logo.png"
                alt="FinAi Logo"
                width={targetSize}
                height={targetSize}
                className="transform group-hover:scale-105 transition-transform duration-500 drop-shadow-md object-contain"
                priority
            />
        </div>
    );
};
