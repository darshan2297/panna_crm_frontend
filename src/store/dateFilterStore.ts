import { create } from "zustand";

export type DateRangePreset = "today" | "yesterday" | "last7days" | "thisMonth" | "all" | "custom";

export interface DateBounds {
  dateFrom?: string;
  dateTo?: string;
  label: string;
  periodText: string;
}

interface DateFilterState {
  preset: DateRangePreset;
  customFrom: string;
  customTo: string;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  getDateBounds: () => DateBounds;
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const useDateFilterStore = create<DateFilterState>((set, get) => ({
  preset: "today",
  customFrom: formatLocalDate(new Date()),
  customTo: formatLocalDate(new Date()),

  setPreset: (preset) => set({ preset }),

  setCustomRange: (from, to) =>
    set({
      preset: "custom",
      customFrom: from,
      customTo: to,
    }),

  getDateBounds: () => {
    const { preset, customFrom, customTo } = get();
    const now = new Date();

    switch (preset) {
      case "today": {
        const todayStr = formatLocalDate(now);
        return {
          dateFrom: `${todayStr}T00:00:00`,
          dateTo: `${todayStr}T23:59:59`,
          label: "Today",
          periodText: "today",
        };
      }
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = formatLocalDate(y);
        return {
          dateFrom: `${yStr}T00:00:00`,
          dateTo: `${yStr}T23:59:59`,
          label: "Yesterday",
          periodText: "yesterday",
        };
      }
      case "last7days": {
        const past = new Date(now);
        past.setDate(past.getDate() - 6);
        const startStr = formatLocalDate(past);
        const endStr = formatLocalDate(now);
        return {
          dateFrom: `${startStr}T00:00:00`,
          dateTo: `${endStr}T23:59:59`,
          label: "Last 7 Days",
          periodText: "in last 7 days",
        };
      }
      case "thisMonth": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const startStr = formatLocalDate(firstDay);
        const endStr = formatLocalDate(now);
        return {
          dateFrom: `${startStr}T00:00:00`,
          dateTo: `${endStr}T23:59:59`,
          label: "This Month",
          periodText: "this month",
        };
      }
      case "custom": {
        const start = customFrom ? `${customFrom}T00:00:00` : undefined;
        const end = customTo ? `${customTo}T23:59:59` : undefined;
        let label = "Custom Range";
        if (customFrom && customTo) {
          if (customFrom === customTo) {
            label = customFrom;
          } else {
            label = `${customFrom} to ${customTo}`;
          }
        }
        return {
          dateFrom: start,
          dateTo: end,
          label,
          periodText: "in selected period",
        };
      }
      case "all":
      default:
        return {
          dateFrom: undefined,
          dateTo: undefined,
          label: "All Time",
          periodText: "all time",
        };
    }
  },
}));
