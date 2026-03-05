import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export type Role = "Admin" | "Architect" | "Viewer";

export async function getSession() {
    return await getServerSession(authOptions);
}

export async function requireAuth() {
    const session = await getSession();
    if (!session?.user) {
        return { error: "Unauthorized", status: 401 };
    }
    const user = session.user as any;
    return {
        session,
        organizationId: user.organizationId as string | undefined
    };
}

export async function requireRole(allowedRoles: Role[]) {
    const session = await getSession();

    if (!session?.user) {
        return { error: "Unauthorized", status: 401 };
    }

    const user = session.user as any;
    const userRole = user.role || "Viewer";

    if (!allowedRoles.includes(userRole as Role)) {
        return { error: "Forbidden", status: 403 };
    }

    return {
        session,
        userRole,
        organizationId: user.organizationId as string | undefined
    };
}

// Shorthand for typical write operations
export async function requireEditor() {
    return requireRole(["Admin", "Architect"]);
}

// Shorthand for Admin only operations
export async function requireAdmin() {
    return requireRole(["Admin"]);
}
