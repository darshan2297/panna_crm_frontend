"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import {
  Globe2,
  RefreshCw,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  Ban,
  ArrowRight,
  ExternalLink,
  Code2,
  CreditCard,
  Truck,
  Sparkles,
  Phone,
  MapPin,
  Receipt,
  AlertCircle,
  Plus,
  Trash2,
  Check,
  Copy,
  Zap,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { api } from "@/services/api";
import {
  GatewayHealthResponse,
  Order,
  PublicOrderTrackResponse,
  WebsiteOrderCreateRequest,
  WebsiteOrderCreateResponse,
} from "@/types";

const POPULAR_MENU_ITEMS = [
  { name: "Panna Special Chicken Dum Biryani", portion: "500g", price: 349 },
  { name: "Royal Mutton Dum Biryani", portion: "500g", price: 449 },
  { name: "Panna Paneer Dum Biryani", portion: "500g", price: 299 },
  { name: "Lucknowi Handi Veg Biryani", portion: "500g", price: 269 },
  { name: "Hyderabadi Chicken 65 (Boneless)", portion: "250g", price: 249 },
  { name: "Gulab Jamun with Rabdi (2 pcs)", portion: "Single", price: 119 },
];

function WebsiteGatewayContent() {
  // Gateway health state
  const [health, setHealth] = useState<GatewayHealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);

  // Recent website orders
  const [recentWebsiteOrders, setRecentWebsiteOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Order Simulator state
  const [simName, setSimName] = useState("Vikram Malhotra");
  const [simPhone, setSimPhone] = useState("9876543210");
  const [simEmail, setSimEmail] = useState("vikram.m@example.com");
  const [simAddress, setSimAddress] = useState(
    "Flat 804, Regency Tower, Link Road, Andheri West, Mumbai 400053"
  );
  const [simPaymentMethod, setSimPaymentMethod] = useState<"COD" | "ONLINE_UPI">(
    "ONLINE_UPI"
  );
  const [simDeliveryFee, setSimDeliveryFee] = useState<number>(40);
  const [simDiscount, setSimDiscount] = useState<number>(50);
  const [simNotes, setSimNotes] = useState("Please ring the doorbell and send extra salan.");
  const [simItems, setSimItems] = useState([
    {
      item_name: "Panna Special Chicken Dum Biryani",
      portion_size: "500g",
      quantity: 2,
      unit_price: 349,
      notes: "Medium spicy",
    },
    {
      item_name: "Gulab Jamun with Rabdi (2 pcs)",
      portion_size: "Single",
      quantity: 1,
      unit_price: 119,
      notes: "Served warm",
    },
  ]);
  const [submittingSimOrder, setSubmittingSimOrder] = useState(false);
  const [simOrderSuccess, setSimOrderSuccess] =
    useState<WebsiteOrderCreateResponse | null>(null);
  const [simOrderError, setSimOrderError] = useState<string | null>(null);

  // Live Tracking Simulator state
  const [trackInputOrderNum, setTrackInputOrderNum] = useState("");
  const [trackingData, setTrackingData] =
    useState<PublicOrderTrackResponse | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Payment Webhook Simulator state
  const [webhookOrderNum, setWebhookOrderNum] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<"PAID" | "FAILED">("PAID");
  const [webhookTxId, setWebhookTxId] = useState("razorpay_pay_992144");
  const [webhookSending, setWebhookSending] = useState(false);
  const [webhookResult, setWebhookResult] = useState<any | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Code sample tab
  const [codeTab, setCodeTab] = useState<"curl" | "fetch" | "webhook">("curl");
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Load gateway health
  const checkGatewayHealth = useCallback(async () => {
    setHealthLoading(true);
    const start = performance.now();
    try {
      const res = await api.getGatewayHealth();
      const end = performance.now();
      setHealth(res);
      setHealthLatency(Math.round(end - start));
    } catch {
      setHealth(null);
      setHealthLatency(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch recent website orders from CRM
  const fetchRecentWebsiteOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getOrders({ platform: "WEBSITE", page_size: 5 });
      if (res && res.items) {
        setRecentWebsiteOrders(res.items);
        // Pre-fill tracking with the latest order if available
        if (res.items.length > 0 && !trackInputOrderNum) {
          setTrackInputOrderNum(res.items[0].order_number);
          setWebhookOrderNum(res.items[0].order_number);
        }
      }
    } catch (err: any) {
      console.error("Failed to load website orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [trackInputOrderNum]);

  useEffect(() => {
    checkGatewayHealth();
    fetchRecentWebsiteOrders();
  }, [checkGatewayHealth, fetchRecentWebsiteOrders]);

  // Handle Simulator Add Item
  const handleAddItem = (presetIndex?: number) => {
    if (presetIndex !== undefined && POPULAR_MENU_ITEMS[presetIndex]) {
      const item = POPULAR_MENU_ITEMS[presetIndex];
      setSimItems((prev) => [
        ...prev,
        {
          item_name: item.name,
          portion_size: item.portion,
          quantity: 1,
          unit_price: item.price,
          notes: "",
        },
      ]);
    } else {
      setSimItems((prev) => [
        ...prev,
        {
          item_name: "Panna Special Chicken Dum Biryani",
          portion_size: "500g",
          quantity: 1,
          unit_price: 349,
          notes: "",
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (simItems.length <= 1) return;
    setSimItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: string,
    val: string | number
  ) => {
    setSimItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
  };

  // Calculations for simulated order
  const calculatedSubtotal = simItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const calculatedTax = Math.round(calculatedSubtotal * 0.05 * 100) / 100;
  const calculatedTotal = Math.max(
    0,
    calculatedSubtotal + calculatedTax + simDeliveryFee - simDiscount
  );

  // Submit Simulator Order
  const handleSimulateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimOrderError(null);
    setSimOrderSuccess(null);
    setSubmittingSimOrder(true);

    const payload: WebsiteOrderCreateRequest = {
      customer: {
        name: simName.trim(),
        phone: simPhone.trim(),
        email: simEmail.trim() || undefined,
        delivery_address: simAddress.trim(),
      },
      items: simItems.map((item) => ({
        item_name: item.item_name,
        portion_size: item.portion_size,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes || undefined,
      })),
      payment_method: simPaymentMethod,
      delivery_fee: simDeliveryFee,
      discount: simDiscount,
      notes: simNotes || undefined,
    };

    try {
      const res = await api.submitPublicWebsiteOrder(payload);
      if (res.success && res.data) {
        setSimOrderSuccess(res.data);
        setTrackInputOrderNum(res.data.order_number);
        setWebhookOrderNum(res.data.order_number);
        // Refresh feeds
        fetchRecentWebsiteOrders();
        // Automatically fetch tracking for this new order
        handleTrackOrder(res.data.order_number);
      } else {
        setSimOrderError(res.message || "Failed to create website order");
      }
    } catch (err: any) {
      setSimOrderError(err.message || "API connection failure");
    } finally {
      setSubmittingSimOrder(false);
    }
  };

  // Public Order Tracking
  const handleTrackOrder = async (orderNumToTrack?: string) => {
    const num = orderNumToTrack || trackInputOrderNum;
    if (!num) return;
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const res = await api.trackPublicOrder(num.trim());
      if (res.success && res.data) {
        setTrackingData(res.data);
      } else {
        setTrackingError(res.message || "Order tracking details not found");
        setTrackingData(null);
      }
    } catch (err: any) {
      setTrackingError(err.message || "Could not retrieve order tracking");
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Payment Webhook Simulation
  const handleSendPaymentWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookOrderNum) return;
    setWebhookSending(true);
    setWebhookError(null);
    setWebhookResult(null);

    try {
      const res = await api.sendPaymentWebhook(webhookOrderNum.trim(), {
        payment_status: webhookStatus,
        transaction_id: webhookTxId,
        payment_gateway: "RAZORPAY",
        notes: `Simulated gateway webhook callback (${webhookStatus})`,
      });

      if (res.success && res.data) {
        setWebhookResult(res.data);
        // Refresh feeds & tracking
        fetchRecentWebsiteOrders();
        if (trackingData?.order_number === webhookOrderNum.trim()) {
          handleTrackOrder(webhookOrderNum.trim());
        }
      } else {
        setWebhookError(res.message || "Webhook processing failed");
      }
    } catch (err: any) {
      setWebhookError(err.message || "Webhook connection error");
    } finally {
      setWebhookSending(false);
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const curlCode = `curl -X POST http://localhost:8000/api/v1/public/orders \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "name": "Aarav Sharma",
      "phone": "9876543210",
      "email": "aarav@example.com",
      "delivery_address": "402 Royal Palms, Link Rd, Mumbai"
    },
    "items": [
      {
        "item_name": "Panna Special Chicken Dum Biryani",
        "portion_size": "500g",
        "quantity": 1,
        "unit_price": 349.0
      }
    ],
    "payment_method": "ONLINE_UPI",
    "delivery_fee": 40.0,
    "discount": 0.0
  }'`;

  const fetchCode = `// Customer Frontend Order Placement
const response = await fetch("http://localhost:8000/api/v1/public/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: {
      name: "Aarav Sharma",
      phone: "9876543210",
      delivery_address: "402 Royal Palms, Link Rd, Mumbai"
    },
    items: [
      {
        item_name: "Panna Special Chicken Dum Biryani",
        portion_size: "500g",
        quantity: 1,
        unit_price: 349
      }
    ],
    payment_method: "ONLINE_UPI"
  })
});
const data = await response.json();
console.log("Order Placed:", data.data.order_number);`;

  const webhookCode = `curl -X POST http://localhost:8000/api/v1/public/orders/${webhookOrderNum || "PB-W-20261003-XXXX"}/payment-webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_status": "PAID",
    "transaction_id": "pay_razorpay_992144",
    "payment_gateway": "RAZORPAY",
    "notes": "Payment successfully authorized via UPI"
  }'`;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-panna-green-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-serif flex items-center gap-2">
                Website Order Integration & Gateway
                <span className="text-xs px-2.5 py-0.5 rounded-full font-sans bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                  Phase 5 Live
                </span>
              </h1>
              <p className="text-sm text-slate-500">
                Direct public API bridge connecting customer storefronts directly into kitchen operations.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Nav / Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              checkGatewayHealth();
              fetchRecentWebsiteOrders();
            }}
            disabled={healthLoading || loadingOrders}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Ping Gateway & Refresh"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                healthLoading || loadingOrders ? "animate-spin" : ""
              }`}
            />
          </button>

          <Link
            href="/orders?platform=website"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-panna-green-800 hover:bg-panna-green-900 rounded-lg shadow-sm transition-all"
          >
            <span>View All Website Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Gateway Telemetry & Health Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              health?.status === "online"
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-rose-50 text-rose-600 border border-rose-200"
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Gateway Status</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-sm font-bold text-slate-900 uppercase">
                {health?.status || "Connecting..."}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Response Latency</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {healthLatency !== null ? `${healthLatency} ms` : "..."}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Platform ID</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {health?.platform || "WEBSITE"} (V{health?.version || "1.0"})
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Public Base Route</p>
            <p className="text-xs font-mono font-bold text-slate-800 mt-0.5 truncate max-w-[170px]" title="/api/v1/public/orders">
              /api/v1/public/orders
            </p>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Simulator Form & Live Tracking + Webhook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Website Order Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-panna-gold-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Website Order Simulator
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate a customer ordering directly from the Panna Biryani storefront.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400">
                  Quick Add:
                </span>
                <button
                  type="button"
                  onClick={() => handleAddItem(0)}
                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200"
                >
                  + Chicken
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem(1)}
                  className="px-2 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200"
                >
                  + Mutton
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSimulateOrder} className="p-6 space-y-5">
              {/* Customer Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Customer & Delivery Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                      placeholder="e.g. Vikram Malhotra"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (10 digits)
                    </label>
                    <input
                      type="tel"
                      required
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                      placeholder="optional@domain.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      required
                      value={simAddress}
                      onChange={(e) => setSimAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                      placeholder="Flat, building, street, area, city"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Biryani & Items ({simItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-panna-green-700 hover:text-panna-green-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {simItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          required
                          value={item.item_name}
                          onChange={(e) =>
                            handleUpdateItem(idx, "item_name", e.target.value)
                          }
                          className="w-full px-2 py-1.5 font-medium text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-panna-green-600"
                          placeholder="Dish Name"
                        />
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                        <select
                          value={item.portion_size}
                          onChange={(e) =>
                            handleUpdateItem(idx, "portion_size", e.target.value)
                          }
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none"
                        >
                          <option value="Single">Single</option>
                          <option value="250g">250g</option>
                          <option value="500g">500g</option>
                          <option value="750g">750g</option>
                          <option value="1kg">1kg</option>
                        </select>

                        <div className="flex items-center border border-slate-200 rounded bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(
                                idx,
                                "quantity",
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(idx, "quantity", item.quantity + 1)
                            }
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium">₹</span>
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.unit_price}
                            onChange={(e) =>
                              handleUpdateItem(
                                idx,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded text-right font-medium text-slate-800 focus:outline-none"
                          />
                        </div>

                        <span className="font-bold text-slate-900 w-16 text-right">
                          ₹{item.quantity * item.unit_price}
                        </span>

                        <button
                          type="button"
                          disabled={simItems.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={simPaymentMethod}
                    onChange={(e: any) => setSimPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600 bg-white"
                  >
                    <option value="ONLINE_UPI">Online UPI / Card (Prepaid)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={simDeliveryFee}
                    onChange={(e) =>
                      setSimDeliveryFee(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount / Coupon (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={simDiscount}
                    onChange={(e) =>
                      setSimDiscount(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Notes / Instructions
                </label>
                <input
                  type="text"
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                  placeholder="e.g. Ring bell, deliver hot"
                />
              </div>

              {/* Price Breakdown Footer & Action Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div>
                    <span>Subtotal: </span>
                    <strong className="text-slate-800">₹{calculatedSubtotal}</strong>
                  </div>
                  <div>
                    <span>GST (5%): </span>
                    <strong className="text-slate-800">₹{calculatedTax}</strong>
                  </div>
                  <div className="text-sm font-bold text-panna-green-800 bg-panna-green-50 px-2.5 py-1 rounded-md border border-panna-green-200">
                    Total: ₹{calculatedTotal}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingSimOrder}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-panna-green-800 hover:from-emerald-500 hover:to-panna-green-700 shadow-md shadow-emerald-700/20 disabled:opacity-50 transition-all"
                >
                  {submittingSimOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Posting to Public API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Simulate Website Checkout</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success / Error Alerts */}
              {simOrderError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{simOrderError}</span>
                </div>
              )}

              {simOrderSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Website Order Received Successfully!</span>
                    </div>
                    <Badge variant="success">
                      {simOrderSuccess.order_status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-emerald-800">
                    <div>
                      Order No: <strong>{simOrderSuccess.order_number}</strong>
                    </div>
                    <div>
                      Payment: <strong>{simOrderSuccess.payment_status}</strong>
                    </div>
                    <div>
                      Amount: <strong>₹{simOrderSuccess.total_amount}</strong>
                    </div>
                    <div>
                      ETA: <strong>{simOrderSuccess.estimated_delivery_minutes} mins</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Order has been auto-inserted into CRM orders table with platform <code>WEBSITE</code>, linked to customer record, and dispatched to kitchen queue.
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Integration Guide / cURL Snippet Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Storefront Developer API Snippets
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCodeTab("curl")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    codeTab === "curl"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab("fetch")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    codeTab === "fetch"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  JavaScript
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab("webhook")}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    codeTab === "webhook"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Webhook
                </button>
              </div>
            </div>

            <div className="relative bg-slate-950 p-4 text-[12px] font-mono text-emerald-400 overflow-x-auto">
              <button
                type="button"
                onClick={() =>
                  copyCode(
                    codeTab === "curl"
                      ? curlCode
                      : codeTab === "fetch"
                      ? fetchCode
                      : webhookCode
                  )
                }
                className="absolute top-3 right-3 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
                title="Copy code"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <pre className="pr-16 whitespace-pre">
                {codeTab === "curl" && curlCode}
                {codeTab === "fetch" && fetchCode}
                {codeTab === "webhook" && webhookCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Simulator + Payment Webhook + Recent Orders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Customer Tracking Simulator Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Customer Live Tracking Simulator</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Public customer order tracking endpoint with masked privacy.
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Lookup Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackInputOrderNum}
                  onChange={(e) => setTrackInputOrderNum(e.target.value)}
                  placeholder="Enter PB-W-20261003-XXXX"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
                />
                <button
                  type="button"
                  onClick={() => handleTrackOrder()}
                  disabled={trackingLoading || !trackInputOrderNum}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${trackingLoading ? "animate-spin" : ""}`}
                  />
                  <span>Track</span>
                </button>
              </div>

              {trackingError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {trackingError}
                </div>
              )}

              {trackingData && (
                <div className="space-y-4 pt-2">
                  {/* Summary Header */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {trackingData.order_number}
                      </span>
                      <Badge
                        variant={
                          trackingData.order_status === "DELIVERED"
                            ? "success"
                            : trackingData.order_status === "CANCELLED"
                            ? "danger"
                            : "brand"
                        }
                      >
                        {trackingData.status_display}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Customer: {trackingData.customer_name} ({trackingData.customer_phone_masked})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{trackingData.delivery_address}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-semibold text-slate-800">
                        <span>Items: {trackingData.items_summary}</span>
                        <span>₹{trackingData.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* 6-Step Visual Timeline */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Order Journey Status
                    </h4>
                    <div className="space-y-2.5">
                      {trackingData.timeline.map((step, idx) => {
                        return (
                          <div
                            key={step.step_key}
                            className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                              step.current
                                ? "bg-emerald-50/70 border-emerald-300 shadow-sm"
                                : step.completed
                                ? "bg-slate-50/70 border-slate-200 text-slate-700"
                                : "bg-transparent border-transparent opacity-40 text-slate-400"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                step.completed
                                  ? "bg-emerald-600 text-white"
                                  : step.current
                                  ? "bg-amber-500 text-white animate-pulse"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {step.completed ? "✓" : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`text-xs font-bold ${
                                    step.current
                                      ? "text-emerald-900"
                                      : "text-slate-800"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {step.current && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                                    CURRENT
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {step.description}
                              </p>
                              {step.timestamp && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(step.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Gateway Webhook Simulator */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span>Payment Gateway Webhook Simulator</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Simulate async Razorpay/UPI callback confirming order payment.
                </p>
              </div>
            </div>

            <form onSubmit={handleSendPaymentWebhook} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Order Number to Update
                </label>
                <input
                  type="text"
                  required
                  value={webhookOrderNum}
                  onChange={(e) => setWebhookOrderNum(e.target.value)}
                  placeholder="PB-W-..."
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Callback Status
                  </label>
                  <select
                    value={webhookStatus}
                    onChange={(e: any) => setWebhookStatus(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PAID">PAID (Success)</option>
                    <option value="FAILED">FAILED (Declined)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={webhookTxId}
                    onChange={(e) => setWebhookTxId(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={webhookSending || !webhookOrderNum}
                className="w-full py-2 px-3 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {webhookSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Callback...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Trigger Payment Webhook</span>
                  </>
                )}
              </button>

              {webhookError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {webhookError}
                </div>
              )}

              {webhookResult && (
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>{webhookResult.message}</span>
                  </div>
                  <div className="font-mono text-[11px] text-purple-800">
                    Payment Status: {webhookResult.previous_payment_status} →{" "}
                    <strong>{webhookResult.new_payment_status}</strong> (Order:{" "}
                    {webhookResult.order_status})
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Recent Website Orders Live Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Recent Website Orders</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {recentWebsiteOrders.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={fetchRecentWebsiteOrders}
                disabled={loadingOrders}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {recentWebsiteOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No website orders placed yet today. Use the simulator above to place your first one!
                </div>
              ) : (
                recentWebsiteOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {ord.order_number}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            ord.order_status === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.order_status === "DELIVERED"
                              ? "bg-blue-100 text-blue-800"
                              : ord.order_status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {ord.customer_name} • ₹{ord.total_amount} ({ord.payment_status})
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTrackInputOrderNum(ord.order_number);
                          handleTrackOrder(ord.order_number);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
                        title="Track this order"
                      >
                        Track
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWebhookOrderNum(ord.order_number);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded"
                        title="Select for webhook test"
                      >
                        Webhook
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebsiteGatewayPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingState />}>
        <WebsiteGatewayContent />
      </Suspense>
    </DashboardLayout>
  );
}
