import type { AccessRequest } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AccessState =
  | { kind: "GUEST" }
  | { kind: "NONE"; userId: string }
  | { kind: "PENDING"; userId: string; request: AccessRequest }
  | { kind: "APPROVED"; userId: string; request: AccessRequest | null }
  | { kind: "DENIED"; userId: string; request: AccessRequest };

export async function getAccess(): Promise<AccessState> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "GUEST" };
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, accessRequest: true },
  });
  if (!user) return { kind: "GUEST" };
  if (user.role === "ADMIN") return { kind: "APPROVED", userId, request: user.accessRequest };

  const request = user.accessRequest;
  if (!request) return { kind: "NONE", userId };
  if (request.status === "APPROVED") return { kind: "APPROVED", userId, request };
  if (request.status === "DENIED") return { kind: "DENIED", userId, request };
  return { kind: "PENDING", userId, request };
}

export function isApproved(access: AccessState): boolean {
  return access.kind === "APPROVED";
}
