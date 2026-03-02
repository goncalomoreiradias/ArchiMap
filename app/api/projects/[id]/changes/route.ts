import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/logger';
import { verifyToken } from '@/lib/jwt';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const changes = await db.projectChange.findMany({
            where: { projectId: resolvedParams.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(changes);
    } catch (error) {
        console.error('Error fetching changes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch changes' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await context.params;
        const { operation, componentId, componentType, description, componentName, componentData } = await request.json();

        const token = request.cookies.get("token")?.value;
        const user = token ? verifyToken(token) as any : null;
        const userId = user?.id || 'anonymous';

        const change = await db.projectChange.create({
            data: {
                projectId: resolvedParams.id,
                operation, // Updated field name
                componentId,
                componentType,
                description,
                // Store custom component data for new cards
                componentName: componentName || null,
                componentData: componentData ? JSON.stringify(componentData) : null
            }
        });

        // Audit Log
        if (userId !== 'anonymous') {
            await logActivity(userId, "UPDATE_PROJECT", resolvedParams.id, `${description} (${operation})`);
        }

        return NextResponse.json(change);
    } catch (error) {
        console.error('Error creating change:', error);
        return NextResponse.json(
            { error: 'Failed to create change' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const { searchParams } = new URL(request.url);
        const changeId = searchParams.get('changeId');

        if (!changeId) {
            return NextResponse.json(
                { error: 'changeId is required' },
                { status: 400 }
            );
        }

        const token = request.cookies.get("token")?.value;
        const user = token ? verifyToken(token) as any : null;
        const userId = user?.id || 'anonymous';

        await db.projectChange.delete({
            where: { id: changeId }
        });

        if (userId !== 'anonymous') {
            await logActivity(userId, "UPDATE_PROJECT", resolvedParams.id, `Reverted change ${changeId}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting change:', error);
        return NextResponse.json(
            { error: 'Failed to delete change' },
            { status: 500 }
        );
    }
}
