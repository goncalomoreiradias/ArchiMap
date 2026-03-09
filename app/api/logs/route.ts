import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOrgScope } from '@/lib/auth-utils';

export async function GET() {
    try {
        const orgFilter = await getOrgScope();
        const logs = await db.activityLog.findMany({
            where: orgFilter,
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
