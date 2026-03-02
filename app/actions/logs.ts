"use server"

import { db } from "@/lib/db"

export type LogFilter = {
    userId?: string
    action?: string
    role?: string
    startDate?: Date | string
    endDate?: Date | string
}

export async function getFilteredLogs(filters: LogFilter) {
    try {
        const whereClause: any = {}

        if (filters.userId && filters.userId !== "ALL") {
            whereClause.userId = filters.userId
        }

        if (filters.action && filters.action !== "ALL") {
            whereClause.action = filters.action
        }

        if (filters.role && filters.role !== "ALL") {
            whereClause.user = {
                role: filters.role
            }
        }

        if (filters.startDate || filters.endDate) {
            whereClause.timestamp = (whereClause.timestamp || {})
            if (filters.startDate) {
                const start = new Date(filters.startDate)
                start.setHours(0, 0, 0, 0)
                whereClause.timestamp.gte = start
            }
            if (filters.endDate) {
                const end = new Date(filters.endDate)
                end.setHours(23, 59, 59, 999)
                whereClause.timestamp.lte = end
            }
        }

        const logs = await db.activityLog.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            }
        })

        return { success: true, logs }
    } catch (error) {
        console.error("Failed to fetch logs:", error)
        return { success: false, error: "Failed to fetch logs" }
    }
}
