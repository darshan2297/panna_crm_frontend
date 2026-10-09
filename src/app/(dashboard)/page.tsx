"use client";

import React, { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/KPICards";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { PlatformDistributionCard } from "@/components/dashboard/PlatformDistributionCard";
import { TopSellingItemsCard } from "@/components/dashboard/TopSellingItemsCard";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { LowStockModal } from "@/components/dashboard/LowStockModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { DashboardData } from "@/types";
import {
  RefreshCw,
  Calendar,
  Sparkles,
  Flame,
  ChefHat,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowStockModalOpen, setLowStockModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<"today" | "7days" | "month">("today");

  const fetchDashboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getDashboardStats();
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto refresh every 45 seconds for operational freshness
    const interval = setInterval(() => fetchDashboard(true), 45000);
    return () => clearInterval(interval);
  }, []);

  const currentDateFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingState message="Loading live operational metrics & sales trends..." />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-3 my-8">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Failed to Connect to Kitchen Operations API</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
        <Button variant="primary" size="sm" onClick={() => fetchDashboard(false)}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Top Header & Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Terminal</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDateFormatted}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              onClick={() => setSelectedRange("today")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRange === "today"
                  ? "bg-panna-green-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setSelectedRange("7days")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRange === "7days"
                  ? "bg-panna-green-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedRange("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedRange === "month"
                  ? "bg-panna-green-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Month
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => fetchDashboard(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh dashboard data"
          >
            Refresh
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Row 1: KPI Stats Cards */}
          <KPICards
            kpis={data.kpis}
            onOpenLowStock={() => setLowStockModalOpen(true)}
          />

          {/* Row 2: Sales Trend Chart & Platform Share Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SalesTrendChart trendData={data.sales_trend} />
            <PlatformDistributionCard kpis={data.kpis} />
          </div>

          {/* Row 3: Live Recent Orders & Top Selling Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentOrdersTable orders={data.recent_orders} />
            <TopSellingItemsCard items={data.top_selling_items} />
          </div>

          {/* Low Stock Alerts Modal */}
          <LowStockModal
            isOpen={lowStockModalOpen}
            onClose={() => setLowStockModalOpen(false)}
            alerts={data.low_stock_alerts}
          />
        </>
      )}
    </>
  );
}
