"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, Clock } from "lucide-react";
import { useDateFilterStore, DateRangePreset } from "@/store/dateFilterStore";

interface DateRangeFilterProps {
  className?: string;
  align?: "left" | "right";
}

const PRESET_OPTIONS: { id: DateRangePreset; label: string; desc: string }[] = [
  { id: "today", label: "Today", desc: "Live orders for today" },
  { id: "yesterday", label: "Yesterday", desc: "Previous day's close" },
  { id: "last7days", label: "Last 7 Days", desc: "Past 7 days performance" },
  { id: "thisMonth", label: "This Month", desc: "Month-to-date metrics" },
  { id: "all", label: "All Time", desc: "Complete historical orders" },
];

export function DateRangeFilter({ className = "", align = "right" }: DateRangeFilterProps) {
  const { preset, customFrom, customTo, setPreset, setCustomRange, getDateBounds } =
    useDateFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [fromInput, setFromInput] = useState(customFrom);
  const [toInput, setToInput] = useState(customTo);

  const bounds = getDateBounds();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (p: DateRangePreset) => {
    setPreset(p);
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromInput && toInput) {
      setCustomRange(fromInput, toInput);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0C3823]/20"
        title="Filter orders and KPI metrics by date"
      >
        <Calendar className="w-3.5 h-3.5 text-[#0C3823] shrink-0" />
        <span className="font-medium text-slate-800">{bounds.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200/90 z-50 p-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Date Range Filter
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              Live KPI Sync
            </span>
          </div>

          {/* Presets List */}
          <div className="space-y-0.5">
            {PRESET_OPTIONS.map((opt) => {
              const isSelected = preset === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? "bg-[#0C3823] text-white font-semibold shadow-2xs"
                      : "text-slate-700 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="text-left">
                    <div>{opt.label}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="px-2 text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Custom Date Range</span>
            </div>
            <form onSubmit={handleApplyCustom} className="space-y-2 px-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">From</label>
                  <input
                    type="date"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0C3823]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">To</label>
                  <input
                    type="date"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0C3823]"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-[#0C3823] text-white hover:bg-[#072316] text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                Apply Range
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
