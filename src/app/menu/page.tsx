"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import {
  UtensilsCrossed,
  Plus,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  Edit2,
  Trash2,
  ExternalLink,
  ChefHat,
  Percent,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ViewModeToggle } from "@/components/common/ViewModeToggle";
import { SearchInput } from "@/components/common/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuItemModal } from "@/components/menu/MenuItemModal";
import { CategoryModal } from "@/components/menu/CategoryModal";
import { api } from "@/services/api";
import {
  MenuCategory,
  MenuItem,
  MenuSummary,
} from "@/types";

type PlatformPriceMode = "ALL" | "WEBSITE" | "ZOMATO" | "SWIGGY";

function MenuManagementContent() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [summary, setSummary] = useState<MenuSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Views
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "ALL">("ALL");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "OUT_OF_STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [platformView, setPlatformView] = useState<PlatformPriceMode>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  // Stock toggling state per item
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Load Menu Data
  const loadMenuData = useCallback(async () => {
    try {
      setError(null);
      const [catsRes, itemsRes, sumRes] = await Promise.all([
        api.getMenuCategories(),
        api.getMenuItems(),
        api.getMenuSummary(),
      ]);

      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data);
      }
      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      console.error("Error loading menu data:", err);
      setError(err.message || "Failed to load menu catalog");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMenuData();
  }, [loadMenuData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMenuData();
  };

  // Quick 1-click in-stock / out-of-stock toggle
  const handleToggleAvailability = async (item: MenuItem) => {
    setTogglingId(item.id);
    const newStatus = !item.is_available;
    try {
      const res = await api.toggleMenuItemAvailability(item.id, newStatus);
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_available: newStatus } : i))
        );
        // Refresh summary counter
        api.getMenuSummary().then((sumRes) => {
          if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        });
      }
    } catch (err: any) {
      alert(`Could not update stock status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to remove "${item.name}" from the menu?`)) {
      return;
    }
    try {
      const res = await api.deleteMenuItem(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        loadMenuData();
      }
    } catch (err: any) {
      alert(`Failed to delete item: ${err.message}`);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category filter
    if (selectedCategoryId !== "ALL" && item.category_id !== selectedCategoryId) {
      return false;
    }
    // Dietary filter
    if (dietaryFilter === "VEG" && !item.is_veg) return false;
    if (dietaryFilter === "NON_VEG" && item.is_veg) return false;
    if (dietaryFilter === "OUT_OF_STOCK" && item.is_available) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCat = item.category_name?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setPage(1);
  }, [selectedCategoryId, dietaryFilter, searchQuery]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-panna-gold-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <UtensilsCrossed className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif flex items-center gap-2">
                Menu Management & Pricing Rules
              </h1>
              <p className="text-sm text-slate-500">
                Master dish catalog, portion options, multi-platform margin rules, and 1-click kitchen availability.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh menu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>+ New Category</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-panna-green-800 hover:bg-panna-green-900 rounded-lg shadow-sm shadow-panna-green-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Dishes */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Dishes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-serif">
              {summary ? summary.total_items : items.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across all categories</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
        </div>

        {/* Menu Sections */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Categories</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-serif">
              {summary ? summary.total_categories : categories.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Organized sections</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Veg vs Non-Veg */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Dietary Ratio</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {summary ? summary.veg_items_count : items.filter((i) => i.is_veg).length} Veg
              </span>
              <span className="text-sm font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {summary ? summary.non_veg_items_count : items.filter((i) => !i.is_veg).length} Non-Veg
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full kitchen menu</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>

        {/* Out of Stock Alert */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Kitchen Out of Stock</p>
            <p
              className={`text-2xl font-bold mt-1 font-serif ${
                summary?.out_of_stock_count && summary.out_of_stock_count > 0
                  ? "text-rose-600"
                  : "text-emerald-700"
              }`}
            >
              {summary ? summary.out_of_stock_count : items.filter((i) => !i.is_available).length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {summary?.out_of_stock_count === 0
                ? "All dishes available"
                : "Requires restocking"}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              summary?.out_of_stock_count && summary.out_of_stock_count > 0
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Tab Bar & Controls Container matching Inventory styling */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-4">
        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-stone-100 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              selectedCategoryId === "ALL"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <UtensilsCrossed className={`w-3.5 h-3.5 ${selectedCategoryId === "ALL" ? "text-amber-400" : "text-stone-400"}`} />
            <span>All Dishes</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                selectedCategoryId === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-stone-200 text-stone-700"
              }`}
            >
              {items.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? "bg-emerald-950 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {cat.items_count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter and Operational Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search dish by name, recipe or ingredient..."
          />

          {/* Dietary Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-500 mr-1 hidden sm:inline">
              Filter:
            </span>
            <button
              onClick={() => setDietaryFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                dietaryFilter === "ALL"
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter("VEG")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                dietaryFilter === "VEG"
                  ? "bg-emerald-900 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter("NON_VEG")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                dietaryFilter === "NON_VEG"
                  ? "bg-rose-900 text-white shadow-sm"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Non-Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                dietaryFilter === "OUT_OF_STOCK"
                  ? "bg-amber-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Out of Stock
            </button>
          </div>

          {/* Platform Pricing View Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500 hidden lg:inline">
              Prices:
            </span>
            <select
              value={platformView}
              onChange={(e: any) => setPlatformView(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-900"
            >
              <option value="ALL">All Platforms (Side-by-Side)</option>
              <option value="WEBSITE">Website (Base 0%)</option>
              <option value="ZOMATO">Zomato (+22% Markup)</option>
              <option value="SWIGGY">Swiggy (+20% Markup)</option>
            </select>

            {/* View Mode Toggle */}
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      {/* Main Dishes Content Area */}
      {loading ? (
        <TableSkeleton rows={6} columns={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No dishes found"
          description="Try changing the category or search keywords, or click 'Add New Dish' to expand your menu."
          actionText="Add New Dish"
          onAction={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
        />
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedItems.map((item) => {
            const isToggling = togglingId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  !item.is_available
                    ? "border-slate-200 bg-slate-50/60 opacity-80"
                    : "border-slate-200 hover:border-panna-gold-400/60"
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  {/* Category, Spice & Diet Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-panna-green-800 bg-panna-green-50 px-2 py-0.5 rounded border border-panna-green-200 uppercase tracking-wider">
                      {item.category_name}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Spice Level */}
                      <span
                        className="text-[11px] font-medium text-slate-600"
                        title={`Spice: ${item.spice_level}`}
                      >
                        {item.spice_level === "MILD" && "🌶️ Mild"}
                        {item.spice_level === "MEDIUM" && "🌶️🌶️ Medium"}
                        {item.spice_level === "SPICY" && "🌶️🌶️🌶️ Spicy"}
                        {item.spice_level === "EXTRA_SPICY" && "🔥 Fire"}
                      </span>

                      {/* Veg / Non-Veg Indicator Icon */}
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center p-0.5 ${
                          item.is_veg
                            ? "border-emerald-600"
                            : "border-rose-600"
                        }`}
                        title={item.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.is_veg ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900 tracking-tight">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Prep Time */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prep: {item.preparation_time_minutes} mins</span>
                  </div>

                  {/* Portions & Platform Pricing */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Portion</span>
                      <span>
                        {platformView === "ALL" && "Web / Zomato / Swiggy"}
                        {platformView === "WEBSITE" && "Website Price"}
                        {platformView === "ZOMATO" && "Zomato (+22%)"}
                        {platformView === "SWIGGY" && "Swiggy (+20%)"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {item.portions.map((portion, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <span className="font-semibold text-slate-700">
                            {portion.portion_size}
                          </span>

                          <div className="flex items-center gap-2">
                            {platformView === "ALL" ? (
                              <div className="flex items-center gap-2 font-mono">
                                <span className="font-bold text-slate-900">
                                  ₹{portion.base_price}
                                </span>
                                <span className="text-rose-600 text-[11px]">
                                  ₹{portion.zomato_price}
                                </span>
                                <span className="text-orange-600 text-[11px]">
                                  ₹{portion.swiggy_price}
                                </span>
                              </div>
                            ) : platformView === "WEBSITE" ? (
                              <span className="font-bold font-mono text-slate-900">
                                ₹{portion.base_price}
                              </span>
                            ) : platformView === "ZOMATO" ? (
                              <span className="font-bold font-mono text-rose-600">
                                ₹{portion.zomato_price}
                              </span>
                            ) : (
                              <span className="font-bold font-mono text-orange-600">
                                ₹{portion.swiggy_price}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Stock Switch + Edit/Delete */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  {/* Stock Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleAvailability(item)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.is_available ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                      title={item.is_available ? "Click to set Out of Stock" : "Click to set In Stock"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.is_available ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-bold ${
                        item.is_available ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {item.is_available ? "IN STOCK" : "OUT OF STOCK"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsItemModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                      title="Edit dish"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete dish"
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
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Dish</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Spice & Prep</th>
                  <th className="py-3 px-4">Portions & Prices</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center p-0.5 flex-shrink-0 ${
                            item.is_veg ? "border-emerald-600" : "border-rose-600"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>
                        <span>{item.spice_level}</span>
                        <span className="text-slate-400 text-[10px] block">
                          ⏱️ {item.preparation_time_minutes} mins
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-sm">
                        {item.portions.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono font-medium"
                          >
                            <span className="text-slate-600">{p.portion_size}:</span>
                            <strong className="text-slate-900">₹{p.base_price}</strong>
                            <span className="text-rose-600 text-[10px]">
                              (Z: ₹{p.zomato_price})
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          item.is_available
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_available ? "bg-emerald-600" : "bg-slate-400"
                          }`}
                        />
                        <span>{item.is_available ? "In Stock" : "Out of Stock"}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 text-slate-400 hover:text-rose-600"
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

      {/* Pagination Footer (shared for grid and table) */}
      {!loading && totalItems > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <span className="font-bold text-slate-900">
                {Math.min((page - 1) * pageSize + 1, totalItems)}
              </span>
              {" – "}
              <span className="font-bold text-slate-900">
                {Math.min(page * pageSize, totalItems)}
              </span>{" "}
              of <span className="font-bold text-slate-900">{totalItems}</span> dishes
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
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Item Modal (Create / Edit) */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => {
          loadMenuData();
        }}
        categories={categories}
        initialItem={editingItem}
      />

      {/* Category Modal (Create / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          loadMenuData();
        }}
        initialCategory={editingCategory}
      />
    </div>
  );
}

export default function MenuPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8"><TableSkeleton rows={6} columns={5} /></div>}>
        <MenuManagementContent />
      </Suspense>
    </DashboardLayout>
  );
}
