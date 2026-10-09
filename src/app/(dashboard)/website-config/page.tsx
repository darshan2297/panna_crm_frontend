"use client";

import React, { useEffect, useState } from "react";
import {
  Image as ImageIcon, Save, Plus, Trash2, Upload, Truck, Store, Gift, Globe2, CreditCard,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { api } from "@/services/api";
import { PaymentMethodConfig, StorefrontConfig } from "@/types";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-600" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </span>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/api\/v1.*$/, "");
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function resolveImageSrc(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/media/")) return `${API_ORIGIN}${value}`;
  if (value.startsWith("/")) return `${SITE_ORIGIN}${value}`;
  return value;
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/media/uploads/... or URL" />
        <label className="cursor-pointer inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
          <Upload className="h-4 w-4" />
          {uploading ? "..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                const res = await api.uploadWebsiteImage(f);
                onChange(res.data?.url || "");
              } catch (err: any) {
                alert(err.message || "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>
      {value && <img src={resolveImageSrc(value)} alt={label} className="mt-1 h-16 rounded border object-cover" />}
    </div>
  );
}

export default function WebsiteConfigPage() {
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newPm, setNewPm] = useState({ key: "", label: "", description: "" });

  const load = async () => {
    setLoading(true);
    try {
      const cfg = await api.getStorefrontConfig();
      setConfig(cfg.data ?? null);
      const pms = await api.getPaymentMethods();
      setPaymentMethods(pms.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (patch: Partial<StorefrontConfig>) => setConfig((c) => (c ? { ...c, ...patch } : c));

  const save = async (cfg?: StorefrontConfig) => {
    const toSave = cfg ?? config;
    if (!toSave) return;
    setSaving(true); setSuccess(null); setError(null);
    try {
      const { id, ...payload } = toSave;
      const res = await api.updateStorefrontConfig(payload);
      if (res.data) setConfig(res.data);
      setSuccess("Website settings saved successfully");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle a boolean flag and persist immediately (no need to click Save All)
  const toggle = (key: "gift_section_enabled" | "delivery_enabled" | "pickup_enabled" | "free_delivery_enabled") => {
    if (!config) return;
    const next = { ...config, [key]: !config[key] };
    setConfig(next);
    save(next);
  };

  if (loading) return <DashboardLayout><LoadingState /></DashboardLayout>;
  if (!config) return <DashboardLayout><div className="p-6 text-red-600">{error || "Failed to load"}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Globe2 className="h-6 w-6" /> Website Configuration</h1>
            <p className="text-sm text-gray-500">Control branding, images, delivery & gift sections shown on the customer website.</p>
          </div>
          <Button onClick={() => save()} disabled={saving}><Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save All"}</Button>
        </div>

        {success && <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{success}</div>}
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Branding & Images</CardTitle>
            <CardDescription>Logo and banner images shown on the website homepage.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ImageField label="Logo" value={config.logo_url || ""} onChange={(v) => set({ logo_url: v })} />
            <ImageField label="Banner Background" value={config.banner_url || ""} onChange={(v) => set({ banner_url: v })} />
            <ImageField label="Banner (Mobile)" value={config.banner_mobile_url || ""} onChange={(v) => set({ banner_mobile_url: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" /> Gift Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle checked={config.gift_section_enabled} onChange={() => toggle("gift_section_enabled")} label="Show Gift section on website" />
            <ImageField label="Gift Section Background" value={config.gift_bg_url || ""} onChange={(v) => set({ gift_bg_url: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Bulk Order Section</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageField label="Bulk Order Background" value={config.bulk_bg_url || ""} onChange={(v) => set({ bulk_bg_url: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Delivery & Pickup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle checked={config.delivery_enabled} onChange={() => toggle("delivery_enabled")} label="Enable Delivery option" />
            <Toggle checked={config.pickup_enabled} onChange={() => toggle("pickup_enabled")} label="Enable Pickup option" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Delivery Price (₹)</label>
                <Input type="number" value={config.delivery_fee} onChange={(e) => set({ delivery_fee: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Free Delivery Threshold (₹)</label>
                <Input type="number" value={config.free_delivery_threshold} onChange={(e) => set({ free_delivery_threshold: Number(e.target.value) })} />
              </div>
            </div>
            <Toggle checked={config.free_delivery_enabled} onChange={() => toggle("free_delivery_enabled")} label="Free delivery above threshold" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>Address, contact and hours shown across the website.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Brand name" value={config.brand_name || ""} onChange={(e) => set({ brand_name: e.target.value })} />
            <Input placeholder="Tagline" value={config.brand_tagline || ""} onChange={(e) => set({ brand_tagline: e.target.value })} />
            <Input placeholder="Address line" value={config.address_line || ""} onChange={(e) => set({ address_line: e.target.value })} />
            <Input placeholder="Area" value={config.area || ""} onChange={(e) => set({ area: e.target.value })} />
            <Input placeholder="City" value={config.city || ""} onChange={(e) => set({ city: e.target.value })} />
            <Input placeholder="Pincode" value={config.pincode || ""} onChange={(e) => set({ pincode: e.target.value })} />
            <Input placeholder="Google Maps URL" value={config.google_maps_url || ""} onChange={(e) => set({ google_maps_url: e.target.value })} />
            <Input placeholder="Operating hours" value={config.operating_hours || ""} onChange={(e) => set({ operating_hours: e.target.value })} />
            <Input placeholder="Phone support" value={config.phone || ""} onChange={(e) => set({ phone: e.target.value })} />
            <Input placeholder="WhatsApp" value={config.whatsapp || ""} onChange={(e) => set({ whatsapp: e.target.value })} />
            <Input placeholder="Email" value={config.email || ""} onChange={(e) => set({ email: e.target.value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Methods</CardTitle>
            <CardDescription>Enable or disable payment methods on the website checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{pm.label}</div>
                  <div className="text-xs text-gray-500">{pm.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Toggle checked={pm.enabled} onChange={async (v) => {
                    await api.updatePaymentMethod(pm.id, { enabled: v });
                    setPaymentMethods((m) => m.map((x) => (x.id === pm.id ? { ...x, enabled: v } : x)));
                  }} label={pm.enabled ? "Enabled" : "Disabled"} />
                  <button className="text-red-500" onClick={async () => {
                    if (!confirm("Delete this payment method?")) return;
                    await api.deletePaymentMethod(pm.id);
                    setPaymentMethods((m) => m.filter((x) => x.id !== pm.id));
                  }}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input placeholder="Key (e.g. upi)" value={newPm.key} onChange={(e) => setNewPm({ ...newPm, key: e.target.value })} />
              <Input placeholder="Label" value={newPm.label} onChange={(e) => setNewPm({ ...newPm, label: e.target.value })} />
              <Input placeholder="Description" value={newPm.description} onChange={(e) => setNewPm({ ...newPm, description: e.target.value })} />
              <Button onClick={async () => {
                if (!newPm.key || !newPm.label) return;
                try {
                  const res = await api.createPaymentMethod(newPm);
                  if (res.data) setPaymentMethods([...paymentMethods, res.data]);
                  setNewPm({ key: "", label: "", description: "" });
                } catch (e: any) { alert(e.message); }
              }}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
