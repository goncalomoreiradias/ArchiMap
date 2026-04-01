import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrgScope, getSession } from '@/lib/auth-utils';

export async function GET() {
    try {
        const orgFilter = await getOrgScope();
        const session = await getSession();
        const userRole = (session?.user as any)?.role || 'Viewer';
        const userId = (session?.user as any)?.id;

        let extraFilter = {};
        if (userRole === 'Architect' && userId) {
            extraFilter = { userId: userId };
        }

        const logs = await db.activityLog.findMany({
            where: { ...orgFilter, ...extraFilter },
            take: 10,
            orderBy: {
                timestamp: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true
                    }
                }
            }
        });

        // Format logs for display
        const formattedLogs = logs.map(log => ({
            id: log.id,
            user: log.user?.name || log.user?.username || "Unknown Object",
            action: log.action,
            target: log.resource,
            project: log.resource, // Simplification or link to resource names
            timestamp: log.timestamp,
            details: log.details
        }));

        return NextResponse.json(formattedLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
