"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import {
  UserCircle2,
  Plus,
  RefreshCw,
  Search,
  Crown,
  Star,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  Users,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingBag,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/services/api";
import {
  Customer,
  CustomerDetail,
  CustomerOrderBrief,
  CustomerSegment,
  CustomerSummary,
} from "@/types";

type ViewTab = "all" | "top" | "history";

// ── Helpers ─────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function SegmentBadge({ segment }: { segment: CustomerSegment }) {
  const map: Record<CustomerSegment, { label: string; cls: string; icon: React.ReactNode }> = {
    VIP: {
      label: "VIP",
      cls: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: <Crown className="w-3 h-3" />,
    },
    REGULAR: {
      label: "Regular",
      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: <Star className="w-3 h-3" />,
    },
    NEW: {
      label: "New",
      cls: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    LAPSED: {
      label: "Lapsed",
      cls: "bg-rose-50 text-rose-600 border border-rose-200",
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };
  const m = map[segment] ?? map.NEW;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.cls}`}>
      {m.icon}
      {m.label}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const map: Record<string, string> = {
    WEBSITE: "bg-violet-50 text-violet-700 border border-violet-200",
    ZOMATO: "bg-red-50 text-red-600 border border-red-200",
    SWIGGY: "bg-orange-50 text-orange-700 border border-orange-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[platform] ?? "bg-stone-100 text-stone-600"}`}>
      {platform.charAt(0) + platform.slice(1).toLowerCase()}
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-600 border border-rose-200",
    PREPARING: "bg-amber-50 text-amber-700 border border-amber-200",
    NEW: "bg-blue-50 text-blue-700 border border-blue-200",
    CONFIRMED: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    READY: "bg-teal-50 text-teal-700 border border-teal-200",
    OUT_FOR_DELIVERY: "bg-violet-50 text-violet-700 border border-violet-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[status] ?? "bg-stone-100 text-stone-600"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ── Customer Detail Drawer ───────────────────────────────────────
function CustomerDrawer({
  customerId,
  onClose,
  onUpdated,
}: {
  customerId: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCustomer(customerId);
      if (res.data) {
        setCustomer(res.data);
        setEditName(res.data.name);
        setEditEmail(res.data.email ?? "");
        setEditAddress(res.data.default_address ?? "");
      }
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await api.updateCustomer(customer.id, {
        name: editName,
        email: editEmail || undefined,
        default_address: editAddress || undefined,
      });
      setEditMode(false);
      await fetchCustomer();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!customer || !noteInput.trim()) return;
    setAddingNote(true);
    try {
      await api.addCustomerNote(customer.id, noteInput.trim());
      setNoteInput("");
      await fetchCustomer();
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Customer Profile</p>
            <h2 className="text-white text-xl font-bold font-serif">
              {loading ? "Loading..." : customer?.name}
            </h2>
            {customer && (
              <div className="flex items-center gap-2 mt-1.5">
                <SegmentBadge segment={customer.segment as CustomerSegment} />
                <span className="text-emerald-300 text-xs">Since {new Date(customer.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 p-6">
            <TableSkeleton rows={5} columns={4} />
          </div>
        ) : !customer ? (
          <div className="flex-1 flex items-center justify-center text-sm text-stone-500">Customer not found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* KPI Mini Cards */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-stone-100 bg-stone-50">
              <div className="bg-white rounded-xl p-3 border border-stone-200 text-center shadow-sm">
                <p className="text-xs text-stone-500 font-medium">Lifetime Value</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">{formatCurrency(customer.total_spent)}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-stone-200 text-center shadow-sm">
                <p className="text-xs text-stone-500 font-medium">Orders</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{customer.total_orders}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-stone-200 text-center shadow-sm">
                <p className="text-xs text-stone-500 font-medium">Avg. Order</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{formatCurrency(customer.average_order_value)}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-4 border-b border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Contact</h3>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  <Edit2 className="w-3 h-3" />
                  {editMode ? "Cancel" : "Edit"}
                </button>
              </div>
              {editMode ? (
                <div className="space-y-2">
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Full name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Email address"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                  <textarea
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none h-16"
                    placeholder="Default address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-emerald-900 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2.5 text-sm text-stone-700">
                      <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.default_address && (
                    <div className="flex items-start gap-2.5 text-sm text-stone-700">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
                      <span>{customer.default_address}</span>
                    </div>
                  )}
                  {customer.last_order_date && (
                    <div className="flex items-center gap-2.5 text-sm text-stone-500">
                      <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span>Last order {timeAgo(customer.last_order_date)}</span>
                    </div>
                  )}
                  {customer.preferred_platform && (
                    <div className="flex items-center gap-2.5 text-sm text-stone-500">
                      <ShoppingBag className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span>Prefers <span className="font-medium text-stone-700">{customer.preferred_platform.toLowerCase()}</span></span>
                    </div>
                  )}
                  {customer.preferred_item && (
                    <div className="flex items-center gap-2.5 text-sm text-stone-500">
                      <Star className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                      <span>Favourite: <span className="font-medium text-stone-700">{customer.preferred_item}</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div className="p-4 border-b border-stone-100">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> CRM Notes
              </h3>
              {customer.notes ? (
                <pre className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg p-3 whitespace-pre-wrap font-sans mb-3 max-h-28 overflow-y-auto">
                  {customer.notes}
                </pre>
              ) : (
                <p className="text-xs text-stone-400 mb-3">No notes yet. Add your first note below.</p>
              )}
              <div className="flex gap-2">
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add internal note..."
                  className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-900"
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !noteInput.trim()}
                  className="px-3 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="p-4">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Recent Orders
              </h3>
              {customer.recent_orders.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-4">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.recent_orders.map((order) => (
                    <div key={order.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{order.order_number}</p>
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{order.items_summary}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-black text-emerald-700">{formatCurrency(order.total_amount)}</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">{timeAgo(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <PlatformBadge platform={order.platform} />
                        <OrderStatusBadge status={order.order_status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page Content ────────────────────────────────────────────
function CustomersPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ViewTab | null;
  const [activeTab, setActiveTab] = useState<ViewTab>(
    tabParam && ["all", "top", "history"].includes(tabParam) ? tabParam : "all"
  );

  useEffect(() => {
    if (tabParam && ["all", "top", "history"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("ALL");
  const [sortBy, setSortBy] = useState("total_spent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Drawer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [summaryRes, listRes] = await Promise.all([
        api.getCustomerSummary(),
        api.listCustomers({
          page,
          page_size: PAGE_SIZE,
          search: search || undefined,
          segment: segment !== "ALL" ? segment : undefined,
          sort_by: sortBy,
        }),
      ]);

      if (summaryRes.data) setSummary(summaryRes.data);
      setCustomers(listRes.items);
      setTotal(listRes.total);
      setTotalPages(listRes.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, segment, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: "all", label: "All Customers", icon: <Users className="w-3.5 h-3.5" /> },
    { id: "top", label: "Top Spenders", icon: <Crown className="w-3.5 h-3.5" /> },
    { id: "history", label: "Order History", icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const SEGMENT_FILTERS = [
    { id: "ALL", label: "All" },
    { id: "VIP", label: "VIP" },
    { id: "REGULAR", label: "Regular" },
    { id: "NEW", label: "New" },
    { id: "LAPSED", label: "Lapsed" },
  ];

  const SORT_OPTIONS = [
    { value: "total_spent", label: "Top Spenders" },
    { value: "total_orders", label: "Most Orders" },
    { value: "last_order", label: "Recent Activity" },
    { value: "newest", label: "Newest Customers" },
    { value: "name", label: "Name (A–Z)" },
  ];

  // Get top 20 for top spenders tab
  const topSpenders = [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 20);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
              Customer CRM
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-900 text-white">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            360° customer profiles — lifetime value, order history, segments, and internal notes.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          title="Refresh"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-emerald-800 hover:border-emerald-300 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* KPI Summary Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Total Customers", value: summary.total_customers, icon: <Users className="w-4 h-4" />, color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-200" },
            { label: "New This Month", value: summary.new_customers, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "VIP Customers", value: summary.vip_customers, icon: <Crown className="w-4 h-4" />, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Regular", value: summary.regular_customers, icon: <Star className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Lapsed (>30d)", value: summary.lapsed_customers, icon: <AlertTriangle className="w-4 h-4" />, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
            { label: "Total Revenue", value: formatCurrency(summary.total_revenue), icon: <IndianRupee className="w-4 h-4" />, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", isText: true },
            { label: "Avg. Order Value", value: formatCurrency(summary.average_order_value), icon: <TrendingUp className="w-4 h-4" />, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", isText: true },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} ${kpi.border} border rounded-2xl p-3.5 shadow-sm`}>
              <div className={`${kpi.color} mb-1`}>{kpi.icon}</div>
              <p className={`text-lg font-black ${kpi.color}`}>
                {(kpi as any).isText ? kpi.value : kpi.value.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-emerald-800 text-emerald-900 bg-emerald-50/50"
                  : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: All Customers */}
        {activeTab === "all" && (
          <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Segment Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SEGMENT_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setSegment(f.id); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      segment === f.id
                        ? "bg-emerald-950 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:ml-auto">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Name, phone, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadData()}
                    className="bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-900 w-52"
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="border border-stone-200 rounded-xl px-3 py-2 text-xs bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-900"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : customers.length === 0 ? (
              <EmptyState
                title="No Customers Found"
                description="No customer records match your current filters."
                actionText="Clear Filters"
                onAction={() => { setSearch(""); setSegment("ALL"); }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-stone-100">
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Segment</th>
                        <th className="px-4 py-3 text-right">Orders</th>
                        <th className="px-4 py-3 text-right">Lifetime Value</th>
                        <th className="px-4 py-3 text-right">Avg. Order</th>
                        <th className="px-4 py-3 text-left">Last Order</th>
                        <th className="px-4 py-3 text-left"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50/80 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white font-black text-sm shadow-sm flex-shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                                <p className="text-xs text-stone-500">{c.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <SegmentBadge segment={c.segment as CustomerSegment} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-700">{c.total_orders}</td>
                          <td className="px-4 py-3 text-right font-black text-emerald-700">{formatCurrency(c.total_spent)}</td>
                          <td className="px-4 py-3 text-right text-stone-600">{formatCurrency(c.average_order_value)}</td>
                          <td className="px-4 py-3 text-stone-500 text-xs">
                            {c.last_order_date ? timeAgo(c.last_order_date) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedCustomerId(c.id)}
                              className="px-3 py-1.5 bg-emerald-900 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50/50">
                    <p className="text-xs text-stone-500">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-stone-600 font-medium px-2">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab: Top Spenders */}
        {activeTab === "top" && (
          <div className="p-4">
            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topSpenders.map((c, idx) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm ${
                        idx === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600" :
                        idx === 1 ? "bg-gradient-to-br from-slate-400 to-slate-600" :
                        idx === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                        "bg-gradient-to-br from-emerald-700 to-emerald-950"
                      }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      {idx < 3 && (
                        <span className="absolute -top-1 -right-1 text-[10px] font-black">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-bold text-slate-800 text-sm truncate">{c.name}</p>
                        <SegmentBadge segment={c.segment as CustomerSegment} />
                      </div>
                      <p className="text-xs text-stone-500">{c.phone} • {c.total_orders} orders</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-emerald-700 text-base">{formatCurrency(c.total_spent)}</p>
                      <p className="text-[10px] text-stone-400">LTV</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Order History */}
        {activeTab === "history" && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by phone or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadData()}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-900"
                />
              </div>
            </div>
            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : customers.length === 0 ? (
              <EmptyState title="No Results" description="Search for a customer to see their order history." />
            ) : (
              <div className="space-y-2">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                        <SegmentBadge segment={c.segment as CustomerSegment} />
                      </div>
                      <p className="text-xs text-stone-500">{c.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{c.total_orders} orders</p>
                      <p className="text-xs text-stone-400">{c.last_order_date ? timeAgo(c.last_order_date) : "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomerId !== null && (
        <CustomerDrawer
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onUpdated={() => loadData(true)}
        />
      )}
    </DashboardLayout>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-8"><TableSkeleton rows={6} columns={6} /></div></DashboardLayout>}>
      <CustomersPageContent />
    </Suspense>
  );
}
