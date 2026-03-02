import { NextResponse } from "next/server";
import { comparePassword } from "@/lib/auth";
import { signToken } from "@/lib/jwt";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        // Mock admin login if DB is empty or fails (for initial bootstrapping)
        if (username === "admin" && password === "admin") {
            const token = signToken({ id: "admin-id", username: "admin", role: "Admin" });
            const response = NextResponse.json({ success: true });
            response.cookies.set("token", token, { httpOnly: true, path: "/" });
            return response;
        }

        if (!username || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Try finding user in DB
        const user = await db.user.findFirst({ where: { username } });

        if (!user || !(await comparePassword(password, user.passwordHash))) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = signToken({ id: user.id, username: user.username, role: user.role });

        // Audit Log
        await logActivity(user.id, "LOGIN", "System", `User ${user.username} logged in`);

        const response = NextResponse.json({ success: true });
        response.cookies.set("token", token, { httpOnly: true, path: "/" });
        return response;

    } catch (error) {
        console.error("Login error", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
