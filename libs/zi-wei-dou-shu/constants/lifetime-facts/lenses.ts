import type { FactSection, LoveLens } from "./types";

/**
 * 섹션별 관점(lens) 목록. 장면 재료의 lens는 이 안에서 고른다.
 * KO 섹션 지시(libs/services/ai/prompts/ko.ts)의 "다룰 관점"과 같은 목록이다.
 */
export const SECTION_LENSES = {
  core: [
    "첫인상과 실제 속",
    "가장 센 무기",
    "자꾸 걸려 넘어지는 지점",
    "되풀이되는 장면",
  ],
  wealth: ["버는 방식", "쓰는 습관", "모으는 힘", "돈이 새는 순간"],
  career: [
    "일하는 방식",
    "인정받는 순간",
    "부딪히는 사람이나 상황",
    "잘 맞는 판",
  ],
  relationship: [
    "마음이 열리는 계기",
    "연락과 표현",
    "싸우거나 서운할 때",
    "상대가 보는 나",
    "끌리는 사람",
  ] satisfies LoveLens[],
  health: ["튼튼한 곳", "먼저 오는 신호", "신호가 오는 상황", "회복하는 방식"],
  timing: [],
} as const satisfies Record<FactSection, readonly string[]>;
