import { AppShell } from "@/components/layout/AppShell";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    const user = verifyToken(token) as any;

    if (!user) {
        redirect("/login");
    }

    return (
        <AppShell userRole={user.role}>
            {children}
        </AppShell>
    );
}
