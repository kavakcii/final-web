"use client";

import { CornerRightUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface AIInputWithLoadingProps {
    id?: string;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    loadingDuration?: number;
    thinkingDuration?: number;
    onSubmit?: (value: string) => void | Promise<void>;
    className?: string;
    autoAnimate?: boolean;
}

export function AIInputWithLoading({
    id = "ai-input-with-loading",
    placeholder = "FinAl'e Sor...",
    minHeight = 56,
    maxHeight = 200,
    loadingDuration = 3000,
    thinkingDuration = 1000,
    onSubmit,
    className,
    autoAnimate = false
}: AIInputWithLoadingProps) {
    const [inputValue, setInputValue] = useState("");
    const [submitted, setSubmitted] = useState(autoAnimate);
    const [isAnimating, setIsAnimating] = useState(autoAnimate);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight,
        maxHeight,
    });

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const runAnimation = () => {
            if (!isAnimating) return;
            setSubmitted(true);
            timeoutId = setTimeout(() => {
                setSubmitted(false);
                timeoutId = setTimeout(runAnimation, thinkingDuration);
            }, loadingDuration);
        };

        if (isAnimating) {
            runAnimation();
        }

        return () => clearTimeout(timeoutId);
    }, [isAnimating, loadingDuration, thinkingDuration]);

    const handleSubmit = async () => {
        if (!inputValue.trim() || submitted) return;

        setSubmitted(true);
        await onSubmit?.(inputValue);
        setInputValue("");
        adjustHeight(true);

        // Reset submission state is handled by the parent or timeout, but here for UI feedback immediately
        setTimeout(() => {
            setSubmitted(false);
        }, 1000);
    };

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative max-w-xl w-full mx-auto flex items-start flex-col gap-2">
                <div className="relative max-w-xl w-full mx-auto">
                    <Textarea
                        id={id}
                        placeholder={placeholder}
                        className={cn(
                            "max-w-xl bg-slate-800/80 backdrop-blur-md w-full rounded-3xl pl-6 pr-10 py-4",
                            "placeholder:text-slate-400",
                            "border-slate-700 ring-offset-0 focus:ring-1 focus:ring-blue-500/50",
                            "text-white resize-none text-wrap leading-[1.2]",
                            `min-h-[${minHeight}px]`
                        )}
                        style={{ minHeight: `${minHeight}px` }}
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        disabled={submitted}
                    />
                    <button
                        onClick={handleSubmit}
                        className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 transition-all duration-300",
                            submitted ? "bg-transparent" : "bg-blue-600 hover:bg-blue-500 text-white"
                        )}
                        type="button"
                        disabled={submitted}
                    >
                        {submitted ? (
                            <div
                                className="w-4 h-4 bg-blue-400 rounded-sm animate-spin"
                            />
                        ) : (
                            <CornerRightUp
                                className={cn(
                                    "w-4 h-4 transition-opacity",
                                    inputValue ? "opacity-100" : "opacity-70"
                                )}
                            />
                        )}
                    </button>
                </div>
                <p className="pl-4 h-4 text-xs mx-auto text-slate-500">
                    {submitted ? "FinAl düşünüyor..." : "Yatırım tavsiyesi değildir."}
                </p>
            </div>
        </div>
    );
}
