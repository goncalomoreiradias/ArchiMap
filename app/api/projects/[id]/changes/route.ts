import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logActivity } from '@/lib/audit-logger';
import { requireEditor } from '@/lib/auth-utils';

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

        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        const userId = (authResult.session.user as any).id;

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
        await logActivity(userId, "UPDATE_PROJECT", resolvedParams.id, `${description} (${operation})`);

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

        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        const userId = (authResult.session.user as any).id;

        await db.projectChange.delete({
            where: { id: changeId }
        });

        await logActivity(userId, "UPDATE_PROJECT", resolvedParams.id, `Reverted change ${changeId}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting change:', error);
        return NextResponse.json(
            { error: 'Failed to delete change' },
            { status: 500 }
        );
    }
}
