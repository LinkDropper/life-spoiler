export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface InterpretationCacheRow {
  id: string;
  chart_hash: string;
  interpretation_type: string;
  result: Json;
  created_at: string;
  updated_at: string;
}

export interface InterpretationCacheInsert {
  id?: string;
  chart_hash: string;
  interpretation_type: string;
  result: Json;
  created_at?: string;
  updated_at?: string;
}

export type AnalysisResultRow = InterpretationCacheRow;
export type AnalysisResultInsert = InterpretationCacheInsert;

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

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  provider: OAuthProvider;
  provider_id: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  profile_completed: boolean;
}

export interface UserInsert {
  id: string;
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  provider: OAuthProvider;
  provider_id: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string | null;
  profile_completed?: boolean;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: CalendarType;
  gender: Gender;
  relationship_status: RelationshipStatus | null;
  relationship_status_custom: string | null;
  occupation_status: OccupationStatus | null;
  occupation_status_custom: string | null;
  relationship_to_user: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id?: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time?: string | null;
  birth_time_unknown?: boolean;
  calendar_type: CalendarType;
  gender: Gender;
  relationship_status?: RelationshipStatus | null;
  relationship_status_custom?: string | null;
  occupation_status?: OccupationStatus | null;
  occupation_status_custom?: string | null;
  relationship_to_user?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FortuneRow {
  id: string;
  profile_id: string;
  fortune_type: FortuneType;
  year: number; // 0 for lifetime, actual year for yearly
  result: Json;
  created_at: string;
  updated_at: string;
}

export interface FortuneInsert {
  id?: string;
  profile_id: string;
  fortune_type: FortuneType;
  year?: number;
  result: Json;
  created_at?: string;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      interpretation_cache: {
        Row: InterpretationCacheRow;
        Insert: InterpretationCacheInsert;
        Update: Partial<InterpretationCacheInsert>;
        Relationships: [];
      };
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: Partial<UserInsert>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      fortunes: {
        Row: FortuneRow;
        Insert: FortuneInsert;
        Update: Partial<FortuneInsert>;
        Relationships: [
          {
            foreignKeyName: "fortunes_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
