"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Truck,
  IndianRupee,
  AlertTriangle,
  AlertCircle,
  PackageCheck,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Boxes,
  Package,
  Layers,
  Send,
  MessageCircle,
  Mail,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreatePOModal } from "@/components/restock/CreatePOModal";
import { PODetailModal } from "@/components/restock/PODetailModal";
import { DispatchAlertModal } from "@/components/restock/DispatchAlertModal";
import { api } from "@/services/api";
import {
  RestockOrder,
  RestockOrderStatus,
  RestockSuggestionItem,
  RestockSummary,
  NotificationItem,
  NotificationChannel,
  NotificationSeverity,
} from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type ViewTab = "planner" | "purchase_orders" | "notifications";

function RestockManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Tab state
  const tabParam = searchParams.get("tab");
  const initialTab: ViewTab =
    tabParam === "purchase_orders" || tabParam === "notifications"
      ? tabParam
      : "planner";
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);

  useEffect(() => {
    if (tabParam === "purchase_orders" || tabParam === "notifications") {
      setActiveTab(tabParam);
    } else if (tabParam === "planner" || !tabParam) {
      setActiveTab("planner");
    }
  }, [tabParam]);

  // Data states
  const [summary, setSummary] = useState<RestockSummary | null>(null);
  const [suggestions, setSuggestions] = useState<RestockSuggestionItem[]>([]);
  const [orders, setOrders] = useState<RestockOrder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<"ALL" | "INVENTORY" | "PACKAGING">("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [notifSeverityFilter, setNotifSeverityFilter] = useState<string>("ALL");

  // Modals
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [preselectedSuggestions, setPreselectedSuggestions] = useState<RestockSuggestionItem[]>([]);
  const [selectedPO, setSelectedPO] = useState<RestockOrder | null>(null);
  const [poDetailOpen, setPODetailOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Pagination states
  const [plannerPage, setPlannerPage] = useState(1);
  const [plannerPageSize, setPlannerPageSize] = useState(10);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [notifPage, setNotifPage] = useState(1);
  const [notifPageSize, setNotifPageSize] = useState(10);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Load all data
  const loadData = async () => {
    try {
      const [sumRes, sugRes, ordRes, notifRes] = await Promise.all([
        api.getRestockSummary().catch(() => null),
        api.getRestockSuggestions().catch(() => null),
        api.getRestockOrders({ page_size: 100 }).catch(() => null),
        api.getNotifications({ page_size: 100 }).catch(() => null),
      ]);

      if (sumRes?.data) setSummary(sumRes.data);
      if (sugRes?.data) setSuggestions(sugRes.data);
      if (ordRes?.data?.items) setOrders(ordRes.data.items);
      if (notifRes?.data?.items) setNotifications(notifRes.data.items);
    } catch (err) {
      console.error("Failed to load restock data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScanBreaches = async () => {
    setScanning(true);
    try {
      const res = await api.scanKitchenStockAlerts();
      await loadData();
      const count = res.data?.alerts_generated ?? 0;
      setFeedback(
        `Kitchen scan complete! ${count} new alerts generated.`
      );
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error("Scan failed", err);
      await loadData().catch(() => null);
      setFeedback("Refreshed restock data.");
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setScanning(false);
    }
  };

  // Switch tab and URL sync
  const handleTabChange = (newTab: ViewTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "planner") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    router.replace(`/restock${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Open Create PO with single suggestion
  const handleAddSingleToPO = (item: RestockSuggestionItem) => {
    setPreselectedSuggestions([item]);
    setCreatePOOpen(true);
  };

  // Open Create PO with all suggestions
  const handleBulkPOAll = () => {
    setPreselectedSuggestions(suggestions);
    setCreatePOOpen(true);
  };

  // Open PO details
  const handleViewPO = (po: RestockOrder) => {
    setSelectedPO(po);
    setPODetailOpen(true);
  };

  // Direct 1-Click Receive Stock
  const handleDirectReceiveStock = (po: RestockOrder) => {
    setConfirmAction(() => async () => {
      try {
        await api.receiveRestockOrder(po.id);
        await loadData();
        setFeedback(`PO ${po.po_number} successfully received into kitchen stock!`);
        setTimeout(() => setFeedback(null), 5000);
      } catch (err: any) {
        alert(err?.message || "Failed to receive PO stock");
      }
    });
  };

  // Open Dispatch Modal
  const handleOpenDispatch = (notif: NotificationItem) => {
    setSelectedNotif(notif);
    setDispatchModalOpen(true);
  };

  // Filtered Suggestions (Tab 1)
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      const sName = s.name || s.item_name || "";
      const sCat = s.category || "";
      const sSupp = s.supplier || s.supplier_name || "";
      const sType = s.item_type || s.target_type || "INVENTORY";
      const matchSearch =
        sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sCat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sSupp.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTarget =
        targetFilter === "ALL" || sType === targetFilter;
      return matchSearch && matchTarget;
    });
  }, [suggestions, searchQuery, targetFilter]);

  const paginatedSuggestions = useMemo(() => {
    const start = (plannerPage - 1) * plannerPageSize;
    return filteredSuggestions.slice(start, start + plannerPageSize);
  }, [filteredSuggestions, plannerPage, plannerPageSize]);

  const totalPlannerPages = Math.ceil(filteredSuggestions.length / plannerPageSize) || 1;

  // Filtered Orders (Tab 2)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        orderStatusFilter === "ALL" || o.status === orderStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, orderStatusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  const totalOrderPages = Math.ceil(filteredOrders.length / orderPageSize) || 1;

  // Filtered Notifications (Tab 3)
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity =
        notifSeverityFilter === "ALL" || n.severity === notifSeverityFilter;
      return matchSearch && matchSeverity;
    });
  }, [notifications, searchQuery, notifSeverityFilter]);

  const paginatedNotifications = useMemo(() => {
    const start = (notifPage - 1) * notifPageSize;
    return filteredNotifications.slice(start, start + notifPageSize);
  }, [filteredNotifications, notifPage, notifPageSize]);

  const totalNotifPages = Math.ceil(filteredNotifications.length / notifPageSize) || 1;

  // Total deficit cost
  const totalDeficitCost = suggestions.reduce(
    (sum, s) => sum + (s.estimated_cost ?? s.estimated_total_cost_inr ?? 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
              Restock & Kitchen Alerts
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated deficit detection, smart purchase orders & multi-channel supplier dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleScanBreaches}
            disabled={scanning}
            className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors shadow-2xs disabled:opacity-50"
            title="Scan ingredients & packaging against thresholds"
          >
            <RefreshCw
              className={`w-4 h-4 ${scanning ? "animate-spin text-amber-500" : "text-emerald-700"}`}
            />
          </button>

          <button
            onClick={() => {
              setPreselectedSuggestions([]);
              setCreatePOOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950 text-white hover:bg-emerald-900 text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 KPI Cards (Matching standard Inventory / Packaging visual styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Restock Investment */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-white pointer-events-none">
            <IndianRupee className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-300 truncate">
                Restock Deficit
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/90 text-amber-300 border border-emerald-700/60 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              Calculated
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-400 tracking-tight my-1">
            ₹{totalDeficitCost.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-stone-300 flex items-center gap-1.5 pt-2 border-t border-emerald-900/60">
            <span>Required to restore safe kitchen inventory</span>
          </div>
        </div>

        {/* Card 2: Active Deficit Items */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Low Stock Breaches
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${suggestions.length > 0
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
            >
              {suggestions.length > 0 ? "Action Needed" : "All Healthy"}
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight my-1">
            {suggestions.length}
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-2 border-t border-stone-100">
            <span className="font-bold text-amber-700">
              {suggestions.filter((s) => (s.item_type || s.target_type) === "INVENTORY").length} ingredients
            </span>
            <span>•</span>
            <span className="font-bold text-indigo-700">
              {suggestions.filter((s) => (s.item_type || s.target_type) === "PACKAGING").length} packaging
            </span>
          </div>
        </div>

        {/* Card 3: Open Purchase Orders */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Open POs
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              Pending Delivery
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-600 tracking-tight my-1">
            {orders.filter((o) => o.status === "DRAFT" || o.status === "ORDERED").length}
          </div>
          <div className="text-xs text-stone-500 pt-2 border-t border-stone-100">
            ₹
            {orders
              .filter((o) => o.status === "DRAFT" || o.status === "ORDERED")
              .reduce((sum, o) => sum + (o.total_estimated_cost ?? o.total_amount_inr ?? 0), 0)
              .toLocaleString("en-IN")}{" "}
            active commitments
          </div>
        </div>

        {/* Card 4: Goods Received into Stock */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <PackageCheck className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Stock Received
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              Kitchen Replenished
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-700 tracking-tight my-1">
            {orders.filter((o) => o.status === "RECEIVED").length}
          </div>
          <div className="text-xs text-stone-500 pt-2 border-t border-stone-100">
            Fully checked & booked into inventory
          </div>
        </div>
      </div>

      {/* Main Tab Bar & Controls Container (Inventory Standard Container) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            {/* Tab 1: Deficit Planner */}
            <button
              onClick={() => handleTabChange("planner")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "planner"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${activeTab === "planner" ? "text-amber-400" : "text-amber-600"
                  }`}
              />
              <span>Deficit & Restock Planner</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {suggestions.length}
              </span>
            </button>

            {/* Tab 2: Purchase Orders */}
            <button
              onClick={() => handleTabChange("purchase_orders")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "purchase_orders"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              <Truck
                className={`w-3.5 h-3.5 ${activeTab === "purchase_orders" ? "text-amber-400" : "text-stone-500"
                  }`}
              />
              <span>Purchase Orders</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {orders.length}
              </span>
            </button>

            {/* Tab 3: Alerts & Notification Log */}
            <button
              onClick={() => handleTabChange("notifications")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "notifications"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
            >
              <Send
                className={`w-3.5 h-3.5 ${activeTab === "notifications" ? "text-amber-400" : "text-stone-500"
                  }`}
              />
              <span>Notification Audit & Dispatches</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {notifications.length}
              </span>
            </button>
          </div>

          {/* Quick action buttons on right */}
          <div className="flex items-center gap-2">
            {activeTab === "planner" && suggestions.length > 0 && (
              <button
                onClick={handleBulkPOAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bulk PO for All Deficits</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === "planner"
                  ? "Search deficit items, suppliers, categories..."
                  : activeTab === "purchase_orders"
                    ? "Search PO number, supplier..."
                    : "Search alert titles, messages..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPlannerPage(1);
                setOrderPage(1);
                setNotifPage(1);
              }}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
            />
          </div>

          {/* Context Filters */}
          <div className="flex items-center gap-2">
            {activeTab === "planner" && (
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => {
                    setTargetFilter("ALL");
                    setPlannerPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${targetFilter === "ALL"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                    }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => {
                    setTargetFilter("INVENTORY");
                    setPlannerPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${targetFilter === "INVENTORY"
                      ? "bg-white text-emerald-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                    }`}
                >
                  Ingredients
                </button>
                <button
                  onClick={() => {
                    setTargetFilter("PACKAGING");
                    setPlannerPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${targetFilter === "PACKAGING"
                      ? "bg-white text-indigo-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                    }`}
                >
                  Packaging
                </button>
              </div>
            )}

            {activeTab === "purchase_orders" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    setOrderPage(1);
                  }}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 font-bold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ORDERED">Ordered / In Transit</option>
                  <option value="RECEIVED">Goods Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Severity:</span>
                <select
                  value={notifSeverityFilter}
                  onChange={(e) => {
                    setNotifSeverityFilter(e.target.value);
                    setNotifPage(1);
                  }}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 font-bold focus:outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical Alerts</option>
                  <option value="WARNING">Warnings</option>
                  <option value="INFO">Informational</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: DEFICIT & RESTOCK PLANNER */}
        {activeTab === "planner" && (
          <div className="space-y-4">
            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : filteredSuggestions.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-800">
                  No Deficits Detected!
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                  All ingredients and packaging materials are comfortably above their safety thresholds.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Item & Target</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Current Stock</th>
                        <th className="py-3 px-4">Safety Buffer</th>
                        <th className="py-3 px-4 text-right">Suggested Order</th>
                        <th className="py-3 px-4 text-right">Est. Unit Cost</th>
                        <th className="py-3 px-4 text-right">Est. Total</th>
                        <th className="py-3 px-4">Preferred Supplier</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {paginatedSuggestions.map((s, idx) => {
                        const sType = s.item_type || s.target_type || "INVENTORY";
                        const sId = s.item_id || s.target_id || idx;
                        const sName = s.name || s.item_name || "Item";
                        const reorder = s.reorder_level ?? s.reorder_threshold ?? 0;
                        const crit = s.minimum_stock ?? s.critical_threshold ?? (reorder * 0.5);
                        const stockRatio = reorder > 0 ? (s.current_stock / reorder) * 100 : 0;
                        const isCritical = s.current_stock <= crit;
                        const suggested = s.suggested_order_qty ?? s.suggested_reorder_qty ?? 0;
                        const unitCost = s.purchase_cost ?? s.estimated_unit_cost_inr ?? 0;
                        const totalCost = s.estimated_cost ?? s.estimated_total_cost_inr ?? (suggested * unitCost);
                        const supplierName = s.supplier || s.supplier_name || "Primary Mandi Supplier";

                        return (
                          <tr key={`${sType}-${sId}`} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${sType === "INVENTORY"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-indigo-100 text-indigo-800"
                                    }`}
                                >
                                  {sType === "INVENTORY" ? "I" : "P"}
                                </span>
                                <div>
                                  <span className="font-bold text-stone-900 block">
                                    {sName}
                                  </span>
                                  <span className="text-[10px] text-stone-400 capitalize">
                                    {sType === "INVENTORY"
                                      ? "Raw Material"
                                      : "Packaging Material"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-semibold">
                                {s.category}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div>
                                <span
                                  className={`font-black ${isCritical ? "text-rose-600" : "text-amber-600"
                                    }`}
                                >
                                  {s.current_stock} {s.unit}
                                </span>
                                <div className="w-20 bg-stone-100 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full rounded-full ${isCritical ? "bg-rose-500" : "bg-amber-500"
                                      }`}
                                    style={{ width: `${Math.min(stockRatio, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-stone-600">
                              <div>
                                <span>Reorder: {reorder} {s.unit}</span>
                                {crit > 0 && (
                                  <span className="block text-[10px] text-rose-600 font-semibold">
                                    Crit: {crit} {s.unit}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <span className="font-black text-emerald-900 text-sm">
                                +{suggested} {s.unit}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right text-stone-600">
                              ₹{unitCost}
                            </td>

                            <td className="py-3 px-4 text-right font-black text-stone-900">
                              ₹{totalCost.toLocaleString("en-IN")}
                            </td>

                            <td className="py-3 px-4 text-stone-600 truncate max-w-[160px]">
                              {supplierName}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleAddSingleToPO(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950 text-white hover:bg-emerald-900 text-[11px] font-bold shadow-2xs transition-colors"
                                title="Add item to a new purchase order"
                              >
                                <Plus className="w-3 h-3 text-amber-400" />
                                <span>Add to PO</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Showing {paginatedSuggestions.length} of {filteredSuggestions.length} deficit items
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPlannerPage((p) => Math.max(1, p - 1))}
                      disabled={plannerPage <= 1}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-800">
                      Page {plannerPage} of {totalPlannerPages}
                    </span>
                    <button
                      onClick={() => setPlannerPage((p) => Math.min(totalPlannerPages, p + 1))}
                      disabled={plannerPage >= totalPlannerPages}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PURCHASE ORDERS */}
        {activeTab === "purchase_orders" && (
          <div className="space-y-4">
            {loading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                <Truck className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-800">
                  No Purchase Orders Found
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-3">
                  There are no purchase orders matching this filter.
                </p>
                <button
                  onClick={() => {
                    setPreselectedSuggestions([]);
                    setCreatePOOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-950 text-white text-xs font-bold hover:bg-emerald-900 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create First PO</span>
                </button>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">PO Number</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-4 text-center">Items Count</th>
                        <th className="py-3 px-4 text-right">Order Amount</th>
                        <th className="py-3 px-4">Date Created</th>
                        <th className="py-3 px-4">Expected Delivery</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {paginatedOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                            {po.po_number}
                          </td>

                          <td className="py-3 px-4 font-bold text-stone-800">
                            {po.supplier_name}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold text-[11px]">
                              {po.items.length} items
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-black text-stone-900 text-sm">
                            ₹{(po.total_estimated_cost ?? po.total_amount_inr ?? 0).toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-4 text-stone-500">
                            {new Date(po.created_at).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-4 text-stone-600">
                            {(po.expected_date || po.ordered_at) ? (
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                {new Date(po.expected_date || po.ordered_at!).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-stone-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                po.status === "RECEIVED"
                                  ? "success"
                                  : po.status === "ORDERED"
                                    ? "warning"
                                    : po.status === "DRAFT"
                                      ? "neutral"
                                      : "danger"
                              }
                              size="sm"
                            >
                              {po.status}
                            </Badge>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewPO(po)}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold transition-colors"
                              >
                                View PO
                              </button>

                              {po.status === "ORDERED" && (
                                <button
                                  onClick={() => handleDirectReceiveStock(po)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black transition-colors flex items-center gap-1 shadow-2xs"
                                  title="Receive goods into kitchen stock"
                                >
                                  <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Receive</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Showing {paginatedOrders.length} of {filteredOrders.length} orders
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                      disabled={orderPage <= 1}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-800">
                      Page {orderPage} of {totalOrderPages}
                    </span>
                    <button
                      onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                      disabled={orderPage >= totalOrderPages}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATION AUDIT & DISPATCHES */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : filteredNotifications.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-800">
                  No Notifications Found
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                  No kitchen alerts or order notifications match your filter criteria.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Severity & Type</th>
                        <th className="py-3 px-4">Notification Details</th>
                        <th className="py-3 px-4">Channel</th>
                        <th className="py-3 px-4">Delivery Status</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {paginatedNotifications.map((notif) => {
                        const isCritical = notif.severity === "CRITICAL";
                        const isWarning = notif.severity === "WARNING";

                        return (
                          <tr
                            key={notif.id}
                            className={`hover:bg-stone-50/60 transition-colors ${!notif.is_read ? "bg-amber-50/20" : ""
                              }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isCritical
                                      ? "bg-rose-100 text-rose-700"
                                      : isWarning
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                >
                                  {isCritical ? (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  ) : isWarning ? (
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block ${isCritical
                                        ? "bg-rose-200 text-rose-900"
                                        : isWarning
                                          ? "bg-amber-200 text-amber-900"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                  >
                                    {notif.severity}
                                  </span>
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    {notif.type}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-md">
                              <span className="font-bold text-stone-900 block leading-tight">
                                {notif.title}
                              </span>
                              <span className="text-stone-600 text-[11px] block mt-0.5 line-clamp-2">
                                {notif.message}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px] font-semibold border border-stone-200">
                                {notif.channel}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {notif.channel_status === "DELIVERED" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Delivered
                                </span>
                              ) : (
                                <span className="text-stone-400 text-[11px] font-medium">
                                  Ready / Pending
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                              <div>
                                <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                                <span className="block text-[10px] text-stone-400">
                                  {new Date(notif.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenDispatch(notif)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
                                >
                                  <Send className="w-3 h-3 text-emerald-600" />
                                  <span>Dispatch</span>
                                </button>

                                {!notif.is_read && (
                                  <button
                                    onClick={async () => {
                                      await api.markNotificationAsRead(notif.id);
                                      setNotifications((prev) =>
                                        prev.map((n) =>
                                          n.id === notif.id ? { ...n, is_read: true } : n
                                        )
                                      );
                                    }}
                                    className="px-2 py-1 text-stone-400 hover:text-stone-700 text-[11px]"
                                  >
                                    Dismiss
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Showing {paginatedNotifications.length} of {filteredNotifications.length} notifications
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNotifPage((p) => Math.max(1, p - 1))}
                      disabled={notifPage <= 1}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-800">
                      Page {notifPage} of {totalNotifPages}
                    </span>
                    <button
                      onClick={() => setNotifPage((p) => Math.min(totalNotifPages, p + 1))}
                      disabled={notifPage >= totalNotifPages}
                      className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title="Receive Stock"
        message="Receive goods from this PO? This will update kitchen stock levels."
        confirmLabel="Receive Stock"
        variant="danger"
        loading={confirmBusy}
        onConfirm={async () => {
          if (!confirmAction) return;
          setConfirmBusy(true);
          try { await confirmAction(); } finally { setConfirmBusy(false); setConfirmAction(null); }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

export default function RestockPage() {
  return (
    <React.Suspense fallback={<div className="p-8"><TableSkeleton rows={6} columns={6} /></div>}>
      <RestockManagementContent />
    </React.Suspense>
  );
}
