import { getMingConstellation } from "@/libs/fortune/lifetime-screen";
import { isFortuneOwned } from "@/libs/home/home-profile";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type {
  CompatibilityResult,
  CompatibilitySubScores,
} from "@/libs/hooks/compatibility/types";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type {
  CompatibilityPairRow,
  CompatibilityRelationshipType,
} from "@/libs/supabase/types";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

/**
 * 궁합 운세 = 공동 주연 영화 (docs/fortune-screen-redesign-2026-11.md §13).
 * 관계 유형이 곧 장르다.
 */
export type CompatibilityGenre =
  | "romance"
  | "romcom"
  | "buddy"
  | "office"
  | "family"
  | "reunion"
  | "pet"
  | "drama";

const GENRE_BY_RELATIONSHIP: Record<
  CompatibilityRelationshipType,
  CompatibilityGenre
> = {
  lover: "romance",
  some: "romcom",
  friend: "buddy",
  colleague: "office",
  family: "family",
  ex_partner: "reunion",
  ex_spouse: "reunion",
  cat_owner: "pet",
  dog_owner: "pet",
  custom: "drama",
};

export const toCompatibilityGenre = (
  relationshipType: CompatibilityRelationshipType | null
): CompatibilityGenre =>
  relationshipType ? GENRE_BY_RELATIONSHIP[relationshipType] : "drama";

/** ACT 3 네 갈래: 이야기(categories) 키와 점수(subScores) 키 짝 */
export const COMPATIBILITY_STORY_KEYS = [
  "communication",
  "growth",
  "emotion",
  "crisis",
] as const;

export type CompatibilityStoryKey = (typeof COMPATIBILITY_STORY_KEYS)[number];

const SCORE_KEY_BY_STORY: Record<
  CompatibilityStoryKey,
  keyof CompatibilitySubScores
> = {
  communication: "communication",
  growth: "growthSynergy",
  emotion: "trustIndex",
  crisis: "crisisResilience",
};

export const getStoryScore = (
  subScores: CompatibilitySubScores,
  key: CompatibilityStoryKey
): number => subScores[SCORE_KEY_BY_STORY[key]];

/** 궁합 본편 다음에 권할 운세: 첫 번째 사람이 아직 안 본 운세 중 홈 순서로 첫 번째 */
const NEXT_ORDER: HomeFortuneKey[] = [
  "lifetime",
  "yearly",
  "pastLife",
  "yearly2027",
  "faceReading",
];

export const pickNextAfterCompatibility = (
  profile: ProfileWithFortunes | null
): HomeFortuneKey | null =>
  NEXT_ORDER.find((key) => !isFortuneOwned(profile, key)) ?? null;

// ============================================================
// 궁합 목록 = 공동 주연작 라인업 (기획서 §13 · 2026-11-06)
// ============================================================

export interface CompatibilityLineupItem {
  id: string;
  nameA: string;
  nameB: string;
  genre: CompatibilityGenre;
  relationshipType: CompatibilityRelationshipType;
  /** 직접 입력한 관계 이름 */
  relationshipCustom: string | null;
  /** 결제한 궁합(본편 소장) */
  isOwned: boolean;
  /** 예고편을 만든 뒤부터 있는 케미 점수 */
  score: number | null;
  /** 본편 한 줄 (해석이 있을 때) */
  headline: string | null;
  /** 명궁 주성 한글 이름 (그림 경로용) */
  starKeyA: string | null;
  starKeyB: string | null;
  /** 카드를 누르면 갈 곳: 소장했으면 본편, 아니면 예고편 */
  href: string;
}

interface LineupPairSource extends Pick<
  CompatibilityPairRow,
  | "id"
  | "relationship_type"
  | "relationship_type_custom"
  | "score"
  | "paid_at"
  | "result"
> {
  profile_a: { name: string };
  profile_b: { name: string };
}

const toLeadStarKey = (chart: ZiweiChart | null | undefined): string | null =>
  chart ? (getMingConstellation(chart)[0]?.starName ?? null) : null;

export const toCompatibilityLineupItem = (
  pair: LineupPairSource
): CompatibilityLineupItem => {
  const result = pair.result as unknown as Partial<CompatibilityResult> | null;
  const isOwned = Boolean(pair.paid_at);
  return {
    id: pair.id,
    nameA: pair.profile_a.name,
    nameB: pair.profile_b.name,
    genre: toCompatibilityGenre(pair.relationship_type),
    relationshipType: pair.relationship_type,
    relationshipCustom: pair.relationship_type_custom,
    isOwned,
    score: pair.score,
    headline: result?.interpretation?.headline ?? null,
    starKeyA: toLeadStarKey(result?.charts?.profileA?.rawChart),
    starKeyB: toLeadStarKey(result?.charts?.profileB?.rawChart),
    href: `/compatibility/${pair.id}/fortune/${isOwned ? "result" : "preview"}`,
  };
};
