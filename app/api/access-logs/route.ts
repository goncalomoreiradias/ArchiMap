import { NextResponse } from 'next/server';

export async function GET() {
    // Mock Data for Access Logs
    // In a real app, this would query Prisma.ActivityLog
    const logs = [
        {
            id: '1',
            user: 'admin@emp.com',
            action: 'LOGIN',
            resource: 'System',
            timestamp: new Date().toISOString(),
            status: 'SUCCESS'
        },
        {
            id: '2',
            user: 'architect@emp.com',
            action: 'VIEW_PROJECT',
            resource: 'Digital Transformation',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
            status: 'SUCCESS'
        },
        {
            id: '3',
            user: 'viewer@emp.com',
            action: 'VIEW_CATALOG',
            resource: 'Business Capabilities',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
            status: 'SUCCESS'
        },
        {
            id: '4',
            user: 'admin@emp.com',
            action: 'EXPORT_DATA',
            resource: 'All Components',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            status: 'SUCCESS'
        },
        {
            id: '5',
            user: 'unknown@ip.addr',
            action: 'LOGIN',
            resource: 'System',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            status: 'FAILURE'
        },
    ];

    return NextResponse.json(logs);
}
