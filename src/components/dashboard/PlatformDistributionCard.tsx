import React from "react";
import { KPIStats } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";

interface PlatformDistributionCardProps {
  kpis: KPIStats;
}

export function PlatformDistributionCard({ kpis }: PlatformDistributionCardProps) {
  const zomatoPct = kpis.platform_sales_pct?.ZOMATO ?? 0;
  const swiggyPct = kpis.platform_sales_pct?.SWIGGY ?? 0;
  const websitePct = kpis.platform_sales_pct?.WEBSITE ?? 0;

  const zomatoSales = kpis.platform_sales?.ZOMATO || 0;
  const swiggySales = kpis.platform_sales?.SWIGGY || 0;
  const websiteSales = kpis.platform_sales?.WEBSITE || 0;

  const zomatoOrders = kpis.platform_orders?.ZOMATO || 0;
  const swiggyOrders = kpis.platform_orders?.SWIGGY || 0;
  const websiteOrders = kpis.platform_orders?.WEBSITE || 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Platform Share</CardTitle>
          <CardDescription>Order & revenue split by delivery channel</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Donut Chart Visual */}
        <div className="flex items-center justify-center pt-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="3.8"
              />
              {/* Zomato arc (Amber) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="3.8"
                strokeDasharray={`${zomatoPct} ${100 - zomatoPct}`}
                strokeDashoffset="0"
                className="transition-all duration-500"
              />
              {/* Swiggy arc (Orange) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#ea580c"
                strokeWidth="3.8"
                strokeDasharray={`${swiggyPct} ${100 - swiggyPct}`}
                strokeDashoffset={`-${zomatoPct}`}
                className="transition-all duration-500"
              />
              {/* Website arc (Emerald) */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="3.8"
                strokeDasharray={`${websitePct} ${100 - websitePct}`}
                strokeDashoffset={`-${zomatoPct + swiggyPct}`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-black text-slate-900 font-sans">
                {kpis.total_orders}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Orders
              </span>
            </div>
          </div>
        </div>

        {/* Platform Breakdown Cards */}
        <div className="space-y-3 pt-2">
          {/* Zomato */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div>
                <span className="font-bold text-slate-800">Zomato</span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                  ({zomatoOrders} orders)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">
                {formatCurrency(zomatoSales)}
              </span>
              <span className="text-[10px] text-amber-700 font-semibold">{zomatoPct}% share</span>
            </div>
          </div>

          {/* Swiggy */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/50 border border-orange-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <div>
                <span className="font-bold text-slate-800">Swiggy</span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                  ({swiggyOrders} orders)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">
                {formatCurrency(swiggySales)}
              </span>
              <span className="text-[10px] text-orange-700 font-semibold">{swiggyPct}% share</span>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div>
                <span className="font-bold text-slate-800">Direct Website</span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-normal">
                  ({websiteOrders} orders)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 block">
                {formatCurrency(websiteSales)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">{websitePct}% share</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
