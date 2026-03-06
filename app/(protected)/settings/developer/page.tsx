"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import {
    Key, Plus, Trash2, Copy, Check, Clock,
    ShieldAlert, AlertCircle, Building, Server
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function DeveloperSettingsPage() {
    const { data: session } = useSession()
    const [keys, setKeys] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [newKeyName, setNewKeyName] = React.useState("")
    const [generatedKey, setGeneratedKey] = React.useState<string | null>(null)
    const [copied, setCopied] = React.useState(false)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    // Ensure only Admins or Architects see this
    const role = (session?.user as any)?.role || 'Viewer'
    const canManageKeys = role === 'Admin' || role === 'Architect'

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/organizations/keys')
            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch (error) {
            console.error("Failed to fetch keys", error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchKeys()
    }, [])

    const handleGenerateKey = async () => {
        if (!newKeyName.trim()) return

        setIsGenerating(true)
        try {
            const res = await fetch('/api/organizations/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            })

            if (res.ok) {
                const data = await res.json()
                setGeneratedKey(data.rawKey) // Store temporarily to show the user
                fetchKeys() // Refresh the table
            }
        } catch (error) {
            console.error("Failed to generate key", error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleRevokeKey = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this key? External systems using it will immediately lose access.")) return

        try {
            const res = await fetch(`/api/organizations/keys/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                fetchKeys()
            }
        } catch (error) {
            console.error("Failed to revoke key", error)
        }
    }

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetDialog = () => {
        setIsDialogOpen(false)
        setGeneratedKey(null)
        setNewKeyName("")
    }

    if (!canManageKeys) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-4">
                    <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                    <p className="text-muted-foreground">You do not have permission to manage API Keys.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col pt-24 px-8 pb-8 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Developer Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage API Keys for external integrations (ServiceNow, LeanIX, etc).
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    if (!open) resetDialog()
                    else setIsDialogOpen(true)
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="h-4 w-4" />
                            Generate New Key
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Generate API Key</DialogTitle>
                            <DialogDescription>
                                Create a new secret key for machine-to-machine integrations.
                            </DialogDescription>
                        </DialogHeader>

                        {!generatedKey ? (
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Key Name</label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. ServiceNow Production Sync"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="rounded-xl"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4">
                                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sky-500 font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        Important
                                    </div>
                                    <p className="text-sm text-sky-500/80">
                                        Please copy this key immediately. You will not be able to see it again.
                                    </p>
                                </div>
                                <div className="relative">
                                    <pre className="p-4 pr-12 rounded-xl bg-slate-950 text-slate-50 text-sm whitespace-pre-wrap break-all border border-border/50 font-mono">
                                        {generatedKey}
                                    </pre>
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="absolute top-2 right-2 h-8 w-8 rounded-lg"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {!generatedKey ? (
                                <Button
                                    onClick={handleGenerateKey}
                                    disabled={!newKeyName.trim() || isGenerating}
                                    className="rounded-xl"
                                >
                                    {isGenerating ? "Generating..." : "Generate Key"}
                                </Button>
                            ) : (
                                <Button onClick={resetDialog} className="rounded-xl">
                                    Done
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 border rounded-2xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="w-[300px]">Name</TableHead>
                            <TableHead>Key Prefix</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Loading keys...
                                </TableCell>
                            </TableRow>
                        ) : keys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                                            <Key className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-slate-500">No API Keys created yet.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            keys.map((key) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4 text-indigo-500" />
                                            {key.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <code className="px-2 py-1 rounded bg-muted text-xs font-mono">
                                            {key.displayKey}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(key.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {key.lastUsedAt ? (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                {new Date(key.lastUsedAt).toLocaleString()}
                                            </div>
                                        ) : (
                                            <span className="text-xs">Never used</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg h-8"
                                            onClick={() => handleRevokeKey(key.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Revoke
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
