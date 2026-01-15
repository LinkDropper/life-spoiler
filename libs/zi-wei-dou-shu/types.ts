import { z } from "zod/v4";

// ============================================================
// 기본 인덱스 타입
// ============================================================

/** 지지(地支) 인덱스: 자(0) ~ 해(11) */
export type BranchIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** 천간(天干) 인덱스: 갑(0) ~ 계(9) */
export type StemIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 오행국 수: 수이국(2), 목삼국(3), 금사국(4), 토오국(5), 화육국(6) */
export type WuxingJu = 2 | 3 | 4 | 5 | 6;

/** 별 밝기: 묘(최고) > 왕 > 득 > 리 > 평 > 함(최저) */
export type Brightness = "묘" | "왕" | "득" | "리" | "평" | "함";

/** 성별 */
export type Gender = "male" | "female";

/** 달력 유형 */
export type CalendarType = "solar" | "lunar";

/** 사화성 종류 */
export type Sihua = "화록" | "화권" | "화과" | "화기";

// ============================================================
// 입력 스키마 (Zod)
// ============================================================

export const ZiweiInputSchema = z.object({
  name: z.string().min(1).max(20),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:mm 형식이어야 합니다"),
  gender: z.enum(["male", "female"]),
  calendarType: z.enum(["solar", "lunar"]),
  isLeapMonth: z.boolean().optional(),
});

export type ZiweiInput = z.infer<typeof ZiweiInputSchema>;

// ============================================================
// 음력 날짜
// ============================================================

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  yearStem: StemIndex;
  yearBranch: BranchIndex;
}

// ============================================================
// 별 정보
// ============================================================

export interface StarInfo {
  name: string;
  brightness: Brightness;
  sihua?: Sihua;
}

// ============================================================
// 궁 정보
// ============================================================

export interface Palace {
  name: string;
  branch: BranchIndex;
  stem: StemIndex;
  mainStars: StarInfo[];
  minorStars: StarInfo[];
  isShenGong: boolean;
}

// ============================================================
// 사화 결과
// ============================================================

export interface SihuaResult {
  hualu: string;
  huaquan: string;
  huake: string;
  huaji: string;
}

// ============================================================
// 전체 명반
// ============================================================

export interface ZiweiChart {
  input: ZiweiInput;
  lunarDate: LunarDate;
  timeBranch: BranchIndex;
  mingGong: BranchIndex;
  shenGong: BranchIndex;
  wuxingJu: WuxingJu;
  palaces: Palace[];
  sihua: SihuaResult;
}

// ============================================================
// 결과 타입
// ============================================================

export interface FortuneSection {
  title: string;
  content: string;
  highlights: string[];
}

export interface FortuneResult {
  summary: string;
  preview: {
    summary: string;
    description: string;
  };
  wealth: FortuneSection;
  career: FortuneSection;
  relationship: FortuneSection;
  health: FortuneSection;
}

// ============================================================
// 분석 결과 (차트 + 해석)
// ============================================================

export interface ZiweiAnalysisResult {
  chart: ZiweiChart;
  result: FortuneResult;
}
