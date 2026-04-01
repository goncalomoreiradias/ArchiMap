"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, GitFork, Boxes } from "lucide-react"

const slides = [
    {
        id: "catalog",
        title: "Catálogo Arquitetural",
        description: "Explore os domínios de negócio e serviços tecnológicos em tempo real.",
        icon: LayoutDashboard,
        color: "from-indigo-600 to-violet-600",
        shadow: "shadow-indigo-500/20"
    },
    {
        id: "roadmap",
        title: "Evolução do Roadmap",
        description: "Visualize a transição do estado AS-IS para a arquitetura TARGET.",
        icon: GitFork,
        color: "from-emerald-600 to-teal-600",
        shadow: "shadow-emerald-500/20"
    },
    {
        id: "gaps",
        title: "Gestão de Gaps",
        description: "Identifique necessidades e feche lacunas em projetos de transformação.",
        icon: Boxes,
        color: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/20"
    }
]

export function LoginCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-zinc-950 overflow-hidden">
            {/* Background Gradient Orbs */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg x-8 flex flex-col items-center">
                <div className="h-[400px] w-full relative flex justify-center items-center perspective-1000">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50, rotateY: 10 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: -50, rotateY: -10 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                        >
                            {/* Glassmorphism Card */}
                            <div className="w-full aspect-square max-w-[320px] rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-8 gap-6 group relative overflow-hidden">
                                
                                {/* Inner Gradient Glow */}
                                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${slides[currentIndex].color}`} />
                                
                                <div className={`p-5 rounded-2xl bg-gradient-to-br ${slides[currentIndex].color} shadow-lg ${slides[currentIndex].shadow} z-10`}>
                                    {(() => {
                                        const Icon = slides[currentIndex].icon;
                                        return <Icon size={48} className="text-white" />
                                    })()}
                                </div>
                                
                                <div className="z-10 mt-4">
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        {slides[currentIndex].title}
                                    </h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-[280px]">
                                        {slides[currentIndex].description}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-3 mt-12 z-10">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                            style={{
                                width: idx === currentIndex ? '32px' : '12px',
                                backgroundColor: idx === currentIndex ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
                            }}
                        >
                            {idx === currentIndex && (
                                <motion.div 
                                    className="absolute top-0 left-0 h-full bg-white"
                                    layoutId="activeIndicator"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 5, ease: "linear" }}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
