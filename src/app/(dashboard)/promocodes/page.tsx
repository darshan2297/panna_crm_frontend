"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Ticket, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/services/api";
import { PromoCode } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function PromoCodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPromoCodes();
      setCodes(res.data || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (pc: PromoCode) => {
    try {
      await api.updatePromoCode(pc.id, { active: !pc.active });
      setCodes((c) => c.map((x) => (x.id === pc.id ? { ...x, active: !x.active } : x)));
    } catch (e: any) {
      setError(e?.message || "Failed to update promo code");
    }
  };

  const remove = (pc: PromoCode) => {
    setConfirmAction(() => async () => {
      try {
        await api.deletePromoCode(pc.id);
        setCodes((c) => c.filter((x) => x.id !== pc.id));
      } catch (e: any) {
        setError(e?.message || "Failed to delete promo code");
      }
    });
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-6 w-6" /> Promo Codes
          </h1>
          <p className="text-sm text-gray-500">
            Manage discounts, eligibility rules and campaign windows.
          </p>
        </div>
        <Link href="/promocodes/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" /> New Promo Code
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={8} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b bg-gray-50">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Criteria</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Usage</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((pc) => (
                    <tr key={pc.id} className="border-b last:border-0 align-top">
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold flex items-center gap-1.5">
                          {pc.code}
                          {pc.is_private && (
                            <span title="Private — hidden from public listings">
                              <Lock className="w-3 h-3 text-slate-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium">{pc.title}</div>
                        {pc.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-2 max-w-[220px]">
                            {pc.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium">
                          {pc.discount_type === "percentage"
                            ? `${pc.discount_value}%`
                            : pc.discount_type === "free_item"
                            ? "Free item"
                            : pc.discount_type === "free_delivery"
                            ? "Free delivery"
                            : `₹${pc.discount_value}`}
                        </div>
                        {pc.discount_type === "percentage" && pc.max_discount_amount != null && (
                          <div className="text-[10px] text-slate-500">
                            max ₹{pc.max_discount_amount}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500">on {pc.discount_on}</div>
                      </td>

                      <td className="py-3 px-4">
                        {pc.discount_on === "quantity" ? (
                          <span className="text-slate-700">
                            {pc.min_quantity ?? 0}
                            {pc.max_quantity != null ? `–${pc.max_quantity}` : "+"} qty
                          </span>
                        ) : (
                          <span className="text-slate-700">
                            ₹{pc.min_order_value}
                            {pc.max_order_value != null ? `–₹${pc.max_order_value}` : "+"}
                          </span>
                        )}
                        {pc.customer_type !== "all" && (
                          <div className="text-[10px] text-amber-700 mt-0.5">
                            {pc.customer_type === "new" ? "First-time only" : "Returning only"}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {pc.applicable_items && pc.applicable_items.length > 0 ? (
                          <span title={pc.applicable_items.join(", ")}>
                            {pc.applicable_items.length} selected
                          </span>
                        ) : (
                          <span className="text-slate-400">All items</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div>
                          {pc.used_count ?? 0}
                          {pc.max_uses != null ? ` / ${pc.max_uses}` : ""}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {pc.per_user_limit ?? 1} per user
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <button onClick={() => toggleActive(pc)}>
                          <Badge variant={pc.active ? "success" : "danger"}>
                            {pc.active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/promocodes/${pc.id}`}
                          className="inline-block mr-3 text-gray-500 hover:text-gray-800"
                          aria-label={`Edit ${pc.code}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => remove(pc)}
                          className="text-red-500 hover:text-red-700"
                          aria-label={`Delete ${pc.code}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-400">
                        No promo codes yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
          <ConfirmDialog
        open={confirmAction !== null}
        title="Delete Promo Code"
        message="Are you sure you want to delete this promo code? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={confirmBusy}
        onConfirm={async () => {
          if (!confirmAction) return;
          setConfirmBusy(true);
          try { await confirmAction(); } finally { setConfirmBusy(false); setConfirmAction(null); }
        }}
        onCancel={() => setConfirmAction(null)}
      />

</div>
  );
}
