import { db } from "@/lib/db"
import { UsersView } from "@/components/UsersView"

export default async function UsersPage() {
    const users = await db.user.findMany()
    const logs = await db.activityLog.findMany({ orderBy: { timestamp: "desc" } })

    // Sort by createdAt desc
    const sortedUsers = [...users].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const serializedUsers = sortedUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        // status: user.status // Status is now in DB
    }))

    const serializedLogs = logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString()
    }))

    return <UsersView users={serializedUsers} logs={serializedLogs} />
}
