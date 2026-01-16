export type OAuthProvider = "kakao" | "google";
export type CalendarType = "solar" | "lunar";
export type Gender = "male" | "female";
export type FortuneType = "lifetime" | "yearly";
export type RelationshipStatus =
  | "solo"
  | "dating"
  | "married"
  | "divorced"
  | "custom";
export type OccupationStatus =
  | "student"
  | "job_seeker"
  | "homemaker"
  | "employed"
  | "self_employed"
  | "retired"
  | "custom";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: OAuthProvider;
  providerId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  profileCompleted: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
  relationshipStatus: RelationshipStatus | null;
  relationshipStatusCustom: string | null;
  occupationStatus: OccupationStatus | null;
  occupationStatusCustom: string | null;
  relationshipToUser: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Fortune {
  id: string;
  profileId: string;
  fortuneType: FortuneType;
  year: number; // 0 for lifetime, actual year for yearly
  result: unknown;
  createdAt: string;
  updatedAt: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface UserState {
  user: User | null;
  status: AuthStatus;
}

export interface UserActions {
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  login: (user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export type UserStore = UserState & UserActions;
