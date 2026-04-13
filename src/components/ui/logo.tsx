import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const FinAiLogo = ({ className, showText = true }: { className?: string, showText?: boolean }) => (
  <div className={cn("flex items-center gap-3", className)}>
    {/* Resim Olarak Logo */}
    <Image
      src="/logo.png"
      alt="FinAi Logo"
      width={40}
      height={40}
      className="object-contain"
      priority
    />

    {/* Yalnızca İsim: FinAi */}
    {showText && (
      <span className="text-[#00008B] font-[800] text-3xl tracking-tight leading-none" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
        FinAi
      </span>
    )}
  </div>
);
