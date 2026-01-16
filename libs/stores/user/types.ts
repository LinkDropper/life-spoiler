export type OAuthProvider = "kakao" | "google";

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
