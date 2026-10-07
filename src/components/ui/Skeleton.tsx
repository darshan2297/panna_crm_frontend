import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-stone-200/70",
        className
      )}
    />
  );
}

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 6,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Header row */}
      <div className="flex items-center gap-4 border-b border-stone-200 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className="flex items-center gap-4 border-b border-stone-100 pb-3"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={`c-${r}-${c}`}
              className={cn("h-4", c === 0 ? "flex-[1.5]" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
