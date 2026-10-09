"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { api } from "@/services/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Settings2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Sliders,
  Send,
  X,
  Radio,
  Clock,
  Check,
} from "lucide-react";
import {
  IntegrationConfig,
  IntegrationHealthSummary,
  IntegrationLog,
  WebhookSimulateRequest,
} from "@/types";

function IntegrationsContent() {
  const [summary, setSummary] = useState<IntegrationHealthSummary | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [shopToggling, setShopToggling] = useState<string | null>(null);

  // Modals state
  const [configModalPlatform, setConfigModalPlatform] = useState<IntegrationConfig | null>(null);
  const [simulateModalOpen, setSimulateModalOpen] = useState<boolean>(false);

  // Config Form State
  const [cfgStoreId, setCfgStoreId] = useState("");
  const [cfgApiKey, setCfgApiKey] = useState("");
  const [cfgWebhookSecret, setCfgWebhookSecret] = useState("");
  const [cfgAutoAccept, setCfgAutoAccept] = useState(true);
  const [cfgEnvironment, setCfgEnvironment] = useState("LIVE");
  const [cfgSaving, setCfgSaving] = useState(false);

  // Simulation Form State
  const [simPlatform, setSimPlatform] = useState<"ZOMATO" | "SWIGGY">("ZOMATO");
  const [simName, setSimName] = useState("Anjali Verma");
  const [simPhone, setSimPhone] = useState("9823098765");
  const [simAddress, setSimAddress] = useState("Apt 304, Marvel Zephyr, Kharadi, Pune");
  const [simItem, setSimItem] = useState("Chicken Dum Biryani");
  const [simQty, setSimQty] = useState(2);
  const [simPrice, setSimPrice] = useState(380);
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        api.getIntegrationStatus(),
        api.getIntegrationLogs(30),
      ]);
      if (statusRes.data) setSummary(statusRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to load integrations data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleShop = async (platform: string, open: boolean) => {
    setShopToggling(platform);
    try {
      await api.updateIntegrationConfig(platform, { shop_open: open } as any);
      await loadData();
    } catch (err) {
      console.error("Failed to toggle shop status:", err);
    } finally {
      setShopToggling(null);
    }
  };

  const handleSync = async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      await api.triggerIntegrationSync(platform);
      await loadData();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncingPlatform(null);
    }
  };

  const openConfigModal = (cfg: IntegrationConfig) => {
    setConfigModalPlatform(cfg);
    setCfgStoreId(cfg.store_id || "");
    setCfgApiKey("");
    setCfgWebhookSecret(cfg.webhook_secret || "");
    setCfgAutoAccept(cfg.auto_accept);
    setCfgEnvironment(cfg.environment);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configModalPlatform) return;
    setCfgSaving(true);
    try {
      await api.updateIntegrationConfig(configModalPlatform.platform, {
        store_id: cfgStoreId,
        api_key: cfgApiKey || undefined,
        webhook_secret: cfgWebhookSecret,
        auto_accept: cfgAutoAccept,
        environment: cfgEnvironment,
      });
      setConfigModalPlatform(null);
      await loadData();
    } catch (err) {
      console.error("Failed to save config:", err);
    } finally {
      setCfgSaving(false);
    }
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimSubmitting(true);
    setSimSuccessMsg(null);
    try {
      const total = simPrice * simQty + 40 + Math.round(simPrice * simQty * 0.05);
      const res = await api.simulateIntegrationWebhook({
        platform: simPlatform,
        customer_name: simName,
        customer_phone: simPhone,
        delivery_address: simAddress,
        items: [{ item_name: simItem, quantity: simQty, unit_price: simPrice }],
        total_amount: total,
      });

      if (res.data) {
        setSimSuccessMsg(`Order ${res.data.order_number} simulated and injected into CRM!`);
        setTimeout(() => {
          setSimulateModalOpen(false);
          setSimSuccessMsg(null);
        }, 1800);
      }
      await loadData();
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-panna-green-900/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-panna-green-900 text-panna-gold-400">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-panna-green-950 font-serif">
              Zomato & Swiggy Platform Integrations
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Adapter engine, order webhooks, credential vault & aggregator sync health
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Consistent Icon-Only Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="p-2 border-slate-300 hover:bg-slate-50"
            title="Refresh Integrations"
          >
            <RefreshCw className={cn("w-4 h-4 text-panna-green-800", loading && "animate-spin")} />
          </Button>

          {/* Test Simulator Button */}
          <Button
            size="sm"
            onClick={() => setSimulateModalOpen(true)}
            className="gap-2 bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950 font-semibold"
          >
            <Zap className="w-4 h-4 text-panna-gold-400" />
            <span>Simulate Webhook Order</span>
          </Button>
        </div>
      </div>

      {/* Health Banner */}
      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-emerald-950">
                Aggregator Gateway: {summary?.overall_status === "HEALTHY" ? "All Systems Operational" : "Partial Outage"}
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              {summary?.active_platforms_count} of {summary?.platforms.length} partner channels actively syncing orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold">
          <div>
            <span className="text-emerald-700/80 block uppercase text-[10px]">Orders Synced Today</span>
            <span className="text-lg font-bold font-serif text-emerald-950">
              {summary?.total_synced_today || 0} Orders
            </span>
          </div>
          <div>
            <span className="text-emerald-700/80 block uppercase text-[10px]">Sync Cadence</span>
            <span className="text-sm font-bold text-emerald-950">Every 5 Mins</span>
          </div>
        </div>
      </div>

      {/* 4 Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary?.platforms.map((cfg) => {
          const isConnected = cfg.status === "CONNECTED";
          const isZomato = cfg.platform === "ZOMATO";
          const isSwiggy = cfg.platform === "SWIGGY";
          const isWebsite = cfg.platform === "WEBSITE";

          return (
            <Card
              key={cfg.platform}
              className={cn(
                "shadow-xs transition-all relative overflow-hidden",
                !cfg.is_enabled && "opacity-70 bg-slate-50"
              )}
            >
              <div
                className={cn(
                  "h-1.5 w-full",
                  isZomato && "bg-amber-500",
                  isSwiggy && "bg-orange-500",
                  isWebsite && "bg-emerald-600"
                )}
              />

              <CardContent className="p-4 space-y-4">
                {/* Top Card Bar */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 font-serif">
                      {cfg.platform}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isWebsite ? "Direct Storefront" : "Aggregator Partner"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold",
                      isConnected
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-slate-200 text-slate-700"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )}
                    />
                    {cfg.status}
                  </span>
                </div>

                {/* Details block */}
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Store ID:</span>
                    <span className="font-mono font-bold text-slate-800">{cfg.store_id || "Not configured"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">API Key:</span>
                    <span className="font-mono text-slate-600">{cfg.api_key_masked || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orders Today:</span>
                    <span className="font-bold text-panna-green-900">{cfg.orders_synced_today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode:</span>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold">
                      {cfg.environment}
                    </Badge>
                  </div>
                </div>

                <div className="flex align-middle items-center gap-2 mb-2">
                  <Badge variant="neutral" className={cn("text-[9px] py-0 px-1 font-bold", cfg.shop_open ? "text-emerald-700 border-emerald-300 bg-emerald-50" : "text-rose-700 border-rose-300 bg-rose-50")}>
                    {cfg.shop_open ? "SHOP OPEN" : "SHOP CLOSED"}
                  </Badge>
                </div>

                {/* Shop Open / Close Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={cfg.shop_open ? "outline" : "primary"}
                    onClick={() => handleToggleShop(cfg.platform, true)}
                    disabled={shopToggling === cfg.platform || cfg.shop_open === true}
                    className={cn("flex-1 text-xs gap-1", cfg.shop_open ? "border-emerald-200 text-emerald-700" : "bg-emerald-600 text-white hover:bg-emerald-700")}
                  >
                    Open Shop
                  </Button>
                  <Button
                    size="sm"
                    variant={cfg.shop_open ? "danger" : "outline"}
                    onClick={() => handleToggleShop(cfg.platform, false)}
                    disabled={shopToggling === cfg.platform || cfg.shop_open === false}
                    className={cn("flex-1 text-xs gap-1", !cfg.shop_open ? "border-rose-200 text-rose-700" : "")}
                  >
                    Close Shop
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(cfg.platform)}
                    disabled={syncingPlatform === cfg.platform || !cfg.is_enabled}
                    className="flex-1 text-xs gap-1 border-slate-300"
                  >
                    <RefreshCw
                      className={cn(
                        "w-3.5 h-3.5 text-panna-green-800",
                        syncingPlatform === cfg.platform && "animate-spin"
                      )}
                    />
                    <span>Sync Now</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openConfigModal(cfg)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Settings"
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Integration Logs Table */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-serif">Integration Event Logs</CardTitle>
              <CardDescription>Real-time audit of webhook dispatches and scheduled sync routines</CardDescription>
            </div>
            <span className="text-xs text-slate-400 font-medium">Last 30 events</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Platform</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Event Message / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No integration events recorded yet
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            l.platform === "ZOMATO" && "bg-amber-100 text-amber-800",
                            l.platform === "SWIGGY" && "bg-orange-100 text-orange-800",
                            l.platform === "WEBSITE" && "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {l.platform}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{l.event_type}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            l.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          )}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {l.message}
                        {l.payload_snippet && (
                          <span className="block text-[10px] font-mono text-slate-400 truncate max-w-md mt-0.5">
                            {l.payload_snippet}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Credential Configuration Modal */}
      {configModalPlatform && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-panna-green-900" />
                <h3 className="font-bold text-base text-slate-900 font-serif">
                  Configure {configModalPlatform.platform}
                </h3>
              </div>
              <button
                onClick={() => setConfigModalPlatform(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Restaurant Merchant ID
                </label>
                <Input
                  value={cfgStoreId}
                  onChange={(e) => setCfgStoreId(e.target.value)}
                  placeholder="e.g. ZOM-PUN-0842"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Secret / Partner Key
                </label>
                <Input
                  type="password"
                  value={cfgApiKey}
                  onChange={(e) => setCfgApiKey(e.target.value)}
                  placeholder="Leave empty to retain existing key"
                />
                <p className="text-[10px] text-slate-400 mt-1">Encrypted and masked at rest.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Webhook Verification Secret
                </label>
                <Input
                  value={cfgWebhookSecret}
                  onChange={(e) => setCfgWebhookSecret(e.target.value)}
                  placeholder="whsec_..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Environment</label>
                  <select
                    value={cfgEnvironment}
                    onChange={(e) => setCfgEnvironment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
                  >
                    <option value="LIVE">LIVE Production</option>
                    <option value="SANDBOX">SANDBOX Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Auto-Accept</label>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="autoAccept"
                      checked={cfgAutoAccept}
                      onChange={(e) => setCfgAutoAccept(e.target.checked)}
                      className="rounded text-panna-green-900 w-4 h-4"
                    />
                    <label htmlFor="autoAccept" className="text-xs font-medium text-slate-700">
                      Auto-Confirm
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfigModalPlatform(null)}
                  disabled={cfgSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={cfgSaving}
                  className="bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950 font-semibold"
                >
                  {cfgSaving ? "Saving..." : "Save Credentials"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Order Simulator Modal */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-panna-gold-500" />
                <h3 className="font-bold text-base text-slate-900 font-serif">
                  Simulate Aggregator Webhook
                </h3>
              </div>
              <button
                onClick={() => setSimulateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {simSuccessMsg ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-lg text-slate-900 font-serif">Order Ingested!</h4>
                <p className="text-xs text-slate-600">{simSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSimulateSubmit} className="p-5 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Platform</label>
                    <select
                      value={simPlatform}
                      onChange={(e) => setSimPlatform(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      <option value="ZOMATO">Zomato Partner</option>
                      <option value="SWIGGY">Swiggy Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
                    <Input
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <Input
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Address</label>
                    <Input
                      value={simAddress}
                      onChange={(e) => setSimAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Item Selection</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <select
                        value={simItem}
                        onChange={(e) => setSimItem(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      >
                        <option value="Chicken Dum Biryani">Chicken Dum Biryani (500g)</option>
                        <option value="Mutton Dum Biryani">Mutton Dum Biryani (1kg)</option>
                        <option value="Paneer Tikka Biryani">Paneer Tikka Biryani (500g)</option>
                        <option value="Chicken Seekh Kebab">Chicken Seekh Kebab</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={simQty}
                        onChange={(e) => setSimQty(Number(e.target.value))}
                        placeholder="Qty"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 text-xs font-bold">
                  <span>Estimated Total:</span>
                  <span className="text-base text-panna-green-950 font-serif">
                    {formatCurrency(simPrice * simQty + 40 + Math.round(simPrice * simQty * 0.05))}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSimulateModalOpen(false)}
                    disabled={simSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={simSubmitting}
                    className="bg-panna-green-900 text-panna-gold-300 hover:bg-panna-green-950 font-semibold"
                  >
                    {simSubmitting ? "Dispatching..." : "Simulate Webhook Trigger"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading Integrations...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
