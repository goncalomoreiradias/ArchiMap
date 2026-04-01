"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Organization = {
    id: string
    name: string
    slug: string
    role: string
}

export function OrganizationSwitcher() {
    const { data: session, status } = useSession()
    const [organizations, setOrganizations] = React.useState<Organization[]>([])
    const [activeOrgId, setActiveOrgId] = React.useState<string | null>(null)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => { setMounted(true) }, [])

    React.useEffect(() => {
        // Hydrate active org from session
        if (session?.user && (session.user as any).organizationId) {
            setActiveOrgId((session.user as any).organizationId)
        }

        // Fetch organizations list
        async function fetchOrgs() {
            try {
                const res = await fetch('/api/user/organizations')
                if (res.ok) {
                    const data = await res.json()
                    setOrganizations(data)
                }
            } catch (error) {
                console.error("Failed to fetch organizations", error)
            }
        }

        fetchOrgs()
    }, [session])

    // Determine the active organization to display
    let activeOrg = organizations.find((org) => org.id === activeOrgId);

    // Fallback if not found in list (e.g. initial load or hardcoded admin)
    if (!activeOrg) {
        if (status === "loading") {
            activeOrg = { id: "", name: "Loading...", slug: "loading", role: "" };
        } else if ((session?.user as any)?.organizationName) {
            activeOrg = {
                id: (session.user as any).organizationId || "",
                name: (session.user as any).organizationName,
                slug: "",
                role: (session.user as any).orgRole || ""
            };
        } else if (organizations.length > 0) {
            // Default to the first one if they have orgs but none active in session
            activeOrg = organizations[0];
        } else {
            // Fallback for users with NO organizations (like the hardcoded admin test user)
            activeOrg = { id: "", name: "System Admin", slug: "system", role: "Super Admin" };
        }
    }

    // Prevent hydration mismatch — Radix generates different IDs on server vs client
    if (!mounted) {
        return (
            <div className="w-full rounded-xl">
                <div className="flex items-center gap-3 p-2">
                    <div className="h-8 w-8 rounded-lg shrink-0 border border-sidebar-border bg-sidebar-accent/50" />
                    <div className="flex flex-col gap-0.5 items-start text-left flex-1 overflow-hidden">
                        <span className="text-sm font-semibold truncate text-sidebar-foreground">Loading...</span>
                        <span className="text-xs text-sidebar-foreground/60 truncate">Workspace</span>
                    </div>
                </div>
            </div>
        )
    }

    // Determine if the current user is Super Admin
    const isSuperAdmin = session?.user && ((session.user as any).id === "admin-id" || !(session.user as any).organizationId);

    if (!isSuperAdmin) {
        const userName = (session?.user as any)?.username || (session?.user as any)?.name || activeOrg.name;
        const userSystemRole = (session?.user as any)?.role || activeOrg.role || "Viewer";
        
        return (
            <div className="w-full rounded-xl transition-colors outline-none cursor-default select-none">
                <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-sidebar-border bg-sidebar-accent/50">
                        <AvatarFallback className="rounded-lg bg-indigo-500/10 text-indigo-500 font-medium">
                            {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 items-start text-left flex-1 overflow-hidden">
                        <span className="text-sm font-semibold truncate text-sidebar-foreground">
                            {userName}
                        </span>
                        <span className="text-xs text-sidebar-foreground/60 truncate uppercase tracking-wider font-medium">
                            {userSystemRole}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    const userName = (session?.user as any)?.username || (session?.user as any)?.name || activeOrg.name;
    const userSystemRole = (session?.user as any)?.role || activeOrg.role || "Super Admin";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="w-full rounded-xl ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-sidebar-accent/50 outline-none">
                <div className="flex items-center gap-3 p-2">
                    <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-sidebar-border bg-sidebar-accent/50">
                        <AvatarFallback className="rounded-lg bg-indigo-500/10 text-indigo-500 font-medium select-none">
                            {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5 items-start text-left flex-1 overflow-hidden">
                        <span className="text-sm font-semibold truncate text-sidebar-foreground">
                            {userName}
                        </span>
                        <span className="text-xs text-sidebar-foreground/60 truncate uppercase tracking-wider font-medium">
                            {userSystemRole}
                        </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl border-sidebar-border" align="start" sideOffset={8}>
                <DropdownMenuLabel className="text-xs text-sidebar-foreground/60 font-semibold uppercase tracking-wider">
                    Workspaces
                </DropdownMenuLabel>
                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-default transition-colors",
                            activeOrgId === org.id ? "bg-sidebar-accent/50" : "hover:bg-sidebar-accent/30"
                        )}
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/30">
                            <Building className="h-4 w-4 text-sidebar-foreground/70" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-sidebar-foreground truncate">{org.name}</span>
                            <span className="text-xs text-sidebar-foreground/50 truncate text-left">{org.role}</span>
                        </div>
                        {activeOrgId === org.id && (
                            <Check className="ml-auto h-4 w-4 text-indigo-500 shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-sidebar-border" />
                <DropdownMenuItem className="p-2 cursor-pointer gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 rounded-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-transparent border border-sidebar-border/50 border-dashed">
                        <span className="text-lg leading-none mb-0.5">+</span>
                    </div>
                    <span className="text-sm font-medium">Create Organization</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
