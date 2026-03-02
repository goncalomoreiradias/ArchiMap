"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export interface TimeTravelDate {
    year: number;
    month: number; // 0-11
}

interface TimeTravelSliderProps {
    minYear?: number;
    maxYear?: number;
    currentDate: TimeTravelDate;
    onChange: (date: TimeTravelDate) => void;
    className?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface VerticalWheelProps {
    options: number[];
    value: number;
    onChange: (v: number) => void;
    format: (v: number) => string;
}

function VerticalWheel({ options, value, onChange, format }: VerticalWheelProps) {
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentIndex = options.indexOf(value);
    const latestValue = useRef(value);

    // Track the latest value for the wheel handler gracefully
    useEffect(() => {
        latestValue.current = value;
    }, [value]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let accum = 0;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // Prevent page scroll when rolling the wheel on this item
            accum += e.deltaY;

            const currVal = latestValue.current;
            const currentIdx = options.indexOf(currVal);

            // Throttle accumulated deltas down to deliberate steps 
            if (accum > 40) {
                accum -= 40;
                const nextVal = options[Math.min(options.length - 1, currentIdx + 1)];
                onChange(nextVal);
            } else if (accum < -40) {
                accum += 40;
                const prevVal = options[Math.max(0, currentIdx - 1)];
                onChange(prevVal);
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [options, onChange]);

    return (
        <motion.div
            ref={containerRef}
            className="relative flex flex-col items-center justify-center overflow-hidden w-[60px]"
            animate={{ height: isHovered ? 120 : 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className="absolute flex flex-col items-center top-0 w-full"
                animate={{ y: -(currentIndex * 40) + (isHovered ? 40 : 0) }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
                {options.map((opt, i) => {
                    const isSelected = i === currentIndex;
                    const dist = Math.abs(i - currentIndex);
                    const isVisible = isHovered ? dist <= 1 : isSelected;

                    return (
                        <div
                            key={opt}
                            onClick={() => {
                                if (isHovered) onChange(opt);
                            }}
                            className={`h-[40px] flex items-center justify-center cursor-pointer w-full transition-colors duration-200 font-semibold ${isSelected
                                    ? 'text-indigo-600 dark:text-indigo-400 text-[15px]'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[14px]'
                                }`}
                            style={{
                                opacity: isVisible ? (isSelected ? 1 : 0.5) : 0,
                                pointerEvents: isVisible ? 'auto' : 'none',
                                scale: isSelected ? 1.05 : 0.95
                            }}
                        >
                            {format(opt)}
                        </div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}

export function TimeTravelSlider({
    minYear = 2023,
    maxYear = 2030,
    currentDate,
    onChange,
    className
}: TimeTravelSliderProps) {
    const [localDate, setLocalDate] = useState<TimeTravelDate>(currentDate);

    // Sync external changes
    useEffect(() => {
        setLocalDate(currentDate);
    }, [currentDate.year, currentDate.month]);

    const handleSelectMonth = (month: number) => {
        const newDate = { ...localDate, month };
        setLocalDate(newDate);
        onChange(newDate);
    };

    const handleSelectYear = (year: number) => {
        const newDate = { ...localDate, year };
        setLocalDate(newDate);
        onChange(newDate);
    };

    const yearTicks = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
    const monthTicks = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${className || ''}`}>
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] p-1.5 flex flex-row items-center justify-center gap-1 overflow-hidden"
            >
                <motion.div layout className="flex items-center justify-center px-1.5 py-1 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 rounded-full h-[36px] w-[36px] ml-0.5 z-10 shrink-0">
                    <Clock size={16} strokeWidth={2.5} />
                </motion.div>

                <div className="flex flex-row items-center px-2">
                    <VerticalWheel
                        options={yearTicks}
                        value={localDate.year}
                        onChange={handleSelectYear}
                        format={(y) => y.toString()}
                    />

                    <motion.div layout className="w-[1.5px] h-5 bg-slate-200 dark:bg-zinc-700/50 rounded-full mx-1 shrink-0" />

                    <VerticalWheel
                        options={monthTicks}
                        value={localDate.month}
                        onChange={handleSelectMonth}
                        format={(m) => MONTHS[m]}
                    />
                </div>
            </motion.div>
        </div>
    );
}
