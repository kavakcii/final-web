"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
    items,
    direction = "left",
    speed = "fast",
    pauseOnHover = true,
    className,
}: {
    items: {
        id: string | number;
        initials: string;
        name: string;
        role: string;
        quote: string;
        tags: { text: string; type: 'featured' | 'default' }[];
        stats: { icon: any; text: string; }[];
        avatarGradient: string;
    }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    useEffect(() => {
        addAnimation();
    }, []);

    const [start, setStart] = useState(false);

    function addAnimation() {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                if (scrollerRef.current) {
                    scrollerRef.current.appendChild(duplicatedItem);
                }
            });

            getDirection();
            getSpeed();
            setStart(true);
        }
    }
    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "forwards"
                );
            } else {
                containerRef.current.style.setProperty(
                    "--animation-direction",
                    "reverse"
                );
            }
        }
    };
    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === "fast") {
                containerRef.current.style.setProperty("--animation-duration", "20s");
            } else if (speed === "normal") {
                containerRef.current.style.setProperty("--animation-duration", "40s");
            } else {
                containerRef.current.style.setProperty("--animation-duration", "80s");
            }
        }
    };
    return (
        <div
            ref={containerRef}
            className={cn(
                "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
                className
            )}
        >
            <ul
                ref={scrollerRef}
                className={cn(
                    " flex min-w-full shrink-0 gap-4 py-2 w-max flex-nowrap",
                    start && "animate-scroll ",
                    pauseOnHover && "hover:[animation-play-state:paused]"
                )}
            >
                {items.map((item, idx) => (
                    <li
                        className="w-[300px] max-w-full relative rounded-xl border-none bg-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-6 md:w-[350px]"
                        key={item.name}
                    >
                        <blockquote>
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm"
                                    style={{ background: item.avatarGradient }}
                                >
                                    {item.initials}
                                </div>
                                <div>
                                    <span className="block text-base font-bold text-[#0a192f]">
                                        {item.name}
                                    </span>
                                    <span className="block text-xs text-slate-500 font-medium">
                                        {item.role}
                                    </span>
                                </div>
                            </div>

                            <span className="relative z-20 text-sm leading-[1.6] text-[#0a192f] font-medium block mb-4">
                                "{item.quote}"
                            </span>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                <div className="flex gap-2">
                                    {item.tags.map((tag, tIdx) => (
                                        <span key={tIdx} className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-semibold border",
                                            tag.type === 'featured' ? "bg-blue-50 text-blue-800 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-100"
                                        )}>
                                            {tag.text}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                                    {item.stats.map((stat, sIdx) => {
                                        const Icon = stat.icon;
                                        return (
                                            <span key={sIdx} className="flex items-center gap-1">
                                                {Icon && <Icon className="w-3 h-3" />}
                                                {stat.text}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        </blockquote>
                    </li>
                ))}
            </ul>
        </div>
    );
};
