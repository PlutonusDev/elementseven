import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/components/ui";

export function AdminCard({ className, ...props }: ComponentProps<"section">) {
  return <section className={cx("border border-mist bg-white", className)} {...props} />;
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-slate">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cx(
        "border-b border-mist px-3 py-2 text-left text-[11px] font-semibold tracking-wider text-slate uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cx("border-b border-mist px-3 py-2 align-middle", className)} {...props} />
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-mist bg-white p-4">
      <p className="text-[11px] font-semibold tracking-wider text-slate uppercase">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate">{hint}</p>}
    </div>
  );
}
