"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Boxes,
  Package,
  Users,
  UserCircle2,
  BarChart3,
  Globe2,
  Ticket,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  ChevronLeft,
  Flame,
  Truck,
  Clock,
} from "lucide-react";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

interface NavItemConfig {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "brand" | "warning" | "danger";
  children?: { title: string; href: string }[];
}

const navItems: NavItemConfig[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingBag,
    children: [
      { title: "All Orders", href: "/orders" },
      { title: "Live Kitchen Orders", href: "/live-orders" },
      { title: "Website Orders", href: "/orders?platform=website" },
      { title: "Zomato Orders", href: "/orders?platform=zomato" },
      { title: "Swiggy Orders", href: "/orders?platform=swiggy" },
    ],
  },
  {
    title: "Live Orders",
    href: "/live-orders",
    icon: Flame,
    badge: "LIVE",
    badgeVariant: "danger",
  },
  {
    title: "Menu",
    href: "/menu",
    icon: UtensilsCrossed,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Boxes,
    children: [
      { title: "All Ingredients", href: "/inventory" },
      { title: "Low Stock Alerts", href: "/inventory?tab=low_stock" },
      { title: "Movement Log", href: "/inventory?tab=transactions" },
    ],
  },
  {
    title: "Packaging",
    href: "/packaging",
    icon: Package,
    children: [
      { title: "Packaging Items", href: "/packaging" },
      { title: "Stock Levels", href: "/packaging?tab=stock" },
      { title: "Consumption & Rules", href: "/packaging?tab=consumption" },
    ],
  },
  {
    title: "Restock & Alerts",
    href: "/restock",
    icon: Truck,
    children: [
      { title: "Deficit Planner", href: "/restock" },
      { title: "Purchase Orders", href: "/restock?tab=purchase_orders" },
      { title: "Alerts & Dispatches", href: "/restock?tab=notifications" },
    ],
  },
  {
    title: "Customers",
    href: "/customers",
    icon: UserCircle2,
    children: [
      { title: "All Customers", href: "/customers" },
      { title: "Top Spenders", href: "/customers?tab=top" },
      { title: "Order History", href: "/customers?tab=history" },
    ],
  },
  {
    title: "Staff",
    href: "/users",
    icon: Users,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Integrations",
    href: "/integrations",
    icon: Flame,
  },
  {
    title: "Business Hours",
    href: "/business-hours",
    icon: Clock,
  },
  {
    title: "Website Config",
    href: "/website-config",
    icon: Globe2,
  },
  {
    title: "Promo Codes",
    href: "/promocodes",
    icon: Ticket,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function SidebarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  // Helper to determine which menu matches the current path
  const getMenuForPath = (path: string): string | null => {
    for (const item of navItems) {
      if (item.children && item.children.length > 0) {
        if (path === item.href || (item.href !== "/" && path.startsWith(item.href))) {
          return item.title;
        }
      }
    }
    return null;
  };

  const [openSubMenu, setOpenSubMenu] = useState<string | null>(() => getMenuForPath(pathname));

  // Automatically keep only the current route's submenu open, and close others
  useEffect(() => {
    const currentMenu = getMenuForPath(pathname);
    setOpenSubMenu(currentMenu);
  }, [pathname]);

  const handleParentMenuClick = (item: NavItemConfig, e: React.MouseEvent) => {
    e.preventDefault();
    if (!item.children || item.children.length === 0) return;

    // Set this as the only open submenu (accordion: closes all other menus)
    setOpenSubMenu(item.title);

    // Automatically navigate to the first sub-item as default selection
    const defaultHref = item.children[0].href;
    router.push(defaultHref);
  };

  const handleChevronToggle = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpenSubMenu((prev) => (prev === title ? null : title));
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-panna-green-950 text-slate-100 border-r border-panna-green-900/60 transition-all duration-300 z-30 select-none",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-panna-green-900/50">
        {!sidebarCollapsed ? (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-panna-gold-500 to-panna-gold-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-panna-gold-500/20">
              <span className="font-serif text-lg tracking-tight">P</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wide text-white font-serif">
                  Panna
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-panna-gold-500/20 text-panna-gold-400 font-semibold tracking-wider uppercase border border-panna-gold-500/30">
                  CRM
                </span>
              </div>
              <p className="text-[10px] text-panna-green-300 font-medium">
                Cloud Kitchen Ops
              </p>
            </div>
          </Link>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-lg bg-gradient-to-br from-panna-gold-500 to-panna-gold-600 flex items-center justify-center text-slate-950 font-black">
            <span className="font-serif text-lg">P</span>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-1.5 rounded-lg text-panna-green-300 hover:text-white hover:bg-panna-green-900/60 transition-colors"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-panna-green-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const hasChildren = item.children && item.children.length > 0;
          const isSubMenuOpen = openSubMenu === item.title;

          return (
            <div key={item.title} className="space-y-1">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => handleParentMenuClick(item, e)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-panna-green-800/80 text-white font-semibold"
                      : "text-panna-green-200 hover:bg-panna-green-900/50 hover:text-white"
                  )}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-panna-gold-400"
                          : "text-panna-green-300 group-hover:text-panna-gold-400"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </div>

                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                            item.badgeVariant === "warning"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-panna-gold-500/20 text-panna-gold-400 border border-panna-gold-500/30"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span
                        onClick={(e) => handleChevronToggle(item.title, e)}
                        className="p-1 -mr-1 rounded hover:bg-panna-green-900/60 transition-colors cursor-pointer"
                        title={isSubMenuOpen ? "Collapse submenu" : "Expand submenu"}
                      >
                        {isSubMenuOpen ? (
                          <ChevronDown className="w-4 h-4 text-panna-green-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-panna-green-400" />
                        )}
                      </span>
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setOpenSubMenu(null)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-panna-green-800 text-white font-semibold shadow-inner"
                      : "text-panna-green-200 hover:bg-panna-green-900/50 hover:text-white"
                  )}
                  title={sidebarCollapsed ? item.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-panna-gold-400"
                          : "text-panna-green-300 group-hover:text-panna-gold-400"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.title}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-panna-gold-500/20 text-panna-gold-400 border border-panna-gold-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub items with tree linking lines */}
              {hasChildren && !sidebarCollapsed && isSubMenuOpen && (
                <div className="relative pl-[36px] pr-2 space-y-1 pt-1">
                  {/* Top vertical stem extending from parent item into the tree */}
                  <span className="absolute left-[22px] top-0 h-2 w-px bg-panna-green-800/80 pointer-events-none" />

                  {item.children!.map((sub, idx) => {
                    const isLast = idx === item.children!.length - 1;
                    const [subPath, subQuery] = sub.href.split("?");
                    let isSubActive = false;
                    if (subQuery) {
                      const subParams = new URLSearchParams(subQuery);
                      const subPlatform = subParams.get("platform")?.toLowerCase();
                      const subTab = subParams.get("tab")?.toLowerCase();

                      if (subPlatform) {
                        const currentPlatform = searchParams.get("platform")?.toLowerCase();
                        isSubActive = pathname === subPath && subPlatform === currentPlatform;
                      } else if (subTab) {
                        const currentTab = searchParams.get("tab")?.toLowerCase();
                        isSubActive = pathname === subPath && subTab === currentTab;
                      }
                    } else {
                      if (pathname === subPath) {
                        const hasPlatform = !!searchParams.get("platform");
                        const hasTab = !!searchParams.get("tab");
                        isSubActive = !hasPlatform && !hasTab;
                      }
                    }

                    return (
                      <div key={sub.title} className="relative flex items-center">
                        {/* Branch line from spine into the sub-item */}
                        <span
                          className={cn(
                            "absolute -left-[14px] top-0 h-1/2 w-[14px] border-l border-b transition-colors pointer-events-none",
                            isLast ? "rounded-bl-[6px]" : "",
                            isSubActive ? "border-panna-gold-400" : "border-panna-green-800"
                          )}
                        />

                        {/* Continuous spine line downward for subsequent items */}
                        {!isLast && (
                          <span
                            className="absolute -left-[14px] top-1/2 bottom-[-6px] w-px bg-panna-green-800 pointer-events-none"
                          />
                        )}

                        <Link
                          href={sub.href}
                          className={cn(
                            "w-full block px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                            isSubActive
                              ? "text-panna-gold-400 bg-panna-green-900/60 font-semibold shadow-xs"
                              : "text-panna-green-300 hover:text-white hover:bg-panna-green-900/30"
                          )}
                        >
                          {sub.title}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-panna-green-900/50 bg-panna-green-950/80">
        {!sidebarCollapsed ? (
          <div className="bg-panna-green-900/40 rounded-lg p-2.5 border border-panna-green-800/40">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-300">
                Kitchen Online
              </span>
            </div>
            <p className="text-[10px] text-panna-green-300/80 mt-1">
              Zomato • Swiggy • Web Active
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

export function Sidebar() {
  return (
    <React.Suspense fallback={<aside className="w-64 bg-panna-green-950 flex flex-col h-screen" />}>
      <SidebarInner />
    </React.Suspense>
  );
}
