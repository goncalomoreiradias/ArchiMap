"use client"

import { UserProvider } from "@/contexts/UserContext";

import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { useEffect, useState } from "react";

export function AppShell({ children, userRole }: { children: React.ReactNode, userRole: string }) {
    const { isSidebarCollapsed } = useUIStore();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                    <Sidebar userRole={userRole} />
                </div>
                <main className="md:pl-72 h-full bg-slate-50 dark:bg-slate-900">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="h-full relative">
            <div className={cn("hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300",
                isSidebarCollapsed ? "w-20" : "w-72")}>
                <Sidebar userRole={userRole} />
            </div>
            <main className={cn("h-full bg-slate-50 dark:bg-slate-900 transition-all duration-300",
                isSidebarCollapsed ? "md:pl-20" : "md:pl-72")}>
                <UserProvider role={userRole}>
                    {children}
                </UserProvider>
            </main>
        </div>
    )
}
