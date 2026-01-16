"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { createUserStore, type UserStoreApi } from "./store";
import type { UserStore } from "./types";

const UserStoreContext = createContext<UserStoreApi | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const storeRef = useRef<UserStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createUserStore();
  }

  useEffect(() => {
    storeRef.current?.getState().fetchUser();
  }, []);

  return (
    <UserStoreContext.Provider value={storeRef.current}>
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = <T,>(selector: (state: UserStore) => T): T => {
  const store = useContext(UserStoreContext);

  if (!store) {
    throw new Error("useUserStore는 UserProvider 내부에서 사용해야 합니다.");
  }

  return useStore(store, selector);
};

export const useUser = () => {
  return useUserStore((state) => state.user);
};

export const useAuthStatus = () => {
  return useUserStore((state) => state.status);
};

export const useIsAuthenticated = () => {
  return useUserStore((state) => state.status === "authenticated");
};

export const useIsAuthLoading = () => {
  return useUserStore((state) => state.status === "loading");
};

export const useUserActions = () => {
  const store = useContext(UserStoreContext);

  if (!store) {
    throw new Error("useUserActions는 UserProvider 내부에서 사용해야 합니다.");
  }

  return useStore(
    store,
    useShallow((state) => ({
      login: state.login,
      logout: state.logout,
      fetchUser: state.fetchUser,
    }))
  );
};

export const useIsProfileCompleted = () => {
  return useUserStore((state) => state.user?.profileCompleted ?? false);
};

export const useNeedsProfileSetup = () => {
  return useUserStore(
    (state) => state.status === "authenticated" && !state.user?.profileCompleted
  );
};
