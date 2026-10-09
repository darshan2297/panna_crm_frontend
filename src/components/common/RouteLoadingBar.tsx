"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Thin indeterminate progress bar pinned to the top of the content area.
 *
 * Appears the instant a nav is requested and drains once the new route commits,
 * so a click never looks like it was ignored. The minimum visible duration stops
 * it flashing on instant navigations, which reads as a glitch.
 */
export function RouteLoadingBar() {
  const pathname = usePathname();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const endNavigation = useNavigationStore((s) => s.endNavigation);

  const [visible, setVisible] = useState(false);
  const shownAt = useRef<number>(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNavigating) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      shownAt.current = Date.now();
      setVisible(true);
      return;
    }

    // Navigation finished — but hold briefly so quick routes don't flicker.
    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(0, 300 - elapsed);
    hideTimer.current = setTimeout(() => setVisible(false), remaining);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [isNavigating]);

  // The new route has committed, so nothing is in flight any more.
  useEffect(() => {
    endNavigation();
  }, [pathname, endNavigation]);

  // Safety net: never leave the bar pinned if a route never commits.
  useEffect(() => {
    if (!isNavigating) return;
    const bail = setTimeout(endNavigation, 15000);
    return () => clearTimeout(bail);
  }, [isNavigating, endNavigation]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div className="h-full w-1/3 animate-[route-loading_1.1s_ease-in-out_infinite] rounded-full bg-panna-gold-400" />
      <style>{`
        @keyframes route-loading {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
