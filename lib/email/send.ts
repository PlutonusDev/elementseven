import nodemailer, { type Transporter } from "nodemailer";
import { emailFrom } from "@/lib/env";
import { magicLinkEmail } from "@/lib/email/templates";

let transporter: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    transporter = null;
    return null;
  }

  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  // Implicit TLS (SMTPS) only on 465. Every other port (587, 25) starts in
  // plaintext and upgrades via STARTTLS, using secure:true there triggers the
  // "wrong version number" OpenSSL error. An explicit SMTP_SECURE override wins.
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass },
  });
  return transporter;
}

export type SendResult = { ok: boolean; error?: string };

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  logHint?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) {
    console.log(
      `[email] SMTP not configured, logging instead. to=${input.to} subject="${input.subject}"` +
        (input.logHint ? `\n[email] ${input.logHint}` : ""),
    );
    return { ok: true };
  }
  try {
    await transport.sendMail({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const { subject, html } = magicLinkEmail(url);
  await sendEmail({ to, subject, html, logHint: `Magic link: ${url}` });
}
