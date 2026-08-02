import type { Role } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { emailFrom } from "@/lib/env";
import { sendMagicLinkEmail } from "@/lib/email/send";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/magic-link-sent",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
    Nodemailer({
      id: "magic-link",
      name: "Magic link",
      from: emailFrom(),
      maxAge: 15 * 60,
      server: {
        host: process.env.SMTP_HOST ?? "localhost",
        port: Number.parseInt(process.env.SMTP_PORT ?? "587", 10),
        auth: { user: process.env.SMTP_USER ?? "", pass: process.env.SMTP_PASS ?? "" },
      },
      async sendVerificationRequest({ identifier, url }) {
        await sendMagicLinkEmail(identifier, url);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = String(token.id);
      session.user.role = (token.role as Role | undefined) ?? "CUSTOMER";
      return session;
    },
  },
});
