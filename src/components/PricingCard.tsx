import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    features: PricingFeature[];
    isPopular?: boolean;
    delay?: number;
}

export default function PricingCard({
    title,
    price,
    period,
    features,
    isPopular = false,
    delay = 0,
}: PricingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className={cn(
                "relative p-8 rounded-2xl border flex flex-col h-full",
                isPopular
                    ? "bg-primary/5 border-primary shadow-2xl shadow-primary/10"
                    : "bg-card border-border/50 hover:border-border transition-colors"
            )}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    En Popüler
                </div>
            )}

            <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{price}</span>
                    <span className="text-muted-foreground">/{period}</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <div
                            className={cn(
                                "p-1 rounded-full mt-0.5",
                                feature.included ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}
                        >
                            <Check className="w-3 h-3" />
                        </div>
                        <span className={cn("text-sm", !feature.included && "text-muted-foreground line-through opacity-70")}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                className={cn(
                    "w-full py-3 px-6 rounded-lg font-medium transition-all duration-200",
                    isPopular
                        ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
            >
                Hemen Başla
            </button>
        </motion.div>
    );
}
