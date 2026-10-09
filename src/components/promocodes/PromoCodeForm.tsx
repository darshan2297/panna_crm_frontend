"use client";

import React, { useState } from "react";
import { Lock, Users, UtensilsCrossed, ChevronDown, Tag } from "lucide-react";
import { MenuItemSelector } from "@/components/promocodes/MenuItemSelector";

export interface PromoEventDraft {
  event_title: string;
  start_date: string; // yyyy-MM-ddTHH:mm
  end_date: string;
}

export interface PromoFormState {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  terms_conditions: string;
  is_private: boolean;
  discount_type: "fixed" | "percentage" | "free_item" | "free_delivery";
  discount_value: number;
  max_discount_amount: number | "";
  free_item_name: string;
  discount_on: "amount" | "quantity";
  min_order_value: number;
  max_order_value: number | "";
  min_quantity: number | "";
  max_quantity: number | "";
  customer_type: "all" | "new" | "returning";
  valid_from: string;
  valid_until: string;
  max_uses: number | "";
  per_user_limit: number;
  badge: string;
  active: boolean;
  applicable_items: string[];
  events: PromoEventDraft[];
}

const inputCls =
  "w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-panna-green-600 bg-white";
const labelCls = "block text-xs font-semibold text-slate-700 mb-1";
const errCls = "text-[11px] text-red-600 mt-1";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/40">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-panna-green-700" />
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      {hint && <p className="text-[11px] text-slate-500 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

/** Percentage / Flat are the primary types; the rest live behind a toggle. */
const PRIMARY_TYPES = [
  ["percentage", "Percentage"],
  ["fixed", "Flat"],
] as const;

const ADVANCED_TYPES = [
  ["free_item", "Free Item"],
  ["free_delivery", "Free Delivery"],
] as const;

export function PromoCodeForm({
  form,
  setForm,
}: {
  form: PromoFormState;
  setForm: React.Dispatch<React.SetStateAction<PromoFormState>>;
}) {
  const [showAdvancedTypes, setShowAdvancedTypes] = useState(
    form.discount_type === "free_item" || form.discount_type === "free_delivery"
  );

  const set = <K extends keyof PromoFormState>(k: K, v: PromoFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const amountMode = form.discount_on === "amount";
  const isPercentage = form.discount_type === "percentage";
  const isFreeItem = form.discount_type === "free_item";

  const discountValueError =
    isPercentage && form.discount_value > 100 ? "Percentage cannot exceed 100" : null;

  return (
    <div className="space-y-4">
      {/* Discount Information */}
      <Section icon={Users} title="Discount Information">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              placeholder="e.g. Summer of MAP"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Discount Code *</label>
            <input
              className={`${inputCls} uppercase font-semibold`}
              placeholder="SUMMERMAP2026"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Summary</label>
            <input
              className={inputCls}
              placeholder="Short customer-facing summary"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Badge</label>
            <input
              className={inputCls}
              placeholder="e.g. Save 25%"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Terms &amp; Condition</label>
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Eligibility rules shown to the customer"
              value={form.terms_conditions}
              onChange={(e) => set("terms_conditions", e.target.value)}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_private}
                onChange={(e) => set("is_private", e.target.checked)}
                className="accent-panna-green-700"
              />
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-700">Make it private</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Redeemable by code, but hidden from public listings.
            </span>
          </div>
        </div>
      </Section>

      {/* Applicable Menu Items */}
      <Section
        icon={UtensilsCrossed}
        title="Select Menu Items"
        hint="Leave empty to apply the discount to the whole cart."
      >
        <MenuItemSelector
          value={form.applicable_items}
          onChange={(slugs) => set("applicable_items", slugs)}
        />
      </Section>

      {/* Discount Criteria */}
      <Section icon={Tag} title="Discount Criteria">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelCls}>Date range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                className={inputCls}
                value={form.valid_from}
                onChange={(e) => set("valid_from", e.target.value)}
              />
              <input
                type="datetime-local"
                className={inputCls}
                value={form.valid_until}
                onChange={(e) => set("valid_until", e.target.value)}
              />
            </div>
          </div>

          {/* Discount Type */}
          <div className="col-span-2">
            <label className={labelCls}>Discount Type *</label>
            <div className="flex flex-wrap gap-6">
              {PRIMARY_TYPES.map(([v, lbl]) => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="discount_type"
                    checked={form.discount_type === v}
                    onChange={() => set("discount_type", v)}
                    className="accent-panna-green-700"
                  />
                  <span className="text-slate-700">{lbl}</span>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setShowAdvancedTypes((s) => !s)}
                className="flex items-center gap-1 text-xs font-semibold text-panna-green-700 hover:underline"
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showAdvancedTypes ? "rotate-180" : ""}`}
                />
                More types
              </button>
            </div>
            {showAdvancedTypes && (
              <div className="mt-2 flex gap-6">
                {ADVANCED_TYPES.map(([v, lbl]) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="discount_type"
                      checked={form.discount_type === v}
                      onChange={() => set("discount_type", v)}
                      className="accent-panna-green-700"
                    />
                    <span className="text-slate-600">{lbl}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Value inputs — shape follows the selected discount type */}
          {isPercentage ? (
            <>
              <div>
                <label className={labelCls}>Enter Discount Percentage (in %) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={`${inputCls} ${discountValueError ? "border-red-400" : ""}`}
                  value={form.discount_value}
                  onChange={(e) => set("discount_value", Number(e.target.value))}
                />
                {discountValueError && <p className={errCls}>{discountValueError}</p>}
              </div>
              <div>
                <label className={labelCls}>
                  Maximum Discount Amount For Percentage (in ₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  placeholder="e.g. 150"
                  value={form.max_discount_amount}
                  onChange={(e) =>
                    set(
                      "max_discount_amount",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Caps the discount on large carts, e.g. 25% off ₹2000 saves ₹500 → ₹150.
                </p>
              </div>
            </>
          ) : (
            <div>
              <label className={labelCls}>Enter Discount Amount (in ₹) *</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={isFreeItem ? 0 : form.discount_value}
                disabled={isFreeItem}
                onChange={(e) => set("discount_value", Number(e.target.value))}
              />
              {isFreeItem && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Not applicable — the gift item below is added at ₹0.
                </p>
              )}
            </div>
          )}

          {isFreeItem && (
            <div className="col-span-2">
              <label className={labelCls}>Free Item Name</label>
              <input
                className={inputCls}
                placeholder="e.g. Complimentary Shahi Brownie Sweet"
                value={form.free_item_name}
                onChange={(e) => set("free_item_name", e.target.value)}
              />
            </div>
          )}

          {/* Discount On */}
          <div className="col-span-2">
            <label className={labelCls}>Discount On *</label>
            <div className="flex gap-6">
              {(
                [
                  ["quantity", "Quantity"],
                  ["amount", "Amount"],
                ] as const
              ).map(([v, lbl]) => (
                <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="discount_on"
                    checked={form.discount_on === v}
                    onChange={() => set("discount_on", v)}
                    className="accent-panna-green-700"
                  />
                  <span className="text-slate-700">{lbl}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {amountMode
                ? "Thresholds below are read as cart value in ₹."
                : "Thresholds below are read as item quantity in the cart."}
            </p>
          </div>

          {amountMode ? (
            <>
              <div>
                <label className={labelCls}>Minimum Amount (IN ₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.min_order_value}
                  onChange={(e) => set("min_order_value", Number(e.target.value))}
                />
              </div>
              <div>
                <label className={labelCls}>Maximum Amount (IN ₹)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="No limit"
                  value={form.max_order_value}
                  onChange={(e) =>
                    set("max_order_value", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelCls}>Minimum Quantity</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.min_quantity}
                  onChange={(e) =>
                    set("min_quantity", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Maximum Quantity</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="No limit"
                  value={form.max_quantity}
                  onChange={(e) =>
                    set("max_quantity", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>Maximum Available Unit per User</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.per_user_limit}
              onChange={(e) => set("per_user_limit", Math.max(1, Number(e.target.value)))}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A value of 1 lets each customer redeem this code once.
            </p>
          </div>

          <div>
            <label className={labelCls}>Customer Eligibility</label>
            <select
              className={inputCls}
              value={form.customer_type}
              onChange={(e) =>
                set("customer_type", e.target.value as PromoFormState["customer_type"])
              }
            >
              <option value="all">All customers</option>
              <option value="new">First-time customers only</option>
              <option value="returning">Returning customers only</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Maximum Total Uses</label>
            <input
              type="number"
              className={inputCls}
              placeholder="Unlimited"
              value={form.max_uses}
              onChange={(e) =>
                set("max_uses", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
                className="accent-panna-green-700"
              />
              <span className="text-slate-700">Active</span>
            </label>
          </div>
        </div>
      </Section>
    </div>
  );
}