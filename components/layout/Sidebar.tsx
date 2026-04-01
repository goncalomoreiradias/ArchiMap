"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Network,
  Layers,
  BarChart3,
  FolderOpen,
  Users,
  Upload,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  History,
  ClipboardCheck
} from "lucide-react"

import { useUIStore } from "@/store/useUIStore"
import { motion, AnimatePresence } from "framer-motion"
import { logout } from "@/app/actions/auth"
import { OrganizationSwitcher } from "./OrganizationSwitcher"
import { useSession } from "next-auth/react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Mind Map",
    icon: Network,
    href: "/mind-map",
    color: "text-violet-500",
  },
  {
    label: "Components",
    icon: Layers,
    href: "/components",
    color: "text-pink-500",
  },
  {
    label: "Projects",
    icon: FolderOpen,
    href: "/projects",
    color: "text-blue-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/users",
    color: "text-emerald-500",
  },
  {
    label: "Gap Analysis",
    icon: BarChart3,
    href: "/gap-analysis",
    color: "text-amber-500",
  },
  {
    label: "Approvals",
    icon: ClipboardCheck,
    href: "/approvals",
    color: "text-red-500",
  },
  {
    label: "Import",
    icon: Upload,
    href: "/import",
    color: "text-orange-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings/developer",
    color: "text-slate-400",
  },
]

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()
  const { data: session } = useSession()
  const orgName = (session?.user as any)?.organizationName || "Workspace"

  // RBAC Filtering
  const filteredRoutes = routes.filter(route => {
    if (userRole === 'Admin') return true; // Admin sees all

    // Architect sees everything except Users and Approvals
    if (userRole === 'Architect') {
      return route.label !== 'Users' && route.label !== 'Approvals';
    }

    // Chief Architect sees everything except Users
    if (userRole === 'Chief Architect') {
      return route.label !== 'Users';
    }

    if (userRole === 'Viewer') {
      const allowed = ['Mind Map', 'Components', 'Projects', 'Gap Analysis'];
      return allowed.includes(route.label);
    }

    return false; // No role? No access (or default basic)
  });

  return (
    <div className={cn(
      "h-full flex flex-col py-4 relative z-50 transition-all duration-300 ease-in-out",
      "bg-sidebar border-r border-sidebar-border shadow-xl", // Updated to use semantic variables
      isSidebarCollapsed ? "w-20 items-center" : "w-72"
    )}>

      {/* Brand */}
      <div className={cn("px-4 mb-8 flex items-center h-12", isSidebarCollapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 text-white font-bold text-lg overflow-hidden shrink-0">
            EA
            <div className="absolute inset-0 bg-white/20 blur-sm transform -skew-x-12 translate-x-4" />
          </div>
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sidebar-foreground tracking-tight text-lg">ArchMap</span>
              <span className="text-[10px] text-sidebar-foreground/60 font-medium uppercase tracking-wider truncate max-w-[140px]" title={orgName}>{orgName}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="px-3 mb-6">
        <OrganizationSwitcher />
      </div>

      {/* Routes */}
      <div className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
        {filteredRoutes.map((route) => {
          const isActive = pathname === route.href
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "relative flex items-center p-3 rounded-xl transition-all duration-200 group no-underline",
                isActive
                  ? "text-white font-bold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white",
                isSidebarCollapsed && "justify-center p-3"
              )}
              title={isSidebarCollapsed ? route.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-sidebar-accent shadow-md shadow-indigo-900/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <route.icon className={cn(
                "w-5 h-5 relative z-10 transition-colors duration-200 shrink-0",
                isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-white",
                !isSidebarCollapsed && "mr-3"
              )} />

              {!isSidebarCollapsed && (
                <span className="relative z-10 truncate">{route.label}</span>
              )}

              {!isSidebarCollapsed && isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer / Toggle */}
      <div className="p-3 mt-auto mb-14 border-t border-sidebar-border mx-3 space-y-2">
        <button
          onClick={() => logout()}
          className={cn(
            "w-full flex items-center p-2 rounded-xl transition-all duration-200 group text-red-400 hover:bg-red-500/10 hover:text-red-300",
            isSidebarCollapsed ? "justify-center" : "gap-3"
          )}
          title="Sign Out"
        >
          <LogOut size={20} className="shrink-0" />
          {!isSidebarCollapsed && <span className="font-medium">Sign Out</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200"
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : (
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider w-full justify-center">
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
