"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MenuCategory, MenuCategoryInput } from "@/types";
import { api } from "@/services/api";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedCategory: MenuCategory) => void;
  initialCategory?: MenuCategory | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
}: CategoryModalProps) {
  const isEditing = Boolean(initialCategory);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setName(initialCategory.name);
      setDescription(initialCategory.description || "");
      setDisplayOrder(initialCategory.display_order);
      setIsActive(initialCategory.is_active);
    } else {
      setName("");
      setDescription("");
      setDisplayOrder(0);
      setIsActive(true);
    }
    setError(null);
  }, [initialCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter category name");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: MenuCategoryInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
    };

    try {
      if (isEditing && initialCategory) {
        const res = await api.updateMenuCategory(initialCategory.id, payload);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.message || "Failed to update category");
        }
      } else {
        const res = await api.createMenuCategory(payload);
        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.message || "Failed to create category");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Menu Category" : "Add Menu Category"}
      description="Organize your cloud kitchen menu sections."
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Category Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Special Handi Biryanis"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief explanation of this menu section..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-panna-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-panna-green-600"
            >
              <option value="active">Active (Visible)</option>
              <option value="inactive">Inactive (Hidden)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            className="bg-panna-green-800 hover:bg-panna-green-900"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? "Update Category" : "Create Category"}</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
