"use client";

import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, PackageCheck, Layers, MapPin, Truck, HelpCircle } from "lucide-react";
import { PackagingCategory, PackagingItem, PackagingItemInput } from "@/types";
import { Portal } from "@/components/ui/Portal";

interface PackagingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: PackagingItemInput) => Promise<void>;
  item?: PackagingItem | null;
  title?: string;
}

const CATEGORIES: { label: string; value: PackagingCategory }[] = [
  { label: "Container / Handi / Bowl", value: "CONTAINER" },
  { label: "Delivery Bag", value: "BAG" },
  { label: "Accompaniment Cup / Pouch", value: "ACCOMPANIMENT" },
  { label: "Cutlery & Napkin Kit", value: "CUTLERY" },
  { label: "Sealing Tape & Foil", value: "SEALING_LABEL" },
  { label: "Other Essentials", value: "OTHER" },
];

const MATERIALS = [
  "Food Grade PP",
  "Virgin Kraft Paper",
  "Terracotta Clay",
  "Birch Wood",
  "Aluminum Multi-layer Foil",
  "BOPP Adhesive",
  "Virgin Pulp",
  "Bio-Plastic",
  "Other",
];

const UNITS = ["pcs", "roll", "pack"];

export const PackagingItemModal: React.FC<PackagingItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  title,
}) => {
  const [formData, setFormData] = useState<PackagingItemInput>({
    name: "",
    sku: "",
    category: "CONTAINER",
    material: "Food Grade PP",
    capacity: "500ml",
    unit: "pcs",
    current_stock: 0,
    minimum_stock: 50,
    reorder_level: 100,
    purchase_cost: 0,
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
        category: item.category as PackagingCategory,
        material: item.material || "Food Grade PP",
        capacity: item.capacity || "",
        unit: item.unit,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        reorder_level: item.reorder_level,
        purchase_cost: item.purchase_cost,
        supplier: item.supplier || "",
        storage_location: item.storage_location || "",
        description: item.description || "",
        is_active: item.is_active,
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "CONTAINER",
        material: "Food Grade PP",
        capacity: "500ml",
        unit: "pcs",
        current_stock: 0,
        minimum_stock: 50,
        reorder_level: 100,
        purchase_cost: 0,
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
      setError("Packaging item name is required.");
      return;
    }
    if (formData.current_stock < 0) {
      setError("Current stock cannot be negative.");
      return;
    }
    if (formData.purchase_cost < 0) {
      setError("Purchase cost cannot be negative.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save packaging item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculatedValuation = (formData.current_stock || 0) * (formData.purchase_cost || 0);

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
                  {title || (item ? "Edit Packaging Item" : "Add New Packaging Item")}
                </h2>
                <p className="text-xs text-stone-300">
                  Track delivery boxes, earthen handis, raita cups, cutlery & eco bags
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

            {/* Item Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Packaging Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. 500ml Microwavable Biryani Bowl with Snap Lid, Earthen Handi 1kg"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Category, Material & Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PackagingCategory })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Material *
                </label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                >
                  {MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Capacity / Size
                </label>
                <input
                  type="text"
                  value={formData.capacity || ""}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g. 500ml, 1kg, Standard"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* SKU, Unit & Cost */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  SKU / Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Unit of Measure *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Cost Price Per Unit (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Stock Levels Card */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-800" />
                  Stock Balances & Safety Thresholds
                </span>
                <span className="text-xs text-stone-500">Units: {formData.unit}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Current Stock ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm text-stone-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-rose-600 mb-1">
                    Critical Min ({formData.unit}) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 text-sm text-stone-900 bg-white focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-600 mb-1">
                    Reorder Level ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm text-stone-900 bg-white focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-200">
                <span>Calculated Inventory Valuation:</span>
                <span className="font-bold text-stone-900 text-sm">
                  ₹{calculatedValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Supplier & Storage Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-stone-400" />
                  Primary Supplier / Vendor
                </label>
                <input
                  type="text"
                  value={formData.supplier || ""}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="e.g. PlastoPack Industries, GreenEarth EcoPack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  Storage Location
                </label>
                <input
                  type="text"
                  value={formData.storage_location || ""}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  placeholder="e.g. Aisle P-1, Dispatch Counter Rack"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Description & Material Certifications
              </label>
              <textarea
                rows={2}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. 100% Food Grade, Microwave Safe, 140 GSM reinforced kraft paper with flat handle..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Active Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active_pkg"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-900 focus:ring-emerald-900 border-stone-300"
              />
              <label htmlFor="is_active_pkg" className="text-xs font-semibold text-stone-700 cursor-pointer">
                Active in Packaging Catalog & Reorder Monitoring
              </label>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
            <div className="text-xs text-stone-500">
              * Required operational fields
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
                <span>{loading ? "Saving..." : item ? "Update Packaging" : "Save Packaging Item"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
