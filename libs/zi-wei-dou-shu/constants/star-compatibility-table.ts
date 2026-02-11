import type { MainStarName } from "./stars";

/**
 * 주성 간 궁합 상성 테이블
 *
 * @용도 두 명반의 주성 조합에서 궁합 역학을 사전 계산
 * @참고 compatibility-ko.ts 프롬프트의 "주성 간 궁합 상성" 가이드를 데이터로 정형화
 */

export type CompatLevel =
  | "excellent"
  | "good"
  | "neutral"
  | "tension"
  | "clash";

export interface StarCompatEntry {
  level: CompatLevel;
  dynamics: string;
  scoreOffset: number;
}

/**
 * CompatLevel → 점수 오프셋
 */
const LEVEL_SCORE: Record<CompatLevel, number> = {
  excellent: 12,
  good: 6,
  neutral: 0,
  tension: -6,
  clash: -12,
};

/**
 * 정렬된 키 생성 (순서 무관하게 조회하기 위해)
 */
const makeKey = (a: MainStarName, b: MainStarName): string => {
  return [a, b].sort().join("+");
};

/**
 * 주요 주성 조합 궁합 테이블
 * 키: "별A+별B" (가나다순 정렬)
 */
const RAW_TABLE: Record<string, Omit<StarCompatEntry, "scoreOffset">> = {
  // ===== 시너지 조합 (자연스러운 조화) =====
  [makeKey("자미", "천부")]: {
    level: "excellent",
    dynamics:
      "리더십과 안정의 이상적 조합. 자연스러운 존재감과 관리력이 시너지를 내며 상호 존중하는 관계를 형성.",
  },
  [makeKey("태양", "태음")]: {
    level: "excellent",
    dynamics:
      "밝음과 섬세함의 완벽 보완. 외향적 표현과 내향적 감성이 균형을 이루며 감정과 이성이 조화.",
  },
  [makeKey("천기", "천량")]: {
    level: "excellent",
    dynamics:
      "분석과 지혜의 시너지. 이성적 판단력이 결합되어 함께 고민하면 최적해를 도출하는 관계.",
  },
  [makeKey("무곡", "천부")]: {
    level: "excellent",
    dynamics:
      "실행력과 안정의 최강 조합. 재물과 안정의 시너지로 경제적 파트너십이 탁월.",
  },
  [makeKey("천동", "천량")]: {
    level: "good",
    dynamics:
      "여유와 깊이의 조합. 편안함과 지혜가 만나 스트레스 없이 서로를 채워주는 관계.",
  },
  [makeKey("태양", "거문")]: {
    level: "good",
    dynamics:
      "표현력과 분석력의 시너지. 말로 풀어내는 힘이 뛰어나 소통이 활발한 관계.",
  },
  [makeKey("자미", "천기")]: {
    level: "good",
    dynamics:
      "리더와 참모의 조합. 결단력과 분석력이 보완되어 효율적인 의사결정 가능.",
  },
  [makeKey("천기", "태음")]: {
    level: "good",
    dynamics:
      "분석과 감성의 조화. 계획적이면서 감정이 풍부하여 예술/학문적 교감이 깊음.",
  },

  // ===== 주도권 충돌 조합 =====
  [makeKey("자미", "칠살")]: {
    level: "tension",
    dynamics:
      "리더십과 결단력의 경합. 둘 다 주도하려 하므로 역할 구분이 없으면 마찰 발생.",
  },
  [makeKey("자미", "파군")]: {
    level: "tension",
    dynamics:
      "안정 추구와 변화 추구의 충돌. 큰 그림에서 방향이 갈리기 쉬우나 조율하면 강력한 추진력.",
  },
  [makeKey("칠살", "파군")]: {
    level: "tension",
    dynamics:
      "과감한 에너지의 폭발. 방향이 같으면 최강이지만 다르면 파괴적 충돌.",
  },
  [makeKey("무곡", "칠살")]: {
    level: "tension",
    dynamics:
      "실행과 결단의 속도전. 빠른 결과를 추구하지만 과정을 무시하는 위험.",
  },

  // ===== 열정 과열 조합 =====
  [makeKey("염정", "탐랑")]: {
    level: "tension",
    dynamics:
      "열정과 욕구의 폭발적 만남. 초반 매력이 강렬하지만 지속성에 의문. 서로를 자극하되 제어가 필요.",
  },
  [makeKey("염정", "파군")]: {
    level: "clash",
    dynamics:
      "열정과 변화의 극단적 에너지. 기복이 극심하고 화려하지만 불안정한 관계.",
  },

  // ===== 속도 차이 조합 =====
  [makeKey("무곡", "태음")]: {
    level: "tension",
    dynamics:
      "빠른 실행과 느린 감성의 리듬 차이. 결정 속도 차이가 관계의 핵심 이슈.",
  },
  [makeKey("무곡", "천동")]: {
    level: "tension",
    dynamics:
      "목표 지향과 여유 지향의 충돌. 한쪽은 달리고 한쪽은 쉬려 하여 속도 조율 필요.",
  },
  [makeKey("칠살", "태음")]: {
    level: "tension",
    dynamics:
      "독립적 결단과 섬세한 감성의 괴리. 감정 교감이 어려우나 보완되면 깊은 관계.",
  },
  [makeKey("칠살", "천동")]: {
    level: "tension",
    dynamics:
      "개척자와 안주자의 속도 차이. 한쪽은 전진하고 한쪽은 현상유지를 원함.",
  },
  [makeKey("파군", "천부")]: {
    level: "clash",
    dynamics:
      "변화와 안정의 정면 충돌. 한쪽은 새로움을, 한쪽은 현상유지를 원하여 방향 합의 필수.",
  },

  // ===== 보완 가능 조합 =====
  [makeKey("자미", "탐랑")]: {
    level: "neutral",
    dynamics:
      "리더십과 욕구의 만남. 화려하고 매력적이나 목표와 욕구 사이 갈등 가능.",
  },
  [makeKey("무곡", "탐랑")]: {
    level: "neutral",
    dynamics:
      "실행력과 다재다능의 조합. 목표 달성력이 강하나 방향 설정이 중요.",
  },
  [makeKey("천상", "천량")]: {
    level: "good",
    dynamics:
      "봉사와 지혜의 조합. 서로를 보살피는 따뜻한 관계이나 행동력 보완 필요.",
  },
  [makeKey("천부", "태음")]: {
    level: "good",
    dynamics:
      "안정과 감성의 조화. 편안하고 세심한 관계로 정서적 안전감이 높음.",
  },
  [makeKey("거문", "천량")]: {
    level: "neutral",
    dynamics:
      "분석과 지혜의 이성적 조합. 깊은 지적 교감이 가능하나 감정 표현 부족.",
  },
  [makeKey("천동", "태음")]: {
    level: "good",
    dynamics:
      "여유와 감성의 편안한 조합. 서로에게 안식처가 되지만 추진력이 부족할 수 있음.",
  },
};

/**
 * 주성 조합 궁합 조회
 * 테이블에 없는 조합은 neutral 반환
 */
export const getStarCompatibility = (
  starA: MainStarName,
  starB: MainStarName
): StarCompatEntry => {
  // 같은 별끼리
  if (starA === starB) {
    return {
      level: "neutral",
      dynamics: `같은 기운끼리의 만남. 공감대가 극대화되지만 같은 약점도 공유하며 서로를 제어하기 어려움.`,
      scoreOffset: 0,
    };
  }

  const key = makeKey(starA, starB);
  const entry = RAW_TABLE[key];

  if (entry) {
    return {
      ...entry,
      scoreOffset: LEVEL_SCORE[entry.level],
    };
  }

  return {
    level: "neutral",
    dynamics:
      "특별한 상성 없이 중립적 관계. 개인의 밝기와 사화에 따라 결과가 달라짐.",
    scoreOffset: 0,
  };
};
