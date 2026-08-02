import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head>
<body style="font-family:Helvetica,Arial,sans-serif;background:#f7f7f5;color:#17191c;display:grid;place-items:center;min-height:100vh;margin:0;">
  <div style="max-width:420px;padding:40px;background:#fff;border:1px solid #e5e6e2;text-align:center;">
    <div style="display:inline-block;border:2px solid #17191c;width:40px;height:40px;line-height:38px;font-weight:700;margin-bottom:16px;">E7</div>
    <h1 style="font-size:18px;margin:0 0 8px 0;">${title}</h1>
    <p style="font-size:14px;color:#5f6570;line-height:1.6;margin:0;">${body}</p>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return page("Invalid link", "This unsubscribe link is invalid or has been tampered with.");
  }

  const updated = await prisma.user
    .update({ where: { id: userId }, data: { marketingOptIn: false } })
    .catch(() => null);

  if (!updated) {
    return page("Account not found", "We couldn't find an account for this unsubscribe link.");
  }

  return page(
    "You're unsubscribed",
    "You won't receive any more marketing emails from Element Seven. Order and account emails will still be sent.",
  );
}
