"use client";

import React, { useEffect, useState } from "react";
import {
  Flame,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  MenuCategory,
  MenuItem,
  MenuItemInput,
  MenuItemPortionInput,
} from "@/types";
import { api } from "@/services/api";

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedItem: MenuItem) => void;
  categories: MenuCategory[];
  initialItem?: MenuItem | null;
}

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

export function MenuItemModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  initialItem,
}: MenuItemModalProps) {
  const isEditing = Boolean(initialItem);

  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isVeg, setIsVeg] = useState(false);
  const [spiceLevel, setSpiceLevel] = useState("MEDIUM");
  const [prepTime, setPrepTime] = useState(25);
  const [imageUrl, setImageUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [portions, setPortions] = useState<MenuItemPortionInput[]>([{ ...DEFAULT_PORTION }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setCategoryId(initialItem.category_id);
      setName(initialItem.name);
      setDescription(initialItem.description || "");
      setIsVeg(initialItem.is_veg);
      setSpiceLevel(initialItem.spice_level);
      setPrepTime(initialItem.preparation_time_minutes);
      setImageUrl(initialItem.image_url || "");
      setBadge(initialItem.badge || "");
      setIsAvailable(initialItem.is_available);
      if (initialItem.portions && initialItem.portions.length > 0) {
        setPortions(
          initialItem.portions.map((p) => ({
            id: p.id,
            portion_size: p.portion_size,
            weight_grams: p.weight_grams || undefined,
            serves_persons: p.serves_persons || undefined,
            cost_price: p.cost_price,
            base_price: p.base_price,
            zomato_price: p.zomato_price,
            swiggy_price: p.swiggy_price,
            is_available: p.is_available,
          }))
        );
      }
    } else {
      setCategoryId(categories[0]?.id || 1);
      setName("");
      setDescription("");
      setIsVeg(false);
      setSpiceLevel("MEDIUM");
      setPrepTime(25);
      setImageUrl("");
      setBadge("");
      setIsAvailable(true);
      setPortions([{ ...DEFAULT_PORTION }]);
    }
    setError(null);
  }, [initialItem, categories, isOpen]);

  const handleBasePriceChange = (index: number, newBasePrice: number) => {
    setPortions((prev) =>
      prev.map((portion, i) => {
        if (i !== index) return portion;
        return {
          ...portion,
          base_price: newBasePrice,
          zomato_price: Math.round(newBasePrice * 1.22),
          swiggy_price: Math.round(newBasePrice * 1.2),
        };
      })
    );
  };

  const handleUpdatePortion = (
    index: number,
    field: keyof MenuItemPortionInput,
    value: any
  ) => {
    setPortions((prev) =>
      prev.map((portion, i) => (i === index ? { ...portion, [field]: value } : portion))
    );
  };

  const handleAddPortion = () => {
    setPortions((prev) => [
      ...prev,
      {
        portion_size: "1kg",
        weight_grams: 1000,
        serves_persons: "3-4 Persons",
        cost_price: 250,
        base_price: 599,
        zomato_price: 729,
        swiggy_price: 719,
        is_available: true,
      },
    ]);
  };

  const handleRemovePortion = (index: number) => {
    if (portions.length <= 1) return;
    setPortions((prev) => prev.filter((_, i) => i !== index));
  };

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
      if (isEditing && initialItem) {
        const res = await api.updateMenuItem(initialItem.id, payload);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.message || "Failed to update menu dish");
        }
      } else {
        const res = await api.createMenuItem(payload);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.message || "Failed to create menu dish");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save menu dish");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Menu Dish" : "Add New Menu Dish"}
      description="Configure authentic recipe details, dietary options, and multi-platform portion pricing."
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600 bg-white"
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
            />
          </div>
        </div>

        {/* Badge tag */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Badge Tag (e.g. Best Seller, New, Premium, Save 17%)
          </label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="Best Seller"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Image URL (from Website Config upload or /products/... path)
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/media/uploads/xyz.jpg or /products/veg-dum.jpg"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description & Recipe Notes
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Slow cooked with aged saffron basmati rice, tender cuts and authentic spices..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
          />
        </div>

        {/* Veg Toggle, Spice Level & Prep Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          {/* Dietary Type */}
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

          {/* Spice Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Spice Level
            </label>
            <select
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panna-green-600"
            >
              <option value="MILD">🌶️ Mild</option>
              <option value="MEDIUM">🌶️🌶️ Medium</option>
              <option value="SPICY">🌶️🌶️🌶️ Spicy</option>
              <option value="EXTRA_SPICY">🔥 Extra Spicy</option>
            </select>
          </div>

          {/* Prep Time */}
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
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panna-green-600"
            />
          </div>
        </div>

        {/* Portion Sizes & Platform Pricing Builder */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-panna-green-700" />
                <span>Portion Sizes & Platform Pricing Rules</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Base price auto-calculates Zomato (+22%) and Swiggy (+20%) margins.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPortion}
              className="inline-flex items-center gap-1 text-xs font-bold text-panna-green-800 hover:text-panna-green-950 bg-panna-green-50 px-2.5 py-1 rounded-lg border border-panna-green-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Portion</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {portions.map((portion, idx) => {
              const cost = Number(portion.cost_price) || 0;
              const base = Number(portion.base_price) || 0;
              const margin =
                base > 0 && cost > 0
                  ? Math.round(((base - cost) / base) * 100)
                  : 0;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    {/* Portion Size */}
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

                    {/* Food Cost */}
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

                    {/* Base Website Price */}
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

                    {/* Zomato Price */}
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

                    {/* Swiggy Price */}
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

                  {/* Profit Margin & Remove button footer */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        Margin:{" "}
                        <strong
                          className={
                            margin >= 50 ? "text-emerald-700" : "text-amber-700"
                          }
                        >
                          {margin}%
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        Est Profit: ₹{Math.max(0, base - cost)}
                      </span>
                    </div>

                    {portions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePortion(idx)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
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
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
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
              <span>{isEditing ? "Update Dish" : "Create Dish"}</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
