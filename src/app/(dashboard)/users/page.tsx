"use client";

import React, { useEffect, useState } from "react";
import { SearchInput } from "@/components/common/SearchInput";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { User, UserRole } from "@/types";
import {
  Users as UsersIcon,
  UserPlus,
  Filter,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newFormData, setNewFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    role: "STAFF" as UserRole,
    password: "",
  });

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "STAFF" as UserRole,
    is_active: true,
    password: "",
  });

  // Delete User Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers({
        role: selectedRole === "ALL" ? undefined : selectedRole,
        search: search.trim() || undefined,
        page,
        page_size: pageSize,
      });
      setUsers(res.items || []);
      setTotalUsers(res.total || 0);
      setTotalPages(res.pages || Math.ceil((res.total || 0) / pageSize) || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search applies on submit, not per keystroke
  }, [selectedRole, page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      await api.createUser(newFormData);
      setCreateModalOpen(false);
      setNewFormData({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        role: "STAFF",
        password: "",
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditFormData({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      is_active: u.is_active,
      password: "",
    });
    setEditError(null);
    setEditModalOpen(true);
  };

  // Edit User Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const payload: any = {
        full_name: editFormData.full_name,
        email: editFormData.email,
        phone: editFormData.phone,
        role: editFormData.role,
        is_active: editFormData.is_active,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }

      await api.updateUser(editingUser.id, payload);
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (u: User) => {
    setDeletingUser(u);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // Delete User Handler
  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await api.deleteUser(deletingUser.id);
      setDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
  <>
    {/* Top Banner */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Staff Management
          </h1>
          <Badge variant="brand">{users.length} Staff</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage admin, kitchen managers, and delivery operations staff with role-based access.
        </p>
      </div>

      {currentUser?.role === "ADMIN" && (
        <Button
          variant="primary"
          onClick={() => {
            setCreateError(null);
            setCreateModalOpen(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Add Staff Member
        </Button>
      )}
    </div>

    {/* Role Filters & Search Toolbar matching Inventory styling */}
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Role Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "ALL", label: "All Roles" },
          { id: "ADMIN", label: "Admins" },
          { id: "MANAGER", label: "Managers" },
          { id: "STAFF", label: "Kitchen & Staff" },
        ].map((role) => {
          const isActive = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <span>{role.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email..."
          className="max-w-none w-64"
        />
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch("");
            setSelectedRole("ALL");
            setPage(1);
            fetchUsers();
          }}
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>

    {/* Users Table Card */}
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <LoadingState message="Loading staff accounts..." />
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-600">
            {error}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="No user accounts match the current filter or search criteria."
            actionText="Reset Filters"
            onAction={() => {
              setSearch("");
              setSelectedRole("ALL");
            }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                {currentUser?.role === "ADMIN" && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const roleVariant =
                  u.role === "ADMIN" ? "gold" : u.role === "MANAGER" ? "brand" : "neutral";

                return (
                  <TableRow key={u.id}>
                    {/* Name & Username */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-panna-green-800 to-panna-green-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {u.full_name ? u.full_name.slice(0, 2).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            {u.id === currentUser?.id && (
                              <span className="px-1.5 py-0.2 rounded bg-panna-gold-500/20 text-panna-gold-600 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">@{u.username}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge variant={roleVariant as any} size="sm">
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    {/* Created At */}
                    <TableCell>
                      <span className="text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>

                    {/* Admin Actions */}
                    {currentUser?.role === "ADMIN" && (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditModal(u)}
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-panna-green-700" />
                          </Button>
                          {u.id !== currentUser.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-rose-50"
                              onClick={() => openDeleteModal(u)}
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination Footer */}
        {!loading && totalUsers > 0 && (
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {Math.min((page - 1) * pageSize + 1, totalUsers)}
                </span>
                {" – "}
                <span className="font-bold text-slate-900">
                  {Math.min(page * pageSize, totalUsers)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{totalUsers}</span> users
              </span>

              <div className="flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
                <span className="text-[11px] text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs">
                <span className="font-bold text-slate-900">{page}</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-600">{totalPages}</span>
              </div>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Role Boundaries & Permissions Reference */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-panna-gold-600 font-bold text-xs">
          <Shield className="w-4 h-4" />
          <span>ADMIN ROLE</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Full operational & configuration access: user management, credentials, audit logs, financials, platform integration settings, and menu pricing.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-panna-green-700 font-bold text-xs">
          <Shield className="w-4 h-4" />
          <span>MANAGER ROLE</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Operations management: view/manage orders from all platforms, manage menu availability, full inventory purchases & wastage, packaging stock, and analytics.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
          <Shield className="w-4 h-4" />
          <span>STAFF ROLE</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Kitchen terminal: view incoming tickets, update order prep & delivery statuses, and record basic daily stock-in & stock-out operations.
        </p>
      </div>
    </div>

    {/* CREATE USER MODAL */}
    <Modal
      isOpen={createModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Add New CRM User"
      description="Provision a new staff or management account with designated permissions."
    >
      <form onSubmit={handleCreateSubmit} className="space-y-3.5 mt-2">
        {createError && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {createError}
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="e.g. Rahul Sharma"
          value={newFormData.full_name}
          onChange={(e) => setNewFormData({ ...newFormData, full_name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Username"
            placeholder="e.g. rahul_ops"
            value={newFormData.username}
            onChange={(e) => setNewFormData({ ...newFormData, username: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +91 9876543210"
            value={newFormData.phone}
            onChange={(e) => setNewFormData({ ...newFormData, phone: e.target.value })}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. rahul@pannabiryani.com"
          value={newFormData.email}
          onChange={(e) => setNewFormData({ ...newFormData, email: e.target.value })}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Assigned Role
          </label>
          <select
            value={newFormData.role}
            onChange={(e) => setNewFormData({ ...newFormData, role: e.target.value as UserRole })}
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-panna-green-500/20 focus:border-panna-green-600"
          >
            <option value="STAFF">STAFF (Kitchen & Orders)</option>
            <option value="MANAGER">MANAGER (Orders, Inventory, Menu & Analytics)</option>
            <option value="ADMIN">ADMIN (Full System Privileges)</option>
          </select>
        </div>

        <Input
          label="Temporary Password"
          type="password"
          placeholder="At least 6 characters"
          value={newFormData.password}
          onChange={(e) => setNewFormData({ ...newFormData, password: e.target.value })}
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreateModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={createLoading}
          >
            Create Account
          </Button>
        </div>
      </form>
    </Modal>

    {/* EDIT USER MODAL */}
    <Modal
      isOpen={editModalOpen}
      onClose={() => setEditModalOpen(false)}
      title={`Edit User: @${editingUser?.username}`}
      description="Update staff profile, change role permissions, or toggle account status."
    >
      <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-2">
        {editError && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {editError}
          </div>
        )}

        <Input
          label="Full Name"
          value={editFormData.full_name}
          onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Email Address"
            type="email"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={editFormData.phone}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Role
            </label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
              disabled={editingUser?.id === currentUser?.id}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-panna-green-500/20 focus:border-panna-green-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="STAFF">STAFF</option>
              <option value="MANAGER">MANAGER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Account Status
            </label>
            <select
              value={editFormData.is_active ? "active" : "inactive"}
              onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === "active" })}
              disabled={editingUser?.id === currentUser?.id}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-panna-green-500/20 focus:border-panna-green-600 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive (Suspended)</option>
            </select>
          </div>
        </div>

        <Input
          label="Reset Password (Optional)"
          type="password"
          placeholder="Leave blank to keep existing password"
          value={editFormData.password}
          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={editLoading}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>

    {/* DELETE USER CONFIRMATION MODAL */}
    <Modal
      isOpen={deleteModalOpen}
      onClose={() => setDeleteModalOpen(false)}
      title="Delete User Account"
      description="This action cannot be undone. All access will be revoked permanently."
    >
      <div className="space-y-4 mt-2">
        {deleteError && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
            {deleteError}
          </div>
        )}

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            Are you sure you want to delete user <strong>{deletingUser?.full_name}</strong> (@{deletingUser?.username})?
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={deleteLoading}
            onClick={handleDeleteSubmit}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  </>
  );
}
