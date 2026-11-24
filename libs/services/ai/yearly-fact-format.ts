import type { FortuneClaim } from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";
import { PALACE_SECTION } from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";
import { YEARLY_SECTIONS } from "@/libs/zi-wei-dou-shu/calculators/yearly-facts";
import type {
  YearlyFactSheet,
  YearlySection,
} from "@/libs/zi-wei-dou-shu/calculators/yearly-facts";

import { formatClaim } from "./lifetime-fact-format";
import type {
  YearlyInterpretationType,
  YearlyMonthlyFortuneData,
} from "./types";

// ============================================================
// 올해 운세 사실 시트 → KO 프롬프트 블록
// ============================================================
//
// 인생 운세 사실 시트 블록(lifetime-fact-format.ts)과 같은 형식이다.
// 원본 명반 텍스트(별 이름·궁 이름·사화 이름·영어 헤더)는 넘기지 않는다.
// 모델이 그 용어를 그대로 옮기거나 직접 해석하면서 근거 없는 시기를 지어냈다.

type CategoryKey = "wealth" | "career" | "relationship" | "health";

const SECTION_LABELS_KO: Record<YearlySection, string> = {
  core: "나와 생활 전반",
  wealth: "돈",
  career: "일",
  relationship: "연애·인연",
  health: "몸",
};

const SECTION_BY_TYPE: Partial<Record<YearlyInterpretationType, CategoryKey>> =
  {
    yearly_wealth: "wealth",
    yearly_career: "career",
    yearly_relationship: "relationship",
    yearly_health: "health",
  };

export interface YearlyKoContext {
  targetYear: number;
  currentAge: number;
  gender: string;
  relationshipLabel: string | null;
  occupationLabel: string | null;
  engineScores?: Record<CategoryKey, number>;
  monthlyFortunes?: YearlyMonthlyFortuneData[];
}

const formatClaims = (claims: FortuneClaim[], empty: string): string =>
  claims.length > 0 ? claims.map(formatClaim).join("\n") : `- ${empty}`;

const NO_YEAR_CLAIM =
  "올해 이 영역에 따로 켜지는 일은 없어요. 타고난 바탕이 그대로 드러나는 해예요.";

const decadeClaimsFor = (
  sheet: YearlyFactSheet,
  section: YearlySection
): FortuneClaim[] =>
  (sheet.decade?.claims ?? []).filter(
    (c) => c.palace !== undefined && PALACE_SECTION[c.palace] === section
  );

const formatDecadeLine = (sheet: YearlyFactSheet): string =>
  sheet.decade
    ? `${sheet.decade.startAge}-${sheet.decade.endAge}세 | 생활 무대: ${sheet.decade.stage}`
    : "";

const formatGuestInfo = (context: YearlyKoContext): string =>
  [
    "## 손님 정보",
    `- 성별: ${context.gender}`,
    `- ${context.targetYear}년 나이: 만 ${context.currentAge}세`,
    context.relationshipLabel
      ? `- 연애 상태: ${context.relationshipLabel}`
      : "",
    context.occupationLabel ? `- 직업 상태: ${context.occupationLabel}` : "",
  ]
    .filter(Boolean)
    .join("\n");

const CATEGORY_ORDER: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

/** 점수 칸은 이 순서를 따른다. 화면 점수가 엔진 계산과 어긋나지 않게 하려는 근거다. */
const formatScoreOrder = (scores?: Record<CategoryKey, number>): string => {
  if (!scores) return "";
  const ranked = [...CATEGORY_ORDER].sort((a, b) => scores[b] - scores[a]);
  return `## 영역별 올해 순서 (엔진 계산, 내부용)
${ranked.map((key, i) => `${i + 1}. ${SECTION_LABELS_KO[key]} (${scores[key]})`).join("\n")}`;
};

const KO_YEARLY_NARRATION = `사실 시트 쓰는 법:
- "올해 켜지는 일"이 이 섹션의 판정 재료예요. 올해에만 해당하는 이야기라, 판정은 여기서 정해요. 첫 번째 주장이 가장 큰 일이에요.
- "타고난 바탕"은 손님이 원래 어떤 사람인지예요. 올해 일이 이 위에서 어떻게 드러나는지 이어 줄 때만 써요. 바탕만 길게 쓰면 인생 운세와 같은 글이 돼요.
- 올해 켜지는 일이 없는 영역은 큰 변화 없이 원래 모습대로 가는 해라고 담백하게 말해요. 없는 기회나 위기를 만들지 않아요.
- 주장의 방향을 지켜요. positive는 기회로, negative는 조심할 일을 그대로, mixed는 양쪽을 말해요.
- 장면은 주장의 cues로 직접 만들어요(언제·어디서·누구와·무엇). 단서를 그대로 옮기지 말고, 손님의 나이와 연애·직업 상태에 맞는 올해 장면으로 만들어요. 손님 상태와 맞지 않는 단서는 그 상태에 맞는 비슷한 장면으로 바꿔요. voice는 곁 사람이 할 법한 말의 재료예요. 상황에 맞게 고쳐서, 누가 말했는지 붙인 큰따옴표 대사로 장면 안에 넣어요. avoid는 그렇게 읽히지 않게 할 해석이에요.
- 이 시트에 없는 사건, 달, 나이, 직업명, 상대 정보는 만들지 않아요. 몇 월에 무슨 일이 생긴다는 말은 월별 섹션에서만, 그 섹션이 받은 표대로 해요.`;

const formatCategoryBlock = (
  sheet: YearlyFactSheet,
  section: CategoryKey,
  context: YearlyKoContext
): string => {
  const decade = decadeClaimsFor(sheet, section);
  return `## ${context.targetYear}년 사실 시트 — ${SECTION_LABELS_KO[section]} (엔진 계산, 내부용)
### 올해 켜지는 일
${formatClaims(sheet.year[section], NO_YEAR_CLAIM)}

### 타고난 바탕
${formatClaims(sheet.natal[section], "(없음)")}
${decade.length > 0 ? `\n### 지금 10년 (${formatDecadeLine(sheet)})\n${formatClaims(decade, "")}\n` : ""}
${formatScoreOrder(context.engineScores)}

${KO_YEARLY_NARRATION}`;
};

/** 스포일러·스토리: 영역마다 올해 켜지는 일 + 나의 타고난 바탕 */
const formatOverviewBlock = (
  sheet: YearlyFactSheet,
  context: YearlyKoContext
): string => {
  const yearLines = YEARLY_SECTIONS.map(
    (section) =>
      `### ${SECTION_LABELS_KO[section]}\n${formatClaims(sheet.year[section], NO_YEAR_CLAIM)}`
  ).join("\n\n");
  const decade = sheet.decade?.claims ?? [];
  return `## ${context.targetYear}년 사실 시트 — 한 해 전체 (엔진 계산, 내부용)
## 올해 켜지는 일 (영역별)
${yearLines}

## 타고난 바탕 (나)
${formatClaims(sheet.natal.core, "(없음)")}
${sheet.decade ? `\n## 지금 10년 (${formatDecadeLine(sheet)})\n${formatClaims(decade, "이 10년에 따로 켜지는 일은 없어요.")}\n` : ""}
${formatScoreOrder(context.engineScores)}

${KO_YEARLY_NARRATION}`;
};

type MonthTone = "좋은 달" | "보통" | "조심할 달";

/**
 * 엔진 월 점수 순위로 달의 톤을 정한다. 위 2개 좋은 달, 아래 2개 조심할 달.
 * 예전 프롬프트는 "최고 1~2 / 최악 1" 분포를 모델이 근거 없이 만들게 했다.
 */
export const rankMonthTones = (
  months: YearlyMonthlyFortuneData[]
): Map<number, MonthTone> => {
  const sorted = months.map((m) => m.score).sort((a, b) => b - a);
  const tones = new Map<number, MonthTone>();
  // 점수가 계절 보정 위주라 동점이 많다. 동점은 같은 톤으로 묶는다 (2위·뒤에서 2위 점수가 경계)
  const [, goodFrom] = sorted;
  const cautionTo = sorted[sorted.length - 2];
  const isFlat = sorted[0] === sorted[sorted.length - 1];
  for (const m of months) {
    const tone: MonthTone = isFlat
      ? "보통"
      : m.score >= goodFrom
        ? "좋은 달"
        : m.score <= cautionTo
          ? "조심할 달"
          : "보통";
    tones.set(m.month, tone);
  }
  return tones;
};

const formatMonthlyBlock = (
  sheet: YearlyFactSheet,
  context: YearlyKoContext
): string => {
  const months = context.monthlyFortunes ?? [];
  const tones = rankMonthTones(months);
  const allYear = YEARLY_SECTIONS.flatMap((s) =>
    sheet.year[s].map((c) => ({
      ...c,
      topic: `[${SECTION_LABELS_KO[s]}] ${c.topic}`,
    }))
  );
  return `## ${context.targetYear}년 사실 시트 — 월별 (엔진 계산, 내부용)
### 올해 켜지는 일 (달마다 이 중에서 골라 써요)
${formatClaims(allYear, "올해 따로 켜지는 일은 없어요. 계절과 생활 리듬으로 달을 나눠요.")}

### 달별 톤 (엔진 점수 순위)
${months.map((m) => `- ${m.month}월: ${tones.get(m.month)} (${m.score})`).join("\n")}

월별 사실 시트 쓰는 법:
- 달의 톤은 위 표를 따라요. 좋은 달에는 positive 주장, 조심할 달에는 negative 주장을 붙이고, 보통인 달은 계절과 생활 리듬(학기, 명절, 연말 같은)으로 써요.
- 한 주장을 여러 달에 쓸 때는 달마다 다른 장면으로 보여 줘요.
- 시트에 없는 사건, 나이, 직업명, 상대 정보는 만들지 않아요.`;
};

/** KO 올해 운세 데이터 블록 */
export const formatYearlyFactBlockKo = (
  sheet: YearlyFactSheet,
  requestType: YearlyInterpretationType,
  context: YearlyKoContext
): string => {
  const guest = formatGuestInfo(context);
  if (requestType === "yearly_monthly") {
    return `${guest}\n\n${formatMonthlyBlock(sheet, context)}`;
  }
  const section = SECTION_BY_TYPE[requestType];
  if (section) {
    return `${guest}\n\n${formatCategoryBlock(sheet, section, context)}`;
  }
  return `${guest}\n\n${formatOverviewBlock(sheet, context)}`;
};

/** 영역 섹션 문단 수: 올해 켜지는 일 + 타고난 바탕 수에 맞춰 2~3 */
export const yearlyCategoryItemCount = (
  sheet: YearlyFactSheet,
  requestType: YearlyInterpretationType
): number | undefined => {
  const section = SECTION_BY_TYPE[requestType];
  if (!section) return undefined;
  return sheet.year[section].length > 0 ? 3 : 2;
};
