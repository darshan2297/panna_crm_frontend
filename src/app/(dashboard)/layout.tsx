"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RouteLoadingBar } from "@/components/common/RouteLoadingBar";

/**
 * Persistent dashboard shell.
 *
 * This used to be rendered *inside every page* (`<DashboardLayout>…</DashboardLayout>`),
 * which meant React tore down and rebuilt the sidebar, header and scroll
 * container on every single navigation. That is why a click showed a frozen old
 * screen: the entire screen, shell included, was one Suspense unit waiting on
 * the new route's payload.
 *
 * As a real layout it renders once and persists. Only the children swap, so the
 * shell stays put and the content area transitions immediately.
 *
 * `/login` and `/live-orders` deliberately live OUTSIDE this group: the kitchen
 * display is a full-screen dark view with no navigation chrome.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-panna-cream-100 overflow-hidden font-sans text-slate-800">
        <Sidebar />
        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <RouteLoadingBar />
          <Header />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF8F5]">
            <div className="max-w-7xl mx-auto space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
