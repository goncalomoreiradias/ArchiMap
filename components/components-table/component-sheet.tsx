"use client"

import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Need to install avatar if missing, or use div
import { AlertTriangle, MessageSquare, Send, Edit2, Save, X, Calendar } from "lucide-react"

import { updateComponent } from "@/app/actions/components"
import { useUser } from "@/contexts/UserContext"

interface ComponentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    component: any | null
    onDelete: (force: boolean) => void
    isDeleting: boolean
    deleteStatus: any | null
    showDeleteConfirm: boolean
}

export function ComponentSheet({
    open,
    onOpenChange,
    component,
    onDelete,
    isDeleting,
    deleteStatus,
    showDeleteConfirm
}: ComponentSheetProps) {
    const { role } = useUser()
    const isAdmin = role === 'Admin'

    const [description, setDescription] = useState("")
    const [formData, setFormData] = useState<any>({})
    const [isEditingDesc, setIsEditingDesc] = useState(false) // Reusing this for "Edit Mode"
    const [isSaving, setIsSaving] = useState(false)
    const [comments, setComments] = useState<{ id: number; user: string; text: string; date: string; initials: string }[]>([])
    const [newComment, setNewComment] = useState("")

    useEffect(() => {
        if (component) {
            setDescription(component.description || "")
            setFormData({
                description: component.description || "",
                version: component.version || "",
                lifecycle: component.lifecycle || "Plan",
                validFrom: component.validFrom || "",
                validTo: component.validTo || "",
                strategicValue: component.strategicValue || "Medium",
                technicalFit: component.technicalFit || "Adequate",
                complexity: component.complexity || "Medium",
                tags: component.tags || "",
                metadata: component.metadata || "",
                externalLink: component.externalLink || ""
            })
            setIsEditingDesc(false)
            // Reset comments or fetch real ones here
        }
    }, [component])

    const handleSave = async () => {
        if (!component) return
        setIsSaving(true)
        // Combine description into formData just in case, though we used separate state initially
        const payload = {
            ...formData,
            description: description // ensure description is synced
        }

        // Clean up empty strings to null/undefined if needed, or backend handles it
        if (payload.validFrom === "") payload.validFrom = null
        if (payload.validTo === "") payload.validTo = null

        await updateComponent(component.id, payload)
        setIsSaving(false)
        setIsEditingDesc(false)
    }

    const handleAddComment = () => {
        if (!newComment.trim()) return
        const comment = {
            id: Date.now(),
            user: "You (Architect)",
            text: newComment,
            date: "Just now",
            initials: "ME"
        }
        setComments([comment, ...comments])
        setNewComment("")
    }

    if (!component) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto w-[650px] sm:max-w-[650px] p-0 bg-white dark:bg-zinc-950 border-l dark:border-zinc-800">
                {/* Header with improved aesthetics */}
                <div className="bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 p-8 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white dark:bg-black border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300">
                                {component.layer}
                            </Badge>
                            {component.status && (
                                <Badge variant={component.status === 'Target' ? 'default' : 'secondary'}>
                                    {component.status}
                                </Badge>
                            )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">ID: {component.id}</span>
                    </div>
                    <SheetTitle className="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {component.name}
                    </SheetTitle>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm flex items-center gap-2">
                        <Calendar size={14} /> Created {new Date(component.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex-1">
                    <Tabs defaultValue="details" className="w-full">
                        <div className="px-8 pt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Details & Properties</TabsTrigger>
                                <TabsTrigger value="comments">Comments & Discussion</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="details" className="p-8 space-y-8 mt-0 focus-visible:ring-0">
                            {/* Editable Description */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Description</h4>
                                    {/* Edit Button - Only for Admins */}
                                    {!isEditingDesc && isAdmin && (
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(true)} className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                            <Edit2 size={12} className="mr-1" /> Edit
                                        </Button>
                                    )}

                                    {isEditingDesc && (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => { setIsEditingDesc(false); setDescription(component.description || "") }} className="h-7 text-xs">
                                                <X size={14} />
                                            </Button>
                                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700">
                                                <Save size={14} className="mr-1" /> {isSaving ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {isEditingDesc ? (
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-white dark:bg-zinc-900 min-h-[150px] text-sm resize-none"
                                        placeholder="Add a detailed description..."
                                    />
                                ) : (
                                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-zinc-900/50 p-4 rounded-lg border border-slate-100 dark:border-zinc-800 min-h-[100px]">
                                        {description || <span className="text-slate-400 italic">No description provided.</span>}
                                    </div>
                                )}
                            </div>

                            {/* Editable Fields Section */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide border-b pb-2">Lifecycle</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Version</span>
                                            {isEditingDesc ? (
                                                <input
                                                    className="w-24 px-2 py-1 text-right text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.version || ''}
                                                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                                                    placeholder="1.0"
                                                />
                                            ) : (
                                                <span className="font-mono bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{component.version || 'Latest'}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">State</span>
                                            {isEditingDesc ? (
                                                <select
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.lifecycle || 'Plan'}
                                                    onChange={e => setFormData({ ...formData, lifecycle: e.target.value })}
                                                >
                                                    <option value="Plan">Plan</option>
                                                    <option value="Build">Build</option>
                                                    <option value="Run">Run</option>
                                                    <option value="Retire">Retire</option>
                                                </select>
                                            ) : (
                                                <Badge variant="outline" className={
                                                    component.lifecycle === 'Plan' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                                        component.lifecycle === 'Build' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                                            component.lifecycle === 'Run' ? 'text-green-600 border-green-200 bg-green-50' :
                                                                component.lifecycle === 'Retire' ? 'text-red-600 border-red-200 bg-red-50' : ''
                                                }>{component.lifecycle || 'Plan'}</Badge>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Valid From</span>
                                            {isEditingDesc ? (
                                                <input
                                                    type="date"
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.validFrom ? new Date(formData.validFrom).toISOString().split('T')[0] : ''}
                                                    onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                                                />
                                            ) : (
                                                <span>{component.validFrom ? new Date(component.validFrom).toLocaleDateString() : '-'}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Valid To</span>
                                            {isEditingDesc ? (
                                                <input
                                                    type="date"
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.validTo ? new Date(formData.validTo).toISOString().split('T')[0] : ''}
                                                    onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                                                />
                                            ) : (
                                                <span>{component.validTo ? new Date(component.validTo).toLocaleDateString() : '-'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide border-b pb-2">Strategic</h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Strategic Value</span>
                                            {isEditingDesc ? (
                                                <select
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.strategicValue || 'Medium'}
                                                    onChange={e => setFormData({ ...formData, strategicValue: e.target.value })}
                                                >
                                                    <option value="Critical">Critical</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            ) : (
                                                <span className={`font-medium px-2 py-0.5 rounded text-xs ${component.strategicValue === 'Critical' ? 'bg-purple-100 text-purple-700' :
                                                    component.strategicValue === 'High' ? 'bg-indigo-100 text-indigo-700' :
                                                        component.strategicValue === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-700'
                                                    }`}>{component.strategicValue || 'Medium'}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Technical Fit</span>
                                            {isEditingDesc ? (
                                                <select
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.technicalFit || 'Adequate'}
                                                    onChange={e => setFormData({ ...formData, technicalFit: e.target.value })}
                                                >
                                                    <option value="Excellent">Excellent</option>
                                                    <option value="Adequate">Adequate</option>
                                                    <option value="Poor">Poor</option>
                                                    <option value="Critical">Critical</option>
                                                </select>
                                            ) : (
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{component.technicalFit || 'Adequate'}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center h-8">
                                            <span className="text-slate-500">Complexity</span>
                                            {isEditingDesc ? (
                                                <select
                                                    className="w-32 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.complexity || 'Medium'}
                                                    onChange={e => setFormData({ ...formData, complexity: e.target.value })}
                                                >
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            ) : (
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{component.complexity || 'Medium'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata & Links */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide border-b pb-2">Metadata</h4>
                                <div className="grid grid-cols-1 gap-2 pt-2">
                                    {isEditingDesc ? (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-slate-500">Tags (comma separated)</label>
                                                <input
                                                    className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.tags || ''}
                                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                                    placeholder="tag1, tag2, tag3"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-slate-500">External Link</label>
                                                <input
                                                    className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-zinc-900 border-slate-200"
                                                    value={formData.externalLink || ''}
                                                    onChange={e => setFormData({ ...formData, externalLink: e.target.value })}
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-slate-500">Metadata (JSON)</label>
                                                <Textarea
                                                    className="w-full h-24 text-xs font-mono bg-slate-50 dark:bg-zinc-900 border-slate-200 resize-none"
                                                    value={formData.metadata || ''}
                                                    onChange={e => setFormData({ ...formData, metadata: e.target.value })}
                                                    placeholder='{"key": "value"}'
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {component.tags && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {component.tags.split(',').map((tag: string, i: number) => (
                                                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                                            #{tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {component.externalLink && (
                                                <a href={component.externalLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                    External Link <Send size={12} />
                                                </a>
                                            )}
                                            {component.metadata && (
                                                <div className="bg-slate-50 p-3 rounded font-mono text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">
                                                    {component.metadata}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Delete Zone - Refined */}
                            <div className={`rounded-xl border p-5 transition-all duration-300 ${showDeleteConfirm ? 'bg-red-50 border-red-200 ring-1 ring-red-200' : 'bg-slate-50 border-slate-100 hover:border-red-100'}`}>
                                {!showDeleteConfirm ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Delete Component</h4>
                                            <p className="text-xs text-slate-500 mt-1">Permanently remove this component from the catalog.</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onDelete(false)}
                                            disabled={isDeleting}
                                            className="text-red-600 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                        >
                                            <AlertTriangle size={14} className="mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-100 rounded-full text-red-600 mt-1">
                                                <AlertTriangle size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-red-900">Cannot Delete: Dependencies Found</h4>
                                                <p className="text-xs text-red-700 mt-1">
                                                    This component is linked to <strong>{deleteStatus?.dependencies?.length}</strong> other item(s). You must review these connections before force-deleting.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-red-100 text-xs max-h-40 overflow-y-auto shadow-sm">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-red-900/50 border-b border-red-50">
                                                        <th className="pb-2 font-medium">Component</th>
                                                        <th className="pb-2 font-medium">Type</th>
                                                        <th className="pb-2 font-medium text-right">Relation</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {deleteStatus?.dependencies?.map((dep: any, i: number) => (
                                                        <tr key={i} className="border-b border-red-50 last:border-0 text-red-800">
                                                            <td className="py-2 font-medium">{dep.name}</td>
                                                            <td className="py-2 opacity-80">{dep.type}</td>
                                                            <td className="py-2 text-right opacity-80">{dep.relationType}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <Button variant="ghost" size="sm" onClick={() => onDelete(false)} className="text-slate-600">Cancel</Button>
                                            <Button variant="destructive" size="sm" onClick={() => onDelete(true)} disabled={isDeleting}>
                                                Force Delete All Relations
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="comments" className="p-0 h-[400px] flex flex-col focus-visible:ring-0">
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 space-y-2">
                                        <MessageSquare size={32} className="mx-auto opacity-20" />
                                        <p className="text-sm">No comments yet. Start the discussion!</p>
                                    </div>
                                ) : (
                                    comments.map(comment => (
                                        <div key={comment.id} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                                {comment.initials}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{comment.user}</span>
                                                    <span className="text-xs text-slate-400">{comment.date}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-zinc-900 p-3 rounded-r-lg rounded-bl-lg">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-4 border-t bg-slate-50 dark:bg-zinc-900">
                                <div className="flex gap-2">
                                    <Textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="min-h-[60px] resize-none bg-white dark:bg-black border-slate-200 dark:border-zinc-800"
                                    />
                                    <Button onClick={handleAddComment} className="h-auto self-end px-3">
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
