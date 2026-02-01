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

export type OAuthProvider = "kakao" | "google" | "email";
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
  paid_at: string | null; // 결제 완료 시간 (NULL이면 미결제)
  created_at: string;
  updated_at: string;
}

export interface FortuneInsert {
  id?: string;
  profile_id: string;
  fortune_type: FortuneType;
  year?: number;
  result: Json;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFreeAccessRow {
  id: string;
  profile_id: string;
  fortune_type: FortuneType;
  granted_at: string;
  granted_by: string | null;
  expires_at: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFreeAccessInsert {
  id?: string;
  profile_id: string;
  fortune_type: FortuneType;
  granted_at?: string;
  granted_by?: string | null;
  expires_at?: string | null;
  memo?: string | null;
}

// Promo Code Types
export type PromoCodeType = "common" | "single_use";
export type PromoBenefitType = "free_fortune" | "discount";
export type PromoFortuneType = "lifetime" | "yearly" | "all";

export interface PromoCodeRow {
  id: string;
  code: string;
  code_type: PromoCodeType;
  benefit_type: PromoBenefitType;
  fortune_type: PromoFortuneType;
  discount_percent: number | null;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  campaign_name: string | null;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoCodeInsert {
  id?: string;
  code: string;
  code_type: PromoCodeType;
  benefit_type?: PromoBenefitType;
  fortune_type?: PromoFortuneType;
  discount_percent?: number | null;
  max_uses?: number | null;
  current_uses?: number;
  max_uses_per_user?: number;
  valid_from?: string;
  valid_until?: string | null;
  is_active?: boolean;
  campaign_name?: string | null;
  memo?: string | null;
  created_by?: string | null;
}

export interface PromoCodeUsageRow {
  id: string;
  promo_code_id: string;
  user_id: string;
  profile_id: string;
  fortune_type: FortuneType;
  free_access_id: string | null;
  used_at: string;
  created_at: string;
}

export interface PromoCodeUsageInsert {
  id?: string;
  promo_code_id: string;
  user_id: string;
  profile_id: string;
  fortune_type: FortuneType;
  free_access_id?: string | null;
  used_at?: string;
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
      profile_free_access: {
        Row: ProfileFreeAccessRow;
        Insert: ProfileFreeAccessInsert;
        Update: Partial<ProfileFreeAccessInsert>;
        Relationships: [
          {
            foreignKeyName: "profile_free_access_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      promo_codes: {
        Row: PromoCodeRow;
        Insert: PromoCodeInsert;
        Update: Partial<PromoCodeInsert>;
        Relationships: [];
      };
      promo_code_usages: {
        Row: PromoCodeUsageRow;
        Insert: PromoCodeUsageInsert;
        Update: Partial<PromoCodeUsageInsert>;
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_promo_code_id_fkey";
            columns: ["promo_code_id"];
            referencedRelation: "promo_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promo_code_usages_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promo_code_usages_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promo_code_usages_free_access_id_fkey";
            columns: ["free_access_id"];
            referencedRelation: "profile_free_access";
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
