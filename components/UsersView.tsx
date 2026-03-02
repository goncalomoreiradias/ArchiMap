"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, User as UserIcon, Shield, Activity, Users, UserCheck, FileText, Clock, Edit } from "lucide-react"
import { createUser, deleteUser, updateUser } from "@/app/actions/users"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LogExportDialog } from "./users/LogExportDialog"

type User = {
    id: string
    username: string
    email: string
    role: string
    status?: string // Added status
    createdAt: string
}

type ActivityLog = {
    id: string
    userId: string
    action: string
    resource: string
    details?: string
    timestamp: string
}

type UsersViewProps = {
    users: User[]
    logs: ActivityLog[]
}

export function UsersView({ users, logs }: UsersViewProps) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false) // Edit Modal State
    const [editingUser, setEditingUser] = useState<User | null>(null) // User being edited
    const [isPending, startTransition] = useTransition()
    const [selectedUserLogs, setSelectedUserLogs] = useState<{ user: User, logs: ActivityLog[] } | null>(null)
    const router = useRouter()

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Viewer",
        status: "Active"
    })

    // Edit Form Data
    const [editFormData, setEditFormData] = useState({
        username: "",
        email: "",
        role: "Viewer",
        status: "Active",
        password: "" // Optional for reset
    })

    const [logFilterAction, setLogFilterAction] = useState<string>("ALL")

    const handleCreate = () => {
        startTransition(async () => {
            const res = await createUser({ ...formData, status: "Active" })
            if (res.success) {
                setIsAddOpen(false)
                setFormData({ username: "", email: "", password: "", role: "Viewer", status: "Active" })
                router.refresh()
            } else {
                alert(res.message)
            }
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return

        startTransition(async () => {
            const res = await deleteUser(id)
            if (res.success) {
                router.refresh()
            } else {
                alert(res.message)
            }
        })
    }

    const openEditModal = (user: User) => {
        setEditingUser(user)
        setEditFormData({
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status || "Active",
            password: ""
        })
        setIsEditOpen(true)
    }

    const handleUpdate = () => {
        if (!editingUser) return

        startTransition(async () => {
            const res = await updateUser(editingUser.id, editFormData)
            if (res.success) {
                setIsEditOpen(false)
                setEditingUser(null)
                router.refresh()
            } else {
                alert(res.message)
            }
        })
    }

    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Calculate Stats
    const today = new Date().toISOString().split('T')[0];
    const todaysLogs = logs.filter(l => {
        try {
            return new Date(l.timestamp).toISOString().startsWith(today)
        } catch (e) {
            return false
        }
    });

    const todaysLogins = todaysLogs.filter(l => l.action === 'LOGIN');

    // ... (rest of stats calculation)

    // Most active user
    const activityCounts: Record<string, number> = {};
    logs.forEach(l => { activityCounts[l.userId] = (activityCounts[l.userId] || 0) + 1 });
    const mostActiveUserId = Object.keys(activityCounts).sort((a, b) => activityCounts[b] - activityCounts[a])[0];
    const mostActiveUser = users.find(u => u.id === mostActiveUserId);
    const mostActiveUserLogs = logs.filter(l => l.userId === mostActiveUserId);

    // Stats Array
    const stats = [
        {
            label: "Total Users",
            value: users.length,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            onClick: undefined
        },
        {
            label: "Activity Logs",
            value: todaysLogs.length,
            sub: "Total Events Today",
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            onClick: () => setSelectedUserLogs({
                user: { username: "System Wide", email: "Today", role: "System", id: "system", createdAt: new Date().toISOString() },
                logs: todaysLogs
            })
        },
        {
            label: "Recent Activity",
            value: logs.length > 0 ? (mostActiveUser?.username || "N/A") : "None",
            sub: "Most Active User",
            icon: UserCheck,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            onClick: () => mostActiveUser && setSelectedUserLogs({ user: mostActiveUser, logs: mostActiveUserLogs })
        },
    ]

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    const filteredLogs = selectedUserLogs?.logs.filter(log => {
        if (logFilterAction === "ALL") return true;
        return log.action.includes(logFilterAction);
    }) || [];

    if (!isMounted) {
        return null // or a loading skeleton if preferred, but null avoids hydration mismatch for full component if needed, or just for the dialog. 
        // Actually, returning null for the whole component might cause layout shift. 
        // Let's just handle the Dialog being client-only or the whole view.
        // Given the error stack trace involves UsersView, let's verify if we can just wrap the Dialog.
    }

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={containerVariants}
            className="flex flex-col h-[calc(100vh-1rem)] bg-slate-50/50 dark:bg-zinc-950/50 overflow-hidden relative"
        >
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-20 left-20 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            {/* Header */}
            <div className="px-10 py-8 z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                        User Management
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Control access and monitor activity across the platform.
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* LogExportDialog is the source of hydration error, render only when mounted */}
                    {isMounted && <LogExportDialog users={users} />}
                    <Button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-500/20 active:scale-95 transition-all">
                        <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                </div>
            </div>

            {/* Widgets */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 px-10 mb-8 z-10">
                {stats.map((stat) => (
                    <Card
                        key={stat.label}
                        onClick={stat.onClick}
                        className={`border-0 shadow-sm bg-white dark:bg-zinc-900 ring-1 ring-slate-100 dark:ring-zinc-800 rounded-2xl transition-all ${stat.onClick ? 'cursor-pointer hover:shadow-md hover:ring-indigo-200' : ''}`}
                    >
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stat.value}</h3>
                                {stat.sub && <p className="text-xs text-slate-400 font-medium mt-1">{stat.sub}</p>}
                            </div>
                            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Content */}
            <motion.div variants={itemVariants} className="flex-1 overflow-hidden px-10 pb-8 z-10">
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 ring-1 ring-slate-100 dark:ring-zinc-800 rounded-2xl h-full flex flex-col">
                    <CardHeader className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>All Users</CardTitle>
                            <Input placeholder="Search users..." className="w-[300px] rounded-lg bg-slate-50 border-slate-200" />
                        </div>
                    </CardHeader>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-semibold text-slate-500">User</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-500">Joined</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-500">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                                        <TableCell>
                                            <div onClick={() => setSelectedUserLogs({ user, logs: logs.filter(l => l.userId === user.id) })} className="flex items-center gap-4 cursor-pointer">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{user.username}</span>
                                                    <span className="text-xs text-slate-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                user.role === 'Admin' ? 'bg-violet-50 text-violet-700 border-violet-200 rounded-lg px-2 py-0.5' :
                                                    user.role === 'Architect' ? 'bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-2 py-0.5' :
                                                        'bg-slate-50 text-slate-700 border-slate-200 rounded-lg px-2 py-0.5'
                                            }>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                (user.status === 'Active' || !user.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    user.status === 'Suspended' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                            }>
                                                {user.status || 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm font-medium">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditModal(user)}
                                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg mr-1"
                                                title="Edit User"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setSelectedUserLogs({ user, logs: logs.filter(l => l.userId === user.id) })}
                                                className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg mr-1"
                                                title="View Activity Logs"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                                disabled={isPending || user.username === 'admin' || user.username === 'system'}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </motion.div>

            {/* Add User Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="rounded-2xl gap-0 p-0 overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account for the system.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Username</label>
                                <Input
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="jdoe"
                                    className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="Viewer">Viewer</SelectItem>
                                        <SelectItem value="Architect">Architect</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                type="email"
                                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Password</label>
                            <Input
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="******"
                                type="password"
                                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl hover:bg-slate-200">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            {isPending ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-2xl gap-0 p-0 overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Edit User: {editingUser?.username}</DialogTitle>
                            <DialogDescription>
                                Modify user details and permissions.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Role</label>
                                <Select
                                    value={editFormData.role}
                                    onValueChange={(val) => setEditFormData({ ...editFormData, role: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="Viewer">Viewer</SelectItem>
                                        <SelectItem value="Architect">Architect</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <Select
                                    value={editFormData.status}
                                    onValueChange={(val) => setEditFormData({ ...editFormData, status: val })}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 focus:ring-indigo-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                        <SelectItem value="Inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input
                                value={editFormData.email}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                placeholder="john@example.com"
                                type="email"
                                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-700">Reset Password (Optional)</label>
                            <Input
                                value={editFormData.password}
                                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                placeholder="New password..."
                                type="password"
                                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-xl hover:bg-slate-200">Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isPending} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* User Logs Modal with Filters */}
            <Dialog open={!!selectedUserLogs} onOpenChange={(open) => { if (!open) setSelectedUserLogs(null); setLogFilterAction("ALL"); }}>
                <DialogContent className="rounded-2xl gap-0 p-0 overflow-hidden max-w-3xl">
                    <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                    Activity Log: {selectedUserLogs?.user.username}
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedUserLogs?.logs.length} events recorded.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        {/* Filters */}
                        <div className="flex gap-2">
                            <Select
                                value={logFilterAction}
                                onValueChange={setLogFilterAction}
                            >
                                <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg bg-white border-slate-200">
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    <SelectItem value="LOGIN">Logins</SelectItem>
                                    <SelectItem value="CREATE">Creates</SelectItem>
                                    <SelectItem value="UPDATE">Updates</SelectItem>
                                    <SelectItem value="DELETE">Deletes</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-0 max-h-[60vh] overflow-y-auto">
                        {filteredLogs.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-slate-50/50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="w-[160px]">Time</TableHead>
                                        <TableHead className="w-[100px]">Action</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="text-xs text-slate-500 font-mono whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    log.action === 'LOGIN' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        log.action === 'LOGOUT' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                            log.action.includes('DELETE') ? 'bg-red-50 text-red-700 border-red-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                }>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700">
                                                {log.details || log.resource}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                                <Clock className="w-12 h-12 mb-3 opacity-20" />
                                <p>No matching activity found.</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setSelectedUserLogs(null)} className="rounded-xl">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}
