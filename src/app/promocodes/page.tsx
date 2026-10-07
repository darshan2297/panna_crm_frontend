"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Ticket } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/services/api";
import { PromoCode } from "@/types";

const EMPTY = {
  code: "", title: "", subtitle: "", description: "",
  discount_type: "fixed", discount_value: 0, free_item_name: "",
  min_order_value: 0, badge: "", active: true,
  valid_from: "", valid_until: "", max_uses: "", per_user_limit: 1,
  applicable_items: "", minimum_order_items: "",
};

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPromoCodes();
      setCodes(res.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (pc: PromoCode) => {
    setEditing(pc);
    setForm({
      ...pc,
      free_item_name: pc.free_item_name || "",
      subtitle: pc.subtitle || "",
      description: pc.description || "",
      badge: pc.badge || "",
      valid_from: pc.valid_from ? pc.valid_from.slice(0, 16) : "",
      valid_until: pc.valid_until ? pc.valid_until.slice(0, 16) : "",
      max_uses: pc.max_uses ?? "",
      per_user_limit: pc.per_user_limit ?? 1,
      applicable_items: Array.isArray(pc.applicable_items) ? pc.applicable_items.join(", ") : "",
      minimum_order_items: pc.minimum_order_items ?? "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload: any = {
        ...form,
        valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        max_uses: form.max_uses === "" || form.max_uses === null ? null : Number(form.max_uses),
        per_user_limit: Number(form.per_user_limit) || 1,
        applicable_items: form.applicable_items
          ? String(form.applicable_items).split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        minimum_order_items:
          form.minimum_order_items === "" || form.minimum_order_items === null ? null : Number(form.minimum_order_items),
      };
      delete payload.used_count;
      if (editing) {
        const res = await api.updatePromoCode(editing.id, payload);
        if (res.data) setCodes((c) => c.map((x) => (x.id === editing.id ? res.data! : x)));
      } else {
        const res = await api.createPromoCode(payload);
        if (res.data) setCodes((c) => [res.data!, ...c]);
      }
      setModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Ticket className="h-6 w-6" /> Promo Codes</h1>
            <p className="text-sm text-gray-500">Manage website promo codes applied at checkout.</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Promo Code</Button>
        </div>

        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        <Card>
          <CardHeader><CardTitle>All Promo Codes</CardTitle></CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={5} columns={8} /> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b bg-gray-50">
                    <th className="py-3 px-4">Code</th><th className="py-3 px-4">Title</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Value</th><th className="py-3 px-4">Min Order</th><th className="py-3 px-4">Used</th><th className="py-3 px-4">Status</th><th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((pc) => (
                    <tr key={pc.id} className="border-b last:border-0">
                      <td className="py-2 font-mono font-semibold">{pc.code}</td>
                      <td>{pc.title}</td>
                      <td>{pc.discount_type}</td>
                      <td>{pc.discount_type === "percentage" ? `${pc.discount_value}%` : `₹${pc.discount_value}`}</td>
                      <td>₹{pc.min_order_value}</td>
                      <td>{pc.used_count ?? 0}{pc.max_uses != null ? ` / ${pc.max_uses}` : ""}</td>
                      <td>
                        <button onClick={async () => { await api.updatePromoCode(pc.id, { active: !pc.active }); setCodes((c) => c.map((x) => x.id === pc.id ? { ...x, active: !x.active } : x)); }}>
                          <Badge variant={pc.active ? "success" : "danger"}>{pc.active ? "Active" : "Inactive"}</Badge>
                        </button>
                      </td>
                      <td className="text-right">
                        <button className="mr-2 text-gray-500" onClick={() => openEdit(pc)}><Pencil className="h-4 w-4" /></button>
                        <button className="text-red-500" onClick={async () => { if (confirm("Delete?")) { await api.deletePromoCode(pc.id); setCodes((c) => c.filter((x) => x.id !== pc.id)); } }}><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-400">No promo codes yet</td></tr>}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Promo Code" : "New Promo Code"}>
          <div className="space-y-3">
            <Input placeholder="Code (e.g. FIRSTPANNA)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Subtitle" value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <Input placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Badge" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="fixed">Fixed amount (₹)</option>
              <option value="percentage">Percentage (%)</option>
              <option value="free_delivery">Free Delivery</option>
              <option value="free_item">Free Item</option>
            </select>
            <Input type="number" placeholder="Discount value" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
            <Input placeholder="Free item name (optional)" value={form.free_item_name || ""} onChange={(e) => setForm({ ...form, free_item_name: e.target.value })} />
            <Input type="number" placeholder="Minimum order value" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: Number(e.target.value) })} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-500">Valid from
                <Input type="datetime-local" value={form.valid_from || ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              </label>
              <label className="text-xs text-gray-500">Valid until
                <Input type="datetime-local" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Max uses (blank = unlimited)" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
              <Input type="number" placeholder="Per-user limit" value={form.per_user_limit} onChange={(e) => setForm({ ...form, per_user_limit: Number(e.target.value) })} />
            </div>
            <Input placeholder="Applicable item slugs/categories (comma-separated)" value={form.applicable_items || ""} onChange={(e) => setForm({ ...form, applicable_items: e.target.value })} />
            <Input type="number" placeholder="Minimum order items (blank = none)" value={form.minimum_order_items} onChange={(e) => setForm({ ...form, minimum_order_items: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
            </label>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
