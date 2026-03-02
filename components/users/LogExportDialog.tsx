"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Download, FileDown, Loader2 } from "lucide-react"
import { getFilteredLogs } from "@/app/actions/logs"

interface User {
    id: string
    username: string
}

interface LogExportDialogProps {
    users: User[]
}

export function LogExportDialog({ users }: LogExportDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Filters
    const [selectedUser, setSelectedUser] = useState<string>("ALL")
    const [selectedRole, setSelectedRole] = useState<string>("ALL")
    const [selectedAction, setSelectedAction] = useState<string>("ALL")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const handleExport = async () => {
        setIsLoading(true)
        try {
            const res = await getFilteredLogs({
                userId: selectedUser,
                role: selectedRole,
                action: selectedAction,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            })

            if (res.success && res.logs) {
                // Convert to CSV
                const headers = ["Timestamp", "User", "Email", "Role", "Action", "Resource", "Details"]
                const rows = res.logs.map((log: any) => [
                    new Date(log.timestamp).toISOString(),
                    log.user?.username || "Unknown",
                    log.user?.email || "Unknown",
                    log.user?.role || "Unknown",
                    log.action,
                    log.resource,
                    log.details || ""
                ])

                const csvContent = [
                    headers.join(","),
                    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
                ].join("\n")

                // Download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.setAttribute("href", url)
                link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                setOpen(false)
            } else {
                alert("Failed to fetch logs for export.")
            }
        } catch (error) {
            console.error("Export failed", error)
            alert("An error occurred during export.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50">
                    <FileDown size={16} />
                    Export CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Export Activity Logs</DialogTitle>
                    <DialogDescription>
                        Filter and download system activity logs as a CSV file.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">User Role</label>
                            <Select value={selectedRole} onValueChange={(val) => { setSelectedRole(val); if (val !== 'ALL') setSelectedUser('ALL'); }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Roles</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                    <SelectItem value="Architect">Architect</SelectItem>
                                    <SelectItem value="Viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">User</label>
                            <Select value={selectedUser} onValueChange={setSelectedUser} disabled={selectedRole !== 'ALL'}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Users</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <label className="text-sm font-medium text-slate-700">Action Type</label>
                        <Select value={selectedAction} onValueChange={setSelectedAction}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Actions</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleExport} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
