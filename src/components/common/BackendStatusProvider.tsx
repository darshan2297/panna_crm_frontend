"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { BackendDown } from "./BackendDown";

interface BackendStatusContextValue {
  isBackendDown: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  recheck: () => Promise<void>;
}

const BackendStatusContext = createContext<BackendStatusContextValue>({
  isBackendDown: false,
  isChecking: true,
  lastChecked: null,
  recheck: async () => {},
});

const HEALTH_ENDPOINT = "/api/v1/health";
const POLL_INTERVAL_MS = 30_000;
const CHECK_TIMEOUT_MS = 5_000;

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const checkHealth = async () => {
    if (typeof window === "undefined") return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${base}/health`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (mountedRef.current) {
        setIsBackendDown(!res.ok);
        setIsChecking(false);
        setLastChecked(new Date());
      }
    } catch {
      clearTimeout(timeout);
      if (mountedRef.current) {
        setIsBackendDown(true);
        setIsChecking(false);
        setLastChecked(new Date());
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkHealth();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <BackendStatusContext.Provider
      value={{
        isBackendDown,
        isChecking,
        lastChecked,
        recheck: checkHealth,
      }}
    >
      {isBackendDown ? <BackendDown /> : children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
