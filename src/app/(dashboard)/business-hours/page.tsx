"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  Clock,
  RefreshCw,
  CalendarOff,
  CalendarPlus,
  Trash2,
  Save,
  Power,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Zap,
} from "lucide-react";
import { BusinessHoursRead, BusinessHoliday } from "@/types";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime12(value: string) {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function BusinessHoursContent() {
  const [data, setData] = useState<BusinessHoursRead | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [savingHoliday, setSavingHoliday] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local editable copies
  const [days, setDays] = useState<BusinessHoursRead["days"]>([]);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [forceOpen, setForceOpen] = useState(false);

  // New holiday form
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayReason, setHolidayReason] = useState("");
  const [holidayClosed, setHolidayClosed] = useState(true);
  const [holidayOpenTime, setHolidayOpenTime] = useState("11:00");
  const [holidayCloseTime, setHolidayCloseTime] = useState("23:00");

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getBusinessHours();
      if (res.data) {
        setData(res.data);
        setDays(res.data.days);
        setAutoSchedule(res.data.config.auto_schedule_enabled);
        setForceOpen(res.data.config.force_open_now);
        setHolidayMessage(res.data.config.holiday_message || "");
      }
    } catch (err: any) {
      flash(err.message || "Failed to load business hours", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.updateBusinessHoursConfig({
        auto_schedule_enabled: autoSchedule,
        force_open_now: forceOpen,
        holiday_message: holidayMessage,
      });
      flash("Global business hours settings saved");
      await loadData();
    } catch (err: any) {
      flash(err.message || "Failed to save settings", true);
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleForceOpen = async () => {
    const next = !forceOpen;
    setForceOpen(next);
    setSavingConfig(true);
    try {
      await api.updateBusinessHoursConfig({ force_open_now: next });
      flash(next ? "Shop force-opened (extended hours)" : "Force open disabled");
      await loadData();
    } catch (err: any) {
      setForceOpen(!next);
      flash(err.message || "Failed to update override", true);
    } finally {
      setSavingConfig(false);
    }
  };

  const updateDayLocal = (dayOfWeek: number, patch: Partial<BusinessHoursRead["days"][0]>) => {
    setDays((prev) => prev.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...patch } : d)));
  };

  const handleSaveDay = async (dayOfWeek: number) => {
    const day = days.find((d) => d.day_of_week === dayOfWeek);
    if (!day) return;
    setSavingDay(dayOfWeek);
    try {
      await api.updateBusinessHourDay(dayOfWeek, {
        is_open: day.is_open,
        open_time: day.open_time,
        close_time: day.close_time,
      });
      flash(`${day.day_name} hours saved`);
      await loadData();
    } catch (err: any) {
      flash(err.message || "Failed to save day", true);
    } finally {
      setSavingDay(null);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate) {
      flash("Please select a date", true);
      return;
    }
    setSavingHoliday(true);
    try {
      await api.createBusinessHoliday({
        holiday_date: holidayDate,
        is_closed: holidayClosed,
        open_time: holidayClosed ? null : holidayOpenTime,
        close_time: holidayClosed ? null : holidayCloseTime,
        reason: holidayReason || null,
      });
      setHolidayDate("");
      setHolidayReason("");
      flash("Holiday / date override saved");
      await loadData();
    } catch (err: any) {
      flash(err.message || "Failed to save holiday", true);
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (holiday: BusinessHoliday) => {
    try {
      await api.deleteBusinessHoliday(holiday.id);
      flash("Holiday removed");
      await loadData();
    } catch (err: any) {
      flash(err.message || "Failed to remove holiday", true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panna-green-900/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-panna-green-900 text-panna-gold-400">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-panna-green-950 font-serif">
              Business Hours & Holidays
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure weekly opening times, holidays and temporary overrides for the storefront
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="p-2 border-slate-300 hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className={cn("w-4 h-4 text-panna-green-800", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Live status + master controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-base font-serif">Automatic Schedule</CardTitle>
                <CardDescription>
                  When enabled, the site opens and closes automatically as per the weekly timetable
                </CardDescription>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoSchedule}
                onClick={async () => {
                  const next = !autoSchedule;
                  setAutoSchedule(next);
                  try {
                    await api.updateBusinessHoursConfig({ auto_schedule_enabled: next });
                    flash(next ? "Automatic schedule enabled" : "Automatic schedule disabled");
                    await loadData();
                  } catch (err: any) {
                    setAutoSchedule(!next);
                    flash(err.message || "Failed to update schedule", true);
                  }
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  autoSchedule ? "bg-emerald-500" : "bg-slate-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow",
                    autoSchedule ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    forceOpen
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-200 text-slate-500"
                  )}
                >
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Force Open (extended hours)</p>
                  <p className="text-xs text-slate-500">
                    Temporarily keep the shop open even outside the schedule or on holidays
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={forceOpen ? "danger" : "primary"}
                onClick={toggleForceOpen}
                disabled={savingConfig}
                className={cn(
                  "gap-1.5",
                  !forceOpen && "bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950"
                )}
              >
                <Power className="w-4 h-4" />
                {forceOpen ? "Disable Override" : "Force Open Now"}
              </Button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Holiday / Closed Message
              </label>
              <Input
                value={holidayMessage}
                onChange={(e) => setHolidayMessage(e.target.value)}
                placeholder="We are closed today. See you tomorrow!"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Shown on the website header and checkout when the shop is closed.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950 font-semibold gap-1.5"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current status snapshot */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-serif">Storefront Snapshot</CardTitle>
            <CardDescription>As configured right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Schedule</span>
              <Badge variant={autoSchedule ? "success" : "neutral"}>
                {autoSchedule ? "Automatic" : "Manual only"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Override</span>
              <Badge variant={forceOpen ? "warning" : "neutral"}>
                {forceOpen ? "Force Open" : "Off"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Timezone</span>
              <span className="font-mono text-xs font-semibold text-slate-700">
                {data?.config.timezone || "Asia/Kolkata"}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-500 leading-relaxed">
                The per-platform manual Open/Close buttons on the Integrations page act as a{" "}
                <strong>master switch</strong>. If a channel is manually closed, it stays closed
                regardless of the schedule.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly schedule */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-panna-green-900" />
            <div>
              <CardTitle className="text-base font-serif">Weekly Opening Hours</CardTitle>
              <CardDescription>
                Set the opening and closing time for each day of the week
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading schedule...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {days.map((day) => (
                <div
                  key={day.day_of_week}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
                >
                  <div className="w-28 shrink-0 flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-800">{day.day_name}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer w-28 shrink-0">
                    <input
                      type="checkbox"
                      checked={day.is_open}
                      onChange={(e) =>
                        updateDayLocal(day.day_of_week, { is_open: e.target.checked })
                      }
                      className="rounded text-panna-green-900 w-4 h-4"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      {day.is_open ? "Open" : "Closed"}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={day.open_time}
                      disabled={!day.is_open}
                      onChange={(e) =>
                        updateDayLocal(day.day_of_week, { open_time: e.target.value })
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium",
                        !day.is_open && "bg-slate-100 text-slate-400"
                      )}
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="time"
                      value={day.close_time}
                      disabled={!day.is_open}
                      onChange={(e) =>
                        updateDayLocal(day.day_of_week, { close_time: e.target.value })
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium",
                        !day.is_open && "bg-slate-100 text-slate-400"
                      )}
                    />
                    <span className="text-[11px] text-slate-400 hidden md:inline">
                      {day.is_open
                        ? `(${formatTime12(day.open_time)} – ${formatTime12(day.close_time)})`
                        : ""}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveDay(day.day_of_week)}
                    disabled={savingDay === day.day_of_week}
                    className="gap-1 border-slate-300"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingDay === day.day_of_week ? "Saving" : "Save"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 shadow-xs">
          <CardHeader>
            <div className="flex items-start gap-2.5">
              <CalendarPlus className="w-4 h-4 text-panna-green-900 mt-0.5 flex-shrink-0" />
              <div>
                <CardTitle className="text-base font-serif">Add Holiday / Override</CardTitle>
                <CardDescription>Close for a day or set custom hours</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="holidayClosed"
                  checked={holidayClosed}
                  onChange={(e) => setHolidayClosed(e.target.checked)}
                  className="rounded text-panna-green-900 w-4 h-4"
                />
                <label htmlFor="holidayClosed" className="text-xs font-medium text-slate-700">
                  Fully closed this day
                </label>
              </div>

              {!holidayClosed && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Open</label>
                    <input
                      type="time"
                      value={holidayOpenTime}
                      onChange={(e) => setHolidayOpenTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Close</label>
                    <input
                      type="time"
                      value={holidayCloseTime}
                      onChange={(e) => setHolidayCloseTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason (optional)
                </label>
                <Input
                  value={holidayReason}
                  onChange={(e) => setHolidayReason(e.target.value)}
                  placeholder="e.g. Diwali, Maintenance"
                />
              </div>

              <Button
                type="submit"
                disabled={savingHoliday}
                className="w-full bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950 font-semibold gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                {savingHoliday ? "Saving..." : "Save Holiday"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <div className="flex items-start gap-2.5">
              <CalendarOff className="w-4 h-4 text-panna-green-900 mt-0.5 flex-shrink-0" />
              <div>
                <CardTitle className="text-base font-serif">Holiday Calendar</CardTitle>
                <CardDescription>Upcoming closures and date-specific overrides</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Hours / Reason</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!data || data.holidays.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400">
                        No holidays or overrides configured yet
                      </td>
                    </tr>
                  ) : (
                    data.holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {new Date(h.holiday_date + "T00:00:00").toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3">
                          {h.is_closed ? (
                            <Badge variant="danger">Closed</Badge>
                          ) : (
                            <Badge variant="success">Custom Hours</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {h.is_closed
                            ? h.reason || "—"
                            : `${formatTime12(h.open_time || "")} – ${formatTime12(
                                h.close_time || ""
                              )}${h.reason ? ` • ${h.reason}` : ""}`}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteHoliday(h)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BusinessHoursPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading business hours...</div>}>
      <BusinessHoursContent />
    </Suspense>
  );
}
