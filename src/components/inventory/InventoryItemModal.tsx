"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, PackageCheck, Layers, MapPin, Truck, HelpCircle } from "lucide-react";
import { InventoryCategory, InventoryItem, InventoryItemInput } from "@/types";
import { Portal } from "@/components/ui/Portal";

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: InventoryItemInput) => Promise<void>;
  item?: InventoryItem | null;
  title?: string;
}

const CATEGORIES: { label: string; value: InventoryCategory }[] = [
  { label: "Grains & Rice", value: "GRAIN" },
  { label: "Meat & Poultry", value: "MEAT" },
  { label: "Dairy & Ghee", value: "DAIRY" },
  { label: "Vegetables & Herbs", value: "VEGETABLE" },
  { label: "Spices & Seasonings", value: "SPICE" },
  { label: "Oils & Fats", value: "OIL" },
  { label: "Packaging Supplies", value: "PACKAGING" },
  { label: "Other Essentials", value: "OTHER" },
];

const UNITS = ["kg", "g", "l", "ml", "pcs", "packet"];

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  title,
}) => {
  const [formData, setFormData] = useState<InventoryItemInput>({
    name: "",
    sku: "",
    category: "GRAIN",
    unit: "kg",
    current_stock: 0,
    minimum_stock: 10,
    reorder_level: 15,
    purchase_price: 0,
    supplier: "",
    storage_location: "",
    description: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category as InventoryCategory,
        unit: item.unit,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        reorder_level: item.reorder_level,
        purchase_price: item.purchase_price,
        supplier: item.supplier || "",
        storage_location: item.storage_location || "",
        description: item.description || "",
        is_active: item.is_active,
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "GRAIN",
        unit: "kg",
        current_stock: 0,
        minimum_stock: 10,
        reorder_level: 15,
        purchase_price: 0,
        supplier: "",
        storage_location: "",
        description: "",
        is_active: true,
      });
    }
    setError(null);
  }, [item, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (formData.current_stock < 0) {
      setError("Current stock cannot be negative.");
      return;
    }
    if (formData.purchase_price < 0) {
      setError("Purchase cost cannot be negative.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save inventory item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculatedValuation = (formData.current_stock || 0) * (formData.purchase_price || 0);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {title || (item ? "Edit Inventory Ingredient" : "Add New Ingredient")}
              </h2>
              <p className="text-xs text-stone-300">
                Track ingredients, units, safety thresholds, and stock valuation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Item Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Item / Ingredient Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Daawat Biryani Rice, Desi Cow Ghee"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm bg-white font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Unit of Measurement *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm bg-white font-medium"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u.toUpperCase()} ({u === "kg" ? "Kilograms" : u === "g" ? "Grams" : u === "l" ? "Liters" : u === "pcs" ? "Pieces" : u})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                SKU / Code (Optional)
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={formData.sku || ""}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Cost Price per Unit (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.purchase_price || ""}
                  onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Stock Levels & Thresholds Card */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-800" />
              Stock Balances & Safety Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Current Stock ({formData.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.current_stock || ""}
                  onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900 text-sm font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1 flex items-center gap-1">
                  Critical Min ({formData.unit})
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.minimum_stock || ""}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-rose-300 text-stone-900 text-sm font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Reorder Level ({formData.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.reorder_level || ""}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-stone-900 text-sm font-semibold bg-white"
                />
              </div>
            </div>

            {/* Total Valuation Strip */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">Calculated Stock Valuation:</span>
              <span className="font-bold text-emerald-950 text-sm">
                ₹{calculatedValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Supplier & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-stone-500" />
                Primary Supplier / Vendor
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Agro, Amul Distributor"
                value={formData.supplier || ""}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-500" />
                Storage Location
              </label>
              <input
                type="text"
                placeholder="e.g. Cold Room Freezer 1, Spice Cabinet"
                value={formData.storage_location || ""}
                onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Description & Culinary Usage Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Long-grain aged basmati rice used for all Dum Biryani handis..."
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-stone-700 cursor-pointer">
              Active in Inventory Catalog
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{loading ? "Saving..." : item ? "Update Item" : "Save Ingredient"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
);
};
