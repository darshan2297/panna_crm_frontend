"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Utensils,
  ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  MenuCategory,
  MenuItem,
  MenuItemInput,
  MenuItemPortionInput,
} from "@/types";
import { api } from "@/services/api";

const DEFAULT_PORTION: MenuItemPortionInput = {
  portion_size: "500g",
  weight_grams: 500,
  serves_persons: "1-2 Persons",
  cost_price: 150,
  base_price: 349,
  zomato_price: 429,
  swiggy_price: 419,
  is_available: true,
};

const NEW_PORTION: MenuItemPortionInput = {
  portion_size: "1kg",
  weight_grams: 1000,
  serves_persons: "3-4 Persons",
  cost_price: 250,
  base_price: 599,
  zomato_price: 729,
  swiggy_price: 719,
  is_available: true,
};

const SPICE_OPTIONS = [
  { value: "MILD", label: "🌶️ Mild" },
  { value: "MEDIUM", label: "🌶️🌶️ Medium" },
  { value: "SPICY", label: "🌶️🌶️🌶️ Spicy" },
  { value: "EXTRA_SPICY", label: "🔥 Extra Spicy" },
];

const FIELD =
  "w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panna-green-600";

/** Backend serves uploads from `{origin}/media/...`; the API lives at `{origin}/api/v1`. */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const MEDIA_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, "");

function resolveImage(url?: string | null): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/media/")) return `${MEDIA_ORIGIN}${url}`;
  return url;
}

interface FeeConfig {
  txnFeePct: number;
  gstPct: number;
  vasFee: number;
  otherExpense: number;
}

/**
 * Menu prices are tax-inclusive, so GST is backed OUT of the price (never
 * added on top), then gateway/VAS/other charges are removed to arrive at the
 * net revenue and the true margin.
 *
 * VAS and other expense are flat per-order charges; they are surfaced per
 * portion here so the admin sees the complete charge stack while pricing.
 */
function reverseCalculate(base: number, cost: number, fee: FeeConfig) {
  const div = 1 + fee.gstPct / 100;
  const gstIncluded = Math.round((base - base / div) * 100) / 100;
  const baseExcl = Math.round((base / div) * 100) / 100;
  const txnFee = Math.round(((base * fee.txnFeePct) / 100) * 100) / 100;
  const netRev =
    Math.round((baseExcl - txnFee - fee.vasFee - fee.otherExpense) * 100) / 100;
  const marginAmt = Math.round((netRev - cost) * 100) / 100;
  const marginPct = netRev > 0 ? Math.round((marginAmt / netRev) * 100) : 0;
  return { gstIncluded, baseExcl, txnFee, netRev, marginAmt, marginPct };
}

export function MenuItemEditor({ menuItemId }: { menuItemId?: number }) {
  const router = useRouter();
  const isEdit = typeof menuItemId === "number";

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loadedItem, setLoadedItem] = useState<MenuItem | null>(null);

  const [categoryId, setCategoryId] = useState<number>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState("MEDIUM");
  const [prepTime, setPrepTime] = useState(25);
  const [imageUrl, setImageUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [portions, setPortions] = useState<MenuItemPortionInput[]>([
    { ...DEFAULT_PORTION },
  ]);

  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    txnFeePct: 0,
    gstPct: 5,
    vasFee: 0,
    otherExpense: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBroken, setImageBroken] = useState(false);

  // Billing config drives the live margin preview.
  useEffect(() => {
    api
      .getStorefrontConfig()
      .then((res) => {
        if (res.data) {
          const cfg = (res.data as any) || {};
          setFeeConfig({
            txnFeePct: Number(cfg.transaction_fee_percent) || 0,
            gstPct: Number(cfg.gst_percent) || 5,
            vasFee: Number(cfg.vas_fee) || 0,
            otherExpense: Number(cfg.other_expense) || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Categories are needed for both create and edit.
  useEffect(() => {
    api
      .getMenuCategories()
      .then((res) => {
        const cats = res.data || [];
        setCategories(cats);
        if (!isEdit && cats.length > 0) {
          setCategoryId((c) => (cats.some((x) => x.id === c) ? c : cats[0].id));
        }
      })
      .catch(() => {});
  }, [isEdit]);

  // Load the dish when editing.
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    setLoadError(null);
    api
      .getMenuItem(menuItemId!)
      .then((res) => {
        if (!alive) return;
        if (!res.success || !res.data) {
          setLoadError("This menu dish could not be found.");
          setLoading(false);
          return;
        }
        const it = res.data;
        setLoadedItem(it);
        setCategoryId(it.category_id);
        setName(it.name);
        setDescription(it.description || "");
        setIsVeg(it.is_veg);
        setSpiceLevel(it.spice_level);
        setPrepTime(it.preparation_time_minutes);
        setImageUrl(it.image_url || "");
        setBadge(it.badge || "");
        setIsAvailable(it.is_available);
        if (it.portions?.length) {
          setPortions(
            it.portions.map((p) => ({
              id: p.id,
              portion_size: p.portion_size,
              weight_grams: p.weight_grams ?? undefined,
              serves_persons: p.serves_persons ?? undefined,
              cost_price: p.cost_price,
              base_price: p.base_price,
              original_price: p.original_price ?? undefined,
              zomato_price: p.zomato_price,
              swiggy_price: p.swiggy_price,
              is_available: p.is_available,
            }))
          );
        }
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setLoadError(e?.message || "Failed to load this menu dish.");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isEdit, menuItemId]);

  // Reset the broken-image flag whenever the URL changes.
  useEffect(() => setImageBroken(false), [imageUrl]);

  const handleBasePriceChange = (index: number, newBasePrice: number) => {
    setPortions((prev) =>
      prev.map((p, i) =>
        i !== index
          ? p
          : {
              ...p,
              base_price: newBasePrice,
              zomato_price: Math.round(newBasePrice * 1.22),
              swiggy_price: Math.round(newBasePrice * 1.2),
            }
      )
    );
  };

  const handleUpdatePortion = (
    index: number,
    field: keyof MenuItemPortionInput,
    value: any
  ) => {
    setPortions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleAddPortion = () =>
    setPortions((prev) => [...prev, { ...NEW_PORTION }]);

  const handleRemovePortion = (index: number) => {
    if (portions.length <= 1) return;
    setPortions((prev) => prev.filter((_, i) => i !== index));
  };

  // Portfolio-level rollup for the summary panel. Food cost is per unit, so it
  // is multiplied by quantity (each entry here represents 1 unit).
  const totals = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let gst = 0;
    let txn = 0;
    portions.forEach((p) => {
      const base = Number(p.base_price) || 0;
      const c = Number(p.cost_price) || 0;
      const r = reverseCalculate(base, c, feeConfig);
      revenue += base;
      cost += c;
      gst += r.gstIncluded;
      txn += r.txnFee;
    });
    const perOrderFees = (feeConfig.vasFee + feeConfig.otherExpense) * portions.length;
    const margin =
      Math.round((revenue - gst - txn - perOrderFees - cost) * 100) / 100;
    return { revenue, cost, gst, txn, perOrderFees, margin };
  }, [portions, feeConfig]);

  const fromPrice = useMemo(() => {
    const prices = portions
      .map((p) => Number(p.base_price))
      .filter((n) => Number.isFinite(n));
    return prices.length ? Math.min(...prices) : 0;
  }, [portions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter dish name");
      return;
    }
    if (portions.length === 0) {
      setError("At least one portion size is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: MenuItemInput = {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      is_veg: isVeg,
      spice_level: spiceLevel,
      preparation_time_minutes: Number(prepTime),
      image_url: imageUrl.trim() || undefined,
      badge: badge.trim() || undefined,
      is_available: isAvailable,
      portions: portions.map((p) => ({
        id: p.id,
        portion_size: p.portion_size.trim(),
        weight_grams: p.weight_grams ? Number(p.weight_grams) : undefined,
        serves_persons: p.serves_persons ? p.serves_persons.trim() : undefined,
        cost_price: Number(p.cost_price) || 0,
        base_price: Number(p.base_price),
        original_price: p.original_price ? Number(p.original_price) : undefined,
        zomato_price: p.zomato_price ? Number(p.zomato_price) : undefined,
        swiggy_price: p.swiggy_price ? Number(p.swiggy_price) : undefined,
        is_available: p.is_available ?? true,
      })),
    };

    try {
      const res = isEdit
        ? await api.updateMenuItem(menuItemId!, payload)
        : await api.createMenuItem(payload);
      if (res.success) {
        router.push("/menu");
        router.refresh();
      } else {
        setError(res.message || "Failed to save menu dish");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save menu dish");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded-lg bg-slate-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </Link>
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/menu"
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shrink-0"
          aria-label="Back to menu"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
            <Utensils className="h-6 w-6 shrink-0" />
            <span className="truncate">{isEdit ? name || "Edit Dish" : "New Menu Dish"}</span>
          </h1>
          <p className="text-sm text-gray-500">
            Configure authentic recipe details, dietary options, and
            multi-platform portion pricing.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* ---------------- Main form ---------------- */}
        <div className="xl:col-span-2 min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Dish Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  required
                  className={FIELD}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dish Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Mutton Dum Biryani"
                  className={FIELD}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Badge Tag
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Best Seller, New, Premium, Save 17%"
                  className={FIELD}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/media/uploads/xyz.jpg or /products/veg-dum.jpg"
                  className={FIELD}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description &amp; Recipe Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Slow cooked with aged saffron basmati rice, tender cuts and authentic spices..."
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dietary Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVeg(false)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      !isVeg
                        ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>Non-Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsVeg(true)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      isVeg
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Veg</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Spice Level
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  className={FIELD}
                >
                  {SPICE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Prep Time (mins)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className={FIELD}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
              />
              Available on the website
            </label>
          </section>

          {/* Portion builder */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-panna-green-700" />
                  <span>Portion Sizes &amp; Platform Pricing</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Base price auto-calculates Zomato (+22%) and Swiggy (+20%).
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPortion}
                className="inline-flex items-center gap-1 text-xs font-bold text-panna-green-800 hover:text-panna-green-950 bg-panna-green-50 px-2.5 py-1 rounded-lg border border-panna-green-200 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Portion</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {portions.map((portion, idx) => {
                const cost = Number(portion.cost_price) || 0;
                const base = Number(portion.base_price) || 0;
                const r = reverseCalculate(base, cost, feeConfig);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Portion {idx + 1}
                      </span>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <input
                          type="checkbox"
                          checked={portion.is_available ?? true}
                          onChange={(e) =>
                            handleUpdatePortion(idx, "is_available", e.target.checked)
                          }
                        />
                        Available
                      </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Portion Name
                        </label>
                        <input
                          type="text"
                          required
                          value={portion.portion_size}
                          onChange={(e) =>
                            handleUpdatePortion(idx, "portion_size", e.target.value)
                          }
                          placeholder="e.g. 500g, Single, 1kg"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Serves
                        </label>
                        <input
                          type="text"
                          value={portion.serves_persons || ""}
                          onChange={(e) =>
                            handleUpdatePortion(idx, "serves_persons", e.target.value)
                          }
                          placeholder="1-2 Persons"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Food Cost (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={portion.cost_price}
                          onChange={(e) =>
                            handleUpdatePortion(
                              idx,
                              "cost_price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-panna-green-700 mb-0.5">
                          Base / Website (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={portion.base_price}
                          onChange={(e) =>
                            handleBasePriceChange(
                              idx,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1.5 bg-white border border-panna-green-300 rounded font-bold text-panna-green-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-rose-600 mb-0.5">
                            Zomato (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={portion.zomato_price || ""}
                            onChange={(e) =>
                              handleUpdatePortion(
                                idx,
                                "zomato_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-orange-600 mb-0.5">
                            Swiggy (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={portion.swiggy_price || ""}
                            onChange={(e) =>
                              handleUpdatePortion(
                                idx,
                                "swiggy_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded font-medium text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 pt-1.5">
                      <div className="flex-1 rounded-lg bg-slate-50 border border-slate-200 p-2 text-[11px] space-y-0.5">
                        <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-panna-green-700" />
                          Reverse calculation (tax-inclusive price)
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Final customer price</span>
                          <strong className="font-mono">₹{base.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST included ({feeConfig.gstPct}%)</span>
                          <span className="font-mono">− ₹{r.gstIncluded.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>GST removed (base)</span>
                          <span className="font-mono">₹{r.baseExcl.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Payment gateway fee ({feeConfig.txnFeePct}%)</span>
                          <span className="font-mono">− ₹{r.txnFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>VAS charge (per order)</span>
                          <span className="font-mono">− ₹{feeConfig.vasFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Other expense (per order)</span>
                          <span className="font-mono">− ₹{feeConfig.otherExpense.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-slate-200 mt-0.5 pt-0.5">
                          <span>Net revenue</span>
                          <strong className="font-mono">₹{r.netRev.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Food cost</span>
                          <span className="font-mono">− ₹{cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Margin</span>
                          <strong
                            className={
                              r.marginPct >= 50 ? "text-emerald-700" : "text-amber-700"
                            }
                          >
                            ₹{r.marginAmt.toFixed(2)} ({r.marginPct}%)
                          </strong>
                        </div>
                      </div>

                      {portions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePortion(idx)}
                          className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold shrink-0 mt-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ---------------- Sticky summary ---------------- */}
        <div className="xl:col-span-1 xl:sticky xl:top-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Customer Preview
            </h3>

            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              {imageUrl && !imageBroken ? (
                // Remote/third-party images can't use next/image here.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImage(imageUrl)}
                  alt={name || "dish"}
                  onError={() => setImageBroken(true)}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex flex-col items-center justify-center text-slate-300 gap-1">
                  {imageBroken ? (
                    <>
                      <ImageOff className="w-5 h-5" />
                      <span className="text-[10px]">Image not found</span>
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-5 h-5" />
                      <span className="text-[10px]">No image set</span>
                    </>
                  )}
                </div>
              )}

              <div className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      isVeg ? "bg-emerald-600" : "bg-rose-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {name || "Untitled dish"}
                      </span>
                      {badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-panna-green-100 text-panna-green-800">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-3">
                      {description || "No description yet."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  {portions.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-slate-600">{p.portion_size || "—"}</span>
                      <span className="font-bold text-slate-900">
                        ₹{Number(p.base_price) || 0}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-600">From</span>
                  <span className="font-bold text-panna-green-800">
                    ₹{fromPrice.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Margin rollup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-panna-green-700" />
              Margin Across Portions
            </h3>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">List price total</span>
                <span className="font-mono font-semibold">
                  ₹{totals.revenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST included</span>
                <span className="font-mono">− ₹{totals.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gateway fee</span>
                <span className="font-mono">− ₹{totals.txn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAS + other (per portion)</span>
                <span className="font-mono">− ₹{totals.perOrderFees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Food cost</span>
                <span className="font-mono">− ₹{totals.cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 mt-1 pt-1">
                <span>Total margin</span>
                <span className="font-mono text-emerald-700">
                  ₹{totals.margin.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Uses live billing config ({feeConfig.gstPct}% GST,{" "}
              {feeConfig.txnFeePct}% gateway, ₹{feeConfig.vasFee} VAS, ₹
              {feeConfig.otherExpense} other).
            </p>
          </div>

          {/* Record details for existing dishes */}
          {isEdit && loadedItem && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Record Details
              </h3>
              <dl className="space-y-1.5 text-[11px]">
                {[
                  ["Item ID", `#${loadedItem.id}`],
                  ["Category", loadedItem.category_name || categories.find((c) => c.id === categoryId)?.name || "—"],
                  ["Slug", loadedItem.slug || "—"],
                  ["Website", isAvailable ? "Visible" : "Hidden"],
                  ["Portions", String(loadedItem.portions?.length ?? 0)],
                  ["Updated", loadedItem.updated_at ? new Date(loadedItem.updated_at).toLocaleString() : "—"],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3">
                    <dt className="text-slate-500 shrink-0">{k}</dt>
                    <dd className="font-medium text-slate-800 text-right truncate">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 hidden sm:block">
          {isEdit ? "Changes apply to the website immediately." : "Creates a new dish on the menu."}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/menu")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="bg-panna-green-800 hover:bg-panna-green-900"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Saving Dish...</span>
              </>
            ) : (
              <span>{isEdit ? "Save Changes" : "Create Dish"}</span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}