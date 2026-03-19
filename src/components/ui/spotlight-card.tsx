import React, { useEffect, useRef, ReactNode } from 'react';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'primary' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

export const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = "", 
  glowColor = 'blue', 
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smooth interaction and CPU efficiency
      if (rafId.current) cancelAnimationFrame(rafId.current);
      
      rafId.current = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        glow.style.transform = `translate(${x - 200}px, ${y - 200}px)`;
        glow.style.opacity = '1';
      });
    };

    const handleMouseLeave = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      glow.style.opacity = '0';
    };

    card.addEventListener('mousemove', handleMouseMove, { passive: true });
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const colorMap = {
    blue: 'from-blue-500/30 to-transparent',
    purple: 'from-purple-500/30 to-transparent',
    green: 'from-emerald-500/30 to-transparent',
    red: 'from-rose-500/30 to-transparent',
    orange: 'from-orange-500/30 to-transparent',
    primary: 'from-blue-600/40 to-transparent',
    navy: 'from-slate-400/20 to-transparent'
  };

  const sizeMap = {
    sm: 'p-4 rounded-xl',
    md: 'p-6 rounded-2xl',
    lg: 'p-8 rounded-[2.5rem]'
  };

  const style: React.CSSProperties = customSize ? {} : {
    width: width || 'auto',
    height: height || 'auto'
  };

  return (
    <div 
      ref={cardRef} 
      className={`relative overflow-hidden group transition-all duration-300 ${!customSize ? borderMap[glowColor] : ""} ${!customSize ? sizeMap[size] : ""} ${className}`}
      style={style}
    >
      {/* Optimized Spotlight Glow - Fixed size and layout for performance */}
      <div 
        ref={glowRef}
        className={`pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-[80px] bg-gradient-to-br ${colorMap[glowColor]} opacity-0 transition-opacity duration-500 z-0 will-change-transform`}
      />
      
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

const borderMap = {
  blue: 'border border-white/10 hover:border-blue-500/30',
  purple: 'border border-white/10 hover:border-purple-500/30',
  green: 'border border-white/10 hover:border-emerald-500/30',
  red: 'border border-white/10 hover:border-rose-500/30',
  orange: 'border border-white/10 hover:border-orange-500/30',
  primary: 'border border-white/10 hover:border-blue-600/40',
  navy: 'border border-white/10 hover:border-slate-700'
};
