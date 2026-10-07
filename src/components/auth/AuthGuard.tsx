"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import { LoadingState } from "../ui/LoadingState";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, initAuth, token } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // If access token is expired but we have a refresh token, try to refresh
  useEffect(() => {
    if (!isLoading && isAuthenticated && token && isTokenExpired(token)) {
      setRefreshing(true);
      api
        .refreshAccessToken()
        .then((ok) => {
          if (!ok) {
            router.push("/login");
          }
        })
        .finally(() => setRefreshing(false));
    }
  }, [isLoading, isAuthenticated, token, router]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login");
      } else if (isAuthenticated && pathname === "/login") {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <LoadingState message="Verifying session..." />
      </div>
    );
  }

  // If not authenticated and not on login page, render nothing while redirecting
  if (!isAuthenticated && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
