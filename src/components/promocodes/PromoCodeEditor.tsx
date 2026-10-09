"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { api } from "@/services/api";
import { PromoCode } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { PromoCodeForm, PromoFormState } from "@/components/promocodes/PromoCodeForm";
import { PromoCodePreview } from "@/components/promocodes/PromoCodePreview";

export const EMPTY_PROMO_FORM: PromoFormState = {
  code: "",
  title: "",
  subtitle: "",
  description: "",
  terms_conditions: "",
  is_private: false,
  discount_type: "percentage",
  discount_value: 0,
  max_discount_amount: "",
  free_item_name: "",
  discount_on: "amount",
  min_order_value: 0,
  max_order_value: "",
  min_quantity: "",
  max_quantity: "",
  customer_type: "all",
  badge: "",
  active: true,
  valid_from: "",
  valid_until: "",
  max_uses: "",
  per_user_limit: 1,
  applicable_items: [],
  events: [],
};

/** `datetime-local` inputs need a local-time string without the timezone suffix. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toFormState = (pc: PromoCode): PromoFormState => ({
  code: pc.code,
  title: pc.title,
  subtitle: pc.subtitle || "",
  description: pc.description || "",
  terms_conditions: pc.terms_conditions || "",
  is_private: pc.is_private ?? false,
  discount_type: (pc.discount_type as PromoFormState["discount_type"]) || "percentage",
  discount_value: pc.discount_value ?? 0,
  max_discount_amount: pc.max_discount_amount ?? "",
  free_item_name: pc.free_item_name || "",
  discount_on: pc.discount_on || "amount",
  min_order_value: pc.min_order_value ?? 0,
  max_order_value: pc.max_order_value ?? "",
  min_quantity: pc.min_quantity ?? "",
  max_quantity: pc.max_quantity ?? "",
  customer_type: pc.customer_type || "all",
  badge: pc.badge || "",
  active: pc.active,
  valid_from: toLocalInput(pc.valid_from),
  valid_until: toLocalInput(pc.valid_until),
  max_uses: pc.max_uses ?? "",
  per_user_limit: pc.per_user_limit ?? 1,
  applicable_items: Array.isArray(pc.applicable_items) ? pc.applicable_items : [],
  events: [],
});

const buildPayload = (form: PromoFormState) => ({
  code: form.code.trim().toUpperCase(),
  title: form.title,
  subtitle: form.subtitle || null,
  description: form.description || null,
  terms_conditions: form.terms_conditions || null,
  category: "general",
  is_private: form.is_private,
  discount_type: form.discount_type,
  discount_value: Number(form.discount_value) || 0,
  max_discount_amount:
    form.max_discount_amount === "" ? null : Number(form.max_discount_amount),
  free_item_name: form.free_item_name || null,
  discount_on: form.discount_on,
  min_order_value: Number(form.min_order_value) || 0,
  max_order_value: form.max_order_value === "" ? null : Number(form.max_order_value),
  min_quantity: form.min_quantity === "" ? null : Number(form.min_quantity),
  max_quantity: form.max_quantity === "" ? null : Number(form.max_quantity),
  customer_type: form.customer_type,
  badge: form.badge || null,
  active: form.active,
  valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
  valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
  max_uses: form.max_uses === "" ? null : Number(form.max_uses),
  per_user_limit: Number(form.per_user_limit) || 1,
  applicable_items: form.applicable_items.length > 0 ? form.applicable_items : null,
  events: [],
});

/**
 * Full-page promo create/edit form. Shared by /promocodes/new and
 * /promocodes/[id] so both routes share one implementation.
 */
export function PromoCodeEditor({ promoId }: { promoId?: number }) {
  const router = useRouter();
  const isEdit = typeof promoId === "number";

  const [form, setForm] = useState<PromoFormState>(EMPTY_PROMO_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isEdit) return;
    try {
      const res = await api.getPromoCode(promoId!);
      if (res.data) setForm(toFormState(res.data));
      else setError("Promo code not found");
    } catch (e: any) {
      setError(e?.message || "Failed to load promo code");
    } finally {
      setLoading(false);
    }
  }, [isEdit, promoId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(form);
      if (isEdit) await api.updatePromoCode(promoId!, payload);
      else await api.createPromoCode(payload);
      router.push("/promocodes");
      router.refresh();
    } catch (e: any) {
      setError(e?.errors?.join(" | ") || e?.message || "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Loading promo code..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/promocodes"
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shrink-0"
          aria-label="Back to promo codes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            {isEdit ? "Edit Promo Code" : "New Promo Code"}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit
              ? "Update eligibility rules, discount criteria and campaign windows."
              : "Define how this discount applies to your storefront."}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Two columns: form on the left, live preview on the right so wide
          screens aren't left with dead space beside a narrow form. */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 min-w-0">
          <PromoCodeForm form={form} setForm={setForm} />
        </div>

        <div className="xl:col-span-1 xl:sticky xl:top-6">
          <PromoCodePreview form={form} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 py-3 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/promocodes")} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Promo Code"}
        </Button>
      </div>
    </div>
  );
}