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
import { PackagingItem, PackagingTransactionInput, PackagingTransactionType } from "@/types";
import { Portal } from "@/components/ui/Portal";

interface PackagingAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemId: number, payload: PackagingTransactionInput) => Promise<void>;
  items: PackagingItem[];
  selectedItem?: PackagingItem | null;
}

export const PackagingAdjustmentModal: React.FC<PackagingAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  selectedItem: initialItem,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [txType, setTxType] = useState<PackagingTransactionType>("STOCK_IN");
  const [quantity, setQuantity] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number | undefined>(undefined);
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setSelectedItemId(initialItem.id);
      setUnitCost(initialItem.purchase_cost);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
      setUnitCost(items[0].purchase_cost);
    }
    setQuantity(0);
    setReferenceNo("");
    setNotes("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset form only when modal opens or items reload
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

  const handleItemSelect = (id: number) => {
    setSelectedItemId(id);
    const it = items.find((i) => i.id === id);
    if (it) {
      setUnitCost(it.purchase_cost);
    }
  };

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

  const effectiveCost = unitCost !== undefined ? unitCost : (currentItem?.purchase_cost ?? 0);
  const totalCost = (quantity || 0) * effectiveCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) {
      setError("Please select a packaging item.");
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
        unit_cost: unitCost,
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
                <h2 className="text-lg font-bold tracking-tight">Record Packaging Movement</h2>
                <p className="text-xs text-stone-300">
                  Log restock deliveries, dispatch burn, damaged items, or count audit
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Movement Type Tabs */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Transaction Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType("STOCK_IN")}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border ${
                    txType === "STOCK_IN"
                      ? "bg-emerald-900 text-white border-emerald-900 shadow-sm"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <ArrowDownCircle className={`w-4 h-4 ${txType === "STOCK_IN" ? "text-amber-400" : "text-emerald-700"}`} />
                  <span>Stock In (Delivery)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType("STOCK_OUT")}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border ${
                    txType === "STOCK_OUT"
                      ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <ArrowUpCircle className={`w-4 h-4 ${txType === "STOCK_OUT" ? "text-blue-300" : "text-blue-600"}`} />
                  <span>Stock Out (Kitchen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType("WASTAGE")}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border ${
                    txType === "WASTAGE"
                      ? "bg-rose-900 text-white border-rose-900 shadow-sm"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <Trash2 className={`w-4 h-4 ${txType === "WASTAGE" ? "text-rose-300" : "text-rose-600"}`} />
                  <span>Damaged / Waste</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType("AUDIT_CORRECTION")}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition-all border ${
                    txType === "AUDIT_CORRECTION"
                      ? "bg-purple-900 text-white border-purple-900 shadow-sm"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  <Scale className={`w-4 h-4 ${txType === "AUDIT_CORRECTION" ? "text-purple-300" : "text-purple-600"}`} />
                  <span>Audit Count</span>
                </button>
              </div>
            </div>

            {/* Select Item */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Packaging Item *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.sku}) — Available: {it.current_stock} {it.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Balance Comparison Card */}
            {currentItem && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Current Balance
                  </span>
                  <span className="text-xl font-black text-stone-900">
                    {currentStock} <span className="text-xs font-normal text-stone-500">{currentItem.unit}</span>
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                    Change
                  </span>
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded-full inline-block ${
                      txType === "STOCK_IN"
                        ? "bg-emerald-100 text-emerald-800"
                        : txType === "AUDIT_CORRECTION"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {deltaLabel}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                    New Balance
                  </span>
                  <span
                    className={`text-xl font-black ${
                      isInvalidStock ? "text-rose-600" : "text-emerald-950"
                    }`}
                  >
                    {newCalculatedStock} <span className="text-xs font-normal text-stone-500">{currentItem.unit}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Quantity & Unit Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  {txType === "AUDIT_CORRECTION" ? "Actual Verified Quantity *" : "Quantity to Adjust *"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={quantity || ""}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                    {currentItem?.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Unit Cost (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost !== undefined ? unitCost : ""}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    placeholder={currentItem ? String(currentItem.purchase_cost) : "0.00"}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Total Valuation Card */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold">
              <span>Financial Impact / Valuation:</span>
              <span className="font-bold text-amber-950 text-sm">
                ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Reference & Reason */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Reference No. (PO / Invoice / Bill)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. PO-8902, INV-2026-44"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Operational Reason / Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Supplier delivery received, Damaged in transit..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-900 focus:border-transparent transition-all placeholder:text-stone-400"
                />
              </div>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
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
