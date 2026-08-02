import Link from "next/link";
import { ElementTile } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <ElementTile symbol="E7" index={7} size="sm" />
          <span className="font-display text-[15px] font-bold tracking-tight">Element Seven</span>
        </Link>
        {children}
        <p className="mt-8 text-center text-[11px] text-slate">
          18+ only. Nicotine is an addictive chemical.
        </p>
      </div>
    </div>
  );
}
