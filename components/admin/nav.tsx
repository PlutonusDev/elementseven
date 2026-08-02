"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, ElementTile } from "@/components/ui";

const ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/access", label: "Access" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/campaigns", label: "Campaigns" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-4">
        <ElementTile symbol="E7" index={7} size="sm" tone="nitro" />
        <span className="font-display text-sm font-bold text-paper">Admin</span>
      </Link>

      <nav aria-label="Admin" className="flex flex-1 flex-row gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "px-3 py-2 text-[13px] whitespace-nowrap transition-colors",
                active
                  ? "bg-paper/10 font-medium text-paper"
                  : "text-paper/60 hover:bg-paper/5 hover:text-paper",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="hidden border-t border-paper/10 px-4 py-3 text-[13px] text-paper/60 transition-colors hover:text-paper lg:block"
      >
        ← Storefront
      </Link>
    </div>
  );
}
