"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import {
  User as UserIcon,
  Lock,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Mail,
} from "lucide-react";

export default function SettingsPage() {
  const { user, setAuth, token, refreshToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "roles">("profile");

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await api.updateProfile({
        full_name: fullName,
        phone,
        email,
      });
      if (res.data && token) {
        setAuth(res.data, token, refreshToken || undefined);
        setProfileSuccess("Profile updated successfully!");
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordSuccess("Password updated successfully! Please use it next time you login.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, credentials, and inspect system role privileges.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Logged in as:</span>
            <Badge variant="gold">@{user.username} ({user.role})</Badge>
          </div>
        )}
      </div>

      {/* Settings Navigation Tabs Container matching Inventory styling */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <UserIcon className={`w-3.5 h-3.5 ${activeTab === "profile" ? "text-amber-400" : "text-stone-400"}`} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "password"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${activeTab === "password" ? "text-amber-400" : "text-stone-400"}`} />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "roles"
                ? "bg-emerald-950 text-white shadow-sm"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${activeTab === "roles" ? "text-amber-400" : "text-stone-400"}`} />
            <span>Security & Roles</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your display name, contact phone, and official communication email.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {profileSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-2 border border-rose-200/60">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Username"
                  value={user?.username || ""}
                  disabled
                  helperText="Username cannot be changed."
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                    System Role
                  </label>
                  <div className="h-10 px-3.5 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-panna-green-900">
                    {user?.role || "STAFF"}
                  </div>
                </div>
              </div>

              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@pannabiryani.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={profileLoading}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: CHANGE PASSWORD */}
      {activeTab === "password" && (
        <Card className="max-w-xl">
          <CardHeader>
            <div>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Ensure your account uses a strong password of at least 6 characters.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium flex items-center gap-2 border border-rose-200/60">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                required
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={passwordLoading}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: ROLES & SYSTEM SECURITY */}
      {activeTab === "roles" && (
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Role Access Matrix</CardTitle>
                <CardDescription>
                  Enforced at the API route level and verified on each request.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-panna-gold-50/50 border border-panna-gold-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-panna-gold-900">ADMIN</span>
                    <Badge variant="gold">Highest Level</Badge>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                    <li>Full System Access</li>
                    <li>User & Staff Management</li>
                    <li>Integrations & API Credentials</li>
                    <li>Platform Pricing Configuration</li>
                    <li>Financials & Gross Margins</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-panna-green-50/50 border border-panna-green-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-panna-green-900">MANAGER</span>
                    <Badge variant="brand">Operational</Badge>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                    <li>Multi-Platform Orders View & Update</li>
                    <li>Menu Availability & Items</li>
                    <li>Inventory Purchases & Wastage</li>
                    <li>Packaging Stock Management</li>
                    <li>Sales & Inventory Analytics</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">STAFF</span>
                    <Badge variant="neutral">Kitchen</Badge>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4">
                    <li>Kitchen Order Ticket View</li>
                    <li>Status Updates (Prep, Ready, Delivered)</li>
                    <li>Daily Stock In / Out Operations</li>
                    <li>Restricted from Financials & Users</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
