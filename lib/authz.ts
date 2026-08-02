import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function dbRole(userId: string): Promise<"CUSTOMER" | "ADMIN" | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

export async function requireUser(nextPath?: string): Promise<Session> {
  const session = await auth();
  const login = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  if (!session?.user?.id) redirect(login);
  const role = await dbRole(session.user.id);
  if (role === null) redirect(login);
  return session;
}

export async function requireAdminPage(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=%2Fadmin");
  const role = await dbRole(session.user.id);
  if (role !== "ADMIN") redirect("/login?next=%2Fadmin");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const role = await dbRole(session.user.id);
  if (role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}
