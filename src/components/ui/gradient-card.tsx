'use client'
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface GradientCardProps {
  title?: string;
  description?: string;
  link?: string;
  source?: string;
  relatedAsset?: string;
}

export const GradientCard = ({ 
  title = "Finansal Gelişmeler", 
  description = "",
  link = "#",
  source = "Haber",
  relatedAsset
}: GradientCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / rect.height) * 8;
      const rotateY = (x / rect.width) * 8;
      setRotation({ x: rotateX, y: rotateY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className="w-fit h-fit flex items-center justify-center bg-transparent">
      <motion.div
        ref={cardRef}
        className="relative rounded-[20px] overflow-hidden border border-slate-100"
        style={{
          width: "225px",
          height: "260px",
          transformStyle: "preserve-3d",
          backgroundColor: "#ffffff",
          boxShadow: isHovered ? "0 20px 40px -10px rgba(0, 0, 139, 0.2)" : "0 10px 20px -5px rgba(0, 0, 139, 0.1)",
        }}
        animate={{
          y: isHovered ? -5 : 0,
          rotateX: rotation.x,
          rotateY: rotation.y,
          perspective: 1000,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Subtle Glass Reflection */}
        <motion.div
          className="absolute inset-0 z-35 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)",
          }}
          animate={{ opacity: isHovered ? 0.9 : 0.6 }}
        />

        {/* Dark Blue Glow matching site colors */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
          style={{
            background: `radial-gradient(circle at bottom center, rgba(0, 0, 139, 0.15) -20%, rgba(0, 0, 139, 0) 70%)`,
            filter: "blur(30px)",
          }}
          animate={{ opacity: isHovered ? 1 : 0.5 }}
        />

        {/* Navy Bottom Border Glow */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] z-25"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0, 0, 139, 0.3) 50%, transparent 100%)",
          }}
          animate={{
            boxShadow: isHovered ? "0 0 15px 2px rgba(0, 0, 139, 0.2)" : "0 0 5px 0px rgba(0, 0, 139, 0.1)"
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full p-5 z-40 justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00008B]/5 flex items-center justify-center border border-[#00008B]/10">
                        <Newspaper className="w-4 h-4 text-[#00008B]" />
                    </div>
                    <span className="text-[10px] font-black text-[#00008B] uppercase tracking-[0.1em]">FinAi Haberler</span>
                    {relatedAsset && (
                        <div className="px-2 py-0.5 bg-[#00008B] text-white text-[8px] font-black rounded-md tracking-tighter">
                            {relatedAsset}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <h3 className="text-[12px] font-black text-[#00008B] line-clamp-3 leading-[1.3] tracking-tight">
                {title}
                </h3>
                <p className="text-[10px] text-[#00008B]/50 line-clamp-4 leading-relaxed font-medium">
                {description.replace(/<[^>]*>/g, '').trim()}
                </p>
            </div>
          </div>

          <a
            href="/dashboard/news"
            className="flex items-center text-[#00008B] text-[10px] font-bold group mt-2 hover:translate-x-1 transition-transform"
          >
            Haberin Devamı
            <motion.svg className="ml-1 w-3 h-3" viewBox="0 0 16 16" fill="none" animate={{ x: isHovered ? 3 : 0 }}>
              <path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
};
