
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireEditor } from '@/lib/auth-utils';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ gapId: string }> }
) {
    try {
        const { gapId } = await params;

        // Auth check
        // Auth check
        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        const body = await request.json();
        const { title, description, status } = body;

        const gap = await db.gap.update({
            where: { id: gapId },
            data: {
                title,
                description,
                status
            }
        });

        return NextResponse.json(gap);
    } catch (error) {
        console.error("Error updating gap:", error);
        return NextResponse.json({ error: "Failed to update gap" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ gapId: string }> }
) {
    try {
        const { gapId } = await params;

        // Auth check
        // Auth check
        const authResult = await requireEditor();
        if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

        // Unlink changes first (optional if we want to delete them? No, just unlink)
        // Actually relations set to null if we delete the gap?
        // In schema: gapId String? ... gap Gap? @relation(...)
        // If we delete Gap, changes remain but gapId becomes null?
        // Schema says: `onDelete: Cascade`? No, schema for Change -> Project is Cascade.
        // Schema for Change -> Gap: `gap Gap? ...`
        // I haven't specified onDelete for Change->Gap. 
        // If I delete Gap, and it doesn't have Cascade, it might fail if there are changes.
        // Let's check schema again.

        // In the replace_file_content I wrote:
        // gap Gap? @relation(fields: [gapId], references: [id])
        // No onDelete specified. Default is likely Restrict or SetNull depending on DB, but standard Prisma default acts strict.
        // I should probably manually unlink them to be safe or update schema.
        // I'll manually unlink in transaction.

        await db.$transaction([
            db.projectChange.updateMany({
                where: { gapId: gapId },
                data: { gapId: null }
            }),
            db.gap.delete({
                where: { id: gapId }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting gap:", error);
        return NextResponse.json({ error: "Failed to delete gap" }, { status: 500 });
    }
}
