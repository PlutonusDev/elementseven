import { ProductCardSkeleton } from "@/components/store/product-card";
import { Skeleton } from "@/components/ui";

export default function CatalogLoading() {
  return (
    <div className="grid gap-10 py-10 lg:grid-cols-[220px_1fr]">
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
