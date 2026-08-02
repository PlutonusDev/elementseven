"use server";

import crypto from "crypto";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { appUrl } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { zodMessage, type ActionState } from "./types";

function safeNext(value: unknown): string | null {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : null;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("register", 5, 10 * 60_000))) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { ok: false, message: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
      marketingOptIn: formData.get("marketingOptIn") === "on",
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });
  await mergeGuestCartIntoUser(user.id);
  redirect(safeNext(formData.get("next")) ?? "/request-access");
}

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("login", 10, 60_000))) {
    return { ok: false, message: "Too many attempts. Please wait a minute and try again." };
  }
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Invalid email or password." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) await mergeGuestCartIntoUser(user.id);

  redirect(safeNext(formData.get("next")) ?? "/account");
}

export async function magicLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await rateLimit("magic-link", 5, 10 * 60_000))) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  const next = safeNext(formData.get("next")) ?? "/account";

  try {
    await signIn("magic-link", { email: parsed.data, redirect: false, redirectTo: next });
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
  }
  redirect("/magic-link-sent");
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await rateLimit("forgot-password", 5, 10 * 60_000))) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expires: new Date(Date.now() + 60 * 60_000) },
    });
    const url = `${appUrl()}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(url);
    await sendEmail({ to: user.email, subject, html, logHint: `Password reset link: ${url}` });
  }

  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

const resetSchema = z.object({
  token: z.string().min(10, "This reset link is invalid."),
  password: passwordSchema,
});

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await rateLimit("reset-password", 10, 10 * 60_000))) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, message: zodMessage(parsed.error) };

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!record || record.expires < new Date()) {
    return { ok: false, message: "This reset link has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hash(parsed.data.password, 12) },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  redirect("/login?reset=1");
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/");
}
