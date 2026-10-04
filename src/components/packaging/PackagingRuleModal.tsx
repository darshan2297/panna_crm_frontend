"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Layers,
  Save,
  AlertCircle,
  UtensilsCrossed,
  Scale,
  Package,
} from "lucide-react";
import {
  PackagingItem,
  PackagingConsumptionRuleInput,
} from "@/types";
import { Portal } from "@/components/ui/Portal";

interface PackagingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: PackagingConsumptionRuleInput) => Promise<void>;
  items: PackagingItem[];
}

const COMMON_DISH_CATEGORIES = [
  "Dum Biryani",
  "Starters & Kebabs",
  "Curries & Gravies",
  "Desserts",
  "Beverages",
  "ALL_ORDERS",
];

const COMMON_PORTION_SIZES = [
  "ALL",
  "500g",
  "1kg",
  "Single",
  "Full",
  "Half",
  "Piece",
];

export const PackagingRuleModal: React.FC<PackagingRuleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
}) => {
  const [dishCategory, setDishCategory] = useState<string>("Dum Biryani");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const [portionSize, setPortionSize] = useState<string>("ALL");
  const [isCustomPortion, setIsCustomPortion] = useState(false);
  const [customPortion, setCustomPortion] = useState("");

  const [packagingItemId, setPackagingItemId] = useState<number>(0);
  const [quantityPerUnit, setQuantityPerUnit] = useState<number>(1.0);
  const [description, setDescription] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (items.length > 0 && !packagingItemId) {
        setPackagingItemId(items[0].id);
      }
      setDishCategory("Dum Biryani");
      setIsCustomCategory(false);
      setCustomCategory("");
      setPortionSize("ALL");
      setIsCustomPortion(false);
      setCustomPortion("");
      setQuantityPerUnit(1.0);
      setDescription("");
      setIsActive(true);
      setError(null);
    }
  }, [isOpen, items, packagingItemId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalCategory = isCustomCategory ? customCategory.trim() : dishCategory;
    const finalPortion = isCustomPortion ? customPortion.trim() : portionSize;

    if (!finalCategory) {
      setError("Please select or specify a dish category.");
      return;
    }
    if (!packagingItemId) {
      setError("Please select a packaging item.");
      return;
    }
    if (quantityPerUnit <= 0) {
      setError("Quantity consumed per order unit must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        dish_category: finalCategory,
        portion_size: finalPortion || "ALL",
        packaging_item_id: packagingItemId,
        quantity_per_order_unit: quantityPerUnit,
        description: description.trim() || undefined,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save packaging rule.");
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === packagingItemId);

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div
          className="relative w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-2xl overflow-hidden z-10 my-8 transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  New Packaging Consumption Rule
                </h3>
                <p className="text-xs text-stone-300">
                  Automate material deduction when orders are placed
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Dish Category Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-800" />
                Target Dish Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {COMMON_DISH_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setDishCategory(cat);
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-left truncate ${
                      !isCustomCategory && dishCategory === cat
                        ? "bg-emerald-900 border-emerald-900 text-white shadow-sm"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {cat === "ALL_ORDERS" ? "📦 All Orders (Global)" : cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    isCustomCategory
                      ? "bg-emerald-900 border-emerald-900 text-white font-bold"
                      : "bg-stone-100 border-stone-200 text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Custom Category...
                </button>
                {isCustomCategory && (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Thali, Bulk Biryani Deg"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                )}
              </div>
            </div>

            {/* Portion Size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-800" />
                Portion Size Match
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_PORTION_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setIsCustomPortion(false);
                      setPortionSize(size);
                    }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
                      !isCustomPortion && portionSize === size
                        ? "bg-emerald-900 border-emerald-900 text-white shadow-sm"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {size === "ALL" ? "All Sizes" : size}
                  </button>
                ))}
              </div>
              {isCustomPortion ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 750g, 2kg, Jalfrezi Pot"
                    value={customPortion}
                    onChange={(e) => setCustomPortion(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomPortion(false)}
                    className="text-xs text-stone-500 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomPortion(true)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline"
                >
                  + Add Custom Size Rule
                </button>
              )}
            </div>

            {/* Packaging Item Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-800" />
                Deducted Packaging Material
              </label>
              <select
                required
                value={packagingItemId}
                onChange={(e) => setPackagingItemId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.sku}] {i.name} — ({i.current_stock} {i.unit} in stock, ₹{i.purchase_cost.toFixed(2)}/unit)
                  </option>
                ))}
              </select>
              {selectedItem && (
                <p className="mt-1 text-[11px] text-stone-500">
                  Material: <span className="text-stone-900 font-medium">{selectedItem.material}</span> | Category: <span className="text-stone-900 font-medium">{selectedItem.category}</span>
                </p>
              )}
            </div>

            {/* Quantity per Order Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Deduction Quantity ({selectedItem?.unit || "unit"})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={quantityPerUnit}
                  onChange={(e) => setQuantityPerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                />
                <p className="mt-1 text-[10px] text-stone-500">
                  e.g., 1.0 container per biryani plate
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Estimated Unit Packaging Cost
                </label>
                <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 flex items-center justify-between">
                  <span>₹{((selectedItem?.purchase_cost || 0) * (quantityPerUnit || 0)).toFixed(2)}</span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    @ ₹{selectedItem?.purchase_cost?.toFixed(2) || "0.00"}/{selectedItem?.unit || "unit"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Instruction / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1x 500ml Bowl for 500g Biryani"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <div>
                <p className="text-xs font-bold text-stone-900">Rule Status</p>
                <p className="text-[11px] text-stone-500">
                  Active rules automatically consume inventory during order creation
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-900"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-amber-400" />
                )}
                <span>Save Consumption Rule</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
