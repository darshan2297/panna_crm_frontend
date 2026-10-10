"use client";

import React, { useState } from "react";
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  AlertCircle,
  PackageCheck,
  FileText,
  Boxes,
  Package,
  Calendar,
  IndianRupee,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services/api";
import { RestockOrder, RestockOrderStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface PODetailModalProps {
  po: RestockOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PODetailModal({
  po,
  isOpen,
  onClose,
  onSuccess,
}: PODetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  if (!po) return null;

  const handleStatusChange = async (newStatus: RestockOrderStatus) => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.updateRestockOrderStatus(po.id, newStatus);
      setSuccessMessage(`Order status updated to ${newStatus}`);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update order status");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveStock = () => {
    setConfirmAction(() => async () => {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        await api.receiveRestockOrder(po.id);
        setSuccessMessage(
          "Stock successfully received! All kitchen inventory balances have been increased and Stock-In transactions recorded."
        );
        onSuccess();
      } catch (err: any) {
        setErrorMessage(
          err?.message || "Failed to receive stock. Please try again."
        );
      } finally {
        setLoading(false);
      }
    });
  };

  const handleShareWhatsApp = () => {
    const textLines = [
      `*PANNA BIRYANI - PURCHASE ORDER*`,
      `PO Number: ${po.po_number}`,
      `Supplier: ${po.supplier_name}`,
      `Date: ${new Date(po.created_at).toLocaleDateString()}`,
      po.expected_date || po.ordered_at
        ? `Expected Delivery: ${new Date(po.expected_date || po.ordered_at!).toLocaleDateString()}`
        : "",
      ``,
      `*ITEMS TO SUPPLY:*`,
      ...po.items.map(
        (it, idx) =>
          `${idx + 1}. ${it.item_name} - ${it.ordered_quantity ?? it.quantity} ${it.unit} @ ₹${it.unit_cost ?? it.unit_price_inr} (₹${(it.total_cost ?? it.subtotal_inr ?? 0).toLocaleString("en-IN")})`
      ),
      ``,
      `*Total Order Value:* ₹${(po.total_estimated_cost ?? po.total_amount_inr ?? 0).toLocaleString("en-IN")}`,
      po.notes ? `*Notes:* ${po.notes}` : "",
      ``,
      `Please confirm dispatch & delivery schedule. Thank you!`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(textLines)}`;
    window.open(url, "_blank");
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Order: ${po.po_number}`}
      description="Kitchen replenishment manifest and 1-click stock receipt."
      className="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        {/* Messages */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PO Header Card */}
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Supplier / Vendor
            </span>
            <h4 className="text-sm font-bold text-stone-900">
              {po.supplier_name}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Created {new Date(po.created_at).toLocaleDateString()}
              </span>
              {(po.expected_date || po.ordered_at) && (
                <span className="flex items-center gap-1 text-stone-600">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Due {new Date(po.expected_date || po.ordered_at!).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Order Status
            </span>
            <Badge
              variant={
                po.status === "RECEIVED"
                  ? "success"
                  : po.status === "ORDERED"
                  ? "warning"
                  : po.status === "DRAFT"
                  ? "neutral"
                  : "danger"
              }
              size="md"
            >
              {po.status === "RECEIVED"
                ? "✓ GOODS RECEIVED"
                : po.status === "ORDERED"
                ? "⏳ ORDERED / IN TRANSIT"
                : po.status === "DRAFT"
                ? "DRAFT PO"
                : "CANCELLED"}
            </Badge>
          </div>
        </div>

        {/* Notes */}
        {po.notes && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-950">
            <span className="font-bold">Order Note: </span>
            {po.notes}
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 uppercase tracking-wider px-1">
            <span>Itemized Line Items</span>
            <span>{po.items.length} items</span>
          </div>

          <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-stone-100 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {po.items.map((it, idx) => (
                  <tr key={it.id} className="hover:bg-stone-50/60">
                    <td className="py-2.5 px-3 text-stone-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">
                      {it.item_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          (it.item_type || it.target_type) === "INVENTORY"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-indigo-50 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {(it.item_type || it.target_type) === "INVENTORY"
                          ? "Ingredient"
                          : "Packaging"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-800">
                      {it.ordered_quantity ?? it.quantity} {it.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-600">
                      ₹{it.unit_cost ?? it.unit_price_inr}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-stone-900">
                      ₹{(it.total_cost ?? it.subtotal_inr ?? 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-stone-50 font-bold border-t border-stone-200 text-stone-900">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase text-[11px] text-stone-600">
                    Total Order Value:
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-black text-emerald-950">
                    ₹{(po.total_estimated_cost ?? po.total_amount_inr ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrintSlip}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold border border-stone-200 transition-colors"
              title="Print PO slip"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
              title="Send PO details via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Progression */}
            {po.status === "DRAFT" && (
              <>
                <button
                  onClick={() => handleStatusChange("CANCELLED")}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                >
                  Cancel PO
                </button>
                <button
                  onClick={() => handleStatusChange("ORDERED")}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-xs transition-colors flex items-center gap-1"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Mark as ORDERED</span>
                </button>
              </>
            )}

            {po.status === "ORDERED" && (
              <button
                onClick={handleReceiveStock}
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-700 text-white hover:bg-emerald-800 shadow-md transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <PackageCheck className="w-4 h-4 text-amber-300" />
                <span>
                  {loading ? "Receiving Stock..." : "1-Click Receive into Stock"}
                </span>
              </button>
            )}

            {po.status === "RECEIVED" && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Received on{" "}
                  {po.received_at || po.received_date
                    ? new Date(po.received_at || po.received_date!).toLocaleDateString()
                    : "Kitchen Floor"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
          <ConfirmDialog
        open={confirmAction !== null}
        title="Receive Stock"
        message="Are you sure you want to receive all items? This will add stock to kitchen inventory."
        confirmLabel="Receive Stock"
        variant="danger"
        loading={confirmBusy}
        onConfirm={async () => {
          if (!confirmAction) return;
          setConfirmBusy(true);
          try { await confirmAction(); } finally { setConfirmBusy(false); setConfirmAction(null); }
        }}
        onCancel={() => setConfirmAction(null)}
      />

</Modal>
  );
}
