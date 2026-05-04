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

export type CompatibilityRelationshipType =
  | "lover"
  | "some"
  | "friend"
  | "colleague"
  | "family"
  | "ex_partner"
  | "ex_spouse"
  | "cat_owner"
  | "dog_owner"
  | "custom";

export type OAuthProvider = "kakao" | "google" | "email";
export type CalendarType = "solar" | "lunar";
export type Gender = "male" | "female";
export type FortuneType = "lifetime" | "yearly" | "compatibility" | "past_life";
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

export type FaceProfileGender = "male" | "female";

export interface FaceProfileRow {
  id: string;
  user_id: string;
  name: string;
  gender: FaceProfileGender;
  created_at: string;
  updated_at: string;
}

export interface FaceProfileInsert {
  id?: string;
  user_id: string;
  name: string;
  gender: FaceProfileGender;
  created_at?: string;
  updated_at?: string;
}

export interface FaceReportRow {
  id: string;
  share_id: string;
  user_id: string;
  face_profile_id: string;
  image_hash: string;
  result: Json;
  paid_at: string | null;
  original_image_path: string | null;
  character_image_path: string | null;
  character_image_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaceReportInsert {
  id?: string;
  share_id: string;
  user_id: string;
  face_profile_id: string;
  image_hash: string;
  result: Json;
  paid_at?: string | null;
  original_image_path?: string | null;
  character_image_path?: string | null;
  character_image_generated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileFreeAccessRow {
  id: string;
  /** profile_id 와 pair_id 중 정확히 하나만 NOT NULL (DB CHECK 제약) */
  profile_id: string | null;
  /** 궁합 운세용 — compatibility_pairs FK */
  pair_id: string | null;
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
  /** profile_id 와 pair_id 중 정확히 하나만 NOT NULL (DB CHECK 제약) */
  profile_id?: string | null;
  /** 궁합 운세용 — compatibility_pairs FK */
  pair_id?: string | null;
  fortune_type: FortuneType;
  granted_at?: string;
  granted_by?: string | null;
  expires_at?: string | null;
  memo?: string | null;
}

// Promo Code Types
export type PromoCodeType = "common" | "single_use";
export type PromoBenefitType = "free_fortune" | "discount";
export type PromoFortuneType =
  | "lifetime"
  | "yearly"
  | "past_life"
  | "compatibility"
  | "face_spoiler"
  | "all";

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
  owner_id: string | null;
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
  owner_id?: string | null;
  created_by?: string | null;
}

export type PromoUsageFortuneType =
  | "lifetime"
  | "yearly"
  | "past_life"
  | "compatibility"
  | "face_spoiler";

export interface PromoCodeUsageRow {
  id: string;
  promo_code_id: string;
  user_id: string;
  profile_id: string | null;
  /** 궁합 운세용 — compatibility_pairs FK */
  pair_id: string | null;
  face_report_id: string | null;
  fortune_type: PromoUsageFortuneType | null;
  free_access_id: string | null;
  used_at: string;
  created_at: string;
}

export interface PromoCodeUsageInsert {
  id?: string;
  promo_code_id: string;
  user_id: string;
  profile_id?: string | null;
  /** 궁합 운세용 — compatibility_pairs FK */
  pair_id?: string | null;
  face_report_id?: string | null;
  fortune_type?: PromoUsageFortuneType | null;
  free_access_id?: string | null;
  used_at?: string;
}

export interface CompatibilityPairRow {
  id: string;
  user_id: string;
  profile_a_id: string;
  profile_b_id: string;
  relationship_type: CompatibilityRelationshipType;
  relationship_type_custom: string | null;
  score: number | null;
  result: Json | null;
  paid_at: string | null;
  is_free_promotion: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompatibilityPairInsert {
  id?: string;
  user_id: string;
  profile_a_id: string;
  profile_b_id: string;
  relationship_type: CompatibilityRelationshipType;
  relationship_type_custom?: string | null;
  score?: number | null;
  result?: Json | null;
  paid_at?: string | null;
  is_free_promotion?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ReviewFortuneType =
  | "lifetime"
  | "yearly"
  | "past_life"
  | "compatibility";

export interface ReviewRow {
  id: string;
  profile_id: string;
  fortune_type: ReviewFortuneType;
  rating: number;
  content: string;
  created_at: string;
}

export interface ReviewInsert {
  id?: string;
  profile_id: string;
  fortune_type: ReviewFortuneType;
  rating: number;
  content: string;
  created_at?: string;
}

export interface FaceReviewRow {
  id: string;
  face_profile_id: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface FaceReviewInsert {
  id?: string;
  face_profile_id: string;
  rating: number;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export type FollowUpFortuneType =
  | "lifetime"
  | "yearly"
  | "past_life"
  | "compatibility";

export interface FollowUpQuestionRow {
  id: string;
  profile_id: string;
  fortune_type: FollowUpFortuneType;
  fortune_id: string | null;
  pair_id: string | null;
  question: string;
  answer: string;
  is_relevant: boolean;
  is_paid: boolean;
  created_at: string;
}

export interface FollowUpQuestionInsert {
  id?: string;
  profile_id: string;
  fortune_type: FollowUpFortuneType;
  fortune_id?: string | null;
  pair_id?: string | null;
  question: string;
  answer: string;
  is_relevant: boolean;
  is_paid?: boolean;
  created_at?: string;
}

// Referral Types
export type ReferralNotificationChannel = "email";
export type ReferralNotificationStatus = "pending" | "sent" | "failed";

export interface ReferralRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  promo_code_id: string;
  notification_channel: ReferralNotificationChannel | null;
  notification_sent_at: string | null;
  notification_status: ReferralNotificationStatus;
  created_at: string;
}

export interface ReferralInsert {
  id?: string;
  referrer_user_id: string;
  referred_user_id: string;
  promo_code_id: string;
  notification_channel?: ReferralNotificationChannel | null;
  notification_sent_at?: string | null;
  notification_status?: ReferralNotificationStatus;
  created_at?: string;
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
          {
            foreignKeyName: "profile_free_access_pair_id_fkey";
            columns: ["pair_id"];
            referencedRelation: "compatibility_pairs";
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
            foreignKeyName: "promo_code_usages_pair_id_fkey";
            columns: ["pair_id"];
            referencedRelation: "compatibility_pairs";
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
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: Partial<ReviewInsert>;
        Relationships: [
          {
            foreignKeyName: "reviews_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      follow_up_questions: {
        Row: FollowUpQuestionRow;
        Insert: FollowUpQuestionInsert;
        Update: Partial<FollowUpQuestionInsert>;
        Relationships: [
          {
            foreignKeyName: "follow_up_questions_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_up_questions_fortune_id_fkey";
            columns: ["fortune_id"];
            referencedRelation: "fortunes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_up_questions_pair_id_fkey";
            columns: ["pair_id"];
            referencedRelation: "compatibility_pairs";
            referencedColumns: ["id"];
          },
        ];
      };
      referrals: {
        Row: ReferralRow;
        Insert: ReferralInsert;
        Update: Partial<ReferralInsert>;
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_user_id_fkey";
            columns: ["referrer_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey";
            columns: ["referred_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_promo_code_id_fkey";
            columns: ["promo_code_id"];
            referencedRelation: "promo_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      face_reports: {
        Row: FaceReportRow;
        Insert: FaceReportInsert;
        Update: Partial<FaceReportInsert>;
        Relationships: [
          {
            foreignKeyName: "face_reports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "face_reports_face_profile_id_fkey";
            columns: ["face_profile_id"];
            referencedRelation: "face_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      face_profiles: {
        Row: FaceProfileRow;
        Insert: FaceProfileInsert;
        Update: Partial<FaceProfileInsert>;
        Relationships: [
          {
            foreignKeyName: "face_profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      face_reviews: {
        Row: FaceReviewRow;
        Insert: FaceReviewInsert;
        Update: Partial<FaceReviewInsert>;
        Relationships: [
          {
            foreignKeyName: "face_reviews_face_profile_id_fkey";
            columns: ["face_profile_id"];
            referencedRelation: "face_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compatibility_pairs: {
        Row: CompatibilityPairRow;
        Insert: CompatibilityPairInsert;
        Update: Partial<CompatibilityPairInsert>;
        Relationships: [
          {
            foreignKeyName: "compatibility_pairs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compatibility_pairs_profile_a_id_fkey";
            columns: ["profile_a_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compatibility_pairs_profile_b_id_fkey";
            columns: ["profile_b_id"];
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
