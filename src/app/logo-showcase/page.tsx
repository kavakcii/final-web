"use client";

import React from "react";

// Ortak bileşen: FinAi yazısı
const FinAiText = () => (
    <text 
        x="95" 
        y="65" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" 
        fontWeight="800" 
        fontSize="55" 
        letterSpacing="-3" 
        fill="currentColor" 
        className="text-blue-950 dark:text-white"
    >
        FinAi
    </text>
);

export default function LogoShowcase() {
    const logos = [
        {
            id: 1,
            name: "The Architect (Mimari Kesişim)",
            desc: "Güvenin sembolü siyah/füme iskeletin, yapay zeka hızını (safir mavisi) kesmesi.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(0, 10)">
                        <path d="M20 70V20H55 M20 45H45" stroke="currentColor" strokeWidth="6" strokeLinecap="square" className="text-blue-950" />
                        <path d="M35 20L65 70" stroke="currentColor" strokeWidth="6" strokeLinecap="square" className="text-blue-800" />
                        <circle cx="65" cy="20" r="5" fill="currentColor" className="text-blue-800" />
                    </g>
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 2,
            name: "The Pulse (Sonsuz Çizgi)",
            desc: "Finansal akışın ve yapay zekanın kesintisiz gücünü anlatan tek bir zarif çizgi.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 70 L 30 20 L 50 70 L 60 40 L 80 50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-950" />
                    <circle cx="80" cy="50" r="6" fill="currentColor" className="text-blue-500" />
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 3,
            name: "The Monogram (Klasik Özel F.A)",
            desc: "F ve A harflerinin negatif alanla birbirini tamamladığı premium Apple tarzı mühür.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <rect x="0" y="10" width="16" height="60" fill="currentColor" className="text-blue-950" />
                        <rect x="0" y="10" width="45" height="16" fill="currentColor" className="text-blue-950" />
                        <rect x="25" y="35" width="20" height="16" fill="currentColor" className="text-blue-950" />
                        <path d="M60 70 L75 10 L90 70" stroke="currentColor" strokeWidth="10" strokeLinecap="square" strokeLinejoin="miter" className="text-blue-800" />
                    </g>
                    <text x="110" y="65" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="55" letterSpacing="-3" fill="currentColor" className="text-blue-950">FinAi</text>
                </svg>
            )
        },
        {
            id: 4,
            name: "The Apex (Zirve - Yükseliş)",
            desc: "F'nin içindeki saklı dağı/yükselişi yansıtan keskin açılı ultra minimal tasarım.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <path d="M10 70V10H60 M10 40H40" stroke="currentColor" strokeWidth="8" strokeLinecap="square" className="text-blue-950" />
                        <path d="M35 70L60 30L85 70" fill="currentColor" className="text-blue-800/20" stroke="currentColor" strokeWidth="4" />
                        <path d="M35 70L60 30L85 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-800" />
                    </g>
                    <text x="110" y="65" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="55" letterSpacing="-3" fill="currentColor" className="text-blue-950">FinAi</text>
                </svg>
            )
        },
        {
            id: 5,
            name: "The Monolith (Sağlam Duvar)",
            desc: "Merkez bankaları gibi aşılmaz, sarsılmaz 3 sütunlu yapay zeka aurası.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <rect x="10" y="10" width="12" height="60" rx="6" fill="currentColor" className="text-slate-400" />
                        <rect x="30" y="30" width="12" height="40" rx="6" fill="currentColor" className="text-blue-500" />
                        <rect x="50" y="10" width="12" height="60" rx="6" fill="currentColor" className="text-blue-950" />
                        <circle cx="36" cy="16" r="6" fill="currentColor" className="text-blue-800 animate-pulse" />
                    </g>
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 6,
            name: "The Ribbon (Zarif İlmik)",
            desc: "Yapay zekanın organikliğini ve finansın döngüselliğini simgeleyen pürüzsüz kavis.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 70 Q 20 20 50 20 T 80 70" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" className="text-blue-950" />
                    <path d="M10 45 Q 50 0 80 45" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" className="text-blue-500" />
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 7,
            name: "The Vertex (Keskin Nokta)",
            desc: "Yırtıcı ve ultra hızlı algoritmaları temsilen tek, kusursuz keskin bir elmas vuruşu.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <path d="M10 70 L 40 10 L 70 70 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" className="text-blue-950" />
                        <path d="M40 10 L 40 70" stroke="currentColor" strokeWidth="6" className="text-blue-500" />
                        <path d="M10 40 L 70 40" stroke="currentColor" strokeWidth="6" className="text-blue-950" />
                    </g>
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 8,
            name: "The Node (Veri Ağı)",
            desc: "F ve A'nın uç noktalarını zeka ile bağlayan ince çizgili yapay sinir ağı illüzyonu.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <path d="M20 60 L 20 20 L 50 20 L 50 60" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-950" />
                        <path d="M20 40 L 40 40 L 60 70" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-950" />
                        <circle cx="20" cy="20" r="4" fill="currentColor" className="text-blue-800" />
                        <circle cx="50" cy="20" r="4" fill="currentColor" className="text-blue-800" />
                        <circle cx="60" cy="70" r="4" fill="currentColor" className="text-blue-800" />
                        <circle cx="20" cy="40" r="4" fill="currentColor" className="text-blue-950" />
                    </g>
                    <FinAiText />
                </svg>
            )
        },
        {
            id: 9,
            name: "The Echo (İkiz Yankı)",
            desc: "Kendini fona yaslamış katmanlı güven ve şeffaflık vizyonu, negatif alan oyunu.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <path d="M10 10V70H30V40H60V10H10Z" fill="currentColor" className="text-slate-900" />
                        <path d="M75 70L55 30L35 70H75Z" fill="white" />
                        <path d="M75 70L55 30L35 70" stroke="currentColor" strokeWidth="5" className="text-blue-500" strokeLinejoin="miter" />
                    </g>
                    <text x="100" y="65" fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="55" letterSpacing="-3" fill="currentColor" className="text-slate-900">FinAi</text>
                </svg>
            )
        },
        {
            id: 10,
            name: "The Oracle (Gözcü İz)",
            desc: "Piyasayı her daim gözeten yuvarlak bir yapay zeka çemberi ve dışa taşan yatırım büyümesi.",
            svg: (
                <svg viewBox="0 -10 320 120" className="w-full h-auto max-h-32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(10, 10)">
                        <circle cx="40" cy="40" r="25" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-900" />
                        <path d="M40 15 V 65 M 15 40 H 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-slate-900" />
                        <path d="M40 40 L 75 15" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-blue-500 cursor-pointer hover:stroke-cyan-400" />
                        <circle cx="75" cy="15" r="5" fill="currentColor" className="text-blue-600" />
                    </g>
                    <FinAiText />
                </svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <header className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                        FinAi Minimalist Logo Koleksiyonu
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Aşağıdaki 10 farklı logo konseptinin tamamı kod (SVG) ortamında sıfırdan oluşturuldu. 
                        İçlerinde "Finans (Güven)" ve "Yapay Zeka (Hız, Vizyon)" harmanlandı. Beyaz ve temiz arka plan üzerinde test edebilirsiniz.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {logos.map((logo) => (
                        <div key={logo.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col cursor-pointer">
                            
                            {/* Logo Display Area */}
                            <div className="flex-1 p-10 flex items-center justify-center bg-white relative">
                                <div className="absolute top-4 left-4 text-xs font-bold text-slate-300">
                                    0{logo.id}
                                </div>
                                {logo.svg}
                            </div>
                            
                            {/* Explanation Area */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 group-hover:bg-blue-50/50 transition-colors">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{logo.name}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {logo.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
