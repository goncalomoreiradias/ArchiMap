
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Calendar, ArrowRight, Save, Layout, Layers, AlertCircle, Map as MapIcon, RotateCcw, ArrowLeft, MoreHorizontal, CheckCircle2, XCircle, SendHorizontal, Undo2, Lock, ShieldCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GapVisualMap } from "./GapVisualMap"
import { GapCoverageBar } from "./GapCoverageBar"
import { GapWizard } from "./GapWizard"

interface GapBoardProps {
    project: any
    initialGaps: any[]
    userRole?: string
}

export default function GapBoard({ project, initialGaps, userRole = "Viewer" }: GapBoardProps) {
    const router = useRouter()
    const [gaps, setGaps] = useState(initialGaps)
    const [selectedGap, setSelectedGap] = useState<any>(gaps.length > 0 ? gaps[0] : null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const canEditBase = userRole === "Admin" || userRole === "Architect" || userRole === "Chief Architect"
    // Lock editing if gap is PENDING_REVIEW or APPROVED
    const isGapLocked = selectedGap?.approvalStatus === 'PENDING_REVIEW' || selectedGap?.approvalStatus === 'APPROVED'
    const canEdit = canEditBase && !isGapLocked
    const hasChanges = project.changes && project.changes.length > 0

    // Workflow action handler
    const handleWorkflowAction = async (gapId: string, action: string, rejectionReason?: string) => {
        try {
            const res = await fetch(`/api/projects/${project.id}/gaps/${gapId}/workflow`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, rejectionReason })
            })
            if (res.ok) {
                await refreshGaps()
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'Workflow action failed')
            }
        } catch (error) {
            console.error('Workflow action error:', error)
        }
    }

    // Refresh gaps
    const refreshGaps = async () => {
        const res = await fetch(`/api/projects/${project.id}/gaps`)
        if (res.ok) {
            const data = await res.json()
            setGaps(data)
            // Update selected gap if it exists
            if (selectedGap) {
                const updated = data.find((g: any) => g.id === selectedGap.id)
                if (updated) setSelectedGap(updated)
            }
        }
    }

    const handleCreateGap = async (gapData: any) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/projects/${project.id}/gaps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(gapData)
            })

            if (res.ok) {
                const newGap = await res.json()

                // If there are selected changes (from Wizard Step 2), assign them now
                if (gapData.metadata?.selectedChangeIds?.length > 0) {
                    console.log("GapBoard: Assigning changes to new gap:", gapData.metadata.selectedChangeIds);
                    const assignRes = await fetch(`/api/gaps/${newGap.id}/changes`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ changeIds: gapData.metadata.selectedChangeIds, action: "assign" })
                    })
                    if (!assignRes.ok) {
                        const err = await assignRes.json().catch(() => ({}));
                        console.error("Assignment failed:", err);
                        alert(`Gap created, but failed to link changes: ${err.error || "Unknown error"}`);
                    }
                }

                setIsCreateDialogOpen(false)
                await refreshGaps()
                setSelectedGap(newGap)
            } else {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create gap");
            }
        } catch (error) {
            console.error("Failed to create gap", error)
            throw error; // Re-throw so Wizard can catch it
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteGap = async (gapId: string) => {
        if (!confirm("Are you sure you want to delete this gap analysis?")) return

        try {
            const res = await fetch(`/api/gaps/${gapId}`, { method: "DELETE" })
            if (res.ok) {
                if (selectedGap?.id === gapId) setSelectedGap(null)
                await refreshGaps()
            }
        } catch (error) {
            console.error("Failed to delete gap", error)
        }
    }

    // Assign handler passed to detail view
    const handleAssignChange = async (changeIds: string[], gapId: string, gapPhaseId?: string) => {
        const payload: any = { changeIds, action: "assign" }
        if (gapPhaseId) {
            payload.action = "assignPhase"
            payload.gapPhaseId = gapPhaseId
        }

        await fetch(`/api/gaps/${gapId}/changes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        await refreshGaps()
    }


    return (
        <div className="flex h-full gap-8 p-4">
            {/* Left Sidebar: Gaps List */}
            <div className="w-1/5 min-w-[280px] flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 pl-2">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-3 text-slate-400 hover:text-slate-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h2 className="font-bold text-xl tracking-tight text-slate-800">Gap Analysis</h2>
                    </div>

                    {canEdit && (
                        <Button
                            size="lg"
                            disabled={!hasChanges}
                            className="shadow-sm w-full bg-primary hover:bg-primary/90 text-white"
                            suppressHydrationWarning
                            onClick={() => setIsCreateDialogOpen(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Roadmap Definition
                        </Button>
                    )}
                </div>

                {/* Wizard Dialog */}
                <GapWizard
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                    project={project}
                    onSave={handleCreateGap}
                />

                {!hasChanges && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Changes Found</AlertTitle>
                        <AlertDescription className="text-xs">
                            Define a gap view (changes) in the Mind Map before creating analysis gaps.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 flex flex-col gap-3 overflow-auto custom-scrollbar pr-2">
                    {gaps.length === 0 && <div className="text-sm text-muted-foreground p-8 text-center border-2 border-dashed rounded-lg bg-slate-50">No roadmaps defined yet.</div>}
                    {gaps.map((gap: any) => (
                        <div
                            key={gap.id}
                            onClick={() => setSelectedGap(gap)}
                            className={`p-4 rounded-xl border cursor-pointer hover:bg-slate-50 hover:shadow-sm transition-all relative group ${selectedGap?.id === gap.id ? 'border-primary bg-slate-50 ring-1 ring-primary/20 shadow-sm' : 'border-slate-200 bg-white'}`}
                        >
                            {/* Small coverage bar for list view */}
                            <div className="absolute top-2 right-2 opacity-50">
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${Math.round(((gap.changes?.filter((c: any) => c.gapPhaseId).length || 0) / (gap.changes?.length || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <h3 className="font-semibold text-sm truncate pr-8 text-slate-900">{gap.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <GapStatusBadge status={gap.status} />
                                    <ApprovalStatusBadge status={gap.approvalStatus || 'DRAFT'} />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                                {gap.description || "No description provided."}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <div className="text-[10px] font-medium text-slate-400 flex items-center gap-3">
                                    <span className="flex items-center"><Layers className="w-3 h-3 mr-1" /> {gap.changes?.length || 0}</span>
                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {gap.phases?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Area: Gap Details */}
            <div className="flex-1 min-w-0 flex flex-col border rounded-xl overflow-hidden bg-white shadow-lg ring-1 ring-black/5 h-full">
                {selectedGap ? (
                    <GapDetailView
                        gap={selectedGap}
                        onUpdate={refreshGaps}
                        onDelete={() => handleDeleteGap(selectedGap.id)}
                        project={project}
                        canEdit={canEdit}
                        canEditBase={canEditBase}
                        isGapLocked={isGapLocked}
                        userRole={userRole}
                        allGaps={gaps}
                        onAssignChange={handleAssignChange}
                        onWorkflowAction={handleWorkflowAction}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Layers className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700">No Roadmap Selected</h3>
                        <p className="max-w-sm mt-2 text-sm text-slate-500">Select an existing roadmap from the list or define a new one.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function GapStatusBadge({ status }: { status: string }) {
    const colors: any = {
        "Identified": "bg-amber-100 text-amber-800 border-amber-200",
        "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
        "Completed": "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colors[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
            {status}
        </span>
    )
}

function ApprovalStatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
        'DRAFT': { bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: null, label: 'Draft' },
        'PENDING_REVIEW': { bg: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Lock className="w-2.5 h-2.5 mr-1" />, label: 'Pending Review' },
        'APPROVED': { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <ShieldCheck className="w-2.5 h-2.5 mr-1" />, label: 'Approved' },
        'REJECTED': { bg: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-2.5 h-2.5 mr-1" />, label: 'Rejected' },
    }
    const c = config[status] || config['DRAFT']
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center ${c.bg}`}>
            {c.icon}{c.label}
        </span>
    )
}

// ---- Subcomponent: GapDetailView ----
function GapDetailView({ gap, onUpdate, onDelete, project, canEdit, canEditBase, isGapLocked, userRole, allGaps, onAssignChange, onWorkflowAction }: any) {
    const [activeTab, setActiveTab] = useState("visual")

    // State for changing gap details
    const [title, setTitle] = useState(gap.title)
    const [desc, setDesc] = useState(gap.description || "")
    const [status, setStatus] = useState(gap.status)
    const [isSaving, setIsSaving] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")

    const approvalStatus = gap.approvalStatus || 'DRAFT'
    const isApprover = userRole === 'Admin' || userRole === 'Chief Architect'
    const isArchitectOrAdmin = userRole === 'Admin' || userRole === 'Architect' || userRole === 'Chief Architect'

    useEffect(() => {
        setTitle(gap.title)
        setDesc(gap.description || "")
        setStatus(gap.status)
    }, [gap])

    const handleSaveDetails = async () => {
        if (!canEdit) return
        setIsSaving(true)
        try {
            await fetch(`/api/gaps/${gap.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description: desc, status })
            })
            onUpdate()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    // Parse metadata safely
    const metadata = gap.metadata ? JSON.parse(gap.metadata) : {};

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="border-b p-6 bg-white flex justify-between items-start gap-8 shrink-0">
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={!canEdit}
                            className="text-2xl font-bold h-auto px-0 py-1 border-transparent focus-visible:ring-0 focus:border-b focus:border-primary rounded-none transition-all bg-transparent w-full max-w-lg"
                        />
                        <div className="flex items-center gap-2">
                            {/* Display Governance Tags in Header */}
                            {metadata.tags && metadata.tags.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-[10px] bg-slate-50">{tag}</Badge>
                            ))}
                            <GapStatusBadge status={status} />
                            <ApprovalStatusBadge status={approvalStatus} />
                            {canEdit && (
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="w-[130px] h-8 text-xs border-dashed" id="gap-status-select-trigger">
                                        <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent id="gap-status-select-content">
                                        <SelectItem value="Identified">Identified</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 min-h-[20px]">
                        {desc || "No description provided."}
                    </p>

                    {/* Rejection reason banner */}
                    {approvalStatus === 'REJECTED' && gap.rejectionReason && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
                                <p className="text-xs text-red-600">{gap.rejectionReason}</p>
                            </div>
                        </div>
                    )}

                    {/* Locked banner */}
                    {isGapLocked && (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-yellow-600 shrink-0" />
                            <p className="text-xs text-yellow-700 font-medium">
                                {approvalStatus === 'APPROVED' ? 'This gap has been formally approved. Editing is locked.' : 'This gap is pending review. Editing is locked until reviewed.'}
                            </p>
                        </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                        <div className="text-xs text-slate-400 flex items-center gap-4">
                            {gap.startDate && <span>Start: <span className="font-medium text-slate-600" suppressHydrationWarning>{new Date(gap.startDate).toLocaleDateString()}</span></span>}
                            {gap.endDate && <span>Target: <span className="font-medium text-slate-600" suppressHydrationWarning>{new Date(gap.endDate).toLocaleDateString()}</span></span>}
                            {metadata.responsibleTeams && metadata.responsibleTeams.length > 0 && <span>Teams: <span className="font-medium text-slate-600">{metadata.responsibleTeams.join(", ")}</span></span>}
                        </div>

                        <GapCoverageBar changes={gap.changes} />
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    {/* Workflow Action Buttons */}
                    {approvalStatus === 'DRAFT' && isArchitectOrAdmin && (
                        <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg" onClick={() => onWorkflowAction(gap.id, 'submit')}>
                            <SendHorizontal className="h-3.5 w-3.5" /> Submit for Approval
                        </Button>
                    )}
                    {approvalStatus === 'PENDING_REVIEW' && isApprover && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" onClick={() => onWorkflowAction(gap.id, 'approve')}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 rounded-lg">
                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reject Gap</DialogTitle>
                                        <DialogDescription>Please provide a reason for rejecting this gap analysis.</DialogDescription>
                                    </DialogHeader>
                                    <Textarea placeholder="Reason for rejection..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="min-h-[100px]" />
                                    <DialogFooter>
                                        <Button variant="destructive" disabled={!rejectionReason.trim()} onClick={() => { onWorkflowAction(gap.id, 'reject', rejectionReason); setIsRejectDialogOpen(false); setRejectionReason(''); }}>
                                            Confirm Rejection
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                    {approvalStatus === 'PENDING_REVIEW' && isArchitectOrAdmin && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-slate-500 h-7 text-xs" onClick={() => onWorkflowAction(gap.id, 'revert')}>
                            <Undo2 className="h-3 w-3" /> Revert to Draft
                        </Button>
                    )}
                    {approvalStatus === 'REJECTED' && isArchitectOrAdmin && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-slate-600 rounded-lg" onClick={() => onWorkflowAction(gap.id, 'revert')}>
                            <Undo2 className="h-3.5 w-3.5" /> Revert to Draft
                        </Button>
                    )}

                    {canEdit && (
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full" id="gap-detail-tabs">
                    <div className="px-6 border-b bg-white sticky top-0 z-10 shrink-0">
                        <TabsList className="bg-transparent h-12 w-full justify-start rounded-none p-0 gap-6">
                            <TabsTrigger value="visual" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 bg-transparent font-medium border-b-2 border-transparent transition-all">
                                <MapIcon className="w-4 h-4 mr-2" /> Visual Map
                            </TabsTrigger>
                            <TabsTrigger value="roadmap" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 bg-transparent font-medium border-b-2 border-transparent transition-all">
                                <Calendar className="w-4 h-4 mr-2" /> Roadmap
                            </TabsTrigger>
                            <TabsTrigger value="changes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-2 py-3 bg-transparent font-medium border-b-2 border-transparent transition-all">
                                <Layers className="w-4 h-4 mr-2" /> Impacted Changes
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="visual" className="flex-1 p-0 m-0 overflow-hidden relative h-full min-h-0">
                        <div className="absolute inset-0">
                            <GapVisualMap
                                project={project}
                                gaps={allGaps}
                                onAssignChange={onAssignChange}
                                selectedGapId={gap.id}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="roadmap" className="flex-1 p-0 m-0 overflow-hidden h-full min-h-0">
                        <GapRoadmap gap={gap} onUpdate={onUpdate} canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="changes" className="flex-1 p-0 m-0 overflow-hidden h-full min-h-0">
                        <GapChanges gap={gap} project={project} onUpdate={onUpdate} canEdit={canEdit} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

// ---- Subcomponent: Roadmap ----
function GapRoadmap({ gap, onUpdate, canEdit }: { gap: any, onUpdate: () => void, canEdit: boolean }) {
    const [isAddPhaseOpen, setIsAddPhaseOpen] = useState(false)
    const [newByName, setNewByName] = useState("")
    const [newByDate, setNewByDate] = useState("")

    const handleAddPhase = async () => {
        if (!newByName) return
        await fetch(`/api/gaps/${gap.id}/phases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newByName, startDate: newByDate })
        })
        setNewByName("")
        setNewByDate("")
        setIsAddPhaseOpen(false)
        onUpdate()
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b bg-white shadow-sm shrink-0">
                <div>
                    <h3 className="font-semibold text-sm">Implementation Phases</h3>
                    <p className="text-xs text-muted-foreground">Define the timeline and release stages for this gap.</p>
                </div>
                {canEdit && (
                    <Dialog open={isAddPhaseOpen} onOpenChange={setIsAddPhaseOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add Phase</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Phase</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Phase Name</Label>
                                    <Input value={newByName} onChange={(e) => setNewByName(e.target.value)} placeholder="e.g. Design, MVP, Rollout" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Start Date</Label>
                                    <Input type="date" value={newByDate} onChange={(e) => setNewByDate(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddPhase}>Add Phase</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex-1 p-8 overflow-auto custom-scrollbar bg-slate-50/50">
                <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-10 max-w-4xl mx-auto">
                    {gap.phases && gap.phases.length > 0 ? gap.phases.map((phase: any, idx: number) => {
                        const changesInPhase = gap.changes?.filter((c: any) => c.gapPhaseId === phase.id) || []
                        return (
                            <div key={phase.id} className="relative pl-8">
                                <div className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-white border-4 border-primary shadow-sm z-10 px-0 py-0 box-border"></div>
                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-slate-800">{phase.name}</h4>
                                            <Badge variant="secondary" className="text-xs font-normal">{phase.status}</Badge>
                                        </div>
                                        <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded border">
                                            <span suppressHydrationWarning>{phase.startDate ? new Date(phase.startDate).toLocaleDateString() : "TBD"}</span>
                                            {phase.endDate && <span suppressHydrationWarning>{` - ${new Date(phase.endDate).toLocaleDateString()}`}</span>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">{phase.description || "No description provided."}</p>

                                    {/* Mini list of assigned changes */}
                                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                                        <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Engaged Components ({changesInPhase.length})</h5>
                                        {changesInPhase.length > 0 ? (
                                            <div className="grid gap-2">
                                                {changesInPhase.map((c: any) => (
                                                    <div key={c.id} className="text-xs flex items-center gap-2 p-1.5 bg-slate-50 rounded border border-slate-100">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${c.operation === 'ADD' ? 'bg-green-500' : c.operation === 'REMOVE' ? 'bg-red-500' : 'bg-orange-500'}`} />
                                                        <span className="font-medium text-slate-700">{c.component?.name || c.componentType}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic">No components assigned to this phase yet. Select components in the Visual Map.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="pl-8 pt-4 text-sm text-muted-foreground italic flex flex-col items-start gap-2">
                            <p>No roadmap defined yet.</p>
                            <p className="text-xs">1. Create a Phase here.</p>
                            <p className="text-xs">2. Go to the Visual Map tab to assign components.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---- Subcomponent: Changes ----
function GapChanges({ gap, project, onUpdate, canEdit }: { gap: any, project: any, onUpdate: () => void, canEdit: boolean }) {
    const [unassignedChanges, setUnassignedChanges] = useState<any[]>([])
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [selectedToAssign, setSelectedToAssign] = useState<string[]>([])

    useEffect(() => {
        const assignedIds = new Set(gap.changes?.map((c: any) => c.id))
        const available = project.changes?.filter((c: any) => !assignedIds.has(c.id))
        setUnassignedChanges(available || [])
    }, [gap, project])

    const handleAssign = async () => {
        await fetch(`/api/gaps/${gap.id}/changes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ changeIds: selectedToAssign, action: "assign" })
        })
        setSelectedToAssign([])
        setIsAssignOpen(false)
        onUpdate()
    }

    const handleUnassign = async (changeId: string) => {
        await fetch(`/api/gaps/${gap.id}/changes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ changeIds: [changeId], action: "unassign" })
        })
        onUpdate()
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b bg-white shadow-sm shrink-0">
                <div>
                    <h3 className="font-semibold text-sm">Impacted Changes ({gap.changes?.length || 0})</h3>
                    <p className="text-xs text-muted-foreground">List of all architectural changes linked to this gap.</p>
                </div>
                {canEdit && (
                    <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" /> Add Changes</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Link Changes to Gap</DialogTitle>
                                <DialogDescription>Select changes from the project to include in this gap analysis.</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 border rounded bg-slate-50 p-4 overflow-auto custom-scrollbar">
                                <div className="space-y-2">
                                    {unassignedChanges.map((change: any) => (
                                        <div key={change.id} className="flex items-center space-x-2 p-2 bg-white border rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedToAssign.includes(change.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedToAssign([...selectedToAssign, change.id])
                                                    else setSelectedToAssign(selectedToAssign.filter(id => id !== change.id))
                                                }}
                                                className="h-4 w-4 accent-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px]">{change.operation}</Badge>
                                                    {change.componentName || change.componentType}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{change.description || "No description"}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {unassignedChanges.length === 0 && <p className="text-center p-4 text-muted-foreground">No available changes to assign.</p>}
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAssign} disabled={selectedToAssign.length === 0}>Link Selected</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-slate-50/50 min-h-0">
                <div className="space-y-3 max-w-4xl mx-auto pb-10">
                    {gap.changes && gap.changes.length > 0 ? gap.changes.map((change: any) => (
                        <div key={change.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <Badge className={`h-6 ${change.operation === "ADD" ? "bg-green-100 text-green-700 hover:bg-green-200" : change.operation === "REMOVE" ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}>
                                    {change.operation}
                                </Badge>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{change.component?.name || change.componentType || "Unknown Component"}</p>
                                    <p className="text-xs text-slate-500">{change.description || "No change details provided."}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {change.gapPhaseId ? (
                                    <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                                        <Calendar className="w-3 h-3 mr-1.5" />
                                        In Roadmap
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic px-3">Not scheduled</div>
                                )}

                                {canEdit && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => handleUnassign(change.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center p-12 text-muted-foreground border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            No changes linked to this gap yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
