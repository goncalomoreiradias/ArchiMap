import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-utils';
// @ts-ignore
import crypto from 'crypto';

export async function GET() {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        let organizationId = authResult.organizationId;

        // Fallback for hardcoded admin users without explicit DB membership
        if (!organizationId) {
            const defaultOrg = await db.organization.findFirst({ orderBy: { createdAt: 'asc' } });
            if (defaultOrg) organizationId = defaultOrg.id;
            else return NextResponse.json({ error: "No organization context found" }, { status: 400 });
        }

        const keys = await db.apiKey.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });

        // DO NOT RETURN THE FULL KEY IN GET RESPONSES
        // Only return the first few and last few characters for identification
        const safeKeys = keys.map(k => {
            const displayKey = k.key.length > 15
                ? `${k.key.substring(0, 12)}...${k.key.substring(k.key.length - 4)}`
                : 'Hidden';

            return {
                id: k.id,
                name: k.name,
                displayKey: displayKey,
                createdAt: k.createdAt,
                lastUsedAt: k.lastUsedAt
            };
        });

        return NextResponse.json(safeKeys);
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authResult = await requireAdmin();
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        let organizationId = authResult.organizationId;

        // Fallback for hardcoded admin users without explicit DB membership
        if (!organizationId) {
            const defaultOrg = await db.organization.findFirst({ orderBy: { createdAt: 'asc' } });
            if (defaultOrg) organizationId = defaultOrg.id;
            else return NextResponse.json({ error: "No organization context found" }, { status: 400 });
        }

        const body = await request.json();
        if (!body.name || body.name.trim().length === 0) {
            return NextResponse.json({ error: "Key name is required" }, { status: 400 });
        }

        // Generate a secure random API Key
        // format: archimap_sk_[32 hex chars]
        const rawSecret = crypto.randomBytes(32).toString('hex');
        const apiKeyString = `archimap_sk_${rawSecret}`;

        const newKey = await db.apiKey.create({
            data: {
                name: body.name.trim(),
                key: apiKeyString,
                organizationId
            }
        });

        // The ONLY time the raw key is returned is right after creation.
        // The frontend must display it once and then lose it.
        return NextResponse.json({
            id: newKey.id,
            name: newKey.name,
            rawKey: apiKeyString, // NEVER RETURNED AGAIN!
            createdAt: newKey.createdAt
        });

    } catch (error) {
        console.error('Error creating API key:', error);
        return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }
}
