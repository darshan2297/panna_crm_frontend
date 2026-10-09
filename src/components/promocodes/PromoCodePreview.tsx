"use client";

import React, { useMemo, useState } from "react";
import {
  Tag,
  Gift,
  Truck,
  Percent,
  Clock,
  Users,
  ListChecks,
  ShieldAlert,
  Eye,
  Info,
} from "lucide-react";
import { PromoFormState } from "./PromoCodeForm";

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Mirrors resolveDiscountAmount on the website so the preview cannot drift. */
function computeDiscount(
  discountType: PromoFormState["discount_type"],
  value: number,
  cap: number | "",
  subtotal: number
) {
  if (discountType === "percentage") {
    const raw = (subtotal * (Number(value) || 0)) / 100;
    return cap !== "" && Number(cap) > 0 ? Math.min(raw, Number(cap)) : raw;
  }
  if (discountType === "fixed") {
    return Math.max(0, Math.min(Number(value) || 0, subtotal));
  }
  return 0;
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
        <Icon className="w-3.5 h-3.5 text-panna-green-700" />
        <h4 className="text-xs font-bold text-slate-700">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/**
 * Right-hand companion panel: shows the offer as a customer would see it and
 * summarises eligibility, so the operator can sanity-check the configuration
 * without saving.
 */
export function PromoCodePreview({ form }: { form: PromoFormState }) {
  const [sampleCart, setSampleCart] = useState(1000);

  const amountMode = form.discount_on === "amount";
  const isPercentage = form.discount_type === "percentage";
  const isFreeItem = form.discount_type === "free_item";
  const isFreeDelivery = form.discount_type === "free_delivery";

  const discount = useMemo(
    () => computeDiscount(form.discount_type, form.discount_value, form.max_discount_amount, sampleCart),
    [form.discount_type, form.discount_value, form.max_discount_amount, sampleCart]
  );

  const capBites =
    isPercentage &&
    form.max_discount_amount !== "" &&
    Number(form.max_discount_amount) > 0 &&
    (sampleCart * (Number(form.discount_value) || 0)) / 100 > Number(form.max_discount_amount);

  const minThreshold = amountMode
    ? Number(form.min_order_value || 0)
    : Number(form.min_quantity || 0);
  const meetsMin = amountMode
    ? sampleCart >= minThreshold
    : sampleCart >= minThreshold;
  const overMax =
    amountMode && form.max_order_value !== "" && sampleCart > Number(form.max_order_value);

  const typeLabel = isPercentage
    ? `${form.discount_value || 0}% off`
    : isFreeItem
    ? form.free_item_name || "Free item"
    : isFreeDelivery
    ? "Free delivery"
    : `${inr(form.discount_value)} off`;

  return (
    <div className="space-y-4">
      {/* Customer-facing preview */}
      <Card icon={Eye} title="Customer Preview">
        <div className="rounded-xl border border-panna-gold/30 bg-gradient-to-br from-[#fdfaf3] to-[#f7f1e4] p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                {form.badge || "Special Offer"}
              </p>
              <p className="font-serif text-base font-bold text-panna-deep mt-0.5 truncate">
                {form.title || "Untitled offer"}
              </p>
            </div>
            <span className="shrink-0 font-mono text-xs font-bold text-white bg-[#003F32] px-2 py-1 rounded">
              {form.code || "CODE"}
            </span>
          </div>

          {form.description && (
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              {form.description}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-panna-gold/25 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#003F32]" />
            <span className="text-sm font-bold text-[#003F32]">{typeLabel}</span>
          </div>

          {isFreeItem && form.free_item_name && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700">
              <Gift className="w-3.5 h-3.5" />
              <span className="font-semibold">{form.free_item_name} added free</span>
            </div>
          )}
          {isFreeDelivery && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-700">
              <Truck className="w-3.5 h-3.5" />
              <span className="font-semibold">Delivery fee waived</span>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-panna-gold/25 text-[10px] text-slate-500 space-y-0.5">
            {minThreshold > 0 && (
              <p>
                Minimum order {amountMode ? inr(minThreshold) : `${minThreshold} item(s)`}
              </p>
            )}
            {form.valid_until && <p>Valid till {fmtDate(form.valid_until)}</p>}
            {form.is_private && (
              <p className="font-semibold text-amber-700">
                Private — customers must enter the code manually
              </p>
            )}
          </div>
        </div>

        {form.terms_conditions && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Terms &amp; Conditions
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line line-clamp-6">
              {form.terms_conditions}
            </p>
          </div>
        )}
      </Card>

      {/* Discount calculator */}
      {!isFreeItem && !isFreeDelivery && (
        <Card icon={Percent} title="Discount Calculator">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Sample cart value
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={sampleCart}
              onChange={(e) => setSampleCart(Number(e.target.value))}
              className="flex-1 accent-panna-green-700"
            />
            <input
              type="number"
              value={sampleCart}
              onChange={(e) => setSampleCart(Number(e.target.value))}
              className="w-24 border border-slate-300 rounded-md px-2 py-1 text-xs text-right focus:outline-none focus:border-panna-green-600"
            />
          </div>

          <div className="mt-3 space-y-1.5 text-xs bg-slate-50 rounded-lg p-3">
            <Row label="Cart value" value={inr(sampleCart)} />
            <Row
              label="Discount"
              value={<span className="text-emerald-700">- {inr(discount)}</span>}
            />
            {isPercentage && form.max_discount_amount !== "" && (
              <Row label="Cap applied" value={inr(Number(form.max_discount_amount))} />
            )}
            <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between">
              <span className="font-bold text-slate-700">Customer pays</span>
              <span className="font-bold text-slate-900">{inr(sampleCart - discount)}</span>
            </div>
          </div>

          {capBites && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px text-amber-600" />
              <span>
                Cap reached — {form.discount_value}% of {inr(sampleCart)} would be{" "}
                {inr((sampleCart * (Number(form.discount_value) || 0)) / 100)}, limited to{" "}
                {inr(Number(form.max_discount_amount))}.
              </span>
            </div>
          )}

          {!meetsMin && minThreshold > 0 && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px text-slate-400" />
              <span>
                At {inr(sampleCart)} this code won&apos;t qualify — needs{" "}
                {amountMode ? inr(minThreshold) : `${minThreshold} item(s)`}.
              </span>
            </div>
          )}

          {overMax && (
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" />
              <span>
                Above the {inr(Number(form.max_order_value))} ceiling — code won&apos;t apply.
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Eligibility summary */}
      <Card icon={ListChecks} title="Eligibility Summary">
        <div className="divide-y divide-slate-100">
          <Row
            label={<span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> Type</span>}
            value={
              isPercentage
                ? `Percentage (${form.discount_value}%)`
                : isFreeItem
                ? "Free item"
                : isFreeDelivery
                ? "Free delivery"
                : "Flat amount"
            }
          />
          <Row
            label="Discount on"
            value={amountMode ? "Amount (₹)" : "Quantity (items)"}
          />
          <Row
            label="Minimum"
            value={
              amountMode ? inr(form.min_order_value) : `${form.min_quantity ?? 0} item(s)`
            }
          />
          <Row
            label="Maximum"
            value={
              amountMode
                ? form.max_order_value === ""
                  ? "No limit"
                  : inr(Number(form.max_order_value))
                : form.max_quantity === ""
                ? "No limit"
                : `${form.max_quantity} item(s)`
            }
          />
          <Row
            label={
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" /> Per user
              </span>
            }
            value={`${form.per_user_limit}× max`}
          />
          <Row
            label="Total uses"
            value={form.max_uses === "" ? "Unlimited" : inr(Number(form.max_uses))}
          />
          <Row
            label={
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Window
              </span>
            }
            value={
              form.valid_from || form.valid_until
                ? `${fmtDate(form.valid_from)} → ${fmtDate(form.valid_until)}`
                : "Always on"
            }
          />
          <Row
            label="Customers"
            value={
              form.customer_type === "new"
                ? "First-time only"
                : form.customer_type === "returning"
                ? "Returning only"
                : "All customers"
            }
          />
          <Row
            label="Menu items"
            value={
              form.applicable_items.length > 0
                ? `${form.applicable_items.length} selected`
                : "All items"
            }
          />
          <Row
            label="Visibility"
            value={form.is_private ? "Private (hidden)" : "Public (listed)"}
          />
          <Row label="Status" value={form.active ? "Active" : "Inactive"} />
        </div>
      </Card>
    </div>
  );
}