"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Truck,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Package,
  Boxes,
  FileText,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services/api";
import {
  RestockSuggestionItem,
  RestockOrderItemInput,
  RestockOrderTarget,
} from "@/types";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItems?: RestockSuggestionItem[];
  availableSuggestions?: RestockSuggestionItem[];
}

const PRESET_SUPPLIERS = [
  "Panna Royal Spices & Grain Wholesale",
  "Delhi Poultry & Meat Suppliers",
  "Panna Dairy & Pure Ghee Co.",
  "Classic Food Packaging & Eco Containers",
  "Fresh Produce & Green Herb Mandi",
  "Custom Supplier...",
];

export function CreatePOModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedItems = [],
  availableSuggestions = [],
}: CreatePOModalProps) {
  const [supplierName, setSupplierName] = useState(PRESET_SUPPLIERS[0]);
  const [customSupplier, setCustomSupplier] = useState("");
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RestockOrderItemInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize items from preselected suggestions
  useEffect(() => {
    if (isOpen) {
      if (preselectedItems.length > 0) {
        setItems(
          preselectedItems.map((s) => ({
            item_type: s.item_type || s.target_type || "INVENTORY",
            item_id: s.item_id || s.target_id || 1,
            target_type: s.item_type || s.target_type || "INVENTORY",
            target_id: s.item_id || s.target_id || 1,
            item_name: s.name || s.item_name || "Kitchen Item",
            ordered_quantity: Math.max(s.suggested_order_qty ?? s.suggested_reorder_qty ?? 1, 1),
            quantity: Math.max(s.suggested_order_qty ?? s.suggested_reorder_qty ?? 1, 1),
            unit: s.unit || "kg",
            unit_cost: s.purchase_cost ?? s.estimated_unit_cost_inr ?? 100,
            unit_price_inr: s.purchase_cost ?? s.estimated_unit_cost_inr ?? 100,
          }))
        );
        const firstSupplier = preselectedItems[0]?.supplier || preselectedItems[0]?.supplier_name;
        if (firstSupplier) {
          setSupplierName(firstSupplier);
        }
      } else {
        setItems([]);
      }
      setError(null);
    }
  }, [isOpen, preselectedItems]);

  // Calculate totals
  const totalAmount = items.reduce(
    (sum, it) =>
      sum +
      (it.ordered_quantity ?? it.quantity ?? 0) *
        (it.unit_cost ?? it.unit_price_inr ?? 0),
    0
  );

  const handleUpdateItem = (
    index: number,
    field: keyof RestockOrderItemInput,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "quantity") next[index].ordered_quantity = value;
      if (field === "ordered_quantity") next[index].quantity = value;
      if (field === "unit_price_inr") next[index].unit_cost = value;
      if (field === "unit_cost") next[index].unit_price_inr = value;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSuggestion = (s: RestockSuggestionItem) => {
    const sId = s.item_id || s.target_id;
    const sType = s.item_type || s.target_type || "INVENTORY";
    // Avoid duplicate item
    if (items.some((it) => (it.item_type || it.target_type) === sType && (it.item_id || it.target_id) === sId)) {
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        item_type: sType,
        item_id: sId || 1,
        target_type: sType,
        target_id: sId || 1,
        item_name: s.name || s.item_name || "Kitchen Item",
        ordered_quantity: Math.max(s.suggested_order_qty ?? s.suggested_reorder_qty ?? 1, 1),
        quantity: Math.max(s.suggested_order_qty ?? s.suggested_reorder_qty ?? 1, 1),
        unit: s.unit || "kg",
        unit_cost: s.purchase_cost ?? s.estimated_unit_cost_inr ?? 100,
        unit_price_inr: s.purchase_cost ?? s.estimated_unit_cost_inr ?? 100,
      },
    ]);
  };

  const handleAddManualItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_type: "INVENTORY",
        item_id: 1,
        target_type: "INVENTORY",
        target_id: 1,
        item_name: "Raw Material Item",
        ordered_quantity: 10,
        quantity: 10,
        unit: "kg",
        unit_cost: 100,
        unit_price_inr: 100,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Please add at least one line item to the purchase order.");
      return;
    }

    const effectiveSupplier =
      supplierName === "Custom Supplier..." ? customSupplier.trim() : supplierName;

    if (!effectiveSupplier) {
      setError("Please enter a valid supplier name.");
      return;
    }

    setLoading(true);
    setError(null);

    const hasPackaging = items.some(
      (it) => (it.item_type || it.target_type) === "PACKAGING"
    );
    const hasInventory = items.some(
      (it) => (it.item_type || it.target_type) === "INVENTORY"
    );
    const derivedTarget =
      hasPackaging && hasInventory ? "MIXED" : hasPackaging ? "PACKAGING" : "INVENTORY";

    try {
      await api.createRestockOrder({
        supplier_name: effectiveSupplier,
        target_type: derivedTarget,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          item_type: it.item_type || it.target_type || "INVENTORY",
          item_id: it.item_id || it.target_id || 1,
          ordered_quantity: Number(it.ordered_quantity ?? it.quantity ?? 1),
          unit_cost: Number(it.unit_cost ?? it.unit_price_inr ?? 0),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Create PO failed", err);
      setError(err?.message || "Failed to create purchase order. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Restock Purchase Order"
      description="Draft a kitchen purchase order, calculate total investment, and track replenishment."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Supplier & Delivery Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Supplier / Vendor
            </label>
            <select
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
            >
              {PRESET_SUPPLIERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {supplierName === "Custom Supplier..." && (
              <input
                type="text"
                placeholder="Enter custom supplier name"
                value={customSupplier}
                onChange={(e) => setCustomSupplier(e.target.value)}
                required
                className="w-full mt-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Expected Delivery Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Order Notes / Instructions (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Urgent morning delivery before Friday 8:00 AM, inspect seal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:bg-white"
          />
        </div>

        {/* Line Items Section */}
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Order Line Items</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600 text-[10px]">
                {items.length}
              </span>
            </label>

            <div className="flex items-center gap-2">
              {availableSuggestions.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (!isNaN(idx) && availableSuggestions[idx]) {
                        handleAddSuggestion(availableSuggestions[idx]);
                      }
                      e.target.value = "";
                    }}
                    defaultValue=""
                    className="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-2.5 py-1 text-[11px] font-bold hover:bg-amber-100 cursor-pointer"
                  >
                    <option value="" disabled>
                      + Add Low Stock Suggestion...
                    </option>
                    {availableSuggestions.map((s, idx) => (
                      <option key={`${s.item_type || s.target_type}-${s.item_id || s.target_id || idx}`} value={idx}>
                        {s.name || s.item_name} ({(s.item_type || s.target_type) === "INVENTORY" ? "Ingr" : "Pack"}) - Deficit: {s.suggested_order_qty ?? s.suggested_reorder_qty} {s.unit}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddManualItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-[11px] font-bold border border-stone-200"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Table of Line Items */}
          {items.length === 0 ? (
            <div className="py-6 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50">
              <Boxes className="w-6 h-6 text-stone-400 mx-auto mb-1" />
              <p className="text-xs text-stone-600 font-semibold">
                No items added to this PO yet
              </p>
              <p className="text-[11px] text-stone-400">
                Pick a low stock suggestion above or click &apos;Add Item&apos;
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
              {items.map((item, idx) => {
                const lineTotal = (item.quantity || 0) * (item.unit_price_inr || 0);
                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-white hover:bg-stone-50/50 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    {/* Item Name & Target */}
                    <div className="flex-1 min-w-[160px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <select
                          value={item.target_type}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              "target_type",
                              e.target.value as RestockOrderTarget
                            )
                          }
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200"
                        >
                          <option value="INVENTORY">Ingredient</option>
                          <option value="PACKAGING">Packaging</option>
                        </select>
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) =>
                            handleUpdateItem(idx, "item_name", e.target.value)
                          }
                          placeholder="Item Name"
                          className="font-bold text-stone-800 text-xs bg-transparent border-b border-stone-200 focus:outline-none focus:border-emerald-800 flex-1"
                        />
                      </div>
                    </div>

                    {/* Qty & Unit */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-center font-bold text-stone-800 focus:bg-white"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) =>
                          handleUpdateItem(idx, "unit", e.target.value)
                        }
                        className="w-12 bg-stone-50 border border-stone-200 rounded-lg px-1.5 py-1 text-[11px] text-center text-stone-600 focus:bg-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="flex items-center gap-1">
                      <span className="text-stone-400 text-xs">@ ₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.unit_price_inr}
                        onChange={(e) =>
                          handleUpdateItem(
                            idx,
                            "unit_price_inr",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-right font-bold text-stone-800 focus:bg-white"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="w-20 text-right font-black text-stone-900">
                      ₹{lineTotal.toLocaleString("en-IN")}
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary & Footer */}
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Order Investment
            </span>
            <p className="text-xs text-stone-600">
              {items.length} items to replenish kitchen stock
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-950">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-950 text-white hover:bg-emerald-900 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>{loading ? "Generating PO..." : "Create Purchase Order"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
