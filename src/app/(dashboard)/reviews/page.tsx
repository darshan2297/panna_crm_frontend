"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/services/api";
import { Review } from "@/types";

const EMPTY = {
  customer_name: "", location: "", rating: 5, review_text: "",
  dish_loved: "", verified_order: true, is_active: true, sort_order: 0,
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getReviews(false);
      setReviews(res.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (r: Review) => {
    setEditing(r);
    setForm({
      customer_name: r.customer_name,
      location: r.location || "",
      rating: r.rating,
      review_text: r.review_text,
      dish_loved: r.dish_loved || "",
      verified_order: r.verified_order,
      is_active: r.is_active,
      sort_order: r.sort_order,
    });
    setModalOpen(true);
  };

  const openDeleteConfirm = (id: number, name: string) => {
    setDeleteTarget({ id, customer_name: name } as Review);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteReview(deleteTarget.id);
      setReviews((c) => c.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload: any = {
        ...form,
        rating: Number(form.rating) || 5,
        sort_order: Number(form.sort_order) || 0,
        location: form.location || null,
        dish_loved: form.dish_loved || null,
      };
      if (editing) {
        const res = await api.updateReview(editing.id, payload);
        if (res.data) setReviews((c) => c.map((x) => (x.id === editing.id ? res.data! : x)));
      } else {
        const res = await api.createReview(payload);
        if (res.data) setReviews((c) => [res.data!, ...c]);
      }
      setModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const renderStars = (rating: number) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </span>
  );

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="h-6 w-6" /> Reviews</h1>
          <p className="text-sm text-gray-500">Manage customer testimonials shown on the website.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Review</Button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>All Reviews</CardTitle></CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={5} columns={7} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b bg-gray-50">
                  <th className="py-3 px-4">Customer</th><th className="py-3 px-4">Rating</th><th className="py-3 px-4">Review</th><th className="py-3 px-4">Dish Loved</th><th className="py-3 px-4">Order</th><th className="py-3 px-4">Status</th><th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-semibold">{r.customer_name}</div>
                      {r.location && <div className="text-xs text-gray-400">{r.location}</div>}
                    </td>
                    <td>{renderStars(r.rating)}</td>
                    <td className="max-w-xs"><p className="truncate text-gray-600" title={r.review_text}>{r.review_text}</p></td>
                    <td>{r.dish_loved || "—"}</td>
                    <td>{r.verified_order ? <Badge variant="success">Verified</Badge> : <Badge>Guest</Badge>}</td>
                    <td>
                      <button onClick={async () => { await api.updateReview(r.id, { is_active: !r.is_active }); setReviews((c) => c.map((x) => x.id === r.id ? { ...x, is_active: !x.is_active } : x)); }}>
                        <Badge variant={r.is_active ? "success" : "danger"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                      </button>
                    </td>
                    <td className="text-right">
                      <button className="mr-2 text-gray-500" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></button>
                      <button className="text-red-500" onClick={() => openDeleteConfirm(r.id, r.customer_name)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-400">No reviews yet</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Review" : "New Review"}>
        <div className="space-y-3">
          <Input placeholder="Customer name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <Input placeholder="Location (e.g. Vesu, Surat)" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label className="text-xs text-gray-500">Rating
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
            </select>
          </label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px]"
            placeholder="Review text"
            value={form.review_text}
            onChange={(e) => setForm({ ...form, review_text: e.target.value })}
          />
          <Input placeholder="Dish loved (optional)" value={form.dish_loved || ""} onChange={(e) => setForm({ ...form, dish_loved: e.target.value })} />
          <Input type="number" placeholder="Sort order (lower shows first)" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.verified_order} onChange={(e) => setForm({ ...form, verified_order: e.target.checked })} /> Verified order
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (visible on website)
          </label>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete review?"
        message={`Are you sure you want to delete the review from "${deleteTarget?.customer_name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
