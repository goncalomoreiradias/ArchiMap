"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function ConnectingCardsBackground() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="absolute inset-0 overflow-hidden bg-zinc-950 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-zinc-950 to-zinc-950">
            {/* Elegant fading grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            />

            {/* Subtle floating light orbs for atmospheric glow */}
            <motion.div
                className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.2],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />
        </div>
    )
}
