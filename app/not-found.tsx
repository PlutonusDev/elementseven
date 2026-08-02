import Link from "next/link";
import { buttonClass, ElementTile } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <ElementTile symbol="404" size="lg" tone="ghost" />
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="text-sm text-slate">
          That page doesn&apos;t exist. It may have been moved or unpublished.
        </p>
        <Link href="/" className={buttonClass("primary")}>
          Back to the store
        </Link>
      </div>
    </main>
  );
}
