import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

/**
 * Content-area skeleton matching the shape of every CRM module page.
 *
 * Rendered in two distinct situations:
 *  - `(dashboard)/loading.tsx`, while a route transition is in flight (cold
 *    compile in dev, or a slow server render).
 *  - by pages themselves once their data request passes the slow threshold,
 *    via `useDelayedLoading`.
 *
 * It fills only the content area; the sidebar and header come from the
 * persistent `(dashboard)/layout.tsx`, so a click reads as an immediate
 * redirect rather than a frozen old screen.
 */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)} role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Page heading + primary action */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3.5 w-80" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Filters / toolbar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Content table */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
        <div className="flex gap-4 border-b border-stone-200 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b border-stone-100 pb-3 last:border-0">
            {Array.from({ length: 6 }).map((_, c) => (
              <Skeleton key={c} className={cn("h-3.5", c === 0 ? "flex-[1.5]" : "flex-1")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PageSkeleton;
