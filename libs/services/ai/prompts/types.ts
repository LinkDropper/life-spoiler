import type { InterpretationType, YearlyInterpretationType } from "../types";

/**
 * 언어별 프롬프트 구조
 */
export interface LocalizedPrompts {
  /** 자미두수 시스템 프롬프트 */
  ziweiSystemPrompt: string;
  /** 해석 유형별 사용자 프롬프트 */
  userPrompts: Record<InterpretationType, string>;
  /** 궁 이름 매핑 */
  palaceNameMap: Record<InterpretationType, string>;
  /** 올해 운세 시스템 프롬프트 */
  yearlySystemPrompt: string;
  /** 올해 운세 해석 유형별 사용자 프롬프트 */
  yearlyUserPrompts: Record<YearlyInterpretationType, string>;
  /** 상태 레이블 (연애/직업 상태 등) */
  statusLabels: {
    gender: { male: string; female: string };
    relationship: Record<string, string>;
    occupation: Record<string, string>;
  };
}
