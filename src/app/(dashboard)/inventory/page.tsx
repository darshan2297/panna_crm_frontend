"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import {
  Boxes,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash,
  Scale,
  MapPin,
  Truck,
  IndianRupee,
  Clock,
  History,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ViewModeToggle } from "@/components/common/ViewModeToggle";
import { SearchInput } from "@/components/common/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { EmptyState } from "@/components/ui/EmptyState";
import { InventoryItemModal } from "@/components/inventory/InventoryItemModal";
import { StockAdjustmentModal } from "@/components/inventory/StockAdjustmentModal";
import { api } from "@/services/api";
import {
  InventoryCategory,
  InventoryItem,
  InventoryItemInput,
  InventorySummary,
  InventoryTransaction,
  InventoryTransactionInput,
  InventoryTransactionType,
} from "@/types";

type ViewTab = "all" | "low_stock" | "transactions";
type StatusFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "CRITICAL_STOCK" | "OUT_OF_STOCK";

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: "All Categories", value: "ALL" },
  { label: "Grains & Rice", value: "GRAIN" },
  { label: "Meat & Poultry", value: "MEAT" },
  { label: "Dairy & Ghee", value: "DAIRY" },
  { label: "Vegetables & Herbs", value: "VEGETABLE" },
  { label: "Spices & Seasoning", value: "SPICE" },
  { label: "Oils & Fats", value: "OIL" },
  { label: "Packaging", value: "PACKAGING" },
];

function InventoryManagementContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ViewTab | null;
  const [activeTab, setActiveTab] = useState<ViewTab>(
    tabParam && ["all", "low_stock", "transactions"].includes(tabParam) ? tabParam : "all"
  );

  useEffect(() => {
    if (tabParam && ["all", "low_stock", "transactions"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  // Filter changes re-fetch through loadData; only show the skeleton if that
  // fetch is genuinely slow, otherwise a warm response flashes for two frames.
  const showLoadingSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [selectedTxType, setSelectedTxType] = useState<string>("ALL");
  const [txPage, setTxPage] = useState<number>(1);
  const [txPageSize, setTxPageSize] = useState<number>(10);
  const [txTotal, setTxTotal] = useState<number>(0);
  const [txTotalPages, setTxTotalPages] = useState<number>(1);
  const [itemsPage, setItemsPage] = useState<number>(1);
  const [itemsPageSize, setItemsPageSize] = useState<number>(12);
  const [lowStockPage, setLowStockPage] = useState<number>(1);
  const [lowStockPageSize, setLowStockPageSize] = useState<number>(10);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTargetItem, setAdjustTargetItem] = useState<InventoryItem | null>(null);

  // Load summary and initial data
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [summaryRes, itemsRes, txRes] = await Promise.all([
        api.getInventorySummary(),
        api.getInventoryItems({
          category: selectedCategory !== "ALL" ? selectedCategory : undefined,
          status_filter: selectedStatus !== "ALL" ? selectedStatus : undefined,
          search: searchQuery || undefined,
          page_size: 100,
        }),
        api.getInventoryTransactions({
          transaction_type: selectedTxType !== "ALL" ? selectedTxType : undefined,
          page: txPage,
          page_size: txPageSize,
        }),
      ]);

      if (summaryRes.data) setSummary(summaryRes.data);
      if (itemsRes.data) setItems(itemsRes.data.items);
      if (txRes.data) {
        setTransactions(txRes.data.items);
        setTxTotal(txRes.data.total);
        setTxTotalPages(txRes.data.pages || Math.ceil(txRes.data.total / txPageSize) || 1);
      }
    } catch (err) {
      console.error("Failed to load inventory data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery, selectedTxType, txPage, txPageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Create or Update Item
  const handleItemSubmit = async (itemData: InventoryItemInput) => {
    if (editingItem) {
      await api.updateInventoryItem(editingItem.id, itemData);
    } else {
      await api.createInventoryItem(itemData);
    }
    await loadData(true);
  };

  // Handle Delete Item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to deactivate '${item.name}'?`)) return;
    try {
      await api.deleteInventoryItem(item.id);
      await loadData(true);
    } catch (err: any) {
      alert(err?.message || "Failed to delete item.");
    }
  };

  // Handle Quick Stock Adjustment
  const handleStockAdjustment = async (itemId: number, payload: InventoryTransactionInput) => {
    await api.adjustStock(itemId, payload);
    setTxPage(1);
    await loadData(true);
  };

  // Trigger quick modal
  const openAdjustModal = (item?: InventoryItem) => {
    setAdjustTargetItem(item || null);
    setIsAdjustModalOpen(true);
  };

  // Filtered items for Low Stock Tab
  const lowStockItems = items.filter((it) => it.is_low_stock || it.current_stock <= it.reorder_level);

  // Reset pagination on filter changes
  useEffect(() => {
    setItemsPage(1);
    setLowStockPage(1);
  }, [selectedCategory, selectedStatus, searchQuery]);

  // Pagination for All Ingredients
  const totalItemsCount = items.length;
  const totalItemsPages = Math.max(1, Math.ceil(totalItemsCount / itemsPageSize));
  const paginatedItems = items.slice((itemsPage - 1) * itemsPageSize, itemsPage * itemsPageSize);

  // Pagination for Low Stock Items
  const totalLowStockCount = lowStockItems.length;
  const totalLowStockPages = Math.max(1, Math.ceil(totalLowStockCount / lowStockPageSize));
  const paginatedLowStock = lowStockItems.slice((lowStockPage - 1) * lowStockPageSize, lowStockPage * lowStockPageSize);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Kitchen Stock & Supply Chain
            </span>
          </div>
          <h1 className="text-2xl font-black text-emerald-950 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-emerald-900" />
            Inventory & Ingredients Management
          </h1>
          <p className="text-sm text-stone-600">
            Real-time kitchen raw material stock balances, low-stock alerts, and complete movement audit trail
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
            <Scale className="w-4 h-4" />
            <span>Stock Movement</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
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
                Stock Valuation
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/90 text-amber-300 border border-emerald-700/60 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              Active Total
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-400 tracking-tight my-1">
            ₹{summary ? summary.total_inventory_value_inr.toLocaleString("en-IN") : "0"}
          </div>
          <div className="text-xs text-stone-300 flex items-center gap-1.5 pt-2 border-t border-emerald-900/60">
            <span>Across</span>
            <span className="font-bold text-white">{summary?.total_items || 0}</span>
            <span>raw materials & supplies</span>
          </div>
        </div>

        {/* Tracked Ingredients */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                <Boxes className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Tracked Items
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight my-1">
            {summary?.total_items || 0}
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-2 border-t border-stone-100">
            <span className="text-emerald-700 font-bold">{summary?.in_stock_items || 0} healthy</span>
            <span>•</span>
            <span>{summary?.category_valuations.length || 0} categories</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Low Stock
              </span>
            </div>
            {(summary?.low_stock_items ?? 0) > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                Reorder Due
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                Healthy
              </span>
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-600 tracking-tight my-1">
            {summary?.low_stock_items || 0}
          </div>
          <div className="text-xs text-stone-500 pt-2 border-t border-stone-100">
            At or below reorder threshold
          </div>
        </div>

        {/* Critical & Out of Stock */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold uppercase tracking-wider text-[11px] text-stone-700 truncate">
                Critical Stock
              </span>
            </div>
            {(summary?.critical_stock_items ?? 0) + (summary?.out_of_stock_items ?? 0) > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                Action Required
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                Optimal
              </span>
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-black text-rose-600 tracking-tight my-1">
            {(summary?.critical_stock_items || 0) + (summary?.out_of_stock_items || 0)}
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-2 border-t border-stone-100">
            <span className="font-bold text-rose-600">{summary?.out_of_stock_items || 0} empty</span>
            <span>•</span>
            <span>{summary?.critical_stock_items || 0} at min safety</span>
          </div>
        </div>
      </div>

      {/* Main Tab Bar & Controls */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>All Ingredients</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {items.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("low_stock")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "low_stock"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-900" />
              <span>Low Stock Alerts</span>
              {lowStockItems.length > 0 && (
                <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-bold">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "transactions"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Stock Movement Log</span>
              <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-white/20 font-bold">
                {transactions.length}
              </span>
            </button>
          </div>

          {activeTab === "all" && (
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          )}
        </div>

        {/* Filter Bar */}
        {activeTab !== "transactions" ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by ingredient, SKU, or supplier..."
            />

            {/* Category and Status Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                {CATEGORY_TABS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">Healthy Stock</option>
                <option value="LOW_STOCK">Low Stock (Reorder)</option>
                <option value="CRITICAL_STOCK">Critical Minimum</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
          </div>
        ) : (
          /* Movement Log Filters */
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-stone-500 font-medium">
              Showing chronological log of purchases, batch issuance, wastage, and inventory reconciliation
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-600">Movement Type:</span>
              <select
                value={selectedTxType}
                onChange={(e) => {
                  setSelectedTxType(e.target.value);
                  setTxPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                <option value="ALL">All Movements</option>
                <option value="STOCK_IN">Stock In (Purchase)</option>
                <option value="STOCK_OUT">Stock Out (Cooking)</option>
                <option value="WASTAGE">Wastage (Loss/Spoil)</option>
                <option value="AUDIT_CORRECTION">Audit Count</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {showLoadingSkeleton ? (
        <TableSkeleton rows={6} columns={8} />
      ) : activeTab === "all" ? (
        items.length === 0 ? (
          <EmptyState
            title="No ingredients found"
            description="No items match your search or filter criteria. Add your first ingredient to get started."
            actionText="Add Ingredient"
            onAction={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-4">
            {viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedItems.map((item) => {
              const maxGauge = Math.max(item.minimum_stock * 2, item.current_stock, 10);
              const percent = Math.min(100, Math.round((item.current_stock / maxGauge) * 100));
              const isCrit = item.current_stock <= item.minimum_stock;
              const isLow = !isCrit && item.current_stock <= item.reorder_level;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between ${
                    isCrit
                      ? "border-rose-300 ring-1 ring-rose-200"
                      : isLow
                      ? "border-amber-300 ring-1 ring-amber-200"
                      : "border-stone-200"
                  }`}
                >
                  <div>
                    {/* Top Row: Category & Badges */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase tracking-wider">
                        {item.category}
                      </span>
                      {isCrit ? (
                        <Badge variant="danger" size="sm" pulse>
                          Critical Stock
                        </Badge>
                      ) : isLow ? (
                        <Badge variant="warning" size="sm">
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          In Stock
                        </Badge>
                      )}
                    </div>

                    {/* Name & SKU */}
                    <h3 className="text-base font-bold text-stone-900 tracking-tight leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{item.sku}</p>

                    {/* Stock Level Bar */}
                    <div className="mt-4 bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-black text-stone-900">
                            {item.current_stock}
                          </span>
                          <span className="text-xs text-stone-500 font-medium ml-1">
                            {item.unit}
                          </span>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-stone-400">Valuation: </span>
                          <span className="font-bold text-emerald-950">
                            ₹{item.total_valuation.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCrit ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
                        <span>Min Safety: {item.minimum_stock} {item.unit}</span>
                        <span>Reorder at: {item.reorder_level} {item.unit}</span>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                      {item.storage_location && (
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{item.storage_location}</span>
                        </div>
                      )}
                      {item.supplier && (
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <Truck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{item.supplier}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openAdjustModal(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                        title="Stock Movement"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        <span>Adjust</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-900 hover:bg-stone-100"
                        title="Edit Ingredient"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Deactivate Ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient Name</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-right">Current Stock</th>
                    <th className="px-4 py-3.5 text-right">Safety / Reorder</th>
                    <th className="px-4 py-3.5 text-right">Cost / Unit</th>
                    <th className="px-4 py-3.5 text-right">Valuation</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedItems.map((item) => {
                    const isCrit = item.current_stock <= item.minimum_stock;
                    const isLow = !isCrit && item.current_stock <= item.reorder_level;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-stone-900">{item.name}</div>
                          <div className="text-xs text-stone-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          <div className="flex items-center gap-2">
                            <span className={isCrit ? "text-rose-600" : isLow ? "text-amber-600" : "text-stone-900"}>
                              {item.current_stock} {item.unit}
                            </span>
                            {isCrit && <Badge variant="danger" size="sm" pulse>Critical</Badge>}
                            {isLow && <Badge variant="warning" size="sm">Low</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-500">
                          {item.minimum_stock} / {item.reorder_level} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-stone-700">
                          ₹{item.purchase_price} / {item.unit}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-950">
                          ₹{item.total_valuation.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-500">
                          {item.storage_location || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAdjustModal(item)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold"
                            >
                              Adjust
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setIsItemModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-stone-500 hover:text-emerald-900 hover:bg-stone-100"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Ingredients Pagination Controls */}
        {totalItemsCount > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 px-5 py-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-bold text-stone-900">
                  {Math.min((itemsPage - 1) * itemsPageSize + 1, totalItemsCount)}
                </span>
                {" – "}
                <span className="font-bold text-stone-900">
                  {Math.min(itemsPage * itemsPageSize, totalItemsCount)}
                </span>{" "}
                of <span className="font-bold text-stone-900">{totalItemsCount}</span> ingredients
              </span>

              <div className="flex items-center gap-1.5 ml-3 border-l border-stone-200 pl-3">
                <span className="text-[11px] text-stone-500">Per page:</span>
                <select
                  value={itemsPageSize}
                  onChange={(e) => {
                    setItemsPageSize(Number(e.target.value));
                    setItemsPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold bg-white text-stone-700 focus:outline-none"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={itemsPage <= 1}
                onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs">
                <span className="font-bold text-stone-900">{itemsPage}</span>
                <span className="text-stone-400">/</span>
                <span className="text-stone-600">{totalItemsPages}</span>
              </div>

              <button
                disabled={itemsPage >= totalItemsPages}
                onClick={() => setItemsPage((p) => Math.min(totalItemsPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  ) : activeTab === "low_stock" ? (
        /* LOW STOCK ALERTS VIEW */
        lowStockItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">All Stock Levels Healthy!</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              No ingredients are currently below safety thresholds. Kitchen inventory is adequately stocked for current order volume.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-amber-50/60 border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Urgent Replenishment Priority ({lowStockItems.length} Items)
                </h3>
                <p className="text-xs text-amber-800">
                  Ingredients at or below safety levels requiring purchase orders to avoid kitchen stockouts
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3.5">Ingredient</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Current Stock</th>
                    <th className="px-4 py-3.5">Safety Minimum</th>
                    <th className="px-4 py-3.5">Reorder Level</th>
                    <th className="px-4 py-3.5">Suggested Order Qty</th>
                    <th className="px-4 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {paginatedLowStock.map((item) => {
                    const isCrit = item.current_stock <= item.minimum_stock;
                    const suggestedOrder = Math.max(item.reorder_level * 2 - item.current_stock, 10);

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-stone-900">{item.name}</div>
                          <div className="text-xs text-stone-400 font-mono">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          <span className={isCrit ? "text-rose-600 font-black" : "text-amber-700 font-bold"}>
                            {item.current_stock} {item.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-stone-600 font-semibold">
                          {item.minimum_stock} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-stone-600 font-semibold">
                          {item.reorder_level} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-900">
                          +{suggestedOrder.toFixed(1)} {item.unit}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-stone-600">
                          {item.supplier || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => openAdjustModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                            <span>Quick Restock</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Low Stock Pagination Controls */}
            {totalLowStockCount > 0 && (
              <div className="px-5 py-3.5 bg-amber-50/60 border-t border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{" "}
                    <span className="font-bold text-amber-950">
                      {Math.min((lowStockPage - 1) * lowStockPageSize + 1, totalLowStockCount)}
                    </span>
                    {" – "}
                    <span className="font-bold text-amber-950">
                      {Math.min(lowStockPage * lowStockPageSize, totalLowStockCount)}
                    </span>{" "}
                    of <span className="font-bold text-amber-950">{totalLowStockCount}</span> items
                  </span>

                  <div className="flex items-center gap-1.5 ml-3 border-l border-amber-300 pl-3">
                    <span className="text-[11px] text-amber-800">Per page:</span>
                    <select
                      value={lowStockPageSize}
                      onChange={(e) => {
                        setLowStockPageSize(Number(e.target.value));
                        setLowStockPage(1);
                      }}
                      className="px-2 py-1 rounded-lg border border-amber-300 text-xs font-semibold bg-white text-stone-700 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={lowStockPage <= 1}
                    onClick={() => setLowStockPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-stone-700 hover:bg-amber-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-2 font-mono text-xs">
                    <span className="font-bold text-amber-950">{lowStockPage}</span>
                    <span className="text-amber-400">/</span>
                    <span className="text-amber-800">{totalLowStockPages}</span>
                  </div>

                  <button
                    disabled={lowStockPage >= totalLowStockPages}
                    onClick={() => setLowStockPage((p) => Math.min(totalLowStockPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-stone-700 hover:bg-amber-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* TRANSACTIONS / MOVEMENT AUDIT LOG VIEW */
        transactions.length === 0 ? (
          <EmptyState
            title="No movement transactions recorded"
            description="Log your first stock-in purchase, kitchen consumption, or wastage adjustment to start building the audit log."
            actionText="Record Movement"
            onAction={() => openAdjustModal()}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-bold border-b border-stone-200">
                  <tr>
                    <th className="px-3.5 py-3 text-left w-[115px]">Date & Time</th>
                    <th className="px-3.5 py-3 text-left">Ingredient</th>
                    <th className="px-3.5 py-3 text-left w-[130px]">Action</th>
                    <th className="px-3.5 py-3 text-left w-[100px]">Quantity</th>
                    <th className="px-3.5 py-3 text-left w-[130px]">Balance</th>
                    <th className="px-3.5 py-3 text-left w-[90px]">Cost</th>
                    <th className="px-3.5 py-3 text-left">Reference & Notes</th>
                    <th className="px-3.5 py-3 text-left w-[110px]">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transactions.map((tx) => {
                    const isStockIn = tx.transaction_type === "STOCK_IN";
                    const isWaste = tx.transaction_type === "WASTAGE";
                    const isStockOut = tx.transaction_type === "STOCK_OUT";

                    return (
                      <tr key={tx.id} className="hover:bg-stone-50/60 transition-colors">
                        {/* Date and Time: Up & Down */}
                        <td className="px-3.5 py-3 text-xs whitespace-nowrap">
                          <div className="font-semibold text-stone-800">
                            {new Date(tx.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[11px] text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-stone-300 shrink-0" />
                            <span>
                              {new Date(tx.created_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Ingredient & SKU */}
                        <td className="px-3.5 py-3">
                          <div className="font-bold text-stone-900 leading-snug">{tx.item_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">{tx.item_sku}</div>
                        </td>

                        {/* Action Type Badge */}
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          {isStockIn ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 whitespace-nowrap shrink-0 shadow-2xs">
                              <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="whitespace-nowrap">Stock In</span>
                            </span>
                          ) : isWaste ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/80 whitespace-nowrap shrink-0 shadow-2xs">
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span className="whitespace-nowrap">Wastage</span>
                            </span>
                          ) : isStockOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80 whitespace-nowrap shrink-0 shadow-2xs">
                              <ArrowUpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="whitespace-nowrap">Stock Out</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200/80 whitespace-nowrap shrink-0 shadow-2xs">
                              <Scale className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="whitespace-nowrap">Audit Count</span>
                            </span>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="px-3.5 py-3 font-bold font-mono whitespace-nowrap">
                          <span
                            className={
                              isStockIn
                                ? "text-emerald-700"
                                : isWaste
                                ? "text-rose-600"
                                : "text-blue-700"
                            }
                          >
                            {isStockIn ? "+" : isStockOut || isWaste ? "-" : ""}
                            {tx.quantity} {tx.item_unit}
                          </span>
                        </td>

                        {/* Balance Transition */}
                        <td className="px-3.5 py-3 text-xs font-mono text-stone-600 whitespace-nowrap">
                          <span>{tx.stock_before}</span>
                          <span className="text-stone-400 mx-1">→</span>
                          <span className="font-bold text-stone-900">{tx.stock_after}</span>{" "}
                          <span className="text-stone-500">{tx.item_unit}</span>
                        </td>

                        {/* Total Cost */}
                        <td className="px-3.5 py-3 text-xs font-bold text-emerald-950 whitespace-nowrap">
                          {tx.total_cost ? `₹${tx.total_cost.toLocaleString("en-IN")}` : "—"}
                        </td>

                        {/* Reference & Notes */}
                        <td className="px-3.5 py-3 text-xs">
                          {tx.reference_no && (
                            <span className="font-mono font-bold text-stone-800 block text-xs">
                              {tx.reference_no}
                            </span>
                          )}
                          <span className="text-stone-500 text-[11px] truncate block max-w-xs" title={tx.notes || ""}>
                            {tx.notes || "—"}
                          </span>
                        </td>

                        {/* Logged By */}
                        <td className="px-3.5 py-3 text-xs text-stone-700 whitespace-nowrap">
                          <div className="font-medium">{tx.performed_by_name || "Admin"}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {txTotal > 0 && (
              <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <span>
                    Showing{" "}
                    <span className="font-bold text-stone-900">
                      {Math.min((txPage - 1) * txPageSize + 1, txTotal)}
                    </span>
                    {" – "}
                    <span className="font-bold text-stone-900">
                      {Math.min(txPage * txPageSize, txTotal)}
                    </span>{" "}
                    of <span className="font-bold text-stone-900">{txTotal}</span> movement logs
                  </span>

                  <div className="flex items-center gap-1.5 ml-3 border-l border-stone-200 pl-3">
                    <span className="text-[11px] text-stone-500">Per page:</span>
                    <select
                      value={txPageSize}
                      onChange={(e) => {
                        setTxPageSize(Number(e.target.value));
                        setTxPage(1);
                      }}
                      className="px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold bg-white text-stone-700 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={txPage <= 1 || loading}
                    onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1 px-2 font-mono text-xs">
                    <span className="font-bold text-stone-900">{txPage}</span>
                    <span className="text-stone-400">/</span>
                    <span className="text-stone-600">{txTotalPages}</span>
                  </div>

                  <button
                    disabled={txPage >= txTotalPages || loading}
                    onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Modals */}
      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        item={editingItem}
      />

      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleStockAdjustment}
        items={items}
        selectedItem={adjustTargetItem}
      />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton rows={6} columns={8} /></div>}>
      <InventoryManagementContent />
    </Suspense>
  );
}
