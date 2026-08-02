const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatCents(cents: number): string {
  return aud.format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return dateFmt.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return dateTimeFmt.format(new Date(date));
}

export function dollarsToCents(value: string | number): number {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}
