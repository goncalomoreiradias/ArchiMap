import { db } from "@/lib/db"
import { UsersView } from "@/components/UsersView"
import { getOrgScope } from "@/lib/auth-utils"

export default async function UsersPage() {
    const orgFilter = await getOrgScope()
    const isSuperAdmin = !orgFilter.organizationId // Super Admin has no org filter

    // Super Admin sees all users; org admins see users in their org
    const users = isSuperAdmin
        ? await db.user.findMany({
            include: { memberships: { include: { organization: true } } }
        })
        : await db.user.findMany({
            where: {
                memberships: { some: { organizationId: orgFilter.organizationId } }
            },
            include: { memberships: { include: { organization: true } } }
        })

    const logs = await db.activityLog.findMany({
        where: isSuperAdmin ? {} : orgFilter,
        orderBy: { timestamp: "desc" }
    })

    const organizations = isSuperAdmin
        ? await db.organization.findMany({
            include: { _count: { select: { members: true } } }
        })
        : await db.organization.findMany({
            where: { id: orgFilter.organizationId },
            include: { _count: { select: { members: true } } }
        })

    // Sort by createdAt desc
    const sortedUsers = [...users].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const serializedUsers = sortedUsers.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        organizationName: user.memberships[0]?.organization?.name || "No Organization",
        organizationId: user.memberships[0]?.organizationId || ""
    }))

    const serializedLogs = logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString()
    }))

    return <UsersView users={serializedUsers} logs={serializedLogs} organizations={organizations} />
}
