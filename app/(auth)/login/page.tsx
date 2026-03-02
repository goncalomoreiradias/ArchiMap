"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { ConnectingCardsBackground } from "@/components/auth/ConnectingCardsBackground"
import { MockArchitectureView } from "@/components/auth/MockArchitectureView"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            // Artificial delay for effect
            await new Promise(resolve => setTimeout(resolve, 800))

            const res = await fetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
                headers: { "Content-Type": "application/json" },
            })

            if (res.ok) {
                router.push("/dashboard")
            } else {
                const data = await res.json()
                setError(data.error || "Login failed")
                setIsLoading(false)
            }
        } catch (err) {
            setError("Something went wrong")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-black overflow-hidden relative font-sans">

            {/* Left Side - Form */}
            <div className="w-full lg:w-[480px] z-10 flex flex-col justify-center p-8 lg:p-12 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/30" />
                        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">ArchMap</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Welcome Back</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Enter your credentials to access the workspace.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-zinc-500 dark:text-zinc-400 font-medium">Username</Label>
                        <Input
                            id="username"
                            placeholder="e.g. admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="password" className="text-zinc-500 dark:text-zinc-400 font-medium">Password</Label>
                            <a href="#" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</a>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900/20"
                        >
                            {error}
                        </motion.div>
                    )}

                    <Button type="submit" className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In to Workspace"}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-500">
                        Don't have an account? <a href="#" className="text-indigo-600 font-medium hover:underline">Contact Admin</a>
                    </p>
                    <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs text-zinc-400 text-center">Demo Credentials: <strong>admin / admin</strong></p>
                    </div>
                </div>
            </div>

            {/* Right Side - Animation */}
            <div className="flex-1 relative hidden lg:flex items-center justify-center p-8 bg-zinc-900 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <ConnectingCardsBackground />
                </div>

                <div className="relative z-10 w-full max-w-2xl h-full flex flex-col items-center justify-center">
                    <MockArchitectureView />
                </div>
            </div>
        </div>
    )
}
