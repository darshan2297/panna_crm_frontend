import React from "react";
import { KPIStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from "lucide-react";

interface KPICardsProps {
  kpis: KPIStats;
  onOpenLowStock: () => void;
}

export function KPICards({ kpis, onOpenLowStock }: KPICardsProps) {
  const zomatoOrders = kpis.platform_orders?.ZOMATO || 0;
  const swiggyOrders = kpis.platform_orders?.SWIGGY || 0;
  const websiteOrders = kpis.platform_orders?.WEBSITE || 0;

  const zomatoPct = kpis.platform_sales_pct?.ZOMATO || 40;
  const swiggyPct = kpis.platform_sales_pct?.SWIGGY || 35;
  const websitePct = kpis.platform_sales_pct?.WEBSITE || 25;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Orders */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Total Orders</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {kpis.total_orders}
          </span>
          <span
            className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
              kpis.orders_growth_pct >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {kpis.orders_growth_pct >= 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {kpis.orders_growth_pct >= 0 ? `+${kpis.orders_growth_pct}%` : `${kpis.orders_growth_pct}%`}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>
            Zomato: <strong className="text-slate-700">{zomatoOrders}</strong>
          </span>
          <span>•</span>
          <span>
            Swiggy: <strong className="text-slate-700">{swiggyOrders}</strong>
          </span>
          <span>•</span>
          <span>
            Website: <strong className="text-slate-700">{websiteOrders}</strong>
          </span>
        </div>
      </div>

      {/* 2. Total Sales / Revenue */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Total Sales</span>
          <div className="w-8 h-8 rounded-lg bg-panna-gold-50 text-panna-gold-700 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
            {formatCurrency(kpis.total_sales)}
          </span>
          <span
            className={`inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded ${
              kpis.sales_growth_pct >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {kpis.sales_growth_pct >= 0 ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {kpis.sales_growth_pct >= 0 ? `+${kpis.sales_growth_pct}%` : `${kpis.sales_growth_pct}%`}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>
            Zomato: <strong className="text-slate-700">{zomatoPct}%</strong>
          </span>
          <span>•</span>
          <span>
            Swiggy: <strong className="text-slate-700">{swiggyPct}%</strong>
          </span>
          <span>•</span>
          <span>
            Website: <strong className="text-slate-700">{websitePct}%</strong>
          </span>
        </div>
      </div>

      {/* 3. Low Stock Items */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Low Stock Items</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-amber-600 tracking-tight font-sans">
            {kpis.low_stock_count}
          </span>
          <span className="text-xs text-slate-400 font-medium">Needs Attention</span>
        </div>

        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
          <button
            onClick={onOpenLowStock}
            className="text-xs font-semibold text-panna-green-700 hover:text-panna-green-900 inline-flex items-center gap-1 transition-colors"
          >
            <span>View Stock Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Pending / Preparing Orders */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Active Kitchen Load</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl font-extrabold text-panna-green-900 tracking-tight font-sans">
            {kpis.pending_orders + kpis.preparing_orders}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {kpis.preparing_orders} In Prep • {kpis.pending_orders} Confirmed
          </span>
        </div>

        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Delivered Today: <strong className="text-emerald-700">{kpis.delivered_orders}</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            Cancelled: {kpis.cancelled_orders}
          </span>
        </div>
      </div>
    </div>
  );
}
