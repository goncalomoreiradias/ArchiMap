
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

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
        const token = (await request.headers.get('cookie'))?.split('token=')[1]?.split(';')[0];
        // Easier way to get cookie from request usually involves helpers but this works for raw string
        // Better: use next/headers cookies() or request.cookies
        // But request is standard Request, so:
        // const cookieStore = cookies(); const token = cookieStore.get('token'); 
        // We will use request.cookies for NextRequest if we cast it, or parse header.
        // Let's assume standard NextRequest pattern if possible, but the signature above is Request.
        // Let's use standard parse:

        // Actually, let's use the helper if I can, but I'll stick to a simple check for now.
        // For MVP speed, I will rely on the UI hiding buttons, but I SHOULD implement this.

        // let's try to get it safely
        const cookieHeader = request.headers.get('cookie') || '';
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        const tokenStr = tokenMatch ? tokenMatch[1] : null;

        if (!tokenStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = verifyToken(tokenStr);
        if (!decoded || (typeof decoded !== 'string' && decoded.role === 'Viewer')) {
            return NextResponse.json({ error: "Forbidden: Viewers cannot create gaps" }, { status: 403 });
        }

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
