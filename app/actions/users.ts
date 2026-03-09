"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcryptjs from "bcryptjs"

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
            passwordHash = await bcryptjs.hash(data.password || "123456", 10)
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

        // Create organization membership if ID is provided
        if (data.organizationId) {
            await db.organizationMember.create({
                data: {
                    userId: newUser.id,
                    organizationId: data.organizationId,
                    role: data.role === 'Admin' ? 'ADMIN' : 'MEMBER'
                }
            })
        }

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
                updateData.passwordHash = await bcryptjs.hash(data.password, 10)
            } catch (e) {
                console.error("Hashing failed", e)
            }
        }

        const updatedUser = await db.user.update({
            where: { id: userId },
            data: updateData
        })

        // Update organization membership
        if (data.organizationId) {
            // Upsert: Try to update first, if not exists, create
            const existingMember = await db.organizationMember.findFirst({
                where: { userId }
            })

            if (existingMember) {
                if (existingMember.organizationId !== data.organizationId) {
                    await db.organizationMember.update({
                        where: { id: existingMember.id },
                        data: {
                            organizationId: data.organizationId,
                            role: data.role === 'Admin' ? 'ADMIN' : 'MEMBER'
                        }
                    })
                } else {
                    // Just update the role if org is same
                    await db.organizationMember.update({
                        where: { id: existingMember.id },
                        data: {
                            role: data.role === 'Admin' ? 'ADMIN' : 'MEMBER'
                        }
                    })
                }
            } else {
                await db.organizationMember.create({
                    data: {
                        userId,
                        organizationId: data.organizationId,
                        role: data.role === 'Admin' ? 'ADMIN' : 'MEMBER'
                    }
                })
            }
        }

        revalidatePath("/users")
        return { success: true, user: updatedUser }
    } catch (error) {
        console.error("Update User Error:", error)
        return { success: false, message: `Failed to update user: ${error instanceof Error ? error.message : String(error)}` }
    }
}
