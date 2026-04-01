"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { LoginCarousel } from "@/components/auth/LoginCarousel"
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react"
import { getPublicOrganizations, registerUser } from "@/app/actions/auth-actions"

export default function LoginPage() {
    const [mode, setMode] = useState<"login" | "register">("login")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    
    // Register specific
    const [email, setEmail] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [organizationId, setOrganizationId] = useState("")
    const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([])

    const [error, setError] = useState("")
    const [successMsg, setSuccessMsg] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        getPublicOrganizations().then(res => {
            if (res.success && res.data) setOrganizations(res.data)
        })
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccessMsg("")
        setIsLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 800))
            const res = await signIn("credentials", {
                redirect: false,
                username,
                password
            });

            if (res?.ok) {
                router.push("/dashboard")
                router.refresh()
            } else {
                setError(res?.error || "Credenciais inválidas ou erro interno.")
                setIsLoading(false)
            }
        } catch (err) {
            setError("Ocorreu um erro no servidor.")
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccessMsg("")
        
        if (password !== confirmPassword) {
            setError("As passwords não coincidem.")
            return
        }
        
        if (!organizationId) {
            setError("Selecione uma Organização.")
            return
        }

        setIsLoading(true)

        const res = await registerUser({ username, email, password, organizationId })
        if (res.success) {
            setSuccessMsg(res.message || "Conta registada com sucesso!")
            // Reset fields
            setUsername("")
            setPassword("")
            setEmail("")
            setConfirmPassword("")
            setMode("login")
        } else {
            setError(res.message || "Erro no registo.")
        }
        setIsLoading(false)
    }

    return (
        <div className="flex min-h-screen bg-black overflow-hidden relative font-sans">
            <div className="w-full lg:w-[480px] z-10 flex flex-col justify-center p-8 lg:p-12 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
                
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/30" />
                        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">ArchMap</span>
                    </div>
                    {mode === "login" ? (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Bem-vindo</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Insira as suas credenciais para aceder ao portal.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">Criar Conta</h1>
                            <p className="text-zinc-500 dark:text-zinc-400">Junte-se a uma organização na plataforma.</p>
                        </>
                    )}
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 text-red-600 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900/20">
                        {error}
                    </motion.div>
                )}
                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-900/20">
                        {successMsg}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {mode === "login" ? (
                        <motion.form 
                            key="login"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleLogin} 
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-zinc-500 dark:text-zinc-400 font-medium">Username ou Email</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="password" className="text-zinc-500 dark:text-zinc-400 font-medium">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/20"
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Iniciar Sessão"}
                            </Button>

                            <div className="mt-8 text-center pt-4">
                                <p className="text-sm text-zinc-500">
                                    Não tem acesso? <button type="button" onClick={() => { setMode("register"); setError(""); setSuccessMsg(""); }} className="text-indigo-600 font-semibold hover:underline cursor-pointer">Criar Conta</button>
                                </p>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="register"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleRegister} 
                            className="space-y-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 dark:text-zinc-400 font-medium">Username</Label>
                                    <Input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 dark:text-zinc-400 font-medium">Email</Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-zinc-500 dark:text-zinc-400 font-medium">Organização</Label>
                                <Select value={organizationId} onValueChange={setOrganizationId} required>
                                    <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 h-11">
                                        <SelectValue placeholder="Selecione a sua Organização" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {organizations.map(org => (
                                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 dark:text-zinc-400 font-medium">Password</Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-500 dark:text-zinc-400 font-medium">Confirmar Pass</Label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-900"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 mt-4 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all" disabled={isLoading}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Registar e Aguardar"}
                            </Button>

                            <div className="mt-8 text-center pt-4">
                                <p className="text-sm text-zinc-500 flex items-center justify-center gap-1">
                                   <ArrowLeft className="w-4 h-4" /> <button type="button" onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }} className="text-indigo-600 font-semibold hover:underline cursor-pointer">Voltar ao Login</button>
                                </p>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 relative hidden lg:flex items-center justify-center bg-zinc-900 p-0 overflow-hidden">
                <LoginCarousel />
            </div>
        </div>
    )
}
