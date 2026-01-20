import type { FortuneRow, ProfileRow } from "@/libs/supabase/types";

export interface ProfileWithFortunes extends ProfileRow {
  fortunes: FortuneRow[];
}

export type ProfileLoadStatus = "idle" | "loading" | "loaded" | "error";

export interface ProfileState {
  profiles: ProfileWithFortunes[];
  status: ProfileLoadStatus;
  error: string | null;
}

export interface ProfileActions {
  setProfiles: (profiles: ProfileWithFortunes[]) => void;
  setStatus: (status: ProfileLoadStatus) => void;
  setError: (error: string | null) => void;
  fetchProfiles: (force?: boolean) => Promise<void>;
  addProfile: (profile: ProfileWithFortunes) => void;
  updateProfile: (profile: ProfileWithFortunes) => void;
  deleteProfile: (profileId: string) => void;
  getProfileById: (profileId: string) => ProfileWithFortunes | undefined;
  reset: () => void;
}

export type ProfileStore = ProfileState & ProfileActions;
