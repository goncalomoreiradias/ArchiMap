import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        let organizationId = authResult.organizationId;
        const keyId = params.id;

        // Fallback for hardcoded admin users without explicit DB membership
        if (!organizationId) {
            const defaultOrg = await db.organization.findFirst({ orderBy: { createdAt: 'asc' } });
            if (defaultOrg) organizationId = defaultOrg.id;
            else return NextResponse.json({ error: "No organization context found" }, { status: 400 });
        }

        // Ensure the key belongs to the current organization before deleting
        const keyToDelete = await db.apiKey.findUnique({
            where: { id: keyId }
        });

        if (!keyToDelete || keyToDelete.organizationId !== organizationId) {
            return NextResponse.json({ error: "Key not found or unauthorized" }, { status: 404 });
        }

        await db.apiKey.delete({
            where: { id: keyId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting API key:', error);
        return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
    }
}
