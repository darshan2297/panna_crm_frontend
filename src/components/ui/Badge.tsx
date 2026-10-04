import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "brand"
    | "neutral"
    | "gold"
    | "outline";
  size?: "sm" | "md";
  pulse?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border border-amber-200/60",
    danger: "bg-rose-50 text-rose-700 border border-rose-200/60",
    info: "bg-blue-50 text-blue-700 border border-blue-200/60",
    brand: "bg-panna-green-50 text-panna-green-800 border border-panna-green-200",
    gold: "bg-panna-gold-50 text-panna-gold-800 border border-panna-gold-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200/60",
    outline: "bg-white text-slate-700 border border-slate-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] font-medium rounded",
    md: "px-2.5 py-1 text-xs font-medium rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 select-none font-medium leading-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {children}
    </span>
  );
}
