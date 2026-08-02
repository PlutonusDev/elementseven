import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-snap will-change-transform disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0";

const buttonVariants = {
  primary:
    "btn-shine bg-ink text-paper shadow-[3px_3px_0_0_var(--color-amber)] hover:-translate-y-0.5 hover:bg-nitro hover:shadow-[5px_5px_0_0_var(--color-amber)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-amber)] active:duration-75",
  secondary:
    "border-2 border-ink text-ink hover:-translate-y-0.5 hover:border-nitro hover:text-nitro hover:shadow-[3px_3px_0_0_var(--color-nitro)] active:translate-y-0 active:shadow-none active:duration-75",
  ghost: "text-slate hover:text-ink",
  danger:
    "btn-shine bg-alert text-paper hover:-translate-y-0.5 hover:bg-ink hover:shadow-[3px_3px_0_0_var(--color-alert)] active:translate-y-0 active:shadow-none active:duration-75",
  amber:
    "btn-shine bg-amber text-ink shadow-[3px_3px_0_0_var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--color-ink)] active:translate-y-0.5 active:shadow-[1px_1px_0_0_var(--color-ink)] active:duration-75",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

const fieldBase =
  "w-full border border-mist bg-white px-3 py-2 text-sm text-ink placeholder:text-slate/60 hover:border-slate focus:border-ink";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldBase, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldBase, "appearance-none pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldBase, "min-h-24", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cx("mb-1.5 block text-[13px] font-medium text-ink", className)}
      {...props}
    />
  );
}

const badgeTones = {
  neutral: "border-mist bg-white text-slate",
  ink: "border-ink bg-ink text-paper",
  accent: "border-nitro bg-nitro/8 text-nitro",
  alert: "border-alert/40 bg-alert/8 text-alert",
  outline: "border-ink bg-transparent text-ink",
  amber: "border-ink bg-amber text-ink",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton", className)} aria-hidden="true" />;
}

const tileSizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

export function ElementTile({
  symbol,
  index,
  size = "md",
  tone = "paper",
  className,
}: {
  symbol: string;
  index?: number | string;
  size?: keyof typeof tileSizes;
  tone?: "paper" | "ink" | "nitro" | "amber" | "ghost";
  className?: string;
}) {
  const tones = {
    paper: "border-ink bg-paper text-ink",
    ink: "border-ink bg-ink text-paper",
    nitro: "border-nitro bg-nitro text-paper",
    amber: "border-ink bg-amber text-ink",
    ghost: "border-mist bg-transparent text-slate",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center border-2 font-display font-bold",
        tileSizes[size],
        tones[tone],
        className,
      )}
    >
      {index !== undefined && (
        <span className="absolute top-0.5 left-1 text-[8px] leading-none font-normal opacity-70">
          {index}
        </span>
      )}
      {symbol}
    </span>
  );
}

export function EmptyState({
  symbol,
  title,
  body,
  action,
}: {
  symbol: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-mist bg-white px-6 py-16 text-center">
      <ElementTile symbol={symbol} tone="ghost" size="lg" />
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-slate">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Alert({
  tone,
  children,
  className,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    success: "border-ink bg-white text-ink",
    error: "border-alert bg-alert/6 text-alert",
    info: "border-nitro bg-nitro/6 text-ink",
  } as const;
  return (
    <div
      role="status"
      className={cx("animate-rise border px-3 py-2 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}
