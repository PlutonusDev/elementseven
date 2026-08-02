"use client";

import { Button, ElementTile } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <img src="/logo.png" alt="Element Seven Logo" className="h-[100px] mb-6" />
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-slate">
          An unexpected error interrupted that request.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
