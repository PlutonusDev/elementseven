import type { Metadata } from "next";
import { headers } from "next/headers";
import { confirmAgeAction } from "@/lib/actions/age";
import { ElementTile } from "@/components/ui";

export const metadata: Metadata = {
  title: "Age verification",
  robots: { index: false },
};

export default async function AgeGatePage() {
  const h = await headers();
  const next = h.get("x-age-gate-return") ?? "/";

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-10">
      <div aria-hidden="true" className="dot-grid absolute inset-0 opacity-[0.08]" />
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rotate-12 bg-amber/20"
        style={{ clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/3 translate-y-1/4 bg-nitro/20"
        style={{ clipPath: "polygon(0% 0%, 100% 20%, 100% 100%, 0% 80%)" }}
      />

      <div className="relative w-full max-w-md border-2 border-ink bg-paper p-8 shadow-[8px_8px_0_0_var(--color-amber)] sm:p-10">
        <div className="flex items-center gap-3">
          <ElementTile symbol="E7" index={7} size="lg" tone="nitro" />
          <div>
            <p className="font-display text-lg leading-tight font-bold">Element Seven</p>
            <p className="text-[13px] text-slate">Specialist vape retailer</p>
          </div>
        </div>

        <h1 className="mt-8 font-display text-2xl font-black">
          This store sells <span className="text-outline-sm text-amber">nicotine</span> products.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          You must be 18 or older to enter. By continuing you confirm your age and understand that
          nicotine is a highly addictive substance.
        </p>

        <form action={confirmAgeAction} className="mt-8">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full border-2 border-ink bg-ink px-5 py-3.5 font-medium text-paper shadow-[3px_3px_0_0_var(--color-amber)] transition-all hover:-translate-y-0.5 hover:bg-nitro hover:shadow-[4px_4px_0_0_var(--color-amber)]"
          >
            I am 18 or older
          </button>
        </form>
        <a
          href="https://www.quit.org.au"
          className="mt-3 block w-full border border-mist px-5 py-3 text-center text-sm text-slate transition-colors hover:border-slate hover:text-ink"
        >
          I&apos;m under 18
        </a>

        <p className="mt-8 border-t border-mist pt-4 text-[11px] leading-relaxed text-slate">
          WARNING: This product contains nicotine. Nicotine is an addictive chemical. Keep out of
          reach of children and pets.
        </p>
      </div>
    </main>
  );
}
