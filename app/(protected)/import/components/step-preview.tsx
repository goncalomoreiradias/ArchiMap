"use client"

import { useMemo } from "react"
import { ImportAnalysisResult } from "@/app/actions/import-analysis"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowRight, CheckCircle, Database, LayoutDashboard } from "lucide-react"
import { ImportPreviewMap } from "./import-preview-map"
import { Node, Edge } from "@xyflow/react"

interface StepPreviewProps {
    analysis: ImportAnalysisResult
    onConfirm: () => void
    onCancel: () => void
    isExecuting: boolean
}

export function StepPreview({ analysis, onConfirm, onCancel, isExecuting }: StepPreviewProps) {

    // Transform analysis data into ReactFlow nodes/edges
    const { nodes, edges } = useMemo(() => {
        const nodes: Node[] = []
        const edges: Edge[] = []
        const spacingX = 350
        const spacingY = 150

        // Helper to position nodes roughly (simple grid for now)
        let x = 0
        let y = 0
        const cols = 4

        const processNode = (comp: any, isNew: boolean) => {
            const id = comp.id
            const status = isNew ? 'added' : 'existing'

            nodes.push({
                id,
                type: 'archNode',
                position: { x, y },
                data: {
                    label: comp.name,
                    type: comp.type,
                    layer: comp.layer,
                    status: comp.status,
                    lifecycle: comp.lifecycle,
                    strategicValue: comp.strategicValue,
                    changeStatus: status, // Custom field for styling
                    ...comp
                },
                style: isNew ? {
                    border: '2px dashed #22c55e',
                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.2)'
                } : undefined
            })

            x += spacingX
            if (nodes.length % cols === 0) {
                x = 0
                y += spacingY
            }
        }

        // 1. Existing Components (that are relevant)
        // Ideally we should layout the whole map or just the neighborhood. 
        // For now, let's just show what's touched.
        // analysis.components.existing contains items that MATCHED. 
        // We might want to see unrelated items too? 
        // The prompt says "Pre import view... new cards, new relationships... as it looks in mind map"
        // Without full graph layout, simple grid is safer than overlapping everything.

        analysis.components.existing.forEach(c => processNode(c, false))
        analysis.components.new.forEach(c => processNode(c, true))

        // 2. Edges
        // Existing
        analysis.relationships.existing.forEach((rel: any, i: number) => {
            // We need IDs. Existing items in analysis should have them.
        })

        // New Relationships
        analysis.relationships.new.forEach((rel: any, i: number) => {
            // We need to resolve IDs. 
            // In analysis logic we didn't fully resolve IDs for new items to existing items if they weren't matched.
            // But let's assume names are unique for this viz.

            // Find source/target IDs from our nodes array
            const sourceNode = nodes.find(n => n.data.label === rel.sourceName)
            const targetNode = nodes.find(n => n.data.label === rel.targetName)

            if (sourceNode && targetNode) {
                edges.push({
                    id: `new-rel-${i}`,
                    source: sourceNode.id,
                    target: targetNode.id,
                    label: rel.type,
                    animated: true,
                    style: { stroke: '#22c55e', strokeWidth: 2, strokeDasharray: '5,5' }
                })
            }
        })

        return { nodes, edges }
    }, [analysis])

    const hasErrors = analysis.components.errors.length > 0 || analysis.relationships.errors.length > 0

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 uppercase font-bold">New Components</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.stats.newComponents}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 uppercase font-bold">Components to Update</p>
                    <p className="text-2xl font-bold text-blue-600">{analysis.stats.existingComponents}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 uppercase font-bold">New Relationships</p>
                    <p className="text-2xl font-bold text-green-600">{analysis.stats.newRelationships}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Items</p>
                    <p className="text-2xl font-bold text-slate-900">{analysis.stats.totalComponents + analysis.stats.totalRelationships}</p>
                </div>
            </div>

            {hasErrors && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                        Found {analysis.components.errors.length + analysis.relationships.errors.length} errors.
                        Please review the Data Impact tab. You can proceed, but invalid items will be skipped.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="visual" className="w-full h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="visual" className="gap-2"><LayoutDashboard size={14} /> Visual Impact</TabsTrigger>
                        <TabsTrigger value="data" className="gap-2"><Database size={14} /> Data Impact</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="visual" className="flex-1 border rounded-xl overflow-hidden shadow-sm">
                    <ImportPreviewMap nodes={nodes} edges={edges} />
                </TabsContent>

                <TabsContent value="data" className="flex-1 border rounded-xl overflow-auto bg-white p-0">
                    <div className="p-6">
                        <h3 className="font-bold mb-4 text-green-600 flex items-center gap-2">
                            <CheckCircle size={16} /> New Components ({analysis.components.new.length})
                        </h3>
                        {analysis.components.new.length === 0 ? (
                            <p className="text-slate-400 italic text-sm mb-6">No new components.</p>
                        ) : (
                            <table className="w-full text-sm mb-8">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Name</th>
                                        <th className="text-left p-3 font-medium">Type</th>
                                        <th className="text-left p-3 font-medium">Layer</th>
                                        <th className="text-left p-3 font-medium">Lifecycle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.components.new.map((c: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-3 font-medium">{c.name}</td>
                                            <td className="p-3 text-slate-600">{c.type}</td>
                                            <td className="p-3 text-slate-600">{c.layer}</td>
                                            <td className="p-3 text-slate-600">{c.lifecycle}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        <h3 className="font-bold mb-4 text-green-600 flex items-center gap-2">
                            <CheckCircle size={16} /> New Relationships ({analysis.relationships.new.length})
                        </h3>
                        {analysis.relationships.new.length === 0 ? (
                            <p className="text-slate-400 italic text-sm">No new relationships.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Source</th>
                                        <th className="text-left p-3 font-medium">Type</th>
                                        <th className="text-left p-3 font-medium">Target</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.relationships.new.map((r: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                            <td className="p-3 text-slate-900">{r.sourceName}</td>
                                            <td className="p-3 text-slate-500 italic">{r.type}</td>
                                            <td className="p-3 text-slate-900">{r.targetName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel} disabled={isExecuting}>
                    Cancel
                </Button>
                <Button onClick={onConfirm} disabled={isExecuting} className="bg-green-600 hover:bg-green-700 min-w-[150px]">
                    {isExecuting ? 'Importing...' : 'Confirm & Import'}
                    {!isExecuting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}
