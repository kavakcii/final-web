import React from "react";

export const FinAiLogo = ({ className = "w-48 h-auto", showText = true }: { className?: string, showText?: boolean }) => (
  <svg viewBox="0 0 320 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    
    {/* --- THE NEURAL NODE LOGO MARK: 'F' Network --- */}
    <g transform={showText ? "translate(0, 5)" : "translate(110, 5)"}>
        
        {/* Network Web (İnce bağlantı ağları - Yapay Zeka Aurası) */}
        <g stroke="currentColor" className="text-blue-900/40 dark:text-blue-300/30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Dış yörünge eğrileri (Brezier curves) */}
            <path d="M 30 15 Q 10 30 15 50 T 25 85" />
            <path d="M 30 15 Q 50 5 70 20" />
            <path d="M 70 20 Q 80 40 60 50" />
            <path d="M 60 50 Q 50 70 25 85" />
            <path d="M 15 50 Q 40 40 60 50" />
            <path d="M 25 85 Q 40 95 60 70" />
            
            {/* İç rastgele bağlantılar */}
            <line x1="15" y1="50" x2="30" y2="15" />
            <line x1="30" y1="50" x2="70" y2="20" />
            <line x1="30" y1="85" x2="60" y2="50" />
            <line x1="15" y1="50" x2="30" y2="85" />
            <line x1="45" y1="35" x2="30" y2="50" />
            <line x1="45" y1="35" x2="70" y2="20" />
        </g>

        {/* Core 'F' Structure (Ana Omurga) */}
        <g stroke="currentColor" className="text-blue-950 dark:text-blue-100" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {/* Dikey Omurga */}
            <line x1="30" y1="15" x2="30" y2="85" />
            <line x1="30" y1="15" x2="70" y2="20" />
            <line x1="30" y1="50" x2="60" y2="50" />
        </g>

        {/* Neural Nodes (Akıllı Zeka Noktaları) */}
        <g fill="currentColor" className="text-blue-950 dark:text-blue-300">
            {/* Ana F noktaları */}
            <circle cx="30" cy="15" r="5" />
            <circle cx="30" cy="50" r="5" />
            <circle cx="25" cy="85" r="4.5" />
            <circle cx="70" cy="20" r="5" />
            <circle cx="60" cy="50" r="5" />
            
            {/* Ekstra ağ düğümleri (Ufak) */}
            <circle cx="15" cy="50" r="3" className="text-blue-800/60 dark:text-blue-400/60" />
            <circle cx="45" cy="35" r="3" className="text-blue-800/60 dark:text-blue-400/60" />
            <circle cx="60" cy="70" r="2.5" className="text-blue-800/60 dark:text-blue-400/60" />
        </g>
    </g>

    {/* --- TEXT: FinAi --- */}
    {showText && (
      <text 
        x="100" 
        y="65" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="55" 
        letterSpacing="-2" 
        fill="currentColor" 
        className="text-blue-950 dark:text-white"
      >
        FinAi
      </text>
    )}
  </svg>
);
