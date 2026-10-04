"use client";

import React from "react";
import { LayoutGrid, List as ListIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

/**
 * Canonical segmented grid/table view toggle used across Menu, Inventory,
 * Packaging and any other list/grid catalog page.
 */
export function ViewModeToggle({ viewMode, onChange, className }: ViewModeToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center border border-stone-200 rounded-xl p-1 bg-stone-50/50",
        className
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-lg transition-all",
          viewMode === "grid"
            ? "bg-emerald-950 text-white shadow-sm"
            : "text-stone-400 hover:text-stone-700"
        )}
        title="Grid View"
        aria-pressed={viewMode === "grid"}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "p-1.5 rounded-lg transition-all",
          viewMode === "table"
            ? "bg-emerald-950 text-white shadow-sm"
            : "text-stone-400 hover:text-stone-700"
        )}
        title="Table View"
        aria-pressed={viewMode === "table"}
      >
        <ListIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
