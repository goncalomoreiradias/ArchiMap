"use client"

import { useState } from "react"
import { useArchStore, Layer, Status } from "@/store/useArchStore"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export function CreateComponentDialog() {
    const [open, setOpen] = useState(false)
    const addComponentAsync = useArchStore(state => state.addComponentAsync)

    const [formData, setFormData] = useState({
        name: "",
        layer: "Business" as Layer,
        type: "Process",
        status: "As-Is" as Status,
        description: ""
    })
    const [loading, setLoading] = useState(false)

    const layerTypes: Record<Layer, string[]> = {
        'Business': ['Process', 'Function', 'Service', 'Actor', 'Role', 'Event'],
        'BIAN': ['ServiceDomain', 'ServiceOperation', 'BusinessObject'],
        'Application': ['Component', 'Service', 'Interface', 'Collaboration', 'Function'],
        'Data': ['Data Object', 'Artifact', 'Representation', 'Schema'],
        'Technology': ['Device', 'System Software', 'Network', 'Artifact', 'Path']
    };

    const currentTypes = layerTypes[formData.layer] || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        await addComponentAsync(formData)
        setLoading(false)
        setOpen(false)
        setFormData({
            name: "",
            layer: "Business",
            type: "Process",
            status: "As-Is",
            description: ""
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Add Component
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Component</DialogTitle>
                    <DialogDescription>
                        Add a new architectural component to your landscape.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="layer" className="text-right">
                            Layer
                        </Label>
                        <Select
                            value={formData.layer}
                            onValueChange={(val: Layer) => setFormData({
                                ...formData,
                                layer: val,
                                type: layerTypes[val][0] // Reset type when layer changes
                            })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select layer" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="BIAN">BIAN</SelectItem>
                                <SelectItem value="Application">Application</SelectItem>
                                <SelectItem value="Data">Data</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentTypes.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val: Status) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="As-Is">As-Is</SelectItem>
                                <SelectItem value="Transitional">Transitional</SelectItem>
                                <SelectItem value="Target">Target</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
