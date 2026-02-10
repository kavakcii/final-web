import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';

// --- Component Interfaces ---
export interface Testimonial {
    id: string | number;
    initials: string;
    name: string;
    role: string;
    quote: string;
    tags: { text: string; type: 'featured' | 'default' }[];
    stats: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; text: string; }[];
    avatarGradient: string;
}

export interface TestimonialStackProps {
    testimonials: Testimonial[];
    /** How many cards to show behind the main card */
    visibleBehind?: number;
}

// --- The Component ---
export const TestimonialStack = ({ testimonials, visibleBehind = 2 }: TestimonialStackProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const dragStartRef = useRef(0);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const totalCards = testimonials.length;

    const navigate = useCallback((newIndex: number) => {
        setActiveIndex((newIndex + totalCards) % totalCards);
    }, [totalCards]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
        if (index !== activeIndex) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        dragStartRef.current = clientX;
        cardRefs.current[activeIndex]?.classList.add('is-dragging');
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setDragOffset(clientX - dragStartRef.current);
    }, [isDragging]);

    const handleDragEnd = useCallback(() => {
        if (!isDragging) return;
        cardRefs.current[activeIndex]?.classList.remove('is-dragging');
        if (Math.abs(dragOffset) > 50) {
            navigate(activeIndex + (dragOffset < 0 ? 1 : -1));
        }
        setIsDragging(false);
        setDragOffset(0);
    }, [isDragging, dragOffset, activeIndex, navigate]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    if (!testimonials?.length) return null;

    return (
        <section className="testimonials-stack relative pb-10 h-[400px] w-full flex items-center justify-center">
            {testimonials.map((testimonial, index) => {
                const isActive = index === activeIndex;
                // Calculate the card's position in the display order
                const displayOrder = (index - activeIndex + totalCards) % totalCards;

                // --- DYNAMIC STYLE CALCULATION ---
                const style: CSSProperties = {};
                if (displayOrder === 0) { // The active card
                    style.transform = `translateX(${dragOffset}px)`;
                    style.opacity = 1;
                    style.zIndex = totalCards;
                } else if (displayOrder <= visibleBehind) { // Cards stacked behind
                    const scale = 1 - 0.05 * displayOrder;
                    const translateY = -1 * displayOrder; // Adjusted translateY for better staking
                    style.transform = `scale(${scale}) translateY(${translateY}rem)`;
                    style.opacity = 1 - 0.2 * displayOrder;
                    style.zIndex = totalCards - displayOrder;
                } else { // Cards that are out of view
                    style.transform = 'scale(0)';
                    style.opacity = 0;
                    style.zIndex = 0;
                }

                const tagClasses = (type: 'featured' | 'default') => type === 'featured'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600';

                return (
                    <div
                        ref={el => { if (el) cardRefs.current[index] = el; }}
                        key={testimonial.id}
                        className="testimonial-card absolute top-10 w-[90%] max-w-md bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl transition-all duration-300 ease-out cursor-grab active:cursor-grabbing"
                        style={style} // Apply dynamic styles here
                        onMouseDown={(e) => handleDragStart(e, index)}
                        onTouchStart={(e) => handleDragStart(e, index)}
                    >
                        <div className="p-6 md:p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold text-base shadow-md" style={{ background: testimonial.avatarGradient }}>
                                        {testimonial.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-slate-900 font-bold text-lg">{testimonial.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>

                            <blockquote className="text-slate-700 leading-relaxed text-lg mb-6 font-medium">"{testimonial.quote}"</blockquote>

                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-t border-slate-200 pt-4 gap-4">
                                <div className="flex flex-wrap gap-2">
                                    {testimonial.tags.map((tag, i) => (
                                        <span key={i} className={['text-xs', 'px-2', 'py-1', 'rounded-md', 'font-medium', tagClasses(tag.type)].join(' ')}>
                                            {tag.text}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                    {testimonial.stats.map((stat, i) => {
                                        const IconComponent = stat.icon;
                                        return (
                                            <span key={i} className="flex items-center">
                                                <IconComponent className="mr-1.5 h-3.5 w-3.5" />
                                                {stat.text}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            <div className="pagination flex gap-2 justify-center absolute bottom-0 left-0 right-0">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        aria-label={`Go to testimonial ${index + 1}`}
                        onClick={() => navigate(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-blue-600 w-6' : 'bg-slate-300 hover:bg-slate-400'}`}
                    />
                ))}
            </div>
        </section>
    );
};
