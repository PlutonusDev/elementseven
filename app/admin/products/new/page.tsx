import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";

export const metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <div>
      <AdminPageHeader
        title="New product"
        description="Create the product, then add images after the first save."
        actions={
          <Link href="/admin/products" className="text-[13px] text-slate underline underline-offset-2 hover:text-ink">
            ← Products
          </Link>
        }
      />
      <ProductEditor product={null} />
    </div>
  );
}
