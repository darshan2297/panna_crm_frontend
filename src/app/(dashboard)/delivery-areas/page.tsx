"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/services/api";
import { DeliveryArea } from "@/types";

const EMPTY = {
  name: "", pincode: "", delivery_fee: 0, estimated_minutes: 45,
  min_order: 0, is_active: true, sort_order: 0,
};

export default function DeliveryAreasPage() {
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryArea | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryArea | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getDeliveryAreas(false);
      setAreas(res.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (a: DeliveryArea) => {
    setEditing(a);
    setForm({
      name: a.name,
      pincode: a.pincode,
      delivery_fee: a.delivery_fee,
      estimated_minutes: a.estimated_minutes,
      min_order: a.min_order,
      is_active: a.is_active,
      sort_order: a.sort_order,
    });
    setModalOpen(true);
  };

  const openDeleteConfirm = (id: number, name: string) => {
    setDeleteTarget({ id, name } as DeliveryArea);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDeliveryArea(deleteTarget.id);
      setAreas((c) => c.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message || "Failed to delete delivery area");
    } finally {
      setDeleting(false);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload: any = {
        ...form,
        delivery_fee: Number(form.delivery_fee) || 0,
        estimated_minutes: Number(form.estimated_minutes) || 45,
        min_order: Number(form.min_order) || 0,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const res = await api.updateDeliveryArea(editing.id, payload);
        if (res.data) setAreas((c) => c.map((x) => (x.id === editing.id ? res.data! : x)));
      } else {
        const res = await api.createDeliveryArea(payload);
        if (res.data) setAreas((c) => [res.data!, ...c]);
      }
      setModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MapPin className="h-6 w-6" /> Delivery Areas & Pricing</h1>
          <p className="text-sm text-gray-500">
            Set location-wise delivery fees, ETAs and minimum order values. Applied instantly on the website checkout.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Area</Button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Serviceable Areas</CardTitle>
          <CardDescription>Fees shown here are exactly what customers pay on the website</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={5} columns={7} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b bg-gray-50">
                  <th className="py-3 px-4">Area</th><th className="py-3 px-4">Pincode</th><th className="py-3 px-4">Delivery Fee</th><th className="py-3 px-4">ETA</th><th className="py-3 px-4">Min Order</th><th className="py-3 px-4">Status</th><th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 font-semibold">{a.name}</td>
                    <td className="font-mono">{a.pincode}</td>
                    <td className="font-bold text-emerald-700">{a.delivery_fee === 0 ? "FREE" : `₹${a.delivery_fee}`}</td>
                    <td>{a.estimated_minutes} mins</td>
                    <td>{a.min_order > 0 ? `₹${a.min_order}` : "—"}</td>
                    <td>
                      <button onClick={async () => { await api.updateDeliveryArea(a.id, { is_active: !a.is_active }); setAreas((c) => c.map((x) => x.id === a.id ? { ...x, is_active: !x.is_active } : x)); }}>
                        <Badge variant={a.is_active ? "success" : "danger"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                      </button>
                    </td>
                    <td className="text-right">
                      <button className="mr-2 text-gray-500" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></button>
                      <button className="text-red-500" onClick={() => openDeleteConfirm(a.id, a.name)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {areas.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-400">No delivery areas configured</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Delivery Area" : "New Delivery Area"}>
        <div className="space-y-3">
          <Input placeholder="Area name (e.g. Vesu, Adajan, Katargam)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="Pincode (e.g. 395007)" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">Delivery fee (₹, 0 = free)
              <Input type="number" value={form.delivery_fee} onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })} />
            </label>
            <label className="text-xs text-gray-500">ETA (minutes)
              <Input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">Min order (₹, 0 = none)
              <Input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            </label>
            <label className="text-xs text-gray-500">Sort order
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (visible on website)
          </label>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete delivery area?"
        message={`Are you sure you want to delete the delivery area "${deleteTarget?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
