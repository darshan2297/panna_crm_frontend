"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Bell,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Send,
  MessageCircle,
  Mail,
  CheckCheck,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { api } from "@/services/api";
import { NotificationItem, NotificationChannel, NotificationSeverity } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Portal } from "@/components/ui/Portal";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

type TabFilter = "ALL" | "UNREAD" | "STOCK" | "ORDERS";

export function NotificationDrawer({
  isOpen,
  onClose,
  onUpdate,
}: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ page_size: 50 });
      if (res && res.data) {
        setNotifications(res.data.items || []);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Mark single as read
  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setActionMessage("All notifications marked as read");
      setTimeout(() => setActionMessage(null), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // Scan kitchen stock
  const handleScanKitchen = async () => {
    setScanning(true);
    setActionMessage(null);
    try {
      const res = await api.scanKitchenStockAlerts();
      await loadNotifications();
      const count = res.data?.alerts_generated ?? 0;
      setActionMessage(
        `Scan complete! Generated ${count} new stock alerts.`
      );
      setTimeout(() => setActionMessage(null), 5000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to scan kitchen stock", err);
      setActionMessage("Error scanning stock breaches");
    } finally {
      setScanning(false);
    }
  };

  // Quick Dispatch WhatsApp
  const handleDispatchWhatsApp = async (notif: NotificationItem) => {
    try {
      const res = await api.dispatchNotification(notif.id, { channel: "WHATSAPP" });
      const targetUrl = res.data?.action_url || res.data?.whatsapp_url;
      if (targetUrl) {
        window.open(targetUrl, "_blank");
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? { ...n, channel_status: "DELIVERED", is_read: true }
            : n
        )
      );
      setActionMessage("WhatsApp dispatch launched!");
      setTimeout(() => setActionMessage(null), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Dispatch error", err);
    }
  };

  // Quick Dispatch Email
  const handleDispatchEmail = async (notif: NotificationItem) => {
    try {
      const res = await api.dispatchNotification(notif.id, { channel: "EMAIL" });
      const targetUrl = res.data?.action_url || res.data?.email_mailto;
      if (targetUrl) {
        window.open(targetUrl, "_blank");
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id
            ? { ...n, channel_status: "DELIVERED", is_read: true }
            : n
        )
      );
      setActionMessage("Email dispatch link generated!");
      setTimeout(() => setActionMessage(null), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Dispatch error", err);
    }
  };

  if (!isOpen) return null;

  // Filter items
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "UNREAD") return !n.is_read;
    if (activeTab === "STOCK")
      return (
        n.type.includes("STOCK") ||
        n.type.includes("INGREDIENT") ||
        n.type.includes("PACKAGING")
      );
    if (activeTab === "ORDERS") return n.type.includes("ORDER");
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9998] overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-700/60 flex items-center justify-center text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                    Kitchen Alerts & Notifications
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-emerald-200/80">
                    Live stock breaches, order dispatches & kitchen logs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-5 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleScanKitchen}
                  disabled={scanning}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 text-emerald-100 hover:bg-emerald-800 text-[11px] font-bold border border-emerald-800 transition-all disabled:opacity-50"
                  title="Scan raw materials and packaging against critical thresholds"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${scanning ? "animate-spin text-amber-400" : "text-amber-400"}`}
                  />
                  <span>{scanning ? "Scanning Kitchen..." : "Scan Breaches"}</span>
                </button>
                <button
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-stone-700 hover:bg-stone-100 text-[11px] font-semibold border border-stone-200 transition-all disabled:opacity-40"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-stone-500" />
                  <span>Mark All Read</span>
                </button>
              </div>

              <Link
                href="/restock"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
              >
                <span>Restock Planner</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Toast Feedback */}
            {actionMessage && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between animate-in fade-in">
                <span>{actionMessage}</span>
                <button
                  onClick={() => setActionMessage(null)}
                  className="text-amber-700 hover:text-amber-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="px-5 pt-3 pb-2 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: "ALL", label: "All Alerts", count: notifications.length },
                  { id: "UNREAD", label: "Unread", count: unreadCount },
                  {
                    id: "STOCK",
                    label: "Stock Breaches",
                    count: notifications.filter(
                      (n) =>
                        n.type.includes("STOCK") ||
                        n.type.includes("INGREDIENT") ||
                        n.type.includes("PACKAGING")
                    ).length,
                  },
                  {
                    id: "ORDERS",
                    label: "Orders",
                    count: notifications.filter((n) => n.type.includes("ORDER")).length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-emerald-950 text-white shadow-xs"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-4 space-y-3">
              {loading ? (
                <div className="py-16 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-800 mx-auto mb-2" />
                  <p className="text-xs text-stone-500 font-medium">
                    Loading live alerts...
                  </p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">
                    No notifications
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    {activeTab === "UNREAD"
                      ? "All caught up! No unread notifications right now."
                      : "No alerts found matching this filter."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const isCritical = notif.severity === "CRITICAL";
                  const isWarning = notif.severity === "WARNING";
                  const isStock =
                    notif.type.includes("STOCK") ||
                    notif.type.includes("INGREDIENT") ||
                    notif.type.includes("PACKAGING");
                  const isOrder = notif.type.includes("ORDER");

                  return (
                    <div
                      key={notif.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        !notif.is_read
                          ? isCritical
                            ? "bg-rose-50/70 border-rose-200 shadow-xs"
                            : isWarning
                            ? "bg-amber-50/70 border-amber-200 shadow-xs"
                            : "bg-emerald-50/60 border-emerald-200 shadow-xs"
                          : "bg-white border-stone-200/80 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isCritical
                                ? "bg-rose-100 text-rose-700"
                                : isWarning
                                ? "bg-amber-100 text-amber-700"
                                : isOrder
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {isCritical ? (
                              <AlertCircle className="w-4 h-4" />
                            ) : isWarning ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : isOrder ? (
                              <ShoppingBag className="w-4 h-4" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="text-xs font-bold text-stone-900 leading-snug">
                                {notif.title}
                              </h5>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>

                        {/* Top corner channel badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              isCritical
                                ? "bg-rose-200 text-rose-900"
                                : isWarning
                                ? "bg-amber-200 text-amber-900"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {notif.severity}
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            {new Date(notif.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions & Metadata */}
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between gap-2 flex-wrap">
                        {/* Channels info */}
                        <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600">
                            {notif.channel}
                          </span>
                          {notif.channel_status === "DELIVERED" ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="text-stone-400">Ready</span>
                          )}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Dispatch via WhatsApp */}
                          <button
                            onClick={() => handleDispatchWhatsApp(notif)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition-colors"
                            title="Format WhatsApp alert with direct wa.me link"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          {/* Dispatch via Email */}
                          <button
                            onClick={() => handleDispatchEmail(notif)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200 text-[10px] font-bold transition-colors"
                            title="Format Royal Panna Biryani HTML email alert"
                          >
                            <Mail className="w-3 h-3 text-stone-500" />
                            <span>Email</span>
                          </button>

                          {/* Link to restock if stock alert */}
                          {isStock && (
                            <Link
                              href="/restock"
                              onClick={onClose}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-stone-950 hover:bg-amber-600 text-[10px] font-bold transition-colors shadow-xs"
                            >
                              <span>Plan PO</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          )}

                          {/* Mark Read */}
                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkRead(notif.id)}
                              className="px-2 py-1 rounded text-stone-500 hover:text-stone-800 text-[10px] font-medium"
                              title="Mark as read"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom bar */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
              <Link
                href="/restock?tab=notifications"
                onClick={onClose}
                className="text-xs font-bold text-emerald-900 hover:text-emerald-950 inline-flex items-center gap-1.5"
              >
                <span>View Full Notification Audit Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
