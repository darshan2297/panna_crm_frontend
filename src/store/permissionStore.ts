import { create } from "zustand";
import { api } from "@/services/api";
import type { MyPermissions, PermissionAction, PermissionModule } from "@/types";

interface PermissionState {
  role: string | null;
  roleId: number | null;
  isSuperuser: boolean;
  /** Flat "MODULE:ACTION" strings; ["*"] when superuser. */
  grants: string[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchPermissions: () => Promise<void>;
  /** Wipe state on logout so the next login starts clean. */
  resetPermissions: () => void;
  can: (module: PermissionModule, action: PermissionAction) => boolean;
  canView: (module: PermissionModule) => boolean;
}

const WILDCARD = "*";

/**
 * The signed-in user's effective permissions, used to hide links and disable
 * buttons the backend would reject anyway.
 *
 * This is UX only — the API is still authoritative and returns 403 on a request
 * made without the grant. Hiding the control just avoids showing staff a button
 * that can only fail.
 *
 * Until the fetch resolves, `can` returns false, so nothing flashes before the
 * permissions are known. A superuser short-circuits to true.
 */
export const usePermissionStore = create<PermissionState>((set, get) => ({
  role: null,
  roleId: null,
  isSuperuser: false,
  grants: [],
  loaded: false,
  loading: false,
  error: null,

  fetchPermissions: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await api.getMyPermissions();
      const data: MyPermissions | undefined = res.data;
      set({
        role: data?.role ?? null,
        roleId: data?.role_id ?? null,
        isSuperuser: data?.is_superuser ?? false,
        grants: data?.permissions ?? [],
        loaded: true,
        loading: false,
        error: null,
      });
    } catch (e) {
      // A failed probe must not silently grant access, and must not lock the
      // user out of their own session either: keep whatever we had and let the
      // API reject anything unauthorised.
      set({
        loaded: true,
        loading: false,
        error: e instanceof Error ? e.message : "Could not load permissions",
      });
    }
  },

  can: (module, action) => {
    const { grants, isSuperuser, loaded } = get();
    if (isSuperuser) return true;
    if (!loaded) return false;
    if (grants.includes(WILDCARD)) return true;
    return grants.includes(`${module}:${action}`);
  },

  canView: (module) => get().can(module, "VIEW"),

  resetPermissions: () => {
    set({
      role: null,
      roleId: null,
      isSuperuser: false,
      grants: [],
      loaded: false,
      loading: false,
      error: null,
    });
  },
}));
