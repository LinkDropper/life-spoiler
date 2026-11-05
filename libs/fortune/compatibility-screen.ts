import { isFortuneOwned } from "@/libs/home/home-profile";
import type { HomeFortuneKey } from "@/libs/home/home-profile";
import type { CompatibilitySubScores } from "@/libs/hooks/compatibility/types";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";
import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

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
