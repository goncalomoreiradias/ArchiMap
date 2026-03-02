import { db } from "@/lib/db";

export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "CREATE_USER"
    | "DELETE_USER"
    | "CREATE_PROJECT"
    | "UPDATE_PROJECT"
    | "DELETE_PROJECT"
    | "VIEW_PROJECT"
    | "EXPORT_DATA"
    | "IMPORT_DATA";

export async function logActivity(
    userId: string,
    action: AuditAction,
    resource: string,
    details?: string
) {
    try {
        await db.activityLog.create({
            data: {
                userId,
                action,
                resource, // Generic resource ID or name
                details,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw, logging failure shouldn't break the app
    }
}
