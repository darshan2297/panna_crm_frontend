"use client";

import React, { useCallback, useEffect, useRef, useState, Suspense } from "react";
import io, { Socket } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  Ban,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Flame,
  User,
  Receipt,
  Globe,
  UtensilsCrossed,
} from "lucide-react";
import { SearchInput } from "@/components/common/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreateOrderModal } from "@/components/orders/CreateOrderModal";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { api } from "@/services/api";
import { useDateFilterStore } from "@/store/dateFilterStore";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import {
  CreateOrderInput,
  Order,
  OrderDetail,
  OrderPlatform,
  OrderStatus,
  OrderStatusSummary,
} from "@/types";

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const platformParam = searchParams.get("platform");

  // Global Date Filter Store integration
  const { getDateBounds } = useDateFilterStore();
  const dateBounds = getDateBounds();

  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrderStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  // Re-filtering re-fetches; keep the previous rows on screen unless the
  // request is slow enough to warrant a skeleton.
  const showLoadingSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Filters & Pagination synced with URL query parameters
  const [selectedPlatform, setSelectedPlatform] = useState<string>(() => {
    if (platformParam) {
      const upper = platformParam.toUpperCase();
      if (["WEBSITE", "ZOMATO", "SWIGGY"].includes(upper)) {
        return upper;
      }
    }
    return "ALL";
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // Synchronize state whenever URL query params change (e.g. sidebar navigation)
  useEffect(() => {
    if (platformParam) {
      const upper = platformParam.toUpperCase();
      if (["WEBSITE", "ZOMATO", "SWIGGY"].includes(upper)) {
        setSelectedPlatform(upper);
      } else {
        setSelectedPlatform("ALL");
      }
    } else {
      setSelectedPlatform("ALL");
    }
    setPage(1);
  }, [platformParam]);

  // Seamless URL updater for platform tab switching
  const handlePlatformChange = (newPlatform: string) => {
    setSelectedPlatform(newPlatform);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (newPlatform === "ALL") {
      params.delete("platform");
    } else {
      params.set("platform", newPlatform.toLowerCase());
    }
    params.delete("page");
    const query = params.toString() ? `?${params.toString()}` : "";
    router.push(`/orders${query}`);
  };

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch orders and summary with date range filtering
  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const [ordersRes, summaryRes] = await Promise.all([
        api.getOrders({
          page,
          page_size: pageSize,
          platform: selectedPlatform,
          status: selectedStatus,
          payment_status: selectedPaymentStatus,
          search: searchQuery.trim() || undefined,
          date_from: dateBounds.dateFrom,
          date_to: dateBounds.dateTo,
        }),
        api.getOrderSummary({
          date_from: dateBounds.dateFrom,
          date_to: dateBounds.dateTo,
          platform: selectedPlatform,
        }),
      ]);

      setOrders(ordersRes.items || []);
      setTotalPages(ordersRes.pages || 1);
      setTotalOrders(ordersRes.total || 0);

      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, selectedPlatform, selectedStatus, selectedPaymentStatus, searchQuery, dateBounds.dateFrom, dateBounds.dateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Socket.IO real-time updates — auto-refresh when new orders arrive or statuses change
  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
      /\/api\/v1\/?$/,
      ""
    );
    const socket = io(base, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    socket.on("new_order", () => loadOrders());
    socket.on("order_status_changed", () => loadOrders());

    return () => {
      socket.disconnect();
    };
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOpenDetail = async (orderId: number) => {
    try {
      const res = await api.getOrderDetails(orderId);
      if (res.data) {
        setSelectedOrder(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      console.error("Failed to open order details:", err);
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: OrderStatus, notes?: string) => {
    const res = await api.updateOrderStatus(orderId, newStatus, notes);
    if (res.data) {
      setSelectedOrder(res.data);
      await loadOrders();
    }
  };

  const handleCancelOrder = async (orderId: number, reason: string) => {
    const res = await api.cancelOrder(orderId, reason);
    if (res.data) {
      setSelectedOrder(res.data);
      await loadOrders();
    }
  };

  const handleCreateOrder = async (payload: CreateOrderInput) => {
    await api.createOrder(payload);
    await loadOrders();
  };

  // Helper for clean action buttons in table row
  const getNextAction = (status: string) => {
    switch (status) {
      case "NEW":
        return {
          label: "Accept",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          target: "CONFIRMED" as OrderStatus,
          color: "bg-[#0C3823] hover:bg-[#072316] text-white",
        };
      case "CONFIRMED":
        return {
          label: "Cook",
          icon: <ChefHat className="w-3.5 h-3.5" />,
          target: "PREPARING" as OrderStatus,
          color: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "PREPARING":
        return {
          label: "Ready",
          icon: <PackageCheck className="w-3.5 h-3.5" />,
          target: "READY" as OrderStatus,
          color: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "READY":
        return {
          label: "Dispatch",
          icon: <Bike className="w-3.5 h-3.5" />,
          target: "OUT_FOR_DELIVERY" as OrderStatus,
          color: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      case "OUT_FOR_DELIVERY":
        return {
          label: "Deliver",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          target: "DELIVERED" as OrderStatus,
          color: "bg-emerald-700 hover:bg-emerald-800 text-white",
        };
      default:
        return null;
    }
  };

  const renderPlatformBadge = (platform: string) => {
    const p = platform.toUpperCase();
    if (p === "ZOMATO") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Zomato
        </span>
      );
    }
    if (p === "SWIGGY") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
          Swiggy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
        Panna Direct
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge variant="warning" pulse>NEW</Badge>;
      case "CONFIRMED":
        return <Badge variant="info">CONFIRMED</Badge>;
      case "PREPARING":
        return <Badge variant="brand" pulse>IN KITCHEN</Badge>;
      case "READY":
        return <Badge variant="warning">READY</Badge>;
      case "OUT_FOR_DELIVERY":
        return <Badge variant="brand">DISPATCHED</Badge>;
      case "DELIVERED":
        return <Badge variant="success">DELIVERED</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
              Order Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unified operational pipeline across Panna Website, Zomato, and Swiggy
          </p>
        </div>

        {/* Top Action Buttons with Date Range Filter */}
        <div className="flex items-center gap-2.5">
          <DateRangeFilter align="right" />
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-60"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#0C3823]" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#0C3823] text-white hover:bg-[#072316] transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Quick Operational Counters */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {dateBounds.label === "Today" ? "Today's Total" : `${dateBounds.label} Total`}
              </span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {summary.today_orders} <span className="text-xs text-slate-400 font-sans font-normal">orders</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-2">
              <TrendingUp className="w-3.5 h-3.5" />
              ₹{summary.today_revenue.toLocaleString("en-IN")} sales {dateBounds.periodText}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-orange-50/30 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between text-amber-800 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">In Kitchen</span>
              <ChefHat className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950 font-mono tracking-tight">
              {summary.preparing + summary.confirmed} <span className="text-xs text-amber-800 font-sans font-normal">active</span>
            </div>
            <div className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {summary.new} awaiting acceptance
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-indigo-50/30 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between text-blue-800 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Ready & Transit</span>
              <Bike className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-950 font-mono tracking-tight">
              {summary.ready + summary.out_for_delivery} <span className="text-xs text-blue-800 font-sans font-normal">orders</span>
            </div>
            <div className="text-xs text-blue-700 mt-2">
              {summary.out_for_delivery} out for delivery
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-green-50/30 shadow-xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between text-emerald-800 text-xs mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                {dateBounds.label === "Today" ? "Delivered Today" : `Delivered (${dateBounds.label})`}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-950 font-mono tracking-tight">
              {summary.delivered} <span className="text-xs text-emerald-800 font-sans font-normal">completed</span>
            </div>
            <div className="text-xs text-emerald-700 mt-2">
              All handovers confirmed
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Bar & Controls Container matching Inventory styling */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        {/* Platform Channel Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Channels", icon: Layers, dot: null },
              { id: "WEBSITE", label: "Panna Direct", icon: Globe, dot: "bg-emerald-500" },
              { id: "ZOMATO", label: "Zomato", icon: UtensilsCrossed, dot: "bg-rose-500" },
              { id: "SWIGGY", label: "Swiggy", icon: Bike, dot: "bg-amber-500" },
            ].map((tab) => {
              const isActive = selectedPlatform === tab.id;
              const IconComp = tab.icon;
              const count = tab.id === "ALL"
                ? (summary?.total_orders || totalOrders)
                : (selectedPlatform === tab.id
                    ? totalOrders
                    : (orders.filter((o) => o.platform === tab.id).length || null));

              return (
                <button
                  key={tab.id}
                  onClick={() => handlePlatformChange(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-950 text-white shadow-sm"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {tab.dot ? (
                    <span className={`w-2 h-2 rounded-full ${tab.dot} shrink-0 ${isActive ? "ring-2 ring-white/50" : ""}`} />
                  ) : (
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-stone-400"} shrink-0`} />
                  )}
                  <span>{tab.label}</span>
                  {count !== null && count !== undefined && count > 0 && (
                    <span
                      className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border ${
              socketConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                : "bg-rose-50 text-rose-700 border-rose-200/60"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {socketConnected ? "Live Sync ON" : "Offline"}
            </span>
          </div>
        </div>

        {/* Status Pipeline Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 font-bold mr-1 text-[11px] uppercase tracking-wider shrink-0">
            Pipeline:
          </span>
          {[
            { id: "ALL", label: "All", count: summary?.total_orders },
            { id: "NEW", label: "New", count: summary?.new },
            { id: "CONFIRMED", label: "Confirmed", count: summary?.confirmed },
            { id: "PREPARING", label: "In Kitchen", count: summary?.preparing },
            { id: "READY", label: "Ready", count: summary?.ready },
            { id: "OUT_FOR_DELIVERY", label: "Dispatched", count: summary?.out_for_delivery },
            { id: "DELIVERED", label: "Delivered", count: summary?.delivered },
            { id: "CANCELLED", label: "Cancelled", count: summary?.cancelled },
          ].map((st) => {
            const isActive = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStatus(st.id);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${
                  isActive
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <span>{st.label}</span>
                {st.count !== undefined && st.count > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {st.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Payment Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-stone-100">
          <SearchInput
            value={searchQuery}
            onChange={(v) => {
              setSearchQuery(v);
              setPage(1);
            }}
            placeholder="Search by order # (e.g. PB-1024), customer name, or phone..."
            className="sm:col-span-8 max-w-none"
          />

          <div className="sm:col-span-4 flex items-center space-x-2">
            <span className="text-[11px] font-bold text-stone-500 whitespace-nowrap">Payment:</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-900"
            >
              <option value="ALL">All Payment Types</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending (COD)</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {showLoadingSkeleton ? (
          <div className="p-12">
            <TableSkeleton rows={6} columns={6} />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={loadOrders}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No orders found"
              description={
                searchQuery || selectedPlatform !== "ALL" || selectedStatus !== "ALL"
                  ? "Try adjusting your search query or filters to find orders."
                  : "No orders have been received yet. Click 'New Order' to record one."
              }
              actionText="Create Order"
              onAction={() => setIsCreateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order # & Channel</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Amount & Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right w-48">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((order) => {
                  const nextAction = getNextAction(order.order_status);
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(order.id)}
                    >
                      {/* Order Number & Channel */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs group-hover:text-[#0C3823] flex items-center gap-1">
                          {order.order_number}
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0C3823] transition-colors" />
                        </div>
                        <div className="mt-1">
                          {renderPlatformBadge(order.platform)}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{order.customer_name}</div>
                        <div className="text-slate-500 text-[11px] font-mono mt-0.5">{order.customer_phone}</div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-800 line-clamp-1 font-medium">
                          {order.items_summary || "Biryani order"}
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          {order.items_count} item{order.items_count > 1 ? "s" : ""}
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{order.total_amount.toFixed(2)}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5 ${
                            order.payment_status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : order.payment_status === "REFUNDED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(order.order_status)}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div className="font-medium text-slate-700">
                          {new Date(order.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Actions: View and Quick Advance Button */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap w-48"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order.id)}
                            className="w-[72px] h-8 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
                            title="View complete order details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>View</span>
                          </button>

                          {nextAction ? (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(order.id, nextAction.target)}
                              className={`w-[92px] h-8 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all shadow-xs ${nextAction.color}`}
                            >
                              {nextAction.icon}
                              <span>{nextAction.label}</span>
                            </button>
                          ) : (
                            <span className="w-[92px] h-8 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{order.order_status === "CANCELLED" ? "Closed" : "Done"}</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalOrders > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {Math.min((page - 1) * pageSize + 1, totalOrders)}
                </span>
                {" – "}
                <span className="font-bold text-slate-900">
                  {Math.min(page * pageSize, totalOrders)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{totalOrders}</span> orders
              </span>

              <div className="flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
                <span className="text-[11px] text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs">
                <span className="font-bold text-slate-900">{page}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{totalPages}</span>
              </div>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onCancelOrder={handleCancelOrder}
      />

      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12">
          <TableSkeleton rows={6} columns={6} />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
