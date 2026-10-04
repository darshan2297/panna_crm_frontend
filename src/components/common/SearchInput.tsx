"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Canonical search box used across all CRM list pages
 * (Menu, Inventory, Packaging, Orders, Users, Customers, Restock).
 */
export function SearchInput({ value, onChange, placeholder, className, inputClassName }: SearchInputProps) {
  return (
    <div className={cn("relative flex-1 max-w-md", className)}>
      <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-stone-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 placeholder:text-stone-400",
          inputClassName
        )}
      />
    </div>
  );
}
