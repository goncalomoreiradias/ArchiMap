"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/jwt"
import { logActivity } from "@/lib/logger"

export async function logout() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
        const payload = verifyToken(token) as any;
        if (payload?.id) {
            await logActivity(payload.id, "LOGOUT", "System", `User ${payload.username} logged out`);
        }
    }

    cookieStore.delete("token")
    redirect("/login")
}
