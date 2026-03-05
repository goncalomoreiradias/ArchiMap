
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireEditor } from '@/lib/auth-utils';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ gapId: string }> }
) {
    try {
        const { gapId } = await params;
        const phases = await db.gapPhase.findMany({
            where: { gapId },
            orderBy: { startDate: 'asc' }
        });
        return NextResponse.json(phases);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch phases" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ gapId: string }> }
) {
    try {
        const { gapId } = await params;

        // Auth check
        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const body = await request.json();
        const { name, description, startDate, endDate, status } = body;

        const phase = await db.gapPhase.create({
            data: {
                gapId,
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                status: status || "Pending"
            }
        });

        return NextResponse.json(phase);
    } catch (error) {
        console.error("Error creating phase:", error);
        return NextResponse.json({ error: "Failed to create phase" }, { status: 500 });
    }
}
