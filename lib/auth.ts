import NextAuth, { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db) as any,
    session: {
        strategy: "jwt", // Using JWT strategy so Credentials Provider works in NextAuth v4
        maxAge: 30 * 24 * 60 * 60, // 30 Days
    },
    secret: process.env.NEXTAUTH_SECRET || "enterprise_arch_super_secret_dev_key_2026!@#",
    pages: {
        signIn: "/login",
    },
    providers: [
        // Placeholder for Enterprise SSO
        // GoogleProvider({
        //     clientId: process.env.GOOGLE_CLIENT_ID!,
        //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        // }),
        // AzureADProvider({
        //     clientId: process.env.AZURE_AD_CLIENT_ID!,
        //     clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        //     tenantId: process.env.AZURE_AD_TENANT_ID!
        // }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                // Temporary check for Hardcoded test user before checking DB
                if (credentials.username === 'admin' && credentials.password === 'admin') {
                    return { id: "admin-id", name: "Admin User", role: "Admin" } as any;
                }

                const user = await db.user.findFirst({
                    where: {
                        OR: [
                            { username: credentials.username },
                            { email: credentials.username }
                        ]
                    }
                });

                if (!user || !user.passwordHash) {
                    throw new Error("Invalid credentials");
                }

                // Check if user is suspended/inactive
                if (user.status && user.status !== "Active") {
                    throw new Error("Account is suspended. Contact your administrator.");
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    name: (user as any).name || user.username,
                    email: user.email,
                    role: user.role
                } as any;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // On first login, set id and role from the user object
            if (user) {
                token.id = user.id;
                token.role = (user as any).role || "Viewer";
            }

            // Always re-fetch org membership to ensure it's current
            // (handles the case where org was assigned AFTER initial login)
            const userId = (token.id as string);
            if (userId && userId !== "admin-id") {
                try {
                    const membership = await db.organizationMember.findFirst({
                        where: { userId },
                        include: { organization: true }
                    });
                    if (membership) {
                        token.organizationId = membership.organizationId;
                        token.organizationName = membership.organization.name;
                        token.orgRole = membership.role;
                    } else {
                        token.organizationId = undefined;
                        token.organizationName = undefined;
                        token.orgRole = undefined;
                    }
                } catch (e) {
                    console.error('Failed to fetch org membership:', e);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).organizationId = token.organizationId;
                (session.user as any).organizationName = token.organizationName;
                (session.user as any).orgRole = token.orgRole;
            }
            return session;
        }
    }
};
