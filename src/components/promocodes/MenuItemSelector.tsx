"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Check, ChevronDown, ChevronRight, UtensilsCrossed } from "lucide-react";
import { api } from "@/services/api";
import { MenuCategory, MenuItem } from "@/types";

interface Props {
  /** Selected menu item slugs — this is what the promo stores and the cart matches on. */
  value: string[];
  onChange: (slugs: string[]) => void;
}

/**
 * Menu item picker for promo scoping.
 *
 * Values are item **slugs** (lowercase), because both the website cart and the
 * backend `applicable_items` check compare against `product.slug`.
 */
export function MenuItemSelector({ value, onChange }: Props) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, itemRes] = await Promise.all([
          api.getMenuCategories(true),
          api.getMenuItems({ is_active: true }),
        ]);
        if (cancelled) return;
        const cats = catRes.data || [];
        setCategories(cats);
        setItems(itemRes.data || []);
        // Open every category that already has a selection so the user can see it.
        setExpanded(
          Object.fromEntries(cats.map((c) => [c.id, true]))
        );
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load menu items");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => new Set(value.map((s) => s.toLowerCase())), [value]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .map((cat) => ({
        cat,
        items: items.filter(
          (i) =>
            i.category_id === cat.id &&
            (!q || i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, items, query]);

  const toggle = (slug: string) => {
    const s = slug.toLowerCase();
    if (selected.has(s)) {
      onChange(value.filter((v) => v.toLowerCase() !== s));
    } else {
      onChange([...value, s]);
    }
  };

  const toggleGroup = (slugs: string[]) => {
    const allSelected = slugs.every((s) => selected.has(s.toLowerCase()));
    if (allSelected) {
      const drop = new Set(slugs.map((s) => s.toLowerCase()));
      onChange(value.filter((v) => !drop.has(v.toLowerCase())));
    } else {
      const merged = value.concat(slugs);
      const seen: Record<string, true> = {};
      onChange(merged.filter((s) => (seen[s.toLowerCase()] ? false : (seen[s.toLowerCase()] = true))));
    }
  };

  if (loading) {
    return (
      <div className="text-xs text-slate-500 py-4 flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
        Loading menu items…
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-red-600 py-3">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu items…"
          className="w-full border border-slate-300 rounded-md px-3 py-2 pl-8 text-sm focus:outline-none focus:border-panna-green-600 bg-white"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>
          {selected.size === 0
            ? "No items selected — promo applies to the whole cart"
            : `${selected.size} item${selected.size === 1 ? "" : "s"} selected`}
        </span>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-red-600 hover:underline font-semibold"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
        {grouped.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
            <UtensilsCrossed className="w-4 h-4" />
            No menu items match “{query}”
          </div>
        )}

        {grouped.map(({ cat, items: catItems }) => {
          const slugs = catItems.map((i) => i.slug);
          const allOn = slugs.every((s) => selected.has(s.toLowerCase()));
          const someOn = slugs.some((s) => selected.has(s.toLowerCase()));
          const open = expanded[cat.id] ?? true;

          return (
            <div key={cat.id} className="bg-white">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setExpanded((p) => ({ ...p, [cat.id]: !open }))}
                  className="text-slate-500 hover:text-slate-800"
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <span className="text-xs font-bold text-slate-700 flex-1">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => toggleGroup(slugs)}
                  className="text-[11px] font-semibold text-panna-green-700 hover:underline"
                >
                  {allOn ? "Clear all" : "Select all"}
                </button>
                {someOn && !allOn && <span className="w-1.5 h-1.5 rounded-full bg-panna-green-600" />}
              </div>

              {open && (
                <div className="py-1">
                  {catItems.map((item) => {
                    const on = selected.has(item.slug.toLowerCase());
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(item.slug)}
                          className="accent-panna-green-700"
                        />
                        <span className="text-sm text-slate-700 flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                        {!item.is_available && (
                          <span className="text-[10px] text-amber-600">unavailable</span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">{item.slug}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500">
        Promo applies only when the cart contains at least one of the selected items. Values are
        matched against item slugs.
      </p>
    </div>
  );
}