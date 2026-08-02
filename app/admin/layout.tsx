import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/authz";
import { AdminNav } from "@/components/admin/nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s - E7 Admin" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="flex min-h-dvh flex-col bg-[#eef0ec] lg:flex-row">
      <aside className="shrink-0 bg-ink lg:w-52">
        <AdminNav />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 text-[13px] sm:px-6">{children}</main>
    </div>
  );
}
