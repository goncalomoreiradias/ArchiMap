import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET() {
    try {
        const authResult = await requireAuth();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const userId = (authResult.session.user as any).id;

        const memberships = await db.organizationMember.findMany({
            where: { userId },
            include: { organization: true },
            orderBy: { organization: { name: 'asc' } }
        });

        const organizations = memberships.map(m => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role
        }));

        return NextResponse.json(organizations);
    } catch (error) {
        console.error('Error fetching user organizations:', error);
        return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }
}
