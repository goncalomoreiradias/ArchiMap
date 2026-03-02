
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, Check, Calendar, Users, Tag, Map as MapIcon } from "lucide-react"
import { GapVisualMap } from "./GapVisualMap"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GapWizardProps {
    isOpen: boolean
    onClose: () => void
    project: any
    onSave: (data: any) => Promise<void>
}

export function GapWizard({ isOpen, onClose, project, onSave }: GapWizardProps) {
    const [step, setStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)

    // Form Data
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [responsibleTeams, setResponsibleTeams] = useState("")
    const [tags, setTags] = useState<string[]>([])
    const [currentTag, setCurrentTag] = useState("")

    const handleNext = () => setStep(s => s + 1)
    const handleBack = () => setStep(s => s - 1)

    const handleAddTag = () => {
        if (currentTag && !tags.includes(currentTag)) {
            setTags([...tags, currentTag])
            setCurrentTag("")
        }
    }

    const handleComplete = async () => {
        setIsLoading(true)
        try {
            await onSave({
                title,
                description,
                startDate,
                endDate,
                metadata: {
                    responsibleTeams: responsibleTeams.split(',').map(t => t.trim()).filter(Boolean),
                    tags,
                    selectedChangeIds: selectedIds // Pass selected changes for linking
                }
            })
            console.log("GapWizard: Saving gap with changes:", selectedIds);
            // Reset
            setStep(1)
            setTitle("")
            setDescription("")
            setSelectedIds([])
            setStartDate("")
            setEndDate("")
            setResponsibleTeams("")
            setTags([])
            onClose()
            onClose()
        } catch (e: any) {
            console.error(e)
            alert("Failed to create roadmap: " + (e.message || "Unknown error"))
        } finally {
            setIsLoading(false)
        }
    }

    const tagOptions = ["Mandatory", "New Regulation", "Internal Improvement", "Tech Debt", "Innovation"]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={`${step === 2 ? "max-w-[90vw] h-[90vh]" : "max-w-2xl"} transition-all duration-300 flex flex-col p-0 gap-0`}>
                <div className="px-6 py-4 border-b">
                    <DialogHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span className={step === 1 ? "text-primary font-bold" : ""}>1. Definition</span>
                                <span className="text-slate-300">/</span>
                                <span className={step === 2 ? "text-primary font-bold" : ""}>2. Scope</span>
                                <span className="text-slate-300">/</span>
                                <span className={step === 3 ? "text-primary font-bold" : ""}>3. Governance</span>
                            </div>
                        </div>
                        <DialogTitle className="text-2xl">
                            {step === 1 && "Start Roadmap Definition"}
                            {step === 2 && "Define Scope"}
                            {step === 3 && "Governance & Planning"}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 1 && "Identify the architectural gap and its primary objective."}
                            {step === 2 && "Select the architectural changes that are part of this roadmap."}
                            {step === 3 && "Set timelines, ownership, and classification."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Step Content */}
                <div className={`flex-1 bg-slate-50/50 ${step === 2 ? 'overflow-hidden' : 'overflow-auto'}`}>
                    {step === 1 && (
                        <div className="p-6 max-w-2xl mx-auto space-y-4">
                            <div className="space-y-2">
                                <Label>Roadmap Title</Label>
                                <Input
                                    placeholder="e.g. Cloud Migration Phase 1"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Strategy / Description</Label>
                                <Textarea
                                    placeholder="Describe the high-level goal and strategy..."
                                    className="min-h-[150px] resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="h-full w-full relative" style={{ minHeight: '600px' }}>
                            <div className="absolute inset-0">
                                <GapVisualMap
                                    project={project}
                                    gaps={[]} // Pass empty for creation context
                                    selectedGapId="" // Nothing active
                                    selectionMode="multi"
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                    onAssignChange={async () => { }} // No-op in selection mode
                                />
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-xl border border-slate-200 text-sm font-medium z-10 flex items-center gap-3">
                                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                                {selectedIds.length} changes selected
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="p-6 max-w-2xl mx-auto grid gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Target End Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Responsible Teams</Label>
                                <div className="relative">
                                    <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="e.g. DevOps, Platform Team (comma separated)"
                                        className="pl-9"
                                        value={responsibleTeams}
                                        onChange={(e) => setResponsibleTeams(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Classification Tags</Label>
                                <div className="flex gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Select onValueChange={(val) => {
                                            if (!tags.includes(val)) setTags([...tags, val])
                                        }}>
                                            <SelectTrigger className="pl-9">
                                                <SelectValue placeholder="Add Tag..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tagOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 rounded border border-dashed">
                                    {tags.length === 0 && <span className="text-xs text-muted-foreground italic">No tags selected</span>}
                                    {tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="pl-2 pr-1 gap-1">
                                            {tag}
                                            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:bg-slate-200 rounded-full p-0.5">
                                                <Check className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t bg-white">
                    <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
                        {step > 1 ? (
                            <Button variant="outline" onClick={handleBack}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        ) : (
                            <div /> // Spacer
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            {step < 3 ? (
                                <Button onClick={handleNext} disabled={step === 1 && !title}>
                                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button onClick={handleComplete} disabled={isLoading}>
                                    Create Roadmap <Check className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
