import { createStore } from "zustand";

import type { User, UserStore } from "./types";

const initialState = {
  user: null,
  status: "loading" as const,
};

export const createUserStore = () => {
  return createStore<UserStore>((set) => ({
    ...initialState,

    setUser: (user: User | null) => set({ user }),

    setStatus: (status) => set({ status }),

    login: (user: User) =>
      set({
        user,
        status: "authenticated",
      }),

    logout: () =>
      set({
        user: null,
        status: "unauthenticated",
      }),

    fetchUser: async () => {
      try {
        set({ status: "loading" });

        const response = await fetch("/api/user");

        if (!response.ok) {
          set({ user: null, status: "unauthenticated" });
          return;
        }

        const data = await response.json();

        if (data.user) {
          set({ user: data.user, status: "authenticated" });
        } else {
          set({ user: null, status: "unauthenticated" });
        }
      } catch {
        set({ user: null, status: "unauthenticated" });
      }
    },
  }));
};

export type UserStoreApi = ReturnType<typeof createUserStore>;
