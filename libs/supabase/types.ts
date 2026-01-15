// ============================================================
// Supabase Database 타입
// ============================================================

/**
 * JSON 타입 (Supabase JSONB 컬럼)
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * 해석 캐시 테이블 Row 타입
 */
export interface InterpretationCacheRow {
  id: string;
  chart_hash: string;
  interpretation_type: string;
  result: Json;
  created_at: string;
  updated_at: string;
}

/**
 * 해석 캐시 테이블 Insert 타입
 */
export interface InterpretationCacheInsert {
  id?: string;
  chart_hash: string;
  interpretation_type: string;
  result: Json;
  created_at?: string;
  updated_at?: string;
}

// 하위 호환성을 위한 별칭
export type AnalysisResultRow = InterpretationCacheRow;
export type AnalysisResultInsert = InterpretationCacheInsert;

/**
 * Database 스키마 타입
 */
export type Database = {
  public: {
    Tables: {
      interpretation_cache: {
        Row: InterpretationCacheRow;
        Insert: InterpretationCacheInsert;
        Update: Partial<InterpretationCacheInsert>;
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
