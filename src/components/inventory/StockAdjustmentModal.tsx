"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Scale,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { InventoryItem, InventoryTransactionInput, InventoryTransactionType } from "@/types";
import { Portal } from "@/components/ui/Portal";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: number, payload: InventoryTransactionInput) => Promise<void>;
  items: InventoryItem[];
  selectedItem?: InventoryItem | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  selectedItem: initialItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [txType, setTxType] = useState<InventoryTransactionType>("STOCK_IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number | undefined>(undefined);
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setSelectedItemId(initialItem.id);
      setUnitPrice(initialItem.purchase_price);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
      setUnitPrice(items[0].purchase_price);
    }
    setQuantity(0);
    setReferenceNo("");
    setNotes("");
    setError(null);
  }, [initialItem, isOpen, items]);

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

  const currentItem = items.find((i) => i.id === selectedItemId);

  // Handle changing item from dropdown
  const handleItemSelect = (id: number) => {
    setSelectedItemId(id);
    const it = items.find((i) => i.id === id);
    if (it) {
      setUnitPrice(it.purchase_price);
    }
  };

  // Compute calculated new stock
  const currentStock = currentItem?.current_stock ?? 0;
  let newCalculatedStock = currentStock;
  let deltaLabel = "+0";
  let isInvalidStock = false;

  if (txType === "STOCK_IN") {
    newCalculatedStock = currentStock + (quantity || 0);
    deltaLabel = `+${quantity || 0} ${currentItem?.unit || ""}`;
  } else if (txType === "STOCK_OUT" || txType === "WASTAGE") {
    newCalculatedStock = currentStock - (quantity || 0);
    deltaLabel = `-${quantity || 0} ${currentItem?.unit || ""}`;
    if (quantity > currentStock) {
      isInvalidStock = true;
    }
  } else if (txType === "AUDIT_CORRECTION") {
    newCalculatedStock = quantity || 0;
    const diff = (quantity || 0) - currentStock;
    deltaLabel = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)} ${currentItem?.unit || ""}`;
  }

  const effectivePrice = unitPrice !== undefined ? unitPrice : (currentItem?.purchase_price ?? 0);
  const totalCost = (quantity || 0) * effectivePrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError("Please select an item.");
      return;
    }
    if (quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    if ((txType === "STOCK_OUT" || txType === "WASTAGE") && quantity > currentStock) {
      setError(
        `Insufficient stock! Available: ${currentStock} ${currentItem?.unit}, cannot deduct ${quantity} ${currentItem?.unit}.`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(selectedItemId, {
        transaction_type: txType,
        quantity,
        unit_price: unitPrice,
        reference_no: referenceNo || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Record Stock Movement</h2>
              <p className="text-xs text-stone-300">
                Log purchases, kitchen consumption, wastage, or physical audit
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

          {/* Select Item */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Select Ingredient *
            </label>
            <select
              value={selectedItemId || ""}
              onChange={(e) => handleItemSelect(Number(e.target.value))}
              disabled={!!initialItem}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-semibold bg-white disabled:bg-stone-100"
            >
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.current_stock} {it.unit} in stock) — ₹{it.purchase_price}/{it.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Action / Transaction Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTxType("STOCK_IN")}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  txType === "STOCK_IN"
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-md"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <ArrowDownCircle className={`w-4 h-4 ${txType === "STOCK_IN" ? "text-amber-400" : "text-emerald-700"}`} />
                <span>Stock In</span>
                <span className="text-[10px] font-normal opacity-80">(Restock)</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType("STOCK_OUT")}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  txType === "STOCK_OUT"
                    ? "bg-blue-900 text-white border-blue-900 shadow-md"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <ArrowUpCircle className={`w-4 h-4 ${txType === "STOCK_OUT" ? "text-sky-400" : "text-blue-700"}`} />
                <span>Stock Out</span>
                <span className="text-[10px] font-normal opacity-80">(Cooking)</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType("WASTAGE")}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  txType === "WASTAGE"
                    ? "bg-rose-900 text-white border-rose-900 shadow-md"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <Trash2 className={`w-4 h-4 ${txType === "WASTAGE" ? "text-rose-400" : "text-rose-600"}`} />
                <span>Wastage</span>
                <span className="text-[10px] font-normal opacity-80">(Loss/Spoil)</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType("AUDIT_CORRECTION")}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                  txType === "AUDIT_CORRECTION"
                    ? "bg-purple-900 text-white border-purple-900 shadow-md"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <Scale className={`w-4 h-4 ${txType === "AUDIT_CORRECTION" ? "text-amber-400" : "text-purple-700"}`} />
                <span>Audit Count</span>
                <span className="text-[10px] font-normal opacity-80">(Physical)</span>
              </button>
            </div>
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {txType === "AUDIT_CORRECTION" ? "New Counted Stock *" : "Quantity to Adjust *"} ({currentItem?.unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={quantity || ""}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Unit Cost (₹ / {currentItem?.unit})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-400 font-semibold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(currentItem?.purchase_price || 0)}
                  value={unitPrice !== undefined ? unitPrice : ""}
                  onChange={(e) =>
                    setUnitPrice(e.target.value === "" ? undefined : parseFloat(e.target.value) || 0)
                  }
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Real-time Math Preview Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isInvalidStock
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-stone-50 border-stone-200 text-stone-900"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-stone-500 uppercase tracking-wider">Balance Impact Preview</span>
              <span className="text-emerald-950 font-bold">Total Value: ₹{totalCost.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between font-mono text-sm bg-white p-3 rounded-lg border border-stone-200">
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Current Stock</span>
                <span className="font-bold text-stone-800">
                  {currentStock} {currentItem?.unit}
                </span>
              </div>

              <div className="text-center px-2">
                <span className="block text-[10px] text-stone-400 uppercase">Movement</span>
                <span
                  className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                    txType === "STOCK_IN"
                      ? "bg-emerald-100 text-emerald-800"
                      : txType === "WASTAGE"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {deltaLabel}
                </span>
              </div>

              <div className="text-right">
                <span className="block text-[10px] text-stone-400 uppercase">New Calculated Stock</span>
                <span
                  className={`font-bold ${
                    isInvalidStock ? "text-rose-600 underline" : "text-emerald-900 text-base"
                  }`}
                >
                  {newCalculatedStock.toFixed(2)} {currentItem?.unit}
                </span>
              </div>
            </div>

            {isInvalidStock && (
              <p className="mt-2 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Deduction exceeds available stock ({currentStock} {currentItem?.unit})!
              </p>
            )}
          </div>

          {/* Reference & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Reference / Slip No.
              </label>
              <input
                type="text"
                placeholder="e.g. PO-8832, KOT-104, SLIP-09"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Reason / Operational Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Batch cooking, Spillage during boiling"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700/30 focus:border-emerald-700 text-stone-900 text-sm font-medium"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-3">
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
            disabled={loading || isInvalidStock}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 ${
              txType === "STOCK_IN"
                ? "bg-emerald-900 hover:bg-emerald-950"
                : txType === "STOCK_OUT"
                ? "bg-blue-900 hover:bg-blue-950"
                : txType === "WASTAGE"
                ? "bg-rose-900 hover:bg-rose-950"
                : "bg-purple-900 hover:bg-purple-950"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{loading ? "Recording..." : `Confirm ${txType.replace("_", " ")}`}</span>
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
};
