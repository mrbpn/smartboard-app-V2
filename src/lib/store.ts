import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const { data } = await authApi.login(email, password);
        // API returns { data: { user, token } }
        const token = data.data?.token ?? null;
        if (token) localStorage.setItem("sb_access_token", token);
        set({ accessToken: token, isLoading: false });
        const me = await authApi.me();
        set({ user: me.data.data });
      },

      logout: async () => {
        await authApi.logout().catch(() => {});
        localStorage.removeItem("sb_access_token");
        set({ user: null, accessToken: null });
      },

      loadUser: async () => {
        try {
          const { data } = await authApi.me();
          set({ user: data.data });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: "sb-auth",
      partialize: (s) => ({ user: s.user }),
      skipHydration: true, // prevents server/client snapshot mismatch (React error #438)
    }
  )
);
