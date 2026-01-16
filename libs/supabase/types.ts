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
