import { db } from "./db";

export async function logActivity(userId: string, action: string, resource: string, details?: any) {
    try {
        await db.activityLog.create({
            data: {
                userId,
                action,
                resource,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (e) {
        // Silently fail but log in terminal so it doesn't break main flow
        console.error("Failed to write to ActivityLog:", e);
    }
}
