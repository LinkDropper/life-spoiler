import { z } from "zod/v4";

export type BranchIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type StemIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type WuxingJu = 2 | 3 | 4 | 5 | 6;

export type Brightness = "묘" | "왕" | "득" | "리" | "평" | "함";

export type Gender = "male" | "female";

export type CalendarType = "solar" | "lunar";

export type Sihua = "화록" | "화권" | "화과" | "화기";

export const TIME_BRANCHES = [
  { value: "자", label: "자시 (23:00~00:59)", branchIndex: 0 },
  { value: "축", label: "축시 (01:00~02:59)", branchIndex: 1 },
  { value: "인", label: "인시 (03:00~04:59)", branchIndex: 2 },
  { value: "묘", label: "묘시 (05:00~06:59)", branchIndex: 3 },
  { value: "진", label: "진시 (07:00~08:59)", branchIndex: 4 },
  { value: "사", label: "사시 (09:00~10:59)", branchIndex: 5 },
  { value: "오", label: "오시 (11:00~12:59)", branchIndex: 6 },
  { value: "미", label: "미시 (13:00~14:59)", branchIndex: 7 },
  { value: "신", label: "신시 (15:00~16:59)", branchIndex: 8 },
  { value: "유", label: "유시 (17:00~18:59)", branchIndex: 9 },
  { value: "술", label: "술시 (19:00~20:59)", branchIndex: 10 },
  { value: "해", label: "해시 (21:00~22:59)", branchIndex: 11 },
] as const;

export type TimeBranchValue = (typeof TIME_BRANCHES)[number]["value"];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const BirthTimeSchema = z.union([
  z.string().regex(TIME_REGEX, "HH:mm 형식이어야 합니다"),
  z.literal("unknown"),
]);

export const ZiweiInputSchema = z.object({
  name: z.string().min(1).max(20),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다"),
  birthTime: BirthTimeSchema,
  gender: z.enum(["male", "female"]),
  calendarType: z.enum(["solar", "lunar"]),
  isLeapMonth: z.boolean().optional(),
});

export type ZiweiInput = z.infer<typeof ZiweiInputSchema>;

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  yearStem: StemIndex;
  yearBranch: BranchIndex;
}

export interface StarInfo {
  name: string;
  brightness: Brightness;
  sihua?: Sihua;
}

export interface Palace {
  name: string;
  branch: BranchIndex;
  stem: StemIndex;
  mainStars: StarInfo[];
  minorStars: StarInfo[];
  isShenGong: boolean;
}

export interface SihuaResult {
  hualu: string;
  huaquan: string;
  huake: string;
  huaji: string;
}

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

export interface ZiweiAnalysisResult {
  chart: ZiweiChart;
  result: FortuneResult;
}
