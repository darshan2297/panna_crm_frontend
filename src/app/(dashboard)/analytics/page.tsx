"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  IndianRupee,
  ShoppingBag,
  Percent,
  RefreshCw,
  Download,
  AlertTriangle,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Flame,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  SalesTrendResponse,
  TopItemsResponse,
  PlatformBreakdownResponse,
  OrderVelocityResponse,
  CustomerSegmentsResponse,
  DishCostingResponse,
  PLSummaryResponse,
  RevenueBreakdownResponse,
} from "@/types";

/** A chart data point — either a single day or an aggregated multi-day bucket. */
interface ChartPoint {
  date: string;
  day: string;
  endDate?: string;
  total_revenue: number;
  website_revenue: number;
  zomato_revenue: number;
  swiggy_revenue: number;
  order_count: number;
}

function AnalyticsContent() {
  const [days, setDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"trends" | "dishes" | "costing" | "segments">("trends");
  const [loading, setLoading] = useState<boolean>(true);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [topSortBy, setTopSortBy] = useState<"revenue" | "quantity">("revenue");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  // Analytics states
  const [salesTrend, setSalesTrend] = useState<SalesTrendResponse | null>(null);
  const [topItems, setTopItems] = useState<TopItemsResponse | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdownResponse | null>(null);
  const [orderVelocity, setOrderVelocity] = useState<OrderVelocityResponse | null>(null);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegmentsResponse | null>(null);
  const [dishCosting, setDishCosting] = useState<DishCostingResponse | null>(null);
  const [plSummary, setPlSummary] = useState<PLSummaryResponse | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownResponse | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    // allSettled: one failing endpoint must not blank the whole dashboard
    const [trendRes, topRes, platRes, velRes, segRes, costRes, plRes, revRes] = await Promise.allSettled([
      api.getSalesTrend(days),
      api.getTopItems(days, 15, topSortBy),
      api.getPlatformBreakdown(days),
      api.getOrderVelocity(days),
      api.getCustomerSegments(),
      api.getDishCosting(),
      api.getPLSummary(days),
      api.getRevenueBreakdown(days),
    ]);

    const failed = [trendRes, topRes, platRes, velRes, segRes, costRes, plRes, revRes]
      .filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.error("Some analytics endpoints failed:", failed.map((f: any) => f.reason));
    }

    if (trendRes.status === "fulfilled" && trendRes.value.data) setSalesTrend(trendRes.value.data);
    if (topRes.status === "fulfilled" && topRes.value.data) setTopItems(topRes.value.data);
    if (platRes.status === "fulfilled" && platRes.value.data) setPlatformBreakdown(platRes.value.data);
    if (velRes.status === "fulfilled" && velRes.value.data) setOrderVelocity(velRes.value.data);
    if (segRes.status === "fulfilled" && segRes.value.data) setCustomerSegments(segRes.value.data);
    if (costRes.status === "fulfilled" && costRes.value.data) setDishCosting(costRes.value.data);
    if (plRes.status === "fulfilled" && plRes.value.data) setPlSummary(plRes.value.data);
    if (revRes.status === "fulfilled" && revRes.value.data) setRevenueBreakdown(revRes.value.data);
    setLoading(false);
  }, [days, topSortBy]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // SVG Chart Dimensions
  const rawTrendItems = salesTrend?.items || [];
  // Bucket long ranges into ~10-day groups so the chart stays readable
  // (90D → 9 buckets of 10 days instead of 90 cramped daily points)
  const bucketSize = rawTrendItems.length > 30 ? Math.ceil(rawTrendItems.length / 9) : 1;
  const trendItems: ChartPoint[] = [];
  for (let i = 0; i < rawTrendItems.length; i += bucketSize) {
    const chunk = rawTrendItems.slice(i, i + bucketSize);
    trendItems.push({
      date: chunk[0].date,
      day: chunk[0].day,
      endDate: chunk[chunk.length - 1].date,
      total_revenue: chunk.reduce((s, d) => s + d.total_revenue, 0),
      website_revenue: chunk.reduce((s, d) => s + d.website_revenue, 0),
      zomato_revenue: chunk.reduce((s, d) => s + d.zomato_revenue, 0),
      swiggy_revenue: chunk.reduce((s, d) => s + d.swiggy_revenue, 0),
      order_count: chunk.reduce((s, d) => s + d.order_count, 0),
    });
  }
  const maxRevenue = Math.max(...trendItems.map((d) => d.total_revenue), 1000);
  const svgWidth = 720;
  const svgHeight = 220;
  const padX = 40;
  const padY = 25;

  const getX = (index: number) => {
    if (trendItems.length <= 1) return padX;
    return padX + (index * (svgWidth - 2 * padX)) / (trendItems.length - 1);
  };

  const getY = (val: number) => {
    return svgHeight - padY - (val / maxRevenue) * (svgHeight - 2 * padY);
  };

  const buildPath = (key: "website_revenue" | "zomato_revenue" | "swiggy_revenue" | "total_revenue") => {
    if (trendItems.length === 0) return "";
    return trendItems
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[key])}`)
      .join(" ");
  };

  const hoveredPoint = hoveredTrendIdx !== null ? trendItems[hoveredTrendIdx] : null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panna-green-900/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-panna-green-900 text-panna-gold-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-panna-green-950 font-serif">
              Business Analytics & Intelligence
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Multi-platform sales performance, peak order velocity, customer segments & dish profitability
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5">
          {/* Timeframe Buttons */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-all",
                  days === d
                    ? "bg-white text-panna-green-950 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-950"
                )}
              >
                {d}D
              </button>
            ))}
          </div>

          {/* Consistent Icon-Only Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
            className="p-2 border-slate-300 hover:bg-slate-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={cn("w-4 h-4 text-panna-green-800", loading && "animate-spin")} />
          </Button>

          {/* Export CSV Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(!exportOpen)}
              className="gap-2 border-panna-green-800/30 text-panna-green-900 hover:bg-panna-green-50 font-semibold"
            >
              <Download className="w-4 h-4 text-panna-green-800" />
              <span>Export CSV</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>

            {exportOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Choose Dataset
                </div>
                {[
                  { label: "Sales Trend Report", key: "sales" },
                  { label: "Top Dishes Ranking", key: "top_items" },
                  { label: "Food Costing & Margins", key: "costing" },
                  { label: "Platform Revenue Breakdown", key: "platforms" },
                ].map((ds) => (
                  <a
                    key={ds.key}
                    href={api.getAnalyticsExportUrl(ds.key, days)}
                    download
                    onClick={() => setExportOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-panna-green-50 hover:text-panna-green-900 transition-colors"
                  >
                    <span>{ds.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-panna-green-700 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Sales ({days}D)
              </p>
              <p className="text-2xl font-bold font-serif text-panna-green-950 mt-1">
                {formatCurrency(salesTrend?.total_period_revenue || 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{salesTrend?.total_period_orders || 0} Total Orders</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-panna-green-50 flex items-center justify-center text-panna-green-800">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Average Order Value
              </p>
              <p className="text-2xl font-bold font-serif text-slate-900 mt-1">
                {formatCurrency(salesTrend?.average_order_value || 0)}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Per customer checkout</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Gross Profit Margin
              </p>
              <p className="text-2xl font-bold font-serif text-emerald-700 mt-1">
                {plSummary?.gross_profit_margin_pct ?? 0}%
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                <span>Gross Profit: {formatCurrency(plSummary?.gross_profit || 0)}</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Percent className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-panna-gold-500 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg Dish Margin
              </p>
              <p className="text-2xl font-bold font-serif text-panna-green-950 mt-1">
                {dishCosting?.avg_kitchen_margin_pct ?? 0}%
              </p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-700 font-medium">
                {dishCosting?.low_margin_count ? (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {dishCosting.low_margin_count} low-margin recipes
                  </span>
                ) : (
                  <span>All recipes healthy</span>
                )}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-panna-gold-500/10 flex items-center justify-center text-panna-gold-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: "trends", label: "Revenue & Platform Trends", icon: TrendingUp },
          { id: "dishes", label: "Top Dishes & Order Velocity", icon: Flame },
          { id: "costing", label: "Cost & Profit Analytics", icon: Percent },
          { id: "segments", label: "Customer Segments", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all",
                isActive
                  ? "border-panna-green-900 text-panna-green-950 bg-panna-green-50/50 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-panna-green-900" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: REVENUE & PLATFORM TRENDS */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Multi-series SVG Trend Chart */}
            <Card className="lg:col-span-2 shadow-xs">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-serif">Daily Multi-Platform Revenue</CardTitle>
                    <CardDescription>
                      Revenue trajectory over past {days} days broken down by channels
                      {bucketSize > 1 ? ` (grouped in ${bucketSize}-day periods)` : ""}
                    </CardDescription>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">Website</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-slate-600">Zomato</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-slate-600">Swiggy</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {/* Tooltip display */}
                <div className="h-8 mb-2 flex items-center text-xs">
                  {hoveredPoint ? (
                    <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-md border border-slate-200">
                      <span className="font-bold text-slate-900">
                        {hoveredPoint.endDate && hoveredPoint.endDate !== hoveredPoint.date
                          ? `${hoveredPoint.date} → ${hoveredPoint.endDate}`
                          : `${hoveredPoint.day} (${hoveredPoint.date})`}
                        :
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        Web: {formatCurrency(hoveredPoint.website_revenue)}
                      </span>
                      <span className="text-amber-700 font-semibold">
                        Zomato: {formatCurrency(hoveredPoint.zomato_revenue)}
                      </span>
                      <span className="text-orange-700 font-semibold">
                        Swiggy: {formatCurrency(hoveredPoint.swiggy_revenue)}
                      </span>
                      <span className="text-slate-800 font-bold ml-1">
                        Total: {formatCurrency(hoveredPoint.total_revenue)} ({hoveredPoint.order_count} orders)
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Hover over data points to inspect numbers</span>
                  )}
                </div>

                {/* SVG Chart */}
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-56 select-none"
                  >
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const y = svgHeight - padY - pct * (svgHeight - 2 * padY);
                      return (
                        <g key={idx}>
                          <line
                            x1={padX}
                            y1={y}
                            x2={svgWidth - padX}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={padX - 8}
                            y={y + 3}
                            textAnchor="end"
                            className="text-[9px] fill-slate-400 font-mono"
                          >
                            ₹{Math.round(pct * maxRevenue)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Paths */}
                    <path
                      d={buildPath("website_revenue")}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={buildPath("zomato_revenue")}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={buildPath("swiggy_revenue")}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Interactive Hover Nodes */}
                    {trendItems.map((d, i) => {
                      const cx = getX(i);
                      const cy = getY(d.total_revenue);
                      const isHovered = hoveredTrendIdx === i;
                      return (
                        <g
                          key={i}
                          className="cursor-pointer transition-transform"
                          onMouseEnter={() => setHoveredTrendIdx(i)}
                          onMouseLeave={() => setHoveredTrendIdx(null)}
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 6 : 4}
                            fill="#0C3823"
                            stroke="#fff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                          {/* X-axis labels */}
                          {(trendItems.length <= 14 || i % 3 === 0 || i === trendItems.length - 1) && (
                            <text
                              x={cx}
                              y={svgHeight - 6}
                              textAnchor="middle"
                              className="text-[10px] fill-slate-500 font-medium"
                            >
                              {d.date.slice(5)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Platform Distribution Card */}
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-serif">Platform Share & Net Margins</CardTitle>
                <CardDescription>Commissions deducted by channel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {platformBreakdown?.platforms.map((p) => {
                  const isDirect = p.platform === "WEBSITE";
                  return (
                    <div
                      key={p.platform}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800">{p.display_name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          {p.revenue_share_pct}% Share
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            p.platform === "WEBSITE" && "bg-emerald-500",
                            p.platform === "ZOMATO" && "bg-amber-500",
                            p.platform === "SWIGGY" && "bg-orange-500"
                          )}
                          style={{ width: `${Math.min(p.revenue_share_pct, 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross</span>
                          <span className="font-bold text-slate-900">{formatCurrency(p.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Commission ({p.commission_rate_pct}%)
                          </span>
                          <span className={cn("font-bold", isDirect ? "text-emerald-700" : "text-rose-600")}>
                            {isDirect ? "₹0 (Direct)" : `- ${formatCurrency(p.commission_amount)}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Orders</span>
                          <span className="font-medium text-slate-700">{p.order_count} txns</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Net In-Pocket</span>
                          <span className="font-bold text-emerald-800">{formatCurrency(p.net_revenue)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: TOP DISHES & HOURLY VELOCITY */}
      {activeTab === "dishes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Dishes Ranking */}
            <Card className="shadow-xs">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-serif">Menu Item Leaderboard</CardTitle>
                    <CardDescription>Top revenue &amp; volume generators</CardDescription>
                  </div>
                  {/* Toggle */}
                  <div className="inline-flex items-center gap-1 bg-slate-100 rounded-full p-1 shrink-0 mt-0.5">
                    <button
                      onClick={() => setTopSortBy("revenue")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200",
                        topSortBy === "revenue"
                          ? "bg-panna-green-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      By Revenue
                    </button>
                    <button
                      onClick={() => setTopSortBy("quantity")}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200",
                        topSortBy === "quantity"
                          ? "bg-panna-green-900 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      By Units
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topItems?.items.map((item, idx) => (
                    <div
                      key={item.item_name}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-panna-green-900 text-panna-gold-400 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.item_name}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {item.category_name} • {item.quantity_sold} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-950">{formatCurrency(item.total_revenue)}</p>
                        <p className="text-[11px] font-semibold text-emerald-600">{item.percentage_of_total}% share</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Velocity Heatmap (7x24 Matrix) */}
            <Card className="shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-serif">Order Rush Heatmap</CardTitle>
                    <CardDescription>
                      Concentration of kitchen orders by day of week & hour
                    </CardDescription>
                  </div>
                  {orderVelocity && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-800 bg-amber-50 font-semibold">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Peak: {orderVelocity.peak_day} at {orderVelocity.peak_hour}:00
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Hour header indices */}
                  <div className="flex items-center text-[10px] text-slate-400 font-bold px-1">
                    <span className="w-10">Day</span>
                    <div className="flex-1 grid grid-cols-12 gap-1 text-center">
                      {["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "6p", "8p", "10p"].map((h) => (
                        <span key={h}>{h}</span>
                      ))}
                    </div>
                  </div>

                  {/* Day Rows */}
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, dIdx) => {
                    const dayCells = orderVelocity?.cells.filter((c) => c.day_of_week === dIdx) || [];
                    const maxSlot = orderVelocity?.max_orders_in_slot || 1;

                    return (
                      <div key={dayName} className="flex items-center gap-1">
                        <span className="w-10 text-xs font-bold text-slate-700">{dayName}</span>
                        <div className="flex-1 grid gap-0.5" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const cell = dayCells.find((c) => c.hour === h);
                            const count = cell ? cell.order_count : 0;
                            const intensity = Math.min(count / (maxSlot || 1), 1);

                            return (
                              <div
                                key={h}
                                title={`${dayName} at ${h}:00 — ${count} orders`}
                                className={cn(
                                  "h-6 rounded-sm transition-colors cursor-pointer hover:ring-1 hover:ring-emerald-600 hover:ring-offset-0",
                                  count === 0 && "bg-slate-100",
                                  count > 0 && intensity < 0.3 && "bg-emerald-200",
                                  count > 0 && intensity >= 0.3 && intensity < 0.7 && "bg-emerald-400",
                                  count > 0 && intensity >= 0.7 && "bg-emerald-700"
                                )}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3">
                    <span>Low traffic</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 bg-slate-100 rounded-xs" />
                      <span className="w-3.5 h-3.5 bg-emerald-200 rounded-xs" />
                      <span className="w-3.5 h-3.5 bg-emerald-400 rounded-xs" />
                      <span className="w-3.5 h-3.5 bg-emerald-700 rounded-xs" />
                    </div>
                    <span>Peak kitchen rush</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: COST & PROFIT ANALYTICS (PHASE 12) */}
      {activeTab === "costing" && (
        <div className="space-y-6">
          {/* Revenue Bifurcation KPIs (reverse calculation) */}
          <Card className="shadow-sm border-panna-green-900/10">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-serif">Revenue Bifurcation (Reverse Calculation)</CardTitle>
                  <CardDescription className="text-xs">
                    Menu prices include GST (backed out here); transaction fee + VAS apply to every order ({days}-day cycle)
                  </CardDescription>
                </div>
                <Badge variant="outline" className="border-panna-green-300 text-panna-green-800 bg-panna-green-50">
                  Margin: {revenueBreakdown?.margin_pct ?? 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Subtotal</span>
                  <span className="text-xl font-bold font-serif text-panna-green-950 mt-1 block">
                    {formatCurrency(revenueBreakdown?.total_subtotal || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Goods (incl. GST)</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">GST</span>
                  <span className="text-xl font-bold font-serif text-slate-700 mt-1 block">
                    - {formatCurrency(revenueBreakdown?.total_gst || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Backed out</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">Transaction Fee</span>
                  <span className="text-xl font-bold font-serif text-orange-600 mt-1 block">
                    - {formatCurrency(revenueBreakdown?.total_transaction_fee || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Gateway fee</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">VAS Fee</span>
                  <span className="text-xl font-bold font-serif text-amber-600 mt-1 block">
                    - {formatCurrency(revenueBreakdown?.total_vas_fee || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">WhatsApp/SMS/Email</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">Other Expense</span>
                  <span className="text-xl font-bold font-serif text-slate-600 mt-1 block">
                    - {formatCurrency(revenueBreakdown?.total_other_expense || 0)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Packaging/misc</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-700 block uppercase">Total Margin</span>
                  <span className="text-xl font-bold font-serif text-emerald-700 mt-1 block">
                    {formatCurrency(revenueBreakdown?.total_margin || 0)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {revenueBreakdown?.margin_pct ?? 0}% of revenue
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* P&L Summary Waterfall Banner */}
          <Card className="bg-gradient-to-br from-panna-green-950 via-panna-green-900 to-panna-green-950 text-white shadow-md border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between border-b border-panna-green-800 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Kitchen Profit & Loss (P&L) Statement</h3>
                  <p className="text-xs text-panna-green-300">
                    Standardized food cost, packaging expenses, and platform fees ({days}-day cycle)
                  </p>
                </div>
                <Badge variant="outline" className="border-panna-gold-400 text-panna-gold-300 bg-panna-gold-500/10">
                  Gross Margin: {plSummary?.gross_profit_margin_pct}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 rounded-lg bg-panna-green-900/60 border border-panna-green-800/80">
                  <span className="text-[11px] font-semibold text-panna-green-300 block uppercase">Gross Revenue</span>
                  <span className="text-xl font-bold font-serif text-white mt-1 block">
                    {formatCurrency(plSummary?.gross_revenue || 0)}
                  </span>
                  <span className="text-[10px] text-panna-green-400 block mt-0.5">100% Topline</span>
                </div>

                <div className="p-3 rounded-lg bg-panna-green-900/60 border border-panna-green-800/80">
                  <span className="text-[11px] font-semibold text-rose-300 block uppercase">Ingredient Food Cost</span>
                  <span className="text-xl font-bold font-serif text-rose-200 mt-1 block">
                    - {formatCurrency(plSummary?.ingredient_food_cost || 0)}
                  </span>
                  <span className="text-[10px] text-panna-green-400 block mt-0.5">~30.0% COGS</span>
                </div>

                <div className="p-3 rounded-lg bg-panna-green-900/60 border border-panna-green-800/80">
                  <span className="text-[11px] font-semibold text-amber-300 block uppercase">Packaging Cost</span>
                  <span className="text-xl font-bold font-serif text-amber-200 mt-1 block">
                    - {formatCurrency(plSummary?.packaging_cost || 0)}
                  </span>
                  <span className="text-[10px] text-panna-green-400 block mt-0.5">Containers + Bags</span>
                </div>

                <div className="p-3 rounded-lg bg-panna-green-900/60 border border-panna-green-800/80">
                  <span className="text-[11px] font-semibold text-orange-300 block uppercase">Platform Fees</span>
                  <span className="text-xl font-bold font-serif text-orange-200 mt-1 block">
                    - {formatCurrency(plSummary?.platform_commissions || 0)}
                  </span>
                  <span className="text-[10px] text-panna-green-400 block mt-0.5">Zomato & Swiggy</span>
                </div>

                <div className="p-3 rounded-lg bg-panna-gold-500/20 border border-panna-gold-500/40">
                  <span className="text-[11px] font-bold text-panna-gold-300 block uppercase">Net Gross Profit</span>
                  <span className="text-xl font-bold font-serif text-panna-gold-400 mt-1 block">
                    {formatCurrency(plSummary?.gross_profit || 0)}
                  </span>
                  <span className="text-[10px] text-panna-gold-300 font-semibold block mt-0.5">
                    {plSummary?.gross_profit_margin_pct}% Retained Margin
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-Dish Profitability Master Table */}
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-serif">Recipe & Dish Margin Analysis</CardTitle>
                  <CardDescription>
                    Unit economics per portion size across menu catalog
                  </CardDescription>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Showing {dishCosting?.dishes.length || 0} Portions
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Dish & Portion</th>
                      <th className="py-3 px-3 text-right">Selling Price</th>
                      <th className="py-3 px-3 text-right">Food Cost</th>
                      <th className="py-3 px-3 text-right">Packaging</th>
                      <th className="py-3 px-3 text-right">Avg Fee</th>
                      <th className="py-3 px-3 text-right">Net Profit</th>
                      <th className="py-3 px-4 text-center">Gross Margin</th>
                      <th className="py-3 px-4 text-center">Margin Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dishCosting?.dishes.map((dish) => (
                      <tr key={dish.item_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {dish.item_name}
                          <span className="block text-[10px] font-normal text-slate-400">{dish.category_name}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {formatCurrency(dish.selling_price)}
                        </td>
                        <td className="py-3 px-3 text-right text-rose-600 font-medium">
                          {formatCurrency(dish.food_cost)}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-600 font-medium">
                          {formatCurrency(dish.packaging_cost)}
                        </td>
                        <td className="py-3 px-3 text-right text-orange-600 font-medium">
                          {formatCurrency(dish.avg_commission)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-800">
                          {formatCurrency(dish.net_margin_amount)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {dish.gross_margin_pct}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {dish.is_low_margin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              Low Margin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: CUSTOMER SEGMENTS */}
      {activeTab === "segments" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {customerSegments?.segments.map((seg) => (
              <Card key={seg.segment} className="shadow-xs border-t-4 border-t-panna-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                      {seg.segment} Customers
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {seg.percentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-serif text-panna-green-950 mt-2">
                    {seg.customer_count} Members
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Revenue</span>
                      <span className="font-bold text-slate-800">{formatCurrency(seg.total_spent)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Average Ticket</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(seg.avg_spent_per_customer)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading Analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
