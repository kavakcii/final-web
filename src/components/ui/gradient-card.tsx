'use client'
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

interface GradientCardProps {
  title?: string;
  description?: string;
  link?: string;
  source?: string;
}

export const GradientCard = ({ 
  title = "AI-Powered Inbox Sorting", 
  description = "OpenMail revolutionizes email management with AI-driven sorting, boosting productivity and accessibility",
  link = "#",
  source = "Haber"
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
        className="relative rounded-[20px] overflow-hidden"
        style={{
          width: "200px",
          height: "260px",
          transformStyle: "preserve-3d",
          backgroundColor: "#000000",
          boxShadow: isHovered ? "0 20px 40px -10px rgba(78, 99, 255, 0.3)" : "0 10px 20px -5px rgba(0, 0, 0, 0.5)",
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
        {/* Reflection */}
        <motion.div
          className="absolute inset-0 z-35 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)",
          }}
          animate={{ opacity: isHovered ? 0.8 : 0.4 }}
        />

        {/* Purple Glow */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
          style={{
            background: `radial-gradient(circle at bottom center, rgba(161, 58, 229, 0.6) -20%, rgba(79, 70, 229, 0) 70%)`,
            filter: "blur(30px)",
          }}
          animate={{ opacity: isHovered ? 1 : 0.7 }}
        />

        {/* Border Glow */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] z-25"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)",
          }}
          animate={{
            boxShadow: isHovered ? "0 0 15px 2px rgba(172, 92, 255, 0.8)" : "0 0 5px 0px rgba(172, 92, 255, 0.4)"
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col h-full p-4 z-40 justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <Newspaper className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">{source}</span>
            </div>

            <div>
                <h3 className="text-[13px] font-bold text-white line-clamp-3 leading-tight tracking-tight">
                {title}
                </h3>
                <p className="text-[10px] text-gray-400 line-clamp-3 mt-1 leading-normal">
                {description}
                </p>
            </div>
          </div>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-white text-[10px] font-bold group mt-2"
          >
            Haberin Devamı
            <motion.svg className="ml-1 w-3 h-3" viewBox="0 0 16 16" fill="none" animate={{ x: isHovered ? 3 : 0 }}>
              <path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </a>
        </div>
      </motion.div>
    </div>
  );
};
