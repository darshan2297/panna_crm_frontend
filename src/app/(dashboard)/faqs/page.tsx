"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/services/api";
import { FAQ } from "@/types";

const EMPTY = {
  question: "", answer: "", category: "ordering", is_active: true, sort_order: 0,
};

const CATEGORY_LABELS: Record<string, string> = {
  ordering: "Ordering",
  food: "Food",
  delivery: "Delivery",
  bulk: "Bulk Orders",
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getFAQs(false);
      setFaqs(res.data || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (f: FAQ) => {
    setEditing(f);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      is_active: f.is_active,
      sort_order: f.sort_order,
    });
    setModalOpen(true);
  };

  const openDeleteConfirm = (id: number, question: string) => {
    setDeleteTarget({ id, question } as FAQ);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteFAQ(deleteTarget.id);
      setFaqs((c) => c.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message || "Failed to delete FAQ");
    } finally {
      setDeleting(false);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const payload: any = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const res = await api.updateFAQ(editing.id, payload);
        if (res.data) setFaqs((c) => c.map((x) => (x.id === editing.id ? res.data! : x)));
      } else {
        const res = await api.createFAQ(payload);
        if (res.data) setFaqs((c) => [res.data!, ...c]);
      }
      setModalOpen(false);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><HelpCircle className="h-6 w-6" /> FAQs</h1>
          <p className="text-sm text-gray-500">Manage frequently asked questions shown on the website.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New FAQ</Button>
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>All FAQs</CardTitle></CardHeader>
        <CardContent>
          {loading ? <TableSkeleton rows={5} columns={5} /> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 font-bold border-b bg-gray-50">
                  <th className="py-3 px-4">Question</th><th className="py-3 px-4">Answer</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Status</th><th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="py-2 max-w-xs"><p className="font-semibold truncate" title={f.question}>{f.question}</p></td>
                    <td className="max-w-md"><p className="truncate text-gray-600" title={f.answer}>{f.answer}</p></td>
                    <td><Badge>{CATEGORY_LABELS[f.category] || f.category}</Badge></td>
                    <td>
                      <button onClick={async () => { await api.updateFAQ(f.id, { is_active: !f.is_active }); setFaqs((c) => c.map((x) => x.id === f.id ? { ...x, is_active: !x.is_active } : x)); }}>
                        <Badge variant={f.is_active ? "success" : "danger"}>{f.is_active ? "Active" : "Inactive"}</Badge>
                      </button>
                    </td>
                    <td className="text-right">
                      <button className="mr-2 text-gray-500" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></button>
                      <button className="text-red-500" onClick={() => openDeleteConfirm(f.id, f.question)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
                {faqs.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-400">No FAQs yet</td></tr>}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit FAQ" : "New FAQ"}>
        <div className="space-y-3">
          <Input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px]"
            placeholder="Answer"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
          />
          <label className="text-xs text-gray-500">Category
            <select className="w-full border rounded-md px-3 py-2 text-sm mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="ordering">Ordering</option>
              <option value="food">Food</option>
              <option value="delivery">Delivery</option>
              <option value="bulk">Bulk Orders</option>
            </select>
          </label>
          <Input type="number" placeholder="Sort order (lower shows first)" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active (visible on website)
          </label>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete FAQ?"
        message={`Are you sure you want to delete the FAQ "${deleteTarget?.question ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
