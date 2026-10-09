import { create } from "zustand";

/**
 * Route-transition feedback.
 *
 * A client-side navigation renders the *previous* page until the new route's
 * payload arrives — seconds on a cold route in dev, or on any slow API. Without
 * a signal, a click looks like it did nothing. `beginNavigation` is called
 * synchronously on click so the UI reacts on the same tick; the pending flag is
 * cleared once the browser URL actually reaches the requested href.
 *
 * Next 14 has no `useLinkStatus`, so this store is the portable equivalent.
 */
interface NavigationState {
  /** href of the destination being requested, for optimistic UI. */
  pendingHref: string | null;
  isNavigating: boolean;
  beginNavigation: (href: string) => void;
  endNavigation: () => void;
  /**
   * Clear the pending flag once the browser URL matches the requested href.
   *
   * Matching on pathname alone is not enough: several sidebar groups share one
   * path and differ only by query (/inventory, /inventory?tab=low_stock,
   * /inventory?tab=transactions). Switching between those never changes
   * pathname, so the spinner would otherwise hang until the safety timeout.
   */
  settleNavigation: (pathname: string, search: URLSearchParams) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingHref: null,
  isNavigating: false,
  beginNavigation: (href) => set({ pendingHref: href, isNavigating: true }),
  endNavigation: () => set({ pendingHref: null, isNavigating: false }),
  settleNavigation: (pathname, search) =>
    set((state) => {
      if (!state.pendingHref) return state;
      const [path, query] = state.pendingHref.split("?");
      if (path !== pathname) return state;
      // forEach, not entries(): this project targets pre-ES2015, where
      // URLSearchParams iterators are not downlevelled.
      let matched = true;
      new URLSearchParams(query ?? "").forEach((value, key) => {
        if (search.get(key) !== value) matched = false;
      });
      if (!matched) return state;
      return { pendingHref: null, isNavigating: false };
    }),
}));
