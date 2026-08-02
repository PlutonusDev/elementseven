"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, magicLinkAction } from "@/lib/actions/auth";
import { Alert, cx, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ next, notice }: { next: string | null; notice: string | null }) {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [passwordState, passwordFormAction] = useActionState(loginAction, null);
  const [magicState, magicFormAction] = useActionState(magicLinkAction, null);

  const tab = (active: boolean) =>
    cx(
      "flex-1 border-b-2 px-2 pb-2.5 text-sm font-medium transition-colors",
      active ? "border-nitro text-ink" : "border-mist text-slate hover:text-ink",
    );

  return (
    <div className="border border-mist bg-white p-6 sm:p-8">
      <h1 className="font-display text-xl font-bold">Sign in</h1>

      {notice && (
        <Alert tone="success" className="mt-4">
          {notice}
        </Alert>
      )}

      <div role="tablist" aria-label="Sign-in method" className="mt-5 flex">
        <button
          role="tab"
          aria-selected={mode === "password"}
          onClick={() => setMode("password")}
          className={tab(mode === "password")}
          type="button"
        >
          Password
        </button>
        <button
          role="tab"
          aria-selected={mode === "magic"}
          onClick={() => setMode("magic")}
          className={tab(mode === "magic")}
          type="button"
        >
          Magic link
        </button>
      </div>

      {mode === "password" ? (
        <form action={passwordFormAction} className="mt-6 space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="login-password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-slate underline underline-offset-2 hover:text-ink"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {passwordState?.message && <Alert tone="error">{passwordState.message}</Alert>}
          <SubmitButton className="w-full" pendingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>
      ) : (
        <form action={magicFormAction} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="magic-email">Email</Label>
            <Input id="magic-email" name="email" type="email" autoComplete="email" required />
            <p className="mt-1.5 text-xs text-slate">
              We&apos;ll email you a one-time sign-in link. No password needed.
            </p>
          </div>
          {magicState?.message && <Alert tone="error">{magicState.message}</Alert>}
          <SubmitButton className="w-full" pendingText="Sending link…">
            Email me a link
          </SubmitButton>
        </form>
      )}

      <p className="mt-6 border-t border-mist pt-4 text-center text-sm text-slate">
        New here?{" "}
        <Link href="/register" className="font-medium text-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
