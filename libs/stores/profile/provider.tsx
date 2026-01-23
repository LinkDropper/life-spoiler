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

import { useIsAuthenticated } from "../user";
import { createProfileStore, type ProfileStoreApi } from "./store";
import type { ProfileStore } from "./types";

const ProfileStoreContext = createContext<ProfileStoreApi | null>(null);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const storeRef = useRef<ProfileStoreApi | null>(null);
  const isAuthenticated = useIsAuthenticated();

  if (!storeRef.current) {
    storeRef.current = createProfileStore();
  }

  useEffect(() => {
    if (isAuthenticated) {
      storeRef.current?.getState().fetchProfiles();
    } else {
      storeRef.current?.getState().reset();
    }
  }, [isAuthenticated]);

  return (
    <ProfileStoreContext.Provider value={storeRef.current}>
      {children}
    </ProfileStoreContext.Provider>
  );
};

export const useProfileStore = <T,>(
  selector: (state: ProfileStore) => T
): T => {
  const store = useContext(ProfileStoreContext);

  if (!store) {
    throw new Error(
      "useProfileStore는 ProfileProvider 내부에서 사용해야 합니다."
    );
  }

  return useStore(store, selector);
};

export const useProfiles = () => {
  return useProfileStore((state) => state.profiles);
};

export const useProfileLoadStatus = () => {
  return useProfileStore((state) => state.status);
};

export const useProfileError = () => {
  return useProfileStore((state) => state.error);
};

export const useIsProfilesLoading = () => {
  return useProfileStore((state) => state.status === "loading");
};

export const useIsProfilesLoaded = () => {
  return useProfileStore((state) => state.status === "loaded");
};

export const useProfileById = (profileId: string | null) => {
  return useProfileStore(
    useShallow((state) =>
      profileId
        ? state.profiles.find((profile) => profile.id === profileId)
        : undefined
    )
  );
};

export const useProfileActions = () => {
  const store = useContext(ProfileStoreContext);

  if (!store) {
    throw new Error(
      "useProfileActions는 ProfileProvider 내부에서 사용해야 합니다."
    );
  }

  return useStore(
    store,
    useShallow((state) => ({
      fetchProfiles: state.fetchProfiles,
      addProfile: state.addProfile,
      updateProfile: state.updateProfile,
      deleteProfile: state.deleteProfile,
    }))
  );
};
