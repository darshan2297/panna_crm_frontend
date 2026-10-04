"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  ArrowDownCircle,
  IndianRupee,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calculator,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewModeToggle } from "@/components/common/ViewModeToggle";
import { SearchInput } from "@/components/common/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PackagingItemModal } from "@/components/packaging/PackagingItemModal";
import { PackagingAdjustmentModal } from "@/components/packaging/PackagingAdjustmentModal";
import { PackagingRuleModal } from "@/components/packaging/PackagingRuleModal";
import { api } from "@/services/api";
import {
  PackagingItem,
  PackagingItemInput,
  PackagingSummary,
  PackagingTransaction,
  PackagingTransactionInput,
  PackagingConsumptionRule,
  PackagingConsumptionRuleInput,
  PackagingOrderSimulationItem,
  PackagingOrderSimulationResponse,
} from "@/types";

type ViewTab = "items" | "stock" | "consumption";
type StatusFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "CRITICAL_STOCK" | "OUT_OF_STOCK";

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: "All Items", value: "ALL" },
  { label: "Biryani Containers", value: "CONTAINER" },
  { label: "Delivery Bags", value: "BAG" },
  { label: "Accompaniments (Cups/Pouches)", value: "ACCOMPANIMENT" },
  { label: "Cutlery Kits", value: "CUTLERY" },
  { label: "Sealing & Labels", value: "SEALING_LABEL" },
  { label: "Other Essentials", value: "OTHER" },
];

function PackagingDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ViewTab | null;
  const [activeTab, setActiveTab] = useState<ViewTab>(
    tabParam && ["items", "stock", "consumption"].includes(tabParam) ? tabParam : "items"
  );

  useEffect(() => {
    if (tabParam && ["items", "stock", "consumption"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Master Data State
  const [summary, setSummary] = useState<PackagingSummary | null>(null);
  const [items, setItems] = useState<PackagingItem[]>([]);
  const [rules, setRules] = useState<PackagingConsumptionRule[]>([]);
  const [transactions, setTransactions] = useState<PackagingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination for Items Catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [itemsPageSize, setItemsPageSize] = useState<number>(12);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters & Pagination for Stock Tab
  const [stockPage, setStockPage] = useState<number>(1);
  const [stockPageSize, setStockPageSize] = useState<number>(10);

  // Filters & Pagination for Transactions Log
  const [selectedTxType, setSelectedTxType] = useState<string>("ALL");
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);
  const [txTotal, setTxTotal] = useState<number>(0);
  const [txTotalPages, setTxTotalPages] = useState<number>(1);

  // Order Simulator State
  const [simDumBiryani500, setSimDumBiryani500] = useState<number>(2);
  const [simDumBiryani1kg, setSimDumBiryani1kg] = useState<number>(1);
  const [simStarters, setSimStarters] = useState<number>(1);
  const [simDesserts, setSimDesserts] = useState<number>(2);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<PackagingOrderSimulationResponse | null>(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PackagingItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<PackagingItem | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [summaryRes, itemsRes, rulesRes] = await Promise.all([
        api.getPackagingSummary(),
        api.getPackagingItems({ page: 1, page_size: 100 }),
        api.getPackagingRules(),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data.items);
      }
      if (rulesRes.success && rulesRes.data) {
        setRules(rulesRes.data);
      }
    } catch (err) {
      console.error("Failed to load packaging data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load Transactions when on consumption tab or page changes
  const loadTransactions = useCallback(async () => {
    try {
      const res = await api.getPackagingTransactions({
        transaction_type: selectedTxType,
        page: txPage,
        page_size: txPageSize,
      });
      if (res.success && res.data) {
        setTransactions(res.data.items);
        setTxTotal(res.data.total);
        setTxTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error("Failed to load packaging transactions:", err);
    }
  }, [selectedTxType, txPage, txPageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "consumption") {
      loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  // Run Order Simulation
  const handleSimulate = async () => {
    const simItems: PackagingOrderSimulationItem[] = [];
    if (simDumBiryani500 > 0) {
      simItems.push({ dish_category: "Dum Biryani", portion_size: "500g", quantity: simDumBiryani500 });
    }
    if (simDumBiryani1kg > 0) {
      simItems.push({ dish_category: "Dum Biryani", portion_size: "1kg", quantity: simDumBiryani1kg });
    }
    if (simStarters > 0) {
      simItems.push({ dish_category: "Starters & Kebabs", portion_size: "ALL", quantity: simStarters });
    }
    if (simDesserts > 0) {
      simItems.push({ dish_category: "Desserts", portion_size: "ALL", quantity: simDesserts });
    }

    if (simItems.length === 0) {
      setSimResult(null);
      return;
    }

    try {
      setSimLoading(true);
      const res = await api.simulateOrderPackaging(simItems);
      if (res.success && res.data) {
        setSimResult(res.data);
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimLoading(false);
    }
  };

  // Run initial simulation once rules are loaded
  useEffect(() => {
    if (rules.length > 0 && !simResult) {
      handleSimulate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when rules first load
  }, [rules]);

  // Filter items in catalog tab
  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus === "LOW_STOCK" && !item.is_low_stock) return false;
    if (selectedStatus === "CRITICAL_STOCK" && !item.is_critical_stock) return false;
    if (selectedStatus === "OUT_OF_STOCK" && item.current_stock > 0) return false;
    if (selectedStatus === "IN_STOCK" && (item.is_low_stock || item.current_stock === 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchMaterial = item.material.toLowerCase().includes(q);
      const matchSupplier = item.supplier?.toLowerCase().includes(q) || false;
      return matchName || matchSku || matchMaterial || matchSupplier;
    }

    return true;
  });

  // Low stock / replenishment items
  const lowStockItems = items.filter((item) => item.current_stock <= item.reorder_level);

  // Pagination for catalog items
  const totalItemPages = Math.ceil(filteredItems.length / itemsPageSize) || 1;
  const paginatedItems = filteredItems.slice(
    (itemsPage - 1) * itemsPageSize,
    itemsPage * itemsPageSize
  );

  // Pagination for low stock items
  const totalStockPages = Math.ceil(lowStockItems.length / stockPageSize) || 1;
  const paginatedLowStockItems = lowStockItems.slice(
    (stockPage - 1) * stockPageSize,
    stockPage * stockPageSize
  );

  // Handlers for Modals
  const handleCreateOrUpdateItem = async (input: PackagingItemInput) => {
    if (editingItem) {
      await api.updatePackagingItem(editingItem.id, input);
    } else {
      await api.createPackagingItem(input);
    }
    await loadData(true);
  };

  const handleDeleteItem = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate packaging item "${name}"?`)) {
      return;
    }
    try {
      await api.deletePackagingItem(id);
      await loadData(true);
    } catch (err: any) {
      alert(err?.message || "Failed to delete item.");
    }
  };

  const handleAdjustStock = async (itemId: number, payload: PackagingTransactionInput) => {
    await api.adjustPackagingStock(itemId, payload);
    await loadData(true);
    if (activeTab === "consumption") {
      await loadTransactions();
    }
  };

  const handleCreateRule = async (ruleInput: PackagingConsumptionRuleInput) => {
    await api.createPackagingRule(ruleInput);
    const res = await api.getPackagingRules();
    if (res.success && res.data) {
      setRules(res.data);
    }
    handleSimulate();
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm("Remove this packaging consumption rule?")) return;
    try {
      await api.deletePackagingRule(id);
      const res = await api.getPackagingRules();
      if (res.success && res.data) {
        setRules(res.data);
      }
      handleSimulate();
    } catch (err: any) {
      alert(err?.message || "Failed to delete rule.");
    }
  };

  const openAdjustModal = (item?: PackagingItem) => {
    setAdjustingItem(item || null);
    setIsAdjustModalOpen(true);
  };

  const openEditModal = (item: PackagingItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const openNewItemModal = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return <Badge variant="success">STOCK IN</Badge>;
      case "STOCK_OUT":
        return <Badge variant="info">STOCK OUT</Badge>;
      case "WASTAGE":
        return <Badge variant="danger">WASTAGE</Badge>;
      case "ORDER_CONSUMPTION":
        return <Badge variant="brand">ORDER CONSUMPTION</Badge>;
      case "AUDIT_CORRECTION":
        return <Badge variant="warning">AUDIT FIX</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "CONTAINER":
        return "Container / Handi";
      case "BAG":
        return "Delivery Bag";
      case "ACCOMPANIMENT":
        return "Accompaniment";
      case "CUTLERY":
        return "Cutlery Kit";
      case "SEALING_LABEL":
        return "Sealing / Label";
      default:
        return category;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header matching Inventory & Menu screens */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Packaging & Materials Supply
              </span>
              <span className="text-xs text-stone-400 font-medium">Phase 8 Live</span>
            </div>
            <h1 className="text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
              <Package className="w-7 h-7 text-emerald-900" />
              Packaging Management
            </h1>
            <p className="text-sm text-stone-600">
              Handi containers, Kraft bags, raita cups, tamper sealing & automated order consumption engine
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-900" : ""}`} />
            </button>

            <button
              onClick={() => openAdjustModal()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>Record Stock Movement</span>
            </button>

            <button
              onClick={openNewItemModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Packaging Item</span>
            </button>
          </div>
        </div>

        {/* Master Summary KPI Cards matching Inventory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Valuation in Deep Emerald */}
          <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-5 rounded-2xl shadow-sm border border-emerald-800/40 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-200">
                Packaging Valuation
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-amber-400 tracking-tight my-1">
              {summary ? formatCurrency(summary.total_packaging_value_inr) : "₹0.00"}
            </div>
            <div className="text-xs text-emerald-300 flex items-center gap-1.5 pt-2 border-t border-emerald-800/60">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{summary?.category_valuations?.length || 0} material categories</span>
            </div>
          </div>

          {/* Card 2: Tracked Items */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700">
                Tracked Items
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight my-1">
              {summary?.total_items || items.length}
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-2 pt-2 border-t border-stone-100">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {summary?.in_stock_items || 0} normal
              </span>
              <span>•</span>
              <span>{rules.length} auto rules</span>
            </div>
          </div>

          {/* Card 3: Stock Health */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700">
                Stock Health
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-amber-600 tracking-tight my-1">
              {(summary?.low_stock_items || 0) + (summary?.critical_stock_items || 0)}
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-2 pt-2 border-t border-stone-100">
              {(summary?.critical_stock_items || 0) > 0 && (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {summary?.critical_stock_items} Critical
                </span>
              )}
              <span className="text-amber-700 font-medium">
                {summary?.low_stock_items || 0} below reorder
              </span>
            </div>
          </div>

          {/* Card 4: Daily Consumption */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700">
                Today&apos;s Usage
              </span>
              <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight my-1">
              {summary ? `${summary.daily_consumption_units} units` : "0 units"}
            </div>
            <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-2 border-t border-stone-100">
              <span className="font-bold text-stone-900">
                {summary ? formatCurrency(summary.daily_consumption_cost_inr) : "₹0.00"}
              </span>
              <span>cost deduced</span>
            </div>
          </div>
        </div>

        {/* Main Tab Bar & Controls Container */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
          {/* Navigation Tabs matching Inventory styling */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("items")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "items"
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Items Catalog</span>
                <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("stock")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "stock"
                    ? "bg-amber-500 text-stone-950 shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-900" />
                <span>Stock Replenishment</span>
                {lowStockItems.length > 0 && (
                  <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold">
                    {lowStockItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("consumption")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "consumption"
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Consumption & Order Rules</span>
                <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                  {rules.length}
                </span>
              </button>
            </div>

            {activeTab === "items" && (
              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            )}
          </div>

          {/* TAB 1: ITEMS CATALOG */}
          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Category Filter Pills in Consistent Panna Green */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setItemsPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      selectedCategory === cat.value
                        ? "bg-emerald-900 text-white shadow-sm"
                        : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <SearchInput
                  value={searchQuery}
                  onChange={(v) => {
                    setSearchQuery(v);
                    setItemsPage(1);
                  }}
                  placeholder="Search by container name, SKU, material, or supplier..."
                />

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value as StatusFilter);
                      setItemsPage(1);
                    }}
                    className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  >
                    <option value="ALL">All Stock Statuses</option>
                    <option value="IN_STOCK">Healthy / In Stock</option>
                    <option value="LOW_STOCK">Below Reorder Level</option>
                    <option value="CRITICAL_STOCK">Critical Stock (&lt; Min)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Catalog Content */}
              {loading ? (
                <LoadingState message="Loading packaging items catalog..." />
              ) : filteredItems.length === 0 ? (
                <EmptyState
                  icon={<Package className="w-8 h-8 text-stone-400" />}
                  title="No packaging items found"
                  description={searchQuery ? "Try refining your search terms or filters." : "Start by adding your first packaging container or bag."}
                  actionText={searchQuery ? "Clear Search" : "+ Add Packaging Item"}
                  onAction={searchQuery ? () => setSearchQuery("") : openNewItemModal}
                />
              ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedItems.map((item) => {
                    const stockPct = Math.min(
                      100,
                      Math.round((item.current_stock / (item.reorder_level * 1.5 || 100)) * 100)
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:border-emerald-700/40 hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Top Meta */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                              {item.sku}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              {getCategoryLabel(item.category)}
                            </span>
                          </div>

                          {/* Title & Material */}
                          <h3 className="text-sm font-bold text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {item.material} {item.capacity ? `• ${item.capacity}` : ""}
                          </p>

                          {/* Stock Progress Bar */}
                          <div className="mt-4 p-3 bg-stone-50/70 rounded-xl border border-stone-200/60">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-stone-600 font-medium">In Stock</span>
                              <span className="font-bold text-stone-900">
                                {item.current_stock} {item.unit}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  item.is_critical_stock
                                    ? "bg-rose-600"
                                    : item.is_low_stock
                                    ? "bg-amber-500"
                                    : "bg-emerald-600"
                                }`}
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1.5">
                              <span>Min: {item.minimum_stock}</span>
                              <span>Reorder: {item.reorder_level}</span>
                            </div>
                          </div>

                          {/* Pricing & Valuation */}
                          <div className="mt-3 flex items-center justify-between text-xs border-t border-stone-100 pt-2.5">
                            <div>
                              <span className="text-[10px] text-stone-500 block">Cost / {item.unit}</span>
                              <span className="font-semibold text-stone-900">₹{item.purchase_cost.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-stone-500 block">Valuation</span>
                              <span className="font-bold text-stone-900">
                                {formatCurrency(item.total_valuation)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="px-2.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <History className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Movement</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Deactivate Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Item & SKU</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Material & Spec</th>
                          <th className="py-3 px-3 text-right">In Stock</th>
                          <th className="py-3 px-3 text-right">Min / Reorder</th>
                          <th className="py-3 px-3 text-right">Cost / Unit</th>
                          <th className="py-3 px-3 text-right">Valuation</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {paginatedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-stone-900 block text-xs">
                                {item.name}
                              </span>
                              <span className="font-mono text-[10px] text-stone-500">
                                {item.sku}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[11px] font-medium text-stone-800">
                                {getCategoryLabel(item.category)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-stone-500 text-[11px]">
                              {item.material} {item.capacity ? `(${item.capacity})` : ""}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-stone-900">
                              {item.current_stock} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right text-stone-500 text-[11px]">
                              {item.minimum_stock} / {item.reorder_level} {item.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-stone-900">
                              ₹{item.purchase_cost.toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-stone-900">
                              {formatCurrency(item.total_valuation)}
                            </td>
                            <td className="py-3 px-3">
                              {item.current_stock === 0 ? (
                                <Badge variant="danger">Out of Stock</Badge>
                              ) : item.is_critical_stock ? (
                                <Badge variant="danger">Critical</Badge>
                              ) : item.is_low_stock ? (
                                <Badge variant="warning">Low Stock</Badge>
                              ) : (
                                <Badge variant="success">Normal</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openAdjustModal(item)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg transition-colors"
                                >
                                  Stock
                                </button>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination Controls for Catalog */}
              {filteredItems.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200">
                  <span className="text-xs text-stone-500">
                    Showing {(itemsPage - 1) * itemsPageSize + 1} to{" "}
                    {Math.min(itemsPage * itemsPageSize, filteredItems.length)} of {filteredItems.length} packaging items
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                      disabled={itemsPage === 1}
                      className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold px-2 text-stone-900">
                      Page {itemsPage} of {totalItemPages}
                    </span>
                    <button
                      onClick={() => setItemsPage((p) => Math.min(totalItemPages, p + 1))}
                      disabled={itemsPage === totalItemPages}
                      className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STOCK REPLENISHMENT */}
          {activeTab === "stock" && (
            <div className="space-y-6">
              {/* Category Valuation Breakdown */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-900" />
                  Packaging Valuation by Category
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {summary?.category_valuations?.map((cat) => (
                    <div key={cat.category} className="p-3 bg-stone-50/70 rounded-xl border border-stone-200/60">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block truncate">
                        {getCategoryLabel(cat.category)}
                      </span>
                      <span className="text-sm font-bold text-stone-900 block mt-1">
                        {formatCurrency(cat.total_valuation)}
                      </span>
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        {cat.item_count} items
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replenishment Alert Items */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Priority Reorder Items ({lowStockItems.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Containers, bags, and cutlery at or below reorder threshold
                    </p>
                  </div>
                  {lowStockItems.length > 0 && (
                    <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                      Requires Purchase Order
                    </span>
                  )}
                </div>

                {lowStockItems.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3 opacity-90" />
                    <h4 className="text-sm font-bold text-stone-900">Packaging Stock is Healthy!</h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                      All packaging containers, bags, and kits are comfortably above their safety reorder thresholds.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Item & SKU</th>
                          <th className="py-3 px-3 text-right">In Stock</th>
                          <th className="py-3 px-3 text-right">Reorder Level</th>
                          <th className="py-3 px-3 text-right">Deficit</th>
                          <th className="py-3 px-3 text-right">Suggested Order</th>
                          <th className="py-3 px-3 text-right">Est. Supplier Cost</th>
                          <th className="py-3 px-3">Supplier & Bin</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {paginatedLowStockItems.map((item) => {
                          const deficit = Math.max(0, item.reorder_level - item.current_stock);
                          const suggestedBatch = Math.max(deficit, item.minimum_stock * 2);
                          const estCost = suggestedBatch * item.purchase_cost;

                          return (
                            <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-semibold text-stone-900 block">{item.name}</span>
                                <span className="font-mono text-[10px] text-stone-500">{item.sku}</span>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-rose-600">
                                {item.current_stock} {item.unit}
                              </td>
                              <td className="py-3 px-3 text-right text-stone-500">
                                {item.reorder_level} {item.unit}
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-amber-600">
                                -{deficit} {item.unit}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-stone-900">
                                +{suggestedBatch} {item.unit}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-stone-900">
                                {formatCurrency(estCost)}
                              </td>
                              <td className="py-3 px-3 text-[11px] text-stone-500">
                                <div className="flex flex-col">
                                  <span className="text-stone-900 font-medium">{item.supplier || "Direct"}</span>
                                  <span className="text-[10px]">{item.storage_location || "Packing Bay"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => openAdjustModal(item)}
                                  className="px-3 py-1.5 text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors ml-auto"
                                >
                                  <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Restock</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination for Stock Replenishment */}
                {lowStockItems.length > stockPageSize && (
                  <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                    <span className="text-xs text-stone-500">
                      Showing {(stockPage - 1) * stockPageSize + 1} to{" "}
                      {Math.min(stockPage * stockPageSize, lowStockItems.length)} of {lowStockItems.length} alert items
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                        disabled={stockPage === 1}
                        className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold px-2 text-stone-900">
                        Page {stockPage} of {totalStockPages}
                      </span>
                      <button
                        onClick={() => setStockPage((p) => Math.min(totalStockPages, p + 1))}
                        disabled={stockPage === totalStockPages}
                        className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONSUMPTION & ORDER RULES */}
          {activeTab === "consumption" && (
            <div className="space-y-6">
              {/* SUBSECTION A: CONSUMPTION RULES MANAGER */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-900" />
                      Packaging Consumption Rules ({rules.length})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Automated material deductions triggered whenever an order is received
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRuleModalOpen(true)}
                    className="px-4 py-2 text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Add Consumption Rule</span>
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 text-xs">
                    No automated consumption rules defined yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Target Dish Category</th>
                          <th className="py-3 px-3">Portion Size</th>
                          <th className="py-3 px-3">Packaging Deducted</th>
                          <th className="py-3 px-3 text-right">Units / Dish</th>
                          <th className="py-3 px-3 text-right">Packaging Cost</th>
                          <th className="py-3 px-3">Rule Description</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {rules.map((rule) => (
                          <tr key={rule.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="py-3 px-4 font-semibold text-stone-900">
                              {rule.dish_category === "ALL_ORDERS" ? (
                                <span className="text-emerald-900 font-black">📦 All Orders (Global)</span>
                              ) : (
                                rule.dish_category || "All Dishes"
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px]">
                                {rule.portion_size || "ALL"}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-900">
                              <span className="block font-semibold">{rule.packaging_item_name}</span>
                              <span className="font-mono text-[10px] text-stone-500">
                                {rule.packaging_item_sku}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-stone-900">
                              {rule.quantity_per_order_unit} {rule.packaging_item_unit || "pcs"}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-stone-900">
                              ₹{((rule.packaging_item_cost || 0) * rule.quantity_per_order_unit).toFixed(2)}
                            </td>
                            <td className="py-3 px-3 text-stone-500 text-[11px]">
                              {rule.description || "—"}
                            </td>
                            <td className="py-3 px-3">
                              {rule.is_active ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="neutral">Paused</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete rule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SUBSECTION B: INTERACTIVE ORDER PACKAGING COST SIMULATOR */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-900" />
                      Kitchen Order Packaging Cost Simulator
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Simulate customer orders to calculate material requirements and packaging expenses
                    </p>
                  </div>
                  <button
                    onClick={handleSimulate}
                    disabled={simLoading}
                    className="px-4 py-2 text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{simLoading ? "Calculating..." : "Run Simulation"}</span>
                  </button>
                </div>

                {/* Simulation Controls */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/70 p-4 rounded-xl border border-stone-200">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Dum Biryani (500g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simDumBiryani500}
                      onChange={(e) => setSimDumBiryani500(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Dum Biryani (1kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simDumBiryani1kg}
                      onChange={(e) => setSimDumBiryani1kg(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Starters & Kebabs
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simStarters}
                      onChange={(e) => setSimStarters(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                      Desserts (Gulab Jamun)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={simDesserts}
                      onChange={(e) => setSimDesserts(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    />
                  </div>
                </div>

                {/* Simulation Results Display */}
                {simResult && (
                  <div className="bg-stone-50/50 border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                        Simulated Bill of Materials (BOM)
                      </span>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-stone-600">
                          Total Units: <span className="text-stone-900 font-bold">{simResult.total_packaging_units} units</span>
                        </span>
                        <span className="text-emerald-950 font-black text-sm">
                          Total Cost: {formatCurrency(simResult.total_packaging_cost_inr)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {simResult.consumed_items.map((ci) => (
                        <div
                          key={ci.packaging_item_id}
                          className="p-3 bg-white rounded-lg border border-stone-200 flex items-center justify-between shadow-xs"
                        >
                          <div>
                            <span className="text-xs font-bold text-stone-900 block truncate">
                              {ci.item_name}
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono">
                              {ci.item_sku} • {ci.category}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <span className="text-xs font-bold text-emerald-900 block">
                              {ci.units_consumed} {ci.unit}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium">
                              ₹{ci.total_cost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SUBSECTION C: PACKAGING TRANSACTIONS AUDIT LOG */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-emerald-900" />
                      Packaging Stock Movement Log ({txTotal})
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Immutable audit trail of inbound purchase, kitchen deduction, and wastage
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTxType}
                      onChange={(e) => {
                        setSelectedTxType(e.target.value);
                        setTxPage(1);
                      }}
                      className="px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                    >
                      <option value="ALL">All Transaction Types</option>
                      <option value="STOCK_IN">Stock In (Purchase)</option>
                      <option value="STOCK_OUT">Stock Out (Kitchen Dispatched)</option>
                      <option value="WASTAGE">Wastage / Damaged</option>
                      <option value="ORDER_CONSUMPTION">Order Consumption</option>
                      <option value="AUDIT_CORRECTION">Audit Correction</option>
                    </select>
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="py-8 text-center text-stone-500 text-xs">
                    No stock transactions recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-3">Packaging Item</th>
                          <th className="py-3 px-3">Movement Type</th>
                          <th className="py-3 px-3 text-right">Quantity</th>
                          <th className="py-3 px-3 text-right">Stock (Before → After)</th>
                          <th className="py-3 px-3 text-right">Total Cost</th>
                          <th className="py-3 px-3">Reference / Order</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                            {/* Stacked Date and Time to prevent horizontal scrolling */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-stone-900 text-xs">
                                  {formatDate(tx.created_at)}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {formatTime(tx.created_at)}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-semibold text-stone-900 block">
                                {tx.item_name || `Item #${tx.packaging_item_id}`}
                              </span>
                              <span className="font-mono text-[10px] text-stone-500">
                                {tx.item_sku}
                              </span>
                            </td>

                            <td className="py-3 px-3 whitespace-nowrap">
                              {getTransactionBadge(tx.transaction_type)}
                            </td>

                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <span
                                className={`font-bold ${
                                  tx.transaction_type === "STOCK_IN"
                                    ? "text-emerald-700"
                                    : "text-stone-900"
                                }`}
                              >
                                {tx.transaction_type === "STOCK_IN" ? "+" : "-"}
                                {tx.quantity} {tx.item_unit || "pcs"}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right whitespace-nowrap text-stone-500 font-mono text-[11px]">
                              {tx.stock_before} → <span className="font-bold text-stone-900">{tx.stock_after}</span>
                            </td>

                            <td className="py-3 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                              {tx.total_cost ? formatCurrency(tx.total_cost) : "—"}
                            </td>

                            <td className="py-3 px-3 text-[11px] text-stone-500 whitespace-nowrap">
                              {tx.order_id ? (
                                <span className="font-semibold text-amber-700">Order #{tx.order_id}</span>
                              ) : (
                                tx.reference_no || "—"
                              )}
                            </td>

                            <td className="py-3 px-4 text-stone-500 text-[11px] max-w-xs truncate">
                              {tx.notes || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Transactions Pagination */}
                {txTotal > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200">
                    <span className="text-xs text-stone-500">
                      Showing {(txPage - 1) * txPageSize + 1} to{" "}
                      {Math.min(txPage * txPageSize, txTotal)} of {txTotal} transactions
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        disabled={txPage === 1}
                        className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-semibold px-2 text-stone-900">
                        Page {txPage} of {txTotalPages}
                      </span>
                      <button
                        onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                        disabled={txPage === txTotalPages}
                        className="p-1.5 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: CREATE OR EDIT PACKAGING ITEM */}
      <PackagingItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleCreateOrUpdateItem}
        item={editingItem}
        title={editingItem ? "Edit Packaging Item" : "Add Packaging Material"}
      />

      {/* MODAL 2: STOCK ADJUSTMENT & RECORD MOVEMENT */}
      <PackagingAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleAdjustStock}
        items={items}
        selectedItem={adjustingItem}
      />

      {/* MODAL 3: CONSUMPTION RULE CREATOR */}
      <PackagingRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSubmit={handleCreateRule}
        items={items}
      />
    </DashboardLayout>
  );
}

export default function PackagingPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading packaging module..." />}>
      <PackagingDashboardContent />
    </Suspense>
  );
}
