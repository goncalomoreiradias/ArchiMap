"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function getPublicOrganizations() {
    try {
        const orgs = await db.organization.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: 'asc' }
        })
        return { success: true, data: orgs }
    } catch (e) {
        console.error("Fetch orgs error:", e)
        return { success: false, message: "Erro ao carregar organizações." }
    }
}

export async function registerUser(data: any) {
    try {
        const { username, email, password, organizationId } = data
        
        if (!username || !email || !password || !organizationId) {
            return { success: false, message: "Preencha todos os campos obrigatórios." }
        }

        // Check if user exists
        const exists = await db.user.findFirst({
            where: {
                OR: [{ email }, { username }]
            }
        })

        if (exists) {
            return { success: false, message: "Username ou Email já encontram-se registados." }
        }

        // Check if org exists
        const org = await db.organization.findUnique({
            where: { id: organizationId }
        })
        if (!org) {
            return { success: false, message: "Organização inválida." }
        }

        const passwordHash = await bcrypt.hash(password, 10)

        // Transaction to ensure atomicity
        await db.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    username,
                    email,
                    passwordHash,
                    role: "Viewer",      // base minimum role
                    status: "Pending"    // Marked for admin approval
                }
            })

            // Attach user to the requested organization for visibility
            await tx.organizationMember.create({
                data: {
                    userId: newUser.id,
                    organizationId: org.id,
                    role: "MEMBER" // Basic logical role inside org
                }
            })
        })

        return { success: true, message: "Conta registada! Encontra-se pendente de aprovação por um Administrador." }

    } catch (error: any) {
        console.error("Register Error:", error)
        return { success: false, message: "Ocorreu um erro interno no registo." }
    }
}
