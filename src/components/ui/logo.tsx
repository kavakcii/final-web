import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const FinAiLogo = ({ className, showText = true }: { className?: string, showText?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", className)}>
    {/* Resim Olarak Logo */}
    <Image
      src="/logo.png"
      alt="FinAi Logo"
      width={40}
      height={40}
      className="h-7 sm:h-9 w-auto object-contain shrink-0"
      priority
    />
    {/* Yalnızca İsim: FinAi */}
    {showText && (
      <span className="text-[#00008B] font-[800] text-3xl sm:text-4xl tracking-tight leading-none flex items-center" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
        FinAi
      </span>
    )}
  </div>
);
