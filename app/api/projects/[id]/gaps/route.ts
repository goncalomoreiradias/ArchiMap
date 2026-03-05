
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireEditor } from '@/lib/auth-utils';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const gaps = await db.gap.findMany({
            where: { projectId: id },
            include: {
                phases: {
                    orderBy: { startDate: 'asc' }
                },
                changes: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(gaps);
    } catch (error) {
        console.error("Error fetching gaps:", error);
        return NextResponse.json({ error: "Failed to fetch gaps" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Auth check
        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const body = await request.json();
        const { title, description, startDate, endDate, metadata } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const gap = await db.gap.create({
            data: {
                projectId: id,
                title,
                description,
                status: "Identified",
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            }
        });

        return NextResponse.json(gap);

    } catch (error) {
        console.error("Error creating gap:", error);
        return NextResponse.json({ error: "Failed to create gap" }, { status: 500 });
    }
}
