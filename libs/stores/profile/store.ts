import { createStore } from "zustand";

import type { ProfileStore, ProfileWithFortunes } from "./types";

const initialState = {
  profiles: [] as ProfileWithFortunes[],
  status: "idle" as const,
  error: null as string | null,
};

export const createProfileStore = () => {
  return createStore<ProfileStore>((set, get) => ({
    ...initialState,

    setProfiles: (profiles: ProfileWithFortunes[]) => set({ profiles }),

    setStatus: (status) => set({ status }),

    setError: (error) => set({ error }),

    fetchProfiles: async () => {
      const currentStatus = get().status;

      // 이미 로딩 중이거나 로드된 경우 스킵
      if (currentStatus === "loading" || currentStatus === "loaded") {
        return;
      }

      try {
        set({ status: "loading", error: null });

        const response = await fetch("/api/profile");

        if (!response.ok) {
          throw new Error("프로필 목록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();

        set({
          profiles: data.profiles || [],
          status: "loaded",
          error: null,
        });
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
        set({
          profiles: [],
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "프로필 목록을 불러오는데 실패했습니다.",
        });
      }
    },

    addProfile: (profile: ProfileWithFortunes) => {
      set((state) => ({
        profiles: [profile, ...state.profiles],
      }));
    },

    updateProfile: (updatedProfile: ProfileWithFortunes) => {
      set((state) => ({
        profiles: state.profiles.map((profile) =>
          profile.id === updatedProfile.id ? updatedProfile : profile
        ),
      }));
    },

    deleteProfile: (profileId: string) => {
      set((state) => ({
        profiles: state.profiles.filter((profile) => profile.id !== profileId),
      }));
    },

    getProfileById: (profileId: string) => {
      return get().profiles.find((profile) => profile.id === profileId);
    },

    reset: () => set(initialState),
  }));
};

export type ProfileStoreApi = ReturnType<typeof createProfileStore>;
