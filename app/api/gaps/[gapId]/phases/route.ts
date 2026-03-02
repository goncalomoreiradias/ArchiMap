
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

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
        const cookieHeader = request.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const tokenStr = tokenMatch ? tokenMatch[1] : null;

        if (!tokenStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decoded = verifyToken(tokenStr);
        if (!decoded || (typeof decoded !== 'string' && decoded.role === 'Viewer')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
