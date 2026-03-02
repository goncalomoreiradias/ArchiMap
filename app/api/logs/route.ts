import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        const logs = await db.projectChange.findMany({
            take: 10,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                project: {
                    select: {
                        name: true
                    }
                }
            }
        });

        // Format logs for display
        const formattedLogs = logs.map(log => ({
            id: log.id,
            user: "System User", // Placeholder until ActivityLog with User relation is fully used
            action: log.operation,
            target: log.componentName || log.componentId,
            project: log.project.name,
            timestamp: log.createdAt,
            details: log.description
        }));

        return NextResponse.json(formattedLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }
}
