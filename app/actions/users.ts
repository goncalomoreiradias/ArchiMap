"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { hashPassword } from "@/lib/auth"

export type UserResult = {
    success: boolean
    message?: string
    user?: any
}

export async function createUser(data: any): Promise<UserResult> {
    try {
        // Basic validation
        if (!data.username || !data.email) {
            return { success: false, message: "Username and Email are required" }
        }

        // Check availability (mock specific unique check)
        const allUsers = await db.user.findMany()
        const existing = allUsers.find((u: any) => u.username === data.username || u.email === data.email)

        if (existing) {
            return { success: false, message: "Username or Email already exists" }
        }

        // Hash password
        let passwordHash = ""
        try {
            passwordHash = await hashPassword(data.password || "123456")
        } catch (e) {
            console.error("Hashing failed", e)
            passwordHash = "HASH_FAILED"
        }

        const newUser = await db.user.create({
            data: {
                username: data.username,
                email: data.email,
                role: data.role || 'Viewer',
                passwordHash: passwordHash
            }
        })

        revalidatePath("/users")
        return { success: true, user: newUser }
    } catch (error) {
        console.error("Create User Error:", error)
        return { success: false, message: "Failed to create user" }
    }
}

export async function deleteUser(userId: string): Promise<UserResult> {
    try {
        await db.user.delete({
            where: { id: userId }
        })
        revalidatePath("/users")
        return { success: true }
    } catch (error) {
        console.error("Delete User Error:", error)
        return { success: false, message: "Failed to delete user" }
    }
}

export async function updateUser(userId: string, data: any): Promise<UserResult> {
    try {
        const updateData: any = {
            username: data.username,
            email: data.email,
            role: data.role,
            status: data.status
        }

        if (data.password) {
            try {
                updateData.passwordHash = await hashPassword(data.password)
            } catch (e) {
                console.error("Hashing failed", e)
            }
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData
        })

        revalidatePath("/users")
        return { success: true, user: updatedUser }
    } catch (error) {
        console.error("Update User Error:", error)
        return { success: false, message: `Failed to update user: ${error instanceof Error ? error.message : String(error)}` }
    }
}
