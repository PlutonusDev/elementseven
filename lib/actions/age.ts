"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function confirmAgeAction(formData: FormData): Promise<void> {
  const jar = await cookies();
  jar.set("e7_age", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const next = String(formData.get("next") ?? "/");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}
