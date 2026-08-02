import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/env";

const CLAIM_SETTING_KEY = "adminClaimUsed";

function page(title: string, body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;background:#f7f7f5;color:#17191c;display:grid;place-items:center;min-height:100vh;margin:0;">
  <div style="max-width:440px;padding:40px;background:#fff;border:2px solid #17191c;text-align:center;">
    <h1 style="font-size:18px;margin:0 0 8px 0;">${title}</h1>
    <p style="font-size:14px;color:#5f6570;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function GET(request: Request) {
  const secret = process.env.ADMIN_CLAIM_SECRET;
  if (!secret) {
    return page("Not available", "Admin claim is not enabled on this deployment.", 404);
  }

  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token || !timingSafeEqual(token, secret)) {
    return page("Invalid link", "This admin-claim link is invalid.", 403);
  }

  const session = await auth();
  if (!session?.user?.id) {
    const next = `/api/admin/claim?token=${encodeURIComponent(token)}`;
    return NextResponse.redirect(`${appUrl()}/login?next=${encodeURIComponent(next)}`);
  }

  if (session.user.role === Role.ADMIN) {
    return NextResponse.redirect(`${appUrl()}/admin`);
  }

  // Atomically claim the one-time token: the unique primary key makes a second
  // create fail, so the endpoint can only ever promote one account.
  try {
    await prisma.setting.create({
      data: {
        key: CLAIM_SETTING_KEY,
        value: { usedBy: session.user.id, at: new Date().toISOString() },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return page(
        "Already used",
        "This one-time admin-claim link has already been used and is no longer valid.",
        410,
      );
    }
    throw error;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: Role.ADMIN },
  });

  // The role lives in the JWT, so the user must sign in again to refresh it.
  return page(
    "You're now an admin",
    'Your account has been promoted. Please <a href="/login" style="color:#2e45ff;">sign out and back in</a> to refresh your session, then visit <a href="/admin" style="color:#2e45ff;">the admin panel</a>.',
  );
}
