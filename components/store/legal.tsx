import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl py-12">
      <p className="text-xs font-semibold tracking-widest text-nitro uppercase">Legal</p>
      <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-3 text-[13px] text-slate">Last updated {updated}</p>
      <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink/85 [&_a]:font-medium [&_a]:text-nitro [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h2]:tracking-tight [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2>{heading}</h2>
      {children}
    </section>
  );
}
