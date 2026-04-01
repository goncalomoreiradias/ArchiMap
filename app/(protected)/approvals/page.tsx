"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, CheckCheck, XCircle, AlertCircle, ArrowRight } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function ApprovalsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [gaps, setGaps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionState, setActionState] = useState<Record<string, 'idle' | 'loading' | 'done'>>({})
    const [rejectingId, setRejectingId] = useState<string | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    const userRole = (session?.user as any)?.role || "Viewer"
    const canApprove = userRole === "Admin" || userRole === "Chief Architect"
    const sessionLoading = status === 'loading'

    async function load() {
        try {
            const res = await fetch('/api/approvals')
            if (res.ok) {
                const data = await res.json()
                setGaps(data)
            } else {
                console.error('Approvals API error:', res.status, await res.text())
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (sessionLoading) return
        if (!canApprove) {
            router.push("/dashboard")
            return
        }
        load()
    }, [canApprove, router, sessionLoading])

    const handleApprove = async (gap: any) => {
        setActionState(s => ({ ...s, [gap.id]: 'loading' }))
        try {
            const res = await fetch(`/api/projects/${gap.projectId}/gaps/${gap.id}/workflow`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve' })
            })
            if (res.ok) {
                setActionState(s => ({ ...s, [gap.id]: 'done' }))
                // Remove from list after short delay
                setTimeout(() => setGaps(prev => prev.filter(g => g.id !== gap.id)), 1200)
            } else {
                let errMsg = 'Failed to approve request';
                try {
                    const err = await res.json();
                    errMsg = err.error || err.message || errMsg;
                } catch (e) {}
                alert(errMsg);
                console.error('Approve failed:', errMsg);
                setActionState(s => ({ ...s, [gap.id]: 'idle' }))
            }
        } catch (e) {
            setActionState(s => ({ ...s, [gap.id]: 'idle' }))
        }
    }

    const handleReject = async (gap: any) => {
        if (!rejectReason.trim()) return
        setActionState(s => ({ ...s, [gap.id]: 'loading' }))
        try {
            const res = await fetch(`/api/projects/${gap.projectId}/gaps/${gap.id}/workflow`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', rejectionReason: rejectReason })
            })
            if (res.ok) {
                setActionState(s => ({ ...s, [gap.id]: 'done' }))
                setRejectingId(null)
                setRejectReason('')
                setTimeout(() => setGaps(prev => prev.filter(g => g.id !== gap.id)), 1200)
            } else {
                let errMsg = 'Failed to reject request';
                try {
                    const err = await res.json();
                    errMsg = err.error || err.message || errMsg;
                } catch (e) {}
                alert(errMsg);
                setActionState(s => ({ ...s, [gap.id]: 'idle' }))
            }
        } catch (e) {
            setActionState(s => ({ ...s, [gap.id]: 'idle' }))
        }
    }

    if (sessionLoading) return <div className="flex items-center justify-center p-12 text-slate-500 animate-pulse">Loading...</div>
    if (!canApprove) return null

    return (
        <div className="container mx-auto py-8 px-6 lg:px-12 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-l-4 border-red-500 pl-3">Pending Approvals</h1>
                <p className="text-muted-foreground mt-2">
                    Review and approve architectural adoptions and component changes submitted by your team.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 text-slate-500 animate-pulse">Loading approvals queue...</div>
            ) : gaps.length === 0 ? (
                <Alert className="bg-emerald-50 border-emerald-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <AlertTitle className="text-emerald-800 font-semibold">All Clear</AlertTitle>
                    <AlertDescription className="text-emerald-700">
                        There are no pending requests waiting for your approval.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="grid gap-5">
                    {gaps.map((gap) => {
                        let meta: any = {}
                        try { meta = gap.metadata ? JSON.parse(gap.metadata) : {} } catch {}
                        const isAdoption = meta.type === 'ADOPTION_REQUEST'
                        const isComponentEdit = meta.type === 'COMPONENT_EDIT_REQUEST'
                        const state = actionState[gap.id] || 'idle'

                        return (
                            <Card key={gap.id} className={`border-l-4 ${isAdoption ? 'border-l-indigo-500' : isComponentEdit ? 'border-l-pink-500' : 'border-l-yellow-400'} shadow-sm transition-all ${state === 'done' ? 'opacity-50' : ''}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {isAdoption && <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium text-xs">Target → AS-IS Adoption</Badge>}
                                                {isComponentEdit && <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 font-medium text-xs">Component Edit</Badge>}
                                                {!isAdoption && !isComponentEdit && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium text-xs">Review</Badge>}
                                            </div>
                                            <CardTitle className="text-lg text-slate-800 truncate">{gap.title}</CardTitle>
                                            <CardDescription className="mt-0.5">
                                                Project: <span className="font-semibold text-indigo-600">{gap.project?.name || "—"}</span>
                                            </CardDescription>
                                        </div>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {new Date(gap.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardHeader>

                                <CardContent className="text-sm text-slate-600 pb-3">
                                    <p className="mb-3 text-slate-600">{gap.description || "No description provided."}</p>

                                    {isAdoption && (
                                        <Alert className="bg-amber-50 border-amber-200 py-2 px-3">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-amber-800 text-xs ml-1">
                                                Approving will permanently apply all Target changes to the AS-IS baseline. This cannot be undone.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-3 border-t border-slate-100 flex flex-col gap-3 items-start">
                                    {state === 'done' ? (
                                        <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                                            <CheckCheck className="w-4 h-4" /> Action applied successfully
                                        </div>
                                    ) : rejectingId === gap.id ? (
                                        <div className="w-full flex flex-col gap-2">
                                            <textarea
                                                className="w-full border border-slate-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                                                rows={2}
                                                placeholder="Reason for rejection (required)..."
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(gap)}
                                                    disabled={!rejectReason.trim() || state === 'loading'}
                                                    className="gap-1"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Confirm Reject
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason('') }}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(gap)}
                                                    disabled={state === 'loading'}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                                >
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    {state === 'loading' ? 'Processing...' : 'Approve'}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setRejectingId(gap.id)}
                                                    disabled={state === 'loading'}
                                                    className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                {isAdoption ? (
                                                    <Link href={`/gap-analysis/${gap.projectId}`}>
                                                        <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-2 font-medium">
                                                            Review in Gap Board <ArrowRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                ) : isComponentEdit ? (
                                                    <Link href={`/components?id=${meta.componentId}`}>
                                                        <Button size="sm" variant="outline" className="text-pink-600 border-pink-200 hover:bg-pink-50 gap-2 font-medium">
                                                            View Current Component <ArrowRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <Link href={`/gap-analysis/${gap.projectId}`}>
                                                        <Button size="sm" variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-2 font-medium">
                                                            Go to Project <ArrowRight className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
