import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const versions = await db.projectVersion.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(versions);
    } catch (error) {
        console.error('Error fetching versions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch versions' },
            { status: 500 }
        );
    }
}

// Restore a version to AS-IS
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;
        const { versionId, action } = await request.json();

        if (!versionId) {
            return NextResponse.json({ error: 'versionId required' }, { status: 400 });
        }

        const version = await db.projectVersion.findUnique({
            where: { id: versionId }
        });

        if (!version || version.projectId !== projectId) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 });
        }

        const snapshots = JSON.parse(version.snapshots || '[]');

        if (action === 'restore') {
            // Archive current AS-IS first
            const project = await db.project.findUnique({
                where: { id: projectId },
                include: { asIsSnapshots: true }
            });

            if (project?.asIsSnapshots && project.asIsSnapshots.length > 0) {
                await db.projectVersion.create({
                    data: {
                        projectId,
                        description: `Archived before restore - ${new Date().toLocaleString()}`,
                        snapshots: JSON.stringify(project.asIsSnapshots.map((s: any) => ({
                            componentId: s.catalogComponentId,
                            componentType: s.catalogComponentType,
                            notes: s.notes
                        })))
                    }
                });
            }

            // Delete current AS-IS
            await db.projectSnapshot.deleteMany({
                where: { projectId, snapshotType: 'AS-IS' }
            });

            // Restore from version
            for (const snap of snapshots) {
                await db.projectSnapshot.create({
                    data: {
                        projectId,
                        snapshotType: 'AS-IS',
                        catalogComponentId: snap.componentId,
                        catalogComponentType: snap.componentType,
                        notes: snap.notes || 'Restored from version'
                    }
                });
            }

            // Clear pending changes
            await db.projectChange.deleteMany({
                where: { projectId }
            });

            return NextResponse.json({ success: true, message: 'Version restored' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error restoring version:', error);
        return NextResponse.json(
            { error: 'Failed to restore version' },
            { status: 500 }
        );
    }
}
