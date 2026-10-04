"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import {
  Flame,
  Radio,
  Clock,
  Wifi,
  WifiOff,
  Store,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/services/api";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Order, OrderStatus } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

const ACTIVE_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

const ALL_STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-sky-500",
  CONFIRMED: "bg-blue-500",
  PREPARING: "bg-amber-500",
  READY: "bg-emerald-500",
  OUT_FOR_DELIVERY: "bg-violet-500",
  DELIVERED: "bg-slate-600",
  CANCELLED: "bg-rose-600",
};

function LiveOrdersInner() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [shopFlags, setShopFlags] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef<Socket | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const res = await api.getOrders({ page: 1, page_size: 50 });
      const items = (res.items || []).filter((o) =>
        ACTIVE_STATUSES.includes(o.order_status as OrderStatus)
      );
      setOrders(items);
    } catch (err) {
      console.error("Failed to load live orders:", err);
    }
  }, []);

  const loadShopFlags = useCallback(async () => {
    try {
      const res = await api.getIntegrationStatus();
      const flags: Record<string, boolean> = {};
      res.data?.platforms.forEach((p) => (flags[p.platform] = p.shop_open !== false));
      setShopFlags(flags);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadShopFlags();

    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(
      /\/api\/v1\/?$/,
      ""
    );
    const socket = io(base, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("new_order", () => loadOrders());
    socket.on("order_status_changed", () => loadOrders());
    socket.on("shop_status_changed", (p: { platform: string; shop_open: boolean }) => {
      setShopFlags((prev) => ({ ...prev, [p.platform]: p.shop_open }));
    });

    const tick = setInterval(() => setNow(Date.now()), 30000);
    // Safety net: re-sync every 30s even if socket drops
    const poll = setInterval(loadOrders, 30000);

    return () => {
      socket.disconnect();
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [loadOrders, loadShopFlags]);

  const quickUpdate = async (order: Order, newStatus: OrderStatus) => {
    if (order.order_status === newStatus) return;
    setUpdatingId(order.id);
    setErrorMsg(null);
    try {
      await api.updateOrderStatus(order.id, newStatus);
      await loadOrders();
    } catch (err: any) {
      setErrorMsg(err?.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const elapsed = (created: string) => {
    const mins = Math.max(0, Math.floor((now - new Date(created).getTime()) / 60000));
    return mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          title="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-panna-gold-400" />
          <h1 className="text-xl font-bold font-serif text-white">Live Kitchen Orders</h1>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {["WEBSITE", "ZOMATO", "SWIGGY"].map((p) => (
            <span
              key={p}
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold border",
                shopFlags[p] !== false
                  ? "bg-emerald-900/60 text-emerald-300 border-emerald-700"
                  : "bg-rose-900/60 text-rose-300 border-rose-700"
              )}
            >
              {p}: {shopFlags[p] !== false ? "OPEN" : "CLOSED"}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-slate-400">{orders.length} live orders</span>
          <button
            onClick={loadOrders}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold",
              connected ? "bg-emerald-900/60 text-emerald-300" : "bg-rose-900/60 text-rose-300"
            )}
          >
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? "LIVE SYNC ON" : "OFFLINE"}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mx-4 mt-3 px-4 py-2 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-600">
          <Radio className="w-12 h-12 mb-3" />
          <p className="text-lg font-semibold">No active orders right now</p>
          <p className="text-sm">New Website / Zomato / Swiggy orders will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-lg font-bold text-panna-gold-300">
                    {order.order_number}
                  </p>
                  <p className="text-sm text-slate-300 font-semibold">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_phone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                    {order.platform}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {elapsed(order.created_at)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 text-sm text-slate-300">
                {order.items_summary}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xl font-bold font-serif text-white">
                  {formatCurrency(order.total_amount)}
                </span>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold text-white",
                    STATUS_STYLES[order.order_status] || "bg-slate-600"
                  )}
                >
                  {order.order_status}
                </span>
              </div>

              {/* Quick status buttons — all in one line row */}
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => quickUpdate(order, s)}
                    disabled={updatingId === order.id}
                    className={cn(
                      "px-1 py-2 rounded-lg text-[9px] font-bold border transition-colors",
                      order.order_status === s
                        ? "bg-panna-gold-400/90 border-panna-gold-400 text-slate-950"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiveOrdersPage() {
  return (
    <AuthGuard>
      <LiveOrdersInner />
    </AuthGuard>
  );
}
