import { useEffect, useRef, useState } from "react";

/**
 * Suppresses a loading skeleton until a request has been slow for `delay` ms.
 *
 * Every CRM page renders a skeleton the moment `loading` flips true. For a
 * warm route the API answers in ~80ms, so the skeleton flashes for two frames
 * and reads as a glitch rather than as feedback. Delaying the *display* (not
 * the fetch) means fast requests render straight into their data, while a
 * genuinely slow one still gets a skeleton.
 *
 * The flag is also forced on for the initial mount, so a cold first paint never
 * shows an empty page with zeros before the skeleton arrives.
 *
 * @param isLoading  the raw loading state from the page's data fetch
 * @param delay      ms to wait before showing the skeleton (default 300)
 */
export function useDelayedLoading(isLoading: boolean, delay = 300): boolean {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial mount: a page that starts in a loading state shows the skeleton at
  // once rather than after the delay — there is no "fast" first paint to protect.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }

    if (isFirstRun.current) {
      setShowSkeleton(true);
      return;
    }

    timer.current = setTimeout(() => setShowSkeleton(true), delay);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [isLoading, delay]);

  useEffect(() => {
    if (isFirstRun.current) isFirstRun.current = false;
  }, []);

  return showSkeleton;
}

export default useDelayedLoading;
