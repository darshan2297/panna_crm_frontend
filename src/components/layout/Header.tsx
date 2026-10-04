"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  Shield,
  Menu,
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { Badge } from "../ui/Badge";
import { NotificationDrawer } from "../notifications/NotificationDrawer";

export function Header() {
  const router = useRouter();
  const { toggleSidebar } = useUiStore();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getHealth();
        if (res && res.status === "online") {
          setBackendHealth("online");
        } else {
          setBackendHealth("offline");
        }
      } catch (e) {
        setBackendHealth("offline");
      }
    }

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getNotificationUnreadCount();
      if (res && res.data && typeof res.data.unread_count === "number") {
        setUnreadCount(res.data.unread_count);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await api.logout();
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
        {/* Left Search & Mobile Toggle */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders, menu, ingredients... (Ctrl + K)"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-panna-green-500/20 focus:border-panna-green-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Backend API Health Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-xs">
            {backendHealth === "online" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-slate-700">API Connected</span>
              </>
            ) : backendHealth === "checking" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-medium text-slate-500">Connecting API...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="font-medium text-rose-600">Backend Offline</span>
              </>
            )}
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Open Notifications & Kitchen Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-300 ring-2 ring-white" />
            )}
          </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-panna-green-800 to-panna-green-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium capitalize">
                {user?.role ? user.role.toLowerCase() : "Master Admin"}
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-100 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.full_name || "Panna Master Admin"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user?.email || "admin@pannabiryani.com"}
                </p>
                <div className="mt-1.5">
                  <Badge variant="gold" size="sm">
                    {user?.role || "ADMIN"}
                  </Badge>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Staff Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Security & Roles</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    <NotificationDrawer
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onUpdate={fetchUnreadCount}
    />
  </>
  );
}
