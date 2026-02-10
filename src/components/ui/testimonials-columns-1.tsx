"use client";
import React from "react";
import { motion } from "framer-motion";

export const TestimonialsColumn = (props: {
    className?: string;
    testimonials: { text: string; image: string; name: string; role: string }[];
    duration?: number;
}) => {
    return (
        <div className={props.className}>
            <motion.div
                animate={{
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6 pb-6"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-black/20 max-w-xs w-full hover:border-slate-700 transition-colors" key={i}>
                                    <div className="text-slate-300 font-medium leading-relaxed mb-6">"{text}"</div>
                                    <div className="flex items-center gap-3">
                                        <img
                                            width={40}
                                            height={40}
                                            src={image}
                                            alt={name}
                                            className="h-10 w-10 rounded-full border border-slate-700"
                                        />
                                        <div className="flex flex-col">
                                            <div className="font-bold text-white text-sm">{name}</div>
                                            <div className="text-xs text-slate-500 font-medium">{role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.div>
        </div>
    );
};
