import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const project = await db.project.findUnique({
            where: { id: resolvedParams.id }
        });

        if (!project) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        // Delete dependencies first
        await db.projectChange.deleteMany({
            where: { projectId: projectId }
        });

        await db.projectSnapshot.deleteMany({
            where: { projectId: projectId }
        });

        await db.projectVersion.deleteMany({
            where: { projectId: projectId }
        });

        // Delete Project
        await db.project.delete({
            where: { id: projectId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
