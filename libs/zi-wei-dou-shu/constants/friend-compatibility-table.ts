import type { Sihua } from "../types";

/**
 * 친구 우주 궁합(Friend Universe) 결정론적 매트릭스
 *
 * @설계원칙
 * 1. LLM 호출 없음. 모든 값은 이 파일의 상수 테이블에서만 나온다.
 * 2. 성별 의존 값을 일절 쓰지 않는다 (대운/유년 순역행 사용 금지).
 *    → guest는 성별을 입력하지 않으므로 성별 축이 존재할 수 없다.
 * 3. 모든 관계 축은 대칭(symmetric)으로 정규화한다.
 *    방향성이 있는 축(오행 생극, 사화 비화, 교우궁 교차)은
 *    양방향을 모두 계산해 합산/평균하여 대칭화한다.
 *
 * @유파 삼합파(三合派)
 */

/**
 * 매트릭스 버전 — 점수 튜닝 시 반드시 올린다 (DB 스냅샷에 저장됨).
 *
 * - `fu-1.0.0`: 최초 (양쪽 시진 확정 전제)
 * - `fu-1.1.0`: 시간 미상(`"unknown"`) 경로 추가, `confidence`/`chartCombinations` 필드 추가.
 *   기능 추가이므로 **시진을 모두 아는 경우의 점수는 1.0.0과 완전히 동일**하다
 *   (`__tests__/friend-compatibility.test.ts`의 골든 회귀 테스트가 고정).
 */
export const FRIEND_COMPATIBILITY_MATRIX_VERSION = "fu-1.1.0";

// ============================================================
// 축 1. 띠(年支) 관계
// ============================================================

/**
 * 두 사람의 생년 지지 관계.
 * `analyzeZodiacCompatibility`(기존 유료 궁합용)의 판정 결과를
 * 친구 궁합용 8분류로 정규화한 것.
 */
export type FriendZodiacRelation =
  | "samhap"
  | "yukhap"
  | "same-sign"
  | "clash"
  | "punishment"
  | "harm"
  | "break"
  | "neutral";

/** 띠 관계별 점수 기여도 */
export const ZODIAC_RELATION_DELTA: Record<FriendZodiacRelation, number> = {
  samhap: 20,
  yukhap: 16,
  "same-sign": 7,
  neutral: 0,
  break: -7,
  harm: -11,
  punishment: -13,
  clash: -14,
};

/** 띠 관계별 factor detail 라벨 (전문 용어 + 쉬운 말 병기) */
export const ZODIAC_RELATION_LABEL: Record<FriendZodiacRelation, string> = {
  samhap: "삼합 — 방향이 같은 띠끼리 뭉치는 관계",
  yukhap: "육합 — 짝처럼 자연스럽게 붙는 관계",
  "same-sign": "같은 띠 — 결이 거의 같은 관계",
  neutral: "특별한 상성 없음 — 담백한 관계",
  break: "파 — 흐름이 한 번씩 끊기는 관계",
  harm: "해 — 은근한 서운함이 쌓이는 관계",
  punishment: "형 — 같은 지점에서 반복해 걸리는 관계",
  clash: "충 — 정반대 기운이 마주 보는 관계",
};

// ============================================================
// 축 2. 오행국(五行局) 관계
// ============================================================

/**
 * 오행국 관계 — 방향(누가 생하는가)을 지운 대칭 3분류.
 *
 * @대칭화근거 상생 쌍은 어느 쪽이 생하든 "서로 기운이 도는 조합"으로 본다.
 * 상극 쌍도 마찬가지로 긴장이 관계 전체에 걸린다.
 */
export type FriendElementRelation = "generate" | "same" | "overcome";

export const ELEMENT_RELATION_DELTA: Record<FriendElementRelation, number> = {
  generate: 13,
  same: 6,
  overcome: -11,
};

export const ELEMENT_RELATION_LABEL: Record<FriendElementRelation, string> = {
  generate: "상생 — 서로의 기운을 밀어 올리는 조합",
  same: "비화 — 같은 기운이라 편하지만 약점도 같은 조합",
  overcome: "상극 — 한쪽이 다른 쪽을 조이는 조합",
};

// ============================================================
// 축 3. 명궁(命宮) 자리 관계
// ============================================================

/**
 * 두 사람의 명궁 지지 간 관계.
 * 띠(생년 지지)와는 다른 축이다 — 명궁은 음력 월+시진에서 나온다.
 *
 * `opposite`(대궁, 6칸 차이)는 삼방사정에 포함되는 자리로,
 * 삼합파에서는 서로를 비추는 강한 인연으로 본다 → 가점.
 */
export type FriendPalaceRelation =
  | "same"
  | "samhap"
  | "yukhap"
  | "opposite"
  | "neutral";

/**
 * 12궁 중 7/12는 무관계이므로 `neutral`을 음수로 두어 축 전체의
 * 기대값이 0 근처가 되도록 중심을 맞춘다 (중앙 과밀·상향 편향 방지).
 */
export const PALACE_RELATION_DELTA: Record<FriendPalaceRelation, number> = {
  same: 8,
  samhap: 7,
  yukhap: 5,
  opposite: 3,
  neutral: -4,
};

export const PALACE_RELATION_LABEL: Record<FriendPalaceRelation, string> = {
  same: "명궁 동궁 — 타고난 자리가 같음",
  samhap: "명궁 삼합 — 서로의 삼방에 들어감",
  yukhap: "명궁 육합 — 자리가 짝을 이룸",
  opposite: "명궁 대궁 — 마주 보며 서로를 비춤",
  neutral: "명궁 무관계 — 자리끼리 얽힘 없음",
};

// ============================================================
// 축 4. 주성(主星) 상성 가중치
// ============================================================

/**
 * 명궁 × 명궁 주성 상성 평균 오프셋에 곱하는 가중치.
 * `getStarCompatibility`가 -12 ~ +12를 돌려주므로 실효 범위는 -12 ~ +12.
 */
export const MING_STAR_WEIGHT = 1;

/**
 * 교우궁(交友宮) × 상대 명궁 주성 상성 평균 오프셋 가중치.
 * "친구 자리"에서 상대를 어떻게 받아들이는지를 보는 축이라
 * 친구 궁합에서는 반드시 포함하되, 명궁 축보다는 낮게 잡는다.
 * 양방향(owner 교우궁×guest 명궁, guest 교우궁×owner 명궁) 평균 → 대칭.
 */
export const FRIEND_PALACE_STAR_WEIGHT = 0.6;

// ============================================================
// 축 5. 사화(四化) 교차 — 비화(飛化)
// ============================================================

/**
 * 한쪽의 연간 사화가 상대 명궁의 별에 떨어졌을 때의 기여도.
 * 양방향을 모두 계산해 합산하므로 결과는 대칭.
 */
export const SIHUA_CROSS_DELTA: Record<Sihua, number> = {
  화록: 5,
  화권: 2,
  화과: 2,
  화기: -8,
};

export const SIHUA_CROSS_LABEL: Record<Sihua, string> = {
  화록: "상대의 좋은 흐름이 내 성향에 그대로 들어옴",
  화권: "상대가 내 추진력을 끌어올림",
  화과: "상대 덕에 내 좋은 면이 드러남",
  화기: "상대의 예민한 지점이 내 성향과 겹침",
};

/** 사화 교차 기여도 총합의 상한/하한 (한쪽으로 과도하게 쏠리는 것 방지) */
export const SIHUA_CROSS_CLAMP = 12;

// ============================================================
// 축 6. 생년 천간(年干) 관계
// ============================================================

export type FriendStemRelation = "combine" | "oppose" | "neutral";

export const STEM_RELATION_DELTA: Record<FriendStemRelation, number> = {
  combine: 5,
  oppose: -4,
  neutral: 0,
};

export const STEM_RELATION_LABEL: Record<FriendStemRelation, string> = {
  combine: "천간합 — 태어난 해의 기운이 서로 맞물림",
  oppose: "천간충 — 태어난 해의 기운이 서로 밀어냄",
  neutral: "천간 무관계 — 특별한 얽힘 없음",
};

/** 천간합 쌍 (갑기 / 을경 / 병신 / 정임 / 무계) — 인덱스 차 5 */
export const STEM_COMBINE_OFFSET = 5;

/** 천간충 쌍 (갑경 / 을신 / 병임 / 정계) — 인덱스 차 6 */
export const STEM_OPPOSE_OFFSET = 6;

// ============================================================
// 시간 미상 안내
// ============================================================

/**
 * 태어난 시간을 모를 때 factors에 덧붙는 안내 항목.
 *
 * @design 점수에 영향을 주지 않도록 delta 0. "정확도가 떨어진다"는 부정형 대신
 * 시간을 입력하면 얻는 것을 말하는 긍정형 유도로 작성했다.
 * @brand-voice 존댓말, 자미두수 전문 용어 미사용.
 */
export const UNKNOWN_TIME_FACTOR = {
  label: "시간 정보",
  detail: "태어난 시간을 넣으면 결과가 더 선명해져요",
  delta: 0,
} as const;

// ============================================================
// 기준 점수 / 정규화
// ============================================================

/**
 * 기준 점수.
 * 전 조합 시뮬레이션(2,256쌍) 결과 중앙값이 64~68에 오도록 튜닝했다.
 * (바이럴 기능이므로 중앙 과밀을 피하되 전반적으로 살짝 높게 분포)
 */
export const FRIEND_COMPATIBILITY_BASE_SCORE = 58;

/**
 * 기여도 확산 계수 (중앙 과밀 완화용 튜닝 노브).
 * 각 축의 원(raw) 기여도에 곱해진다.
 * 2,256쌍 시뮬레이션 결과 각 축의 델타만으로 이미 충분히 벌어져
 * 현재 보정 계수는 1.0. 재튜닝 시 이 값만 조정한다.
 */
export const FRIEND_COMPATIBILITY_SPREAD = 1.0;

/** 노출 점수 하한 / 상한 */
export const FRIEND_COMPATIBILITY_MIN_SCORE = 12;
export const FRIEND_COMPATIBILITY_MAX_SCORE = 99;

// ============================================================
// 등급(tier)
// ============================================================

export interface FriendCompatibilityTier {
  /** kebab-case 영문 슬러그 (i18n 키 / DB 저장용) */
  tier: string;
  /** 포함 하한 (이상) */
  minScore: number;
  /** 포함 상한 (이하) */
  maxScore: number;
  /** 한국어 등급명 (UI 참고용, 번역은 후속 작업) */
  labelKo: string;
}

/**
 * 6단계 등급. 점수 구간은 서로 겹치지 않고 0~100을 빈틈없이 덮는다.
 * 높은 등급부터 정렬 (조회는 위에서부터 첫 매치).
 */
export const FRIEND_COMPATIBILITY_TIERS: readonly FriendCompatibilityTier[] = [
  { tier: "twin-star", minScore: 90, maxScore: 100, labelKo: "쌍성" },
  { tier: "bright-orbit", minScore: 78, maxScore: 89, labelKo: "밝은 궤도" },
  { tier: "warm-gravity", minScore: 66, maxScore: 77, labelKo: "따뜻한 인력" },
  { tier: "steady-orbit", minScore: 54, maxScore: 65, labelKo: "안정 궤도" },
  {
    tier: "crossing-comet",
    minScore: 42,
    maxScore: 53,
    labelKo: "스치는 혜성",
  },
  // 최하위 등급만 사람을 지칭하면 "당신은 멀리 있는 별"로 읽혀,
  // 나머지 5개와 같이 '관계의 상태'를 묘사하는 이름으로 맞춘다 (CPO 확정).
  { tier: "distant-star", minScore: 0, maxScore: 41, labelKo: "먼 궤도" },
] as const;

// ============================================================
// 한줄평 매트릭스 (띠 관계 8 × 오행 관계 3 = 24)
// ============================================================

export interface FriendOneLiner {
  /** i18n 키로 그대로 쓸 안정적 슬러그 */
  id: string;
  /** 한국어 원문 */
  ko: string;
}

/**
 * 한줄평 ID 생성 규칙: `fu-{띠관계}-{오행관계}`
 *
 * @brand-voice 존댓말, 자미두수 전문 용어 미사용, 금지 표현 미사용.
 * @i18n KO만 정의. EN/JA 번역은 후속 작업 (messages/translations.json 미수정).
 */
export const buildOneLinerId = (
  zodiac: FriendZodiacRelation,
  element: FriendElementRelation
): string => `fu-${zodiac}-${element}`;

export const FRIEND_ONE_LINERS: Record<string, FriendOneLiner> = {
  // ===== 삼합 =====
  "fu-samhap-generate": {
    id: "fu-samhap-generate",
    ko: "만나면 시간 가는 줄 모르실 거예요. 각자 하려던 일도 같이 있으면 이상하게 더 술술 풀리거든요.",
  },
  "fu-samhap-same": {
    id: "fu-samhap-same",
    ko: "말투도 취향도 비슷해서 길게 설명할 일이 없어요. 다만 둘 다 미루는 일은 끝까지 아무도 손을 안 대더라고요.",
  },
  "fu-samhap-overcome": {
    id: "fu-samhap-overcome",
    ko: "가는 방향은 같은데 속도가 서로 달라요. 한 명이 밀어붙이면 다른 한 명이 브레이크를 잡아주는 식이고요.",
  },

  // ===== 육합 =====
  "fu-yukhap-generate": {
    id: "fu-yukhap-generate",
    ko: "옆에 있으면 그냥 편해요. 편하기만 한 것도 아니라서, 서로를 한 단계씩 올려주기도 하거든요.",
  },
  "fu-yukhap-same": {
    id: "fu-yukhap-same",
    ko: "뭘 하자고 해도 바로 좋다는 대답이 나오는 사이예요. 다만 새로운 자극만큼은 이 둘 바깥에서 채워야 하는 관계고요.",
  },
  "fu-yukhap-overcome": {
    id: "fu-yukhap-overcome",
    ko: "평소엔 잘 맞는데 돈이나 일이 얽히면 예민해지는 지점이 생겨요. 그 부분만큼은 미리 선을 정해 두세요.",
  },

  // ===== 같은 띠 =====
  "fu-same-sign-generate": {
    id: "fu-same-sign-generate",
    ko: "생각하는 방식이 거의 같아 대화 속도가 빠른 편이에요. 모자란 부분은 서로 알아서 메워 줍니다.",
  },
  "fu-same-sign-same": {
    id: "fu-same-sign-same",
    ko: "거울을 마주 본 것 같은 사이예요. 잘 통하는 만큼 약한 구석까지 똑같이 닮아 있더라고요.",
  },
  "fu-same-sign-overcome": {
    id: "fu-same-sign-overcome",
    ko: "닮은 점이 많아 빨리 친해지지만, 그만큼 고집끼리 부딪히는 순간도 있는 사이예요. 각자 한 발씩만 물러나면 오래 갈 조합입니다.",
  },

  // ===== 충 =====
  "fu-clash-generate": {
    id: "fu-clash-generate",
    ko: "결이 정반대라 처음엔 좀 낯설어요. 대신 서로에게 없던 걸 하나씩 배우게 되거든요.",
  },
  "fu-clash-same": {
    id: "fu-clash-same",
    ko: "좋아하는 건 같은데 방식은 정반대예요. 여행 계획을 같이 짜 보면 그 차이가 바로 드러나요.",
  },
  "fu-clash-overcome": {
    id: "fu-clash-overcome",
    ko: "부딪히는 순간이 자주 오는 조합이에요. 대신 한번 맞춰지고 나면 그 뒤로는 꽤 오래 갑니다.",
  },

  // ===== 형 (자형 포함) =====
  // 낮은 점수를 "둘이 안 맞는다"가 아니라 "닮아서 생기는 마찰"로 프레이밍한다.
  // 이론적으로도 형(刑)은 축술미가 모두 土, 인사신이 모두 장생지처럼
  // 같은 성질끼리 겹쳐 생기는 관계라 이 프레이밍이 삼합파 해석에 부합한다.
  "fu-punishment-generate": {
    id: "fu-punishment-generate",
    ko: "가까워질수록 닮은 지점에서 자꾸 걸리는 사이예요. 안 맞아서가 아니라 비슷해서 생기는 마찰이라, 한번 넘기고 나면 서로 한 뼘씩 자라 있고요.",
  },
  "fu-punishment-same": {
    id: "fu-punishment-same",
    ko: "닮은 만큼 같은 지점에서 자꾸 걸리는 사이예요. 그럴 땐 한 번씩 거리를 둬 보세요.",
  },
  "fu-punishment-overcome": {
    id: "fu-punishment-overcome",
    ko: "말 한마디에 분위기가 확 바뀌는 건 예민한 지점이 서로 닮아서 그렇거든요. 중요한 이야기는 메시지보다 얼굴 보고 나누는 쪽이 낫습니다.",
  },

  // ===== 해 =====
  "fu-harm-generate": {
    id: "fu-harm-generate",
    ko: "겉으로는 잘 지내는데 속마음은 잘 안 꺼내는 사이예요. 서운한 게 있으면 그때그때 바로 말해버리는 쪽이 두 사람 다 편해요.",
  },
  "fu-harm-same": {
    id: "fu-harm-same",
    ko: "닮은 만큼 기대가 커서 실망도 같이 커지는 조합이에요. 기대치를 한 칸만 낮춰 두면 훨씬 편해지더라고요.",
  },
  "fu-harm-overcome": {
    id: "fu-harm-overcome",
    ko: "사소한 부분에서 자꾸 어긋나요. 약속 시간이나 정산 같은 건 처음부터 딱 정해 두세요.",
  },

  // ===== 파 =====
  "fu-break-generate": {
    id: "fu-break-generate",
    ko: "만날 때마다 서로한테 뭔가 하나씩 바뀌는 사이예요. 안정보다는 변화가 어울리는 조합이랄까요.",
  },
  "fu-break-same": {
    id: "fu-break-same",
    ko: "잘 지내다가도 한 번씩 관계가 처음으로 돌아가는 조합이에요. 연락이 뜸해졌다 다시 이어지길 반복하더라고요.",
  },
  "fu-break-overcome": {
    id: "fu-break-overcome",
    ko: "같이 있으면 계획이 자꾸 틀어져요. 큰일을 함께 벌이기보다 가볍게 만나는 쪽이 잘 맞고요.",
  },

  // ===== 무관계 =====
  "fu-neutral-generate": {
    id: "fu-neutral-generate",
    ko: "특별히 부딪힐 일은 없는데 필요할 때 꼭 도움이 되는 사이예요. 이런 관계가 오래 볼수록 값이 오르거든요.",
  },
  "fu-neutral-same": {
    id: "fu-neutral-same",
    ko: "무난하게 잘 지내는 사이예요. 다만 먼저 연락하는 쪽이 없어서 그대로 두면 자연스럽게 뜸해질 수 있어요.",
  },
  "fu-neutral-overcome": {
    id: "fu-neutral-overcome",
    ko: "크게 부딪힐 일은 없지만 결정적인 순간에 의견이 갈리는 사이예요. 중요한 결정만큼은 각자 내리는 편이 낫습니다.",
  },
};
