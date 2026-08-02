import { Skeleton } from "@/components/ui";

export default function ProductLoading() {
  return (
    <div className="py-8">
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <Skeleton className="aspect-square w-full" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-16 w-16" />
            <Skeleton className="h-16 w-16" />
            <Skeleton className="h-16 w-16" />
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-11 w-full max-w-sm" />
          <Skeleton className="h-11 w-full max-w-xs" />
          <Skeleton className="h-12 w-56" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
