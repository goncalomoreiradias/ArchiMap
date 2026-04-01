import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { db } from "./db";

export type Role = "Admin" | "Chief Architect" | "Architect" | "Viewer";

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
        userId: user.id as string,
        userRole: user.role as string,
        organizationId: user.organizationId as string | undefined
    };
}

/**
 * Returns a Prisma `where` clause that scopes data to the current user's organization.
 * - Super Admin (hardcoded admin-id): returns {} (sees everything across all orgs)
 * - Org-scoped user: returns { organizationId: "<their-org-id>" }
 * - Authenticated user with no org: returns { id: "impossible" } (sees nothing — safe default)
 * - Unauthenticated: returns { id: "impossible" } (sees nothing)
 */
export async function getOrgScope(): Promise<Record<string, any>> {
    const session = await getSession();

    if (!session?.user) {
        // Not authenticated — return impossible filter
        return { id: "00000000-0000-0000-0000-000000000000" };
    }

    const user = session.user as any;

    // The ONLY user that bypasses org scoping is the hardcoded super admin
    if (user.id === "admin-id") {
        return {};
    }

    // All other users: strictly scope to their organization
    if (user.organizationId) {
        return { organizationId: user.organizationId };
    }

    // User has no organization assigned — return impossible filter (sees nothing)
    // Note: cannot use null here because existing data may have organizationId=null
    return { organizationId: "00000000-0000-0000-0000-000000000000" };
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
    return requireRole(["Admin", "Chief Architect", "Architect"]);
}

// Shorthand for Admin only operations
export async function requireAdmin() {
    return requireRole(["Admin"]);
}

// ----------------------------------------------------
// M2M API Key Validation (For B2B Integrations)
// ----------------------------------------------------
export async function validateApiKey(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: "Missing or invalid Authorization header", status: 401 };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return { error: "Missing token", status: 401 };
    }

    try {
        const apiKey = await db.apiKey.findUnique({
            where: { key: token }
        });

        if (!apiKey) {
            return { error: "Invalid API Key", status: 403 };
        }

        // Update last used timestamp asynchronously (fire and forget)
        db.apiKey.update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() }
        }).catch(err => console.error("Failed to update API key lastUsedAt", err));

        return { organizationId: apiKey.organizationId };
    } catch (e) {
        console.error("API Key validation error:", e);
        return { error: "Internal server error during authentication", status: 500 };
    }
}
