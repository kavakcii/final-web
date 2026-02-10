"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

export interface PricingPlan {
    name: string;
    price: string;
    yearlyPrice: string;
    period: string;
    features: string[];
    description: string;
    buttonText: string;
    href: string;
    isPopular: boolean;
}

interface PricingProps {
    plans: PricingPlan[];
    title?: string;
    description?: string;
}

export function Pricing({
    plans,
    title = "Simple, Transparent Pricing",
    description = "Choose the plan that works for you\nAll plans include access to our platform, lead generation tools, and dedicated support.",
}: PricingProps) {
    const [isMonthly, setIsMonthly] = useState(true);
    const isDesktop = useMediaQuery("(min-width: 768px)");
    const switchRef = useRef<HTMLButtonElement>(null);

    const handleToggle = (checked: boolean) => {
        setIsMonthly(!checked);
        if (checked && switchRef.current) {
            const rect = switchRef.current.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            confetti({
                particleCount: 50,
                spread: 60,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight,
                },
                colors: [
                    "hsl(var(--primary))",
                    "hsl(var(--accent))",
                    "hsl(var(--secondary))",
                    "hsl(var(--muted))",
                ],
                ticks: 200,
                gravity: 1.2,
                decay: 0.94,
                startVelocity: 30,
                shapes: ["circle"],
            });
        }
    };

    return (
        <div className="container py-20">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    {title}
                </h2>
                <p className="text-muted-foreground text-lg whitespace-pre-line">
                    {description}
                </p>
            </div>

            <div className="flex justify-center mb-10">
                <label className="relative inline-flex items-center cursor-pointer">
                    <Label>
                        <Switch
                            ref={switchRef as any}
                            checked={!isMonthly}
                            onCheckedChange={handleToggle}
                            className="relative"
                        />
                    </Label>
                </label>
                <span className="ml-2 font-semibold text-[#0a192f]">
                    Yıllık Ödeme <span className="text-blue-600">(%20 Tasarruf Et)</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 sm:2 gap-6 max-w-6xl mx-auto">
                {plans.map((plan, index) => {
                    const isPremium = plan.isPopular;
                    return (
                        <motion.div
                            key={index}
                            initial={{ y: 50, opacity: 1 }}
                            whileInView={
                                isDesktop
                                    ? {
                                        y: isPremium ? -20 : 0,
                                        opacity: 1,
                                        x: 0,
                                        scale: isPremium ? 1.05 : 1.0,
                                    }
                                    : {}
                            }
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.6,
                                type: "spring",
                                stiffness: 100,
                                damping: 20,
                                delay: 0.2,
                            }}
                            className={cn(
                                `rounded-2xl border p-8 text-center lg:flex lg:flex-col lg:justify-center relative transition-colors duration-300`,
                                isPremium
                                    ? "bg-[#0a192f] border-blue-900 shadow-2xl z-10"
                                    : "bg-white border-slate-200 shadow-lg hover:border-blue-200 z-0",
                                "flex flex-col",
                                !isPremium && "mt-5"
                            )}
                        >
                            {isPremium && (
                                <div className="absolute top-0 right-0 left-0 bg-blue-600 h-1.5 rounded-t-2xl" />
                            )}
                            {isPremium && (
                                <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    Popüler
                                </div>
                            )}

                            <div className="flex-1 flex flex-col">
                                <p className={cn("text-lg font-bold mb-2", isPremium ? "text-blue-400" : "text-slate-600")}>
                                    {plan.name}
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-x-1">
                                    <span className={cn("text-5xl font-bold tracking-tight", isPremium ? "text-white" : "text-[#0a192f]")}>
                                        <NumberFlow
                                            value={
                                                isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)
                                            }
                                            format={{
                                                style: "currency",
                                                currency: "TRY",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            }}

                                            transformTiming={{
                                                duration: 500,
                                                easing: "ease-out",
                                            }}
                                            willChange
                                            className="font-variant-numeric: tabular-nums"
                                        />
                                    </span>
                                    {plan.period !== "Next 3 months" && (
                                        <span className={cn("text-sm font-semibold self-end mb-2", isPremium ? "text-slate-400" : "text-slate-500")}>
                                            / {plan.period}
                                        </span>
                                    )}
                                </div>

                                <p className={cn("text-xs mt-2 font-medium", isPremium ? "text-slate-400" : "text-slate-500")}>
                                    {isMonthly ? "aylık faturalandırılır" : "yıllık faturalandırılır"}
                                </p>

                                <ul className="mt-8 gap-4 flex flex-col mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-left">
                                            <div className={cn("mt-1 p-0.5 rounded-full flex-shrink-0", isPremium ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700")}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className={cn("text-sm font-medium", isPremium ? "text-slate-300" : "text-slate-600")}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-auto">
                                    <Link
                                        href={plan.href}
                                        className={cn(
                                            "w-full block py-3 px-6 rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg transform active:scale-95",
                                            isPremium
                                                ? "bg-blue-600 text-white hover:bg-blue-500 ring-4 ring-blue-900/20"
                                                : "bg-[#0a192f] text-white hover:bg-[#112240] hover:ring-4 hover:ring-slate-200"
                                        )}
                                    >
                                        {plan.buttonText}
                                    </Link>
                                    <p className={cn("mt-3 text-[10px]", isPremium ? "text-slate-500" : "text-slate-400")}>
                                        {plan.description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
