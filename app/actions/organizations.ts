"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export type OrgResult = {
    success: boolean
    message?: string
    organization?: any
}

export async function createOrganization(data: { name: string; slug: string }): Promise<OrgResult> {
    try {
        if (!data.name || !data.slug) {
            return { success: false, message: "Name and Slug are required" }
        }

        // Normalize slug
        const slug = data.slug
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")

        // Check uniqueness
        const existing = await db.organization.findUnique({ where: { slug } })
        if (existing) {
            return { success: false, message: "An organization with this slug already exists" }
        }

        const org = await db.organization.create({
            data: {
                name: data.name,
                slug
            }
        })

        revalidatePath("/users")
        return { success: true, organization: org }
    } catch (error) {
        console.error("Create Organization Error:", error)
        return { success: false, message: `Failed to create organization: ${error instanceof Error ? error.message : String(error)}` }
    }
}

export async function deleteOrganization(orgId: string): Promise<OrgResult> {
    try {
        // Check how many members it has
        const memberCount = await db.organizationMember.count({
            where: { organizationId: orgId }
        })

        if (memberCount > 0) {
            return { success: false, message: `Cannot delete: This organization still has ${memberCount} member(s). Remove them first.` }
        }

        await db.organization.delete({
            where: { id: orgId }
        })

        revalidatePath("/users")
        return { success: true }
    } catch (error) {
        console.error("Delete Organization Error:", error)
        return { success: false, message: "Failed to delete organization" }
    }
}
