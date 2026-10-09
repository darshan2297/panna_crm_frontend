import React from "react";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

/**
 * App Router Suspense fallback for every dashboard route.
 *
 * The shell comes from `(dashboard)/layout.tsx`, which persists across
 * navigations, so this only has to fill the content area. That is what makes a
 * click read as an immediate redirect: the sidebar and header never disappear,
 * and the old page is replaced the moment navigation starts.
 *
 * Data loading is a separate concern, handled per-page by `useDelayedLoading`,
 * so a fast API never flashes a skeleton.
 */
export default function Loading() {
  return <PageSkeleton />;
}
