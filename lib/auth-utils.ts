import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { db } from "./db";

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
