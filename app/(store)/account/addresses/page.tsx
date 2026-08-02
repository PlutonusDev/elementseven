import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { AddressBook } from "@/components/store/address-book";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await requireUser("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });

  return (
    <div className="mx-auto max-w-2xl py-10">
      <Link href="/account" className="text-[13px] text-slate hover:text-ink">
        ← Back to account
      </Link>
      <h1 className="mt-4 font-display text-3xl font-black tracking-tight">Addresses</h1>
      <div className="mt-8">
        <AddressBook
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            fullName: a.fullName,
            line1: a.line1,
            line2: a.line2,
            suburb: a.suburb,
            state: a.state,
            postcode: a.postcode,
            phone: a.phone,
            isDefault: a.isDefault,
          }))}
        />
      </div>
    </div>
  );
}
