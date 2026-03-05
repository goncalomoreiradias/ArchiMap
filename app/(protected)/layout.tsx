import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const role = (session.user as any).role || 'Viewer';

    return (
        <AppShell userRole={role}>
            {children}
        </AppShell>
    );
}
