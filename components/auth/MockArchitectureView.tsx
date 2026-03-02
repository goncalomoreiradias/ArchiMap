"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Database, Server, Globe, Shield, CreditCard, Cpu, Layers, HardDrive, GitMerge, FileText } from "lucide-react"

// Core Isometric Settings
const ROTATE_X = 55
const ROTATE_Z = -45
// 2D Inversion values so cards face the screen
const INVERSE_Z = 45
const INVERSE_X = -55

export function MockArchitectureView() {
    const [mounted, setMounted] = useState(false)
    const [animationStep, setAnimationStep] = useState(0)

    // Using a faster interval (1800ms) but layering animations so they feel continuous, not strictly staggered pops
    const TOTAL_STEPS = 6
    const STEP_DELAY_MS = 1800

    useEffect(() => {
        setMounted(true)
        const interval = setInterval(() => {
            setAnimationStep(prev => (prev + 1) % TOTAL_STEPS)
        }, STEP_DELAY_MS)
        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        // Added a subtle radial gradient backdrop to give the container more depth
        <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/40 via-transparent to-transparent">

            {/* The primary 3D container. High perspective value keeps the isometric grid looking sleek, not warped */}
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-[50%] perspective-[1600px]">

                {/* Continuous smooth floating animation for the entire grid block */}
                <div
                    className="relative w-[340px] h-[340px]"
                    style={{
                        transform: `rotateX(${ROTATE_X}deg) rotateZ(${ROTATE_Z}deg)`,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Layer 5: SBB (-320 Z) */}
                    <AnimatePresence>
                        {animationStep >= 4 && (
                            <ProjectLayer
                                title="Solution Building Block"
                                translateZ={-320}
                                color="border-violet-500/60"
                                bg="bg-violet-900/20"
                                glow="shadow-[0_0_60px_rgba(139,92,246,0.15)]"
                                nodes={[
                                    { id: "aws", icon: Server, x: 50, y: 50, label: "AWS EKS Cluster", color: "text-violet-300", accent: "from-violet-500 to-indigo-500" }
                                ]}
                            />
                        )}
                    </AnimatePresence>

                    {/* Path 4 -> 5 */}
                    <AnimatePresence>
                        {animationStep >= 4 && (
                            <>
                                <PathBeam start={{ x: 25, y: 25, z: -160 }} end={{ x: 50, y: 50, z: -320 }} color="from-emerald-500 to-violet-500" delay={0.3} />
                                <PathBeam start={{ x: 75, y: 75, z: -160 }} end={{ x: 50, y: 50, z: -320 }} color="from-emerald-500 to-violet-500" delay={0.4} />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Layer 4: Data (-160 Z) */}
                    <AnimatePresence>
                        {animationStep >= 3 && (
                            <ProjectLayer
                                title="Data Entity"
                                translateZ={-160}
                                color="border-emerald-500/60"
                                bg="bg-emerald-900/20"
                                glow="shadow-[0_0_60px_rgba(16,185,129,0.15)]"
                                nodes={[
                                    { id: "db1", icon: HardDrive, x: 25, y: 25, label: "Customer Master", color: "text-emerald-300", accent: "from-emerald-500 to-teal-500" },
                                    { id: "db2", icon: FileText, x: 75, y: 75, label: "Loan Records", color: "text-emerald-300", accent: "from-emerald-500 to-cyan-500" }
                                ]}
                            />
                        )}
                    </AnimatePresence>

                    {/* Path 3 -> 4 */}
                    <AnimatePresence>
                        {animationStep >= 3 && (
                            <>
                                <PathBeam start={{ x: 25, y: 25, z: 0 }} end={{ x: 25, y: 25, z: -160 }} color="from-blue-500 to-emerald-500" delay={0.3} />
                                <PathBeam start={{ x: 75, y: 75, z: 0 }} end={{ x: 75, y: 75, z: -160 }} color="from-blue-500 to-emerald-500" delay={0.4} />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Layer 3: Application (0 Z) */}
                    <AnimatePresence>
                        {animationStep >= 2 && (
                            <ProjectLayer
                                title="Application"
                                translateZ={0}
                                color="border-blue-500/60"
                                bg="bg-blue-900/20"
                                glow="shadow-[0_0_60px_rgba(59,130,246,0.15)]"
                                nodes={[
                                    { id: "api", icon: Globe, x: 25, y: 25, label: "CRM System", color: "text-blue-300", accent: "from-blue-500 to-indigo-500" },
                                    { id: "auth", icon: Cpu, x: 75, y: 75, label: "Core Banking", color: "text-blue-300", accent: "from-blue-500 to-sky-500" }
                                ]}
                            />
                        )}
                    </AnimatePresence>

                    {/* Path 2 -> 3 */}
                    <AnimatePresence>
                        {animationStep >= 2 && (
                            <>
                                <PathBeam start={{ x: 25, y: 25, z: 160 }} end={{ x: 25, y: 25, z: 0 }} color="from-rose-500 to-blue-500" delay={0.3} />
                                <PathBeam start={{ x: 75, y: 75, z: 160 }} end={{ x: 75, y: 75, z: 0 }} color="from-rose-500 to-blue-500" delay={0.4} />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Layer 2: BIAN (160 Z) */}
                    <AnimatePresence>
                        {animationStep >= 1 && (
                            <ProjectLayer
                                title="BIAN Service Domain"
                                translateZ={160}
                                color="border-rose-500/60"
                                bg="bg-rose-900/20"
                                glow="shadow-[0_0_60px_rgba(244,63,94,0.15)]"
                                nodes={[
                                    { id: "party", icon: GitMerge, x: 25, y: 25, label: "Party Routing", color: "text-rose-300", accent: "from-rose-500 to-pink-500" },
                                    { id: "pay", icon: CreditCard, x: 75, y: 75, label: "Consumer Loan", color: "text-rose-300", accent: "from-rose-500 to-orange-500" }
                                ]}
                            />
                        )}
                    </AnimatePresence>

                    {/* Path 1 -> 2 */}
                    <AnimatePresence>
                        {animationStep >= 1 && (
                            <>
                                <PathBeam start={{ x: 50, y: 50, z: 320 }} end={{ x: 25, y: 25, z: 160 }} color="from-amber-500 to-rose-500" delay={0.3} />
                                <PathBeam start={{ x: 50, y: 50, z: 320 }} end={{ x: 75, y: 75, z: 160 }} color="from-amber-500 to-rose-500" delay={0.4} />
                            </>
                        )}
                    </AnimatePresence>

                    {/* Layer 1: Business (320 Z) */}
                    <AnimatePresence>
                        {animationStep >= 0 && (
                            <ProjectLayer
                                title="Business Capability"
                                translateZ={320}
                                color="border-amber-500/60"
                                bg="bg-amber-900/20"
                                glow="shadow-[0_0_60px_rgba(245,158,11,0.15)]"
                                nodes={[
                                    { id: "retail", icon: Layers, x: 50, y: 50, label: "Retail Loan Origination", color: "text-amber-300", accent: "from-amber-500 to-orange-500" }
                                ]}
                            />
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* Unified Taglines and Descriptive Text at the bottom */}
            <div className="absolute bottom-8 w-full flex flex-col items-center justify-center z-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-center mb-5"
                >
                    <h2 className="text-[22px] font-bold text-white mb-1.5 drop-shadow-md">Design Your Architecture</h2>
                    <p className="text-zinc-400 text-sm">
                        From Business Capabilities to Technology Services
                    </p>
                </motion.div>

                <div className="flex items-center justify-center gap-[6px] mb-2">
                    {["Map.", "Plan.", "Scale.", "Manage."].map((word, i) => (
                        <motion.span
                            key={word}
                            className={`text-sm tracking-widest transition-all duration-700 ${animationStep >= i ? 'text-white font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-zinc-600 font-normal'}`}
                        >
                            {word}
                        </motion.span>
                    ))}
                </div>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.3em]">
                    Enterprise Architecture Intelligence
                </p>
            </div>
        </div >
    )
}

function ProjectLayer({ title, translateZ, color, bg, glow, nodes, delay = 0 }: any) {
    return (
        <motion.div
            className={`absolute inset-0 border-[1px] ${color} ${bg} ${glow} rounded-2xl`}
            // Strict layer slices fading in without Z-sliding
            initial={{ opacity: 0, z: translateZ }}
            animate={{ opacity: 1, z: translateZ }}
            exit={{ opacity: 0, z: translateZ }}
            transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }} // smooth custom cubic-bezier
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Elegant fading dotted Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.25] rounded-2xl overflow-hidden pointer-events-none"
                style={{ maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)', WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)' }}
            >
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                        backgroundSize: '34px 34px',
                        backgroundPosition: 'center center'
                    }}
                />
            </div>

            {/* Flat Layer Title (Strict Inverse Transform for perfect 2D) */}
            <div className="absolute pointer-events-none" style={{ top: '0%', left: '0%', width: 0, height: 0, transformStyle: 'preserve-3d' }}>
                <div style={{ transform: `rotateZ(${INVERSE_Z}deg) rotateX(${INVERSE_X}deg)` }}>
                    <motion.div
                        initial={{ opacity: 0, x: '-120px', y: '-30px' }}
                        animate={{ opacity: 1, x: '-120px', y: '-30px' }}
                        transition={{ duration: 0.6, delay: delay + 0.3, ease: "easeOut" }}
                        className={`text-white/80 text-[10px] font-semibold tracking-widest uppercase py-1 px-4 rounded-full border border-white/10 bg-zinc-950/80 ${color.replace('/60', '')} shadow-2xl whitespace-nowrap`}
                    >
                        {title}
                    </motion.div>
                </div>
            </div>

            {/* Fully 2D strict nodes perfectly facing user at all times */}
            {nodes.map((n: any, i: number) => (
                <div
                    key={n.id}
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{ left: `${n.x}%`, top: `${n.y}%`, width: 0, height: 0, transformStyle: 'preserve-3d' }}
                >
                    <div style={{ transform: `rotateZ(${INVERSE_Z}deg) rotateX(${INVERSE_X}deg)` }}>
                        {/* 
                          Premium Node Enter: Gentle fade and slide-up. No scale logic.
                          Continuous floating motion added to individual cards for a "living" feel.
                        */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: delay + 0.4 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                        >
                            <motion.div
                                animate={{ y: [-2, 2, -2] }}
                                transition={{ duration: 4 + (i * 0.5), repeat: Infinity, ease: "easeInOut" }}
                                className="relative bg-zinc-950/95 border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.8)] group"
                            >
                                {/* Subtle inner glow based on layer color */}
                                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${n.accent} opacity-5 blur-md`}></div>

                                <div className={`relative p-2 rounded-lg bg-zinc-900 border border-white/5 shadow-inner ${n.color}`}>
                                    <n.icon size={16} strokeWidth={2} />
                                </div>
                                <span className="relative text-[13px] text-zinc-100 font-medium whitespace-nowrap pr-2">{n.label}</span>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            ))}
        </motion.div>
    )
}

function PathBeam({ start, end, color, delay = 0 }: any) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = start.z - end.z;

    // Smooth, thick horizontal path tracing
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // If perfectly vertical (dz exact mapping), just use the vertical drop animation
    if (length === 0) {
        return (
            <div style={{ transformStyle: 'preserve-3d' }}>
                <motion.div
                    className={`absolute w-[2px] rounded-full bg-gradient-to-b ${color} shadow-[0_0_20px_rgba(255,255,255,0.7)]`}
                    style={{
                        left: `${start.x}%`,
                        top: `${start.y}%`,
                        transformOrigin: 'top center',
                        transformStyle: 'preserve-3d',
                        transform: `translateZ(${start.z}px) rotateX(-90deg)`
                    }}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: dz, opacity: [0, 1, 0.6] }} // Flash bright then settle
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
                />
            </div>
        )
    }

    const midZ = start.z - (dz / 2);

    return (
        <div style={{ transformStyle: 'preserve-3d' }}>
            {/* 1. Initial drop out of start node to mid plane */}
            <motion.div
                className={`absolute w-[2px] rounded-full bg-gradient-to-b ${color} shadow-[0_0_20px_rgba(255,255,255,0.7)]`}
                style={{
                    left: `${start.x}%`,
                    top: `${start.y}%`,
                    transformOrigin: 'top center',
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${start.z}px) rotateX(-90deg)`
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: dz / 2, opacity: [0, 1, 0.6] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay, ease: "easeOut" }}
            />
            {/* 2. Horizontal branch on mid plane */}
            <motion.div
                className={`absolute h-[2px] rounded-full bg-gradient-to-r ${color} shadow-[0_0_20px_rgba(255,255,255,0.7)]`}
                style={{
                    left: `${start.x}%`,
                    top: `${start.y}%`,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'left center',
                    transform: `translateZ(${midZ}px) rotateZ(${angle}deg)`
                }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${length}%`, opacity: [0, 1, 0.6] }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.3, ease: "linear" }}
            />
            {/* 3. Final drop from mid plane into target node */}
            <motion.div
                className={`absolute w-[2px] rounded-full bg-gradient-to-b ${color} shadow-[0_0_20px_rgba(255,255,255,0.7)]`}
                style={{
                    left: `${end.x}%`,
                    top: `${end.y}%`,
                    transformOrigin: 'top center',
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${midZ}px) rotateX(-90deg)`
                }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: dz / 2, opacity: [0, 1, 0.6] }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: delay + 0.6, ease: "easeOut" }}
            />
        </div>
    )
}
