"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  AlertTriangle,
  Lock,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  PermissionAction,
  PermissionGrant,
  PermissionMatrix,
  PermissionModule,
  Role,
} from "@/types";

const ACTIONS: PermissionAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const ACTION_LABEL: Record<PermissionAction, string> = {
  VIEW: "View",
  CREATE: "Create",
  UPDATE: "Edit",
  DELETE: "Delete",
};

const ACTION_HINT: Record<PermissionAction, string> = {
  VIEW: "Open the screen and read its data",
  CREATE: "Add new records",
  UPDATE: "Edit existing records",
  DELETE: "Remove records",
};

const key = (m: PermissionModule, a: PermissionAction) => `${m}:${a}`;

type RolesTab = "roles" | "matrix";

export function RolesClient() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [activeTab, setActiveTab] = useState<RolesTab>("roles");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPermissionMatrix();
      if (res.data) setMatrix(res.data);
      else setError(res.message || "Could not load roles");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reload]);

  if (loading && !matrix) return <RolesSkeleton />;

  if (error && !matrix) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm font-semibold text-red-800">{error}</p>
        <button
          onClick={() => setReload((r) => r + 1)}
          className="text-xs font-bold text-red-700 underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!matrix) return null;

  const tabs: { id: RolesTab; label: string }[] = [
    { id: "roles", label: "Roles" },
    { id: "matrix", label: "Permission Matrix" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "roles" ? (
        <RolesOverview matrix={matrix} onChanged={() => setReload((r) => r + 1)} />
      ) : (
        <PermissionMatrixTable matrix={matrix} onChanged={() => setReload((r) => r + 1)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Role cards + create/edit                                            */
/* ------------------------------------------------------------------ */
function RolesOverview({
  matrix,
  onChanged,
}: {
  matrix: PermissionMatrix;
  onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = async (role: Role) => {
    if (
      !confirm(
        `Delete role "${role.name}"?\n\nThis cannot be undone. Users assigned to it must be reassigned first.`
      )
    ) {
      return;
    }
    setBusyId(role.id);
    try {
      const res = await api.deleteRole(role.id);
      if (res.success) {
        toast.success(`Role "${role.name}" deleted`);
        onChanged();
      } else {
        toast.error(res.message || "Could not delete role");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete role");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-panna-green-700" />
            Roles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Each role bundles module-level permissions. System roles can be
            renamed only on custom roles; their permissions stay editable.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-panna-gold-400 hover:bg-panna-gold-500 text-[#00291F] text-xs font-bold px-4 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {matrix.roles.map((role) => (
          <div
            key={role.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 truncate">
                    {role.name}
                  </h3>
                  {role.is_superuser && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                      <Shield className="w-2.5 h-2.5" />
                      Superuser
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {role.description || "No description"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {role.user_count} user{role.user_count === 1 ? "" : "s"}
              </span>
              <span>
                {role.permissions.length} grant
                {role.permissions.length === 1 ? "" : "s"}
              </span>
              {role.is_system && (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Lock className="w-3 h-3" />
                  System
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setEditing(role)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-slate-700"
              >
                <Pencil className="w-3 h-3" />
                Permissions
              </button>
              {!role.is_system && !role.is_superuser && (
                <button
                  onClick={() => remove(role)}
                  disabled={busyId === role.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {busyId === role.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {creating && (
        <RoleDialog
          matrix={matrix}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            onChanged();
          }}
        />
      )}
      {editing && (
        <RoleDialog
          role={editing}
          matrix={matrix}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function RoleDialog({
  role,
  matrix,
  onClose,
  onSaved,
}: {
  role?: Role;
  matrix: PermissionMatrix;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [grants, setGrants] = useState<Set<string>>(
    () => new Set((role?.permissions ?? []).map((p) => key(p.module, p.action)))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (m: PermissionModule, a: PermissionAction) => {
    setGrants((prev) => {
      const next = new Set(prev);
      const k = key(m, a);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const toggleModule = (m: PermissionModule, actions: PermissionAction[]) => {
    setGrants((prev) => {
      const next = new Set(prev);
      const allOn = actions.every((a) => next.has(key(m, a)));
      actions.forEach((a) => (allOn ? next.delete(key(m, a)) : next.add(key(m, a))));
      return next;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: PermissionGrant[] = Array.from(grants).map((k) => {
      const [module, action] = k.split(":") as [PermissionModule, PermissionAction];
      return { module, action };
    });

    try {
      const res = role
        ? await api.updateRole(role.id, { name, description, permissions: payload })
        : await api.createRole({ name, description, permissions: payload });
      if (res.success) {
        toast.success(role ? `Role "${name}" updated` : `Role "${name}" created`);
        onSaved();
      } else {
        setError(res.message || "Could not save role");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              {role ? `Edit "${role.name}"` : "Create a role"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {grants.size} permission{grants.size === 1 ? "" : "s"} selected
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Role name <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={role?.is_system}
                placeholder="e.g. Kitchen Supervisor"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-panna-green-600 disabled:bg-stone-50 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Description
              </label>
              <input
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role is for"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-panna-green-600"
              />
            </div>
          </div>

          {role?.is_superuser && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-900 leading-relaxed">
                This is a <strong>superuser</strong> role: it bypasses every
                permission check regardless of the boxes below. The selections
                here are kept for clarity but do not restrict access.
              </p>
            </div>
          )}

          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_repeat(4,72px)] gap-0 bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
              <span>Module</span>
              {ACTIONS.map((a) => (
                <span key={a} className="text-center" title={ACTION_HINT[a]}>
                  {ACTION_LABEL[a]}
                </span>
              ))}
            </div>
            <div className="max-h-[45vh] overflow-y-auto">
              {matrix.modules.map((m) => (
                <div
                  key={m.module}
                  className="grid grid-cols-[1fr_repeat(4,72px)] items-center border-b border-stone-100 last:border-0 hover:bg-stone-50/60"
                >
                  <button
                    onClick={() => toggleModule(m.module, m.actions)}
                    className="text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-panna-green-700"
                    title="Toggle every action for this module"
                  >
                    {m.label}
                  </button>
                  {ACTIONS.map((a) => {
                    const supported = m.actions.includes(a);
                    const on = grants.has(key(m.module, a));
                    return (
                      <div key={a} className="flex justify-center">
                        <button
                          type="button"
                          disabled={!supported}
                          onClick={() => toggle(m.module, a)}
                          aria-label={`${ACTION_LABEL[a]} ${m.label}`}
                          aria-pressed={on}
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                            !supported && "opacity-25 cursor-not-allowed",
                            on
                              ? "bg-panna-green-600 border-panna-green-600 text-white"
                              : "border-stone-300 bg-white hover:border-panna-green-500"
                          )}
                        >
                          {on && <Check className="w-3 h-3" strokeWidth={3} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-2 rounded-lg border border-stone-200 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-panna-gold-400 hover:bg-panna-gold-500 text-[#00291F] disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {role ? "Save changes" : "Create role"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Read-only matrix of every role                                      */
/* ------------------------------------------------------------------ */
function PermissionMatrixTable({
  matrix,
  onChanged,
}: {
  matrix: PermissionMatrix;
  onChanged: () => void;
}) {
  const toggle = useCallback(
    async (role: Role, m: PermissionModule, a: PermissionAction) => {
      const has = role.permissions.some((p) => p.module === m && p.action === a);
      const permissions = has
        ? role.permissions.filter((p) => !(p.module === m && p.action === a))
        : [...role.permissions, { module: m, action: a }];
      try {
        const res = await api.updateRole(role.id, { permissions });
        if (res.success) onChanged();
        else toast.error(res.message || "Could not update permissions");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update permissions");
      }
    },
    [onChanged]
  );

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-panna-green-700" />
          Permission matrix
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Toggle any box to grant or revoke it. Changes apply immediately —
          users are re-checked on their next request.
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left font-bold uppercase tracking-wider text-slate-500 px-3 py-2.5 sticky left-0 bg-stone-50">
                  Module
                </th>
                {matrix.roles.map((r) => (
                  <th
                    key={r.id}
                    className="px-2 py-2.5 text-center font-bold text-slate-700 min-w-[240px]"
                  >
                    {r.name}
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                      {r.user_count} user{r.user_count === 1 ? "" : "s"}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.modules.map((m) => (
                <tr
                  key={m.module}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
                >
                  <td className="px-3 py-2 font-semibold text-slate-700 sticky left-0 bg-white">
                    {m.label}
                  </td>
                  {matrix.roles.map((role) => (
                    <td key={role.id} className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {m.actions.map((a) => {
                          const on = role.permissions.some(
                            (p) => p.module === m.module && p.action === a
                          );
                          return (
                            <button
                              key={a}
                              type="button"
                              disabled={role.is_superuser}
                              onClick={() => toggle(role, m.module, a)}
                              aria-label={`${ACTION_LABEL[a]} ${m.label} for ${role.name}`}
                              aria-pressed={on}
                              title={
                                role.is_superuser
                                  ? "Superuser roles bypass all checks"
                                  : `${ACTION_LABEL[a]} — ${ACTION_HINT[a]}`
                              }
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-1 rounded border transition-colors whitespace-nowrap",
                                role.is_superuser && "opacity-40 cursor-not-allowed",
                                on
                                  ? "bg-panna-green-600 border-panna-green-600 text-white"
                                  : "border-stone-200 text-stone-500 hover:border-panna-green-400 hover:text-panna-green-700"
                              )}
                            >
                              {ACTION_LABEL[a]}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RolesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-stone-200/70 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 bg-stone-200/70 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-stone-200/70 rounded-2xl animate-pulse" />
    </div>
  );
}
