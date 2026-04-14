/**
 * 관상스포(Face Spoiler) 동물상 12종 카탈로그.
 *
 * 한국 대중문화에서 통용되는 대표 12종을 얼굴 특징 기반으로 매핑한 상수 테이블.
 * 기준 원본: `a.md` (유저 확정 동물상 스펙)
 *
 * 분류 원칙 (관상학 전문가 검증 2024-04):
 * - 모든 단서는 **관찰 가능한 물리적 형태·비율·위치** 기반. "분위기/느낌" 금지.
 * - 핵심 판별 축: ①눈 형태+눈꼬리 ②얼굴형 윤곽 ③코 높이·길이 ④입술·입 크기 ⑤삼정 비율
 * - 매칭은 반드시 **2개 이상 부위 조합** 근거. 단일 부위 판단 금지.
 *
 * 분류 엔진 변경 (2026-04):
 * - 기존: LLM이 사진+수치를 보고 직접 12종 분류 → 고양이상 편향 심각
 * - 신규: 코드가 `scoringRules` 기반으로 결정적 분류 → LLM은 rationale만 작성
 * - 임계값은 한국인 MediaPipe 468 랜드마크 실측 분포를 기준으로 튜닝
 */

import type { FaceMetrics } from "../face-shape-analyzer";

/** 12종 리터럴 유니온. face-spoiler 타입 시스템의 진리의 원천. */
export type AnimalType =
  | "dog"
  | "cat"
  | "fox"
  | "bear"
  | "rabbit"
  | "deer"
  | "tiger"
  | "lion"
  | "panda"
  | "eagle"
  | "wolf"
  | "raccoon";

interface AnimalLabel {
  ko: string;
  en: string;
  ja: string;
}

/**
 * 스코어링 규칙이 참조할 수 있는 측정 지표 키.
 *
 * FaceMetrics의 스칼라 필드 + 파생 지표(`samjeongUpper` 등).
 * `animal-scorer.ts`의 `readMetric()`이 이 키를 받아 수치를 반환한다.
 */
export type ScoringMetricKey =
  | "faceRatio"
  | "jawWidthRatio"
  | "jawAngularity"
  | "foreheadWidthRatio"
  | "eyeAspectRatio"
  | "eyeCornerAngle"
  | "eyeSpacingRatio"
  | "eyeSizeRatio"
  | "noseLengthRatio"
  | "mouthWidthRatio"
  | "philtrumRatio"
  | "samjeongUpper"
  | "samjeongMiddle"
  | "samjeongLower";

export type ScoringOperator =
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "between"
  | "outside";

export interface ScoringRule {
  /** 측정 지표 키 (FaceMetrics의 스칼라 필드 또는 파생 지표) */
  metric: ScoringMetricKey;
  /** 비교 연산자 */
  op: ScoringOperator;
  /** 기준값. between/outside면 [min, max], 그 외엔 단일 숫자 */
  value: number | [number, number];
  /** 매칭 시 가점(양수) 또는 감점(음수) 가중치 */
  weight: number;
  /**
   * 소프트 경계 폭. 주어지면 경계 근처는 sigmoid로 부분 가중치.
   * 예: op=gt, value=5, softness=1 → 값 4.5는 0.5 정도만 매칭.
   * 생략 시 하드 컷 (매칭=weight, 불매칭=0).
   */
  softness?: number;
}

export interface AnimalScoringRules {
  /** 필수 조건 — 모두 미매칭 시 큰 페널티 (분류에서 사실상 배제) */
  must: ScoringRule[];
  /** 보조 조건 — 매칭 시 가점. 여러 개 동시 충족 가능 */
  supporting: ScoringRule[];
  /** 배타 조건 — 매칭 시 큰 감점. weight는 음수 */
  never: ScoringRule[];
}

interface AnimalDefinition {
  id: AnimalType;
  label: AnimalLabel;
  impressionKeywords: string[];
  /** 필수 단서 (LLM 설명용 문자열) */
  mustCues: string[];
  /** 보조 단서 (LLM 설명용 문자열) */
  supportingCues: string[];
  /** 배타 단서 (LLM 설명용 문자열) */
  neverCues: string[];
  /** 혼동 쌍별 결정적 구분 기준 (LLM 설명용) */
  tieBreakers: Array<{ vs: AnimalType; decisiveCue: string }>;
  /**
   * 코드 결정적 분류용 스코어링 스펙.
   * `animal-scorer.ts`의 `scoreAnimals()`가 이 규칙만으로 primary를 결정한다.
   */
  scoringRules: AnimalScoringRules;
}

/**
 * 한국인 MediaPipe 468 랜드마크 실측 분포 요약 (임계값 설계 기준).
 *
 * - faceRatio: 중앙값 ~0.95, 분포 0.85~1.10. <0.88 가로 넓음, >1.02 세로 갸름
 * - eyeAspectRatio: 중앙값 ~4.0, 분포 3.5~5.0. <3.5 원안, >4.6 세장안
 * - eyeCornerAngle: 중앙값 ~5°, 분포 0°~10°. <2° 수평, 3°~7° 한국인 기본,
 *                   >8° 뚜렷한 상승, >10° 급격한 상승
 * - jawWidthRatio: 중앙값 ~0.95, 분포 0.80~1.05. <0.85 좁음, >1.02 넓음
 * - eyeSizeRatio: 중앙값 ~0.06. >0.07 큰 눈, <0.05 작은 눈
 * - noseLengthRatio: 중앙값 ~0.25. >0.28 긴 코, <0.22 짧은 코
 * - mouthWidthRatio: 중앙값 ~0.40. >0.45 넓은 입, <0.35 작은 입
 * - philtrumRatio: 중앙값 ~0.35. >0.42 긴 인중, <0.28 짧은 인중
 * - jawAngularity: 0~1 범위. >0.5 각짐, <0.3 둥근
 * - samjeongUpper: 중앙값 ~0.33. >0.38 상정 강조 (독수리상)
 */

export const ANIMAL_CATALOG: Record<AnimalType, AnimalDefinition> = {
  dog: {
    id: "dog",
    label: { ko: "강아지상", en: "Dog", ja: "イヌ顔" },
    impressionKeywords: ["친근함", "따뜻함", "신뢰", "사랑스러움"],
    mustCues: [
      "눈꼬리가 수평 또는 완만함 (한국인 기본 상승 각도 이하)",
      "턱선이 둥글고 얼굴이 너무 갸름하지 않음",
    ],
    supportingCues: [
      "입술이 도톰한 편 (윗입술·아랫입술 모두 두께가 있음)",
      "광대가 옆으로 퍼지지 않고 뺨 볼이 부드럽게 도드라짐",
      "이목구비 크기가 얼굴 대비 작은~보통",
    ],
    neverCues: [
      "눈꼬리가 급격히 올라감 → 여우상",
      "눈이 극도로 좁고 긴 세장안 → 고양이상",
      "턱이 각지고 이목구비가 날카로움 → 호랑이상/늑대상",
    ],
    tieBreakers: [
      {
        vs: "bear",
        decisiveCue:
          "이목구비 크기 대 얼굴 크기 — 강아지상은 이목구비가 얼굴 대비 작고 가벼움, 곰상은 이목구비 자체가 크고 굵음",
      },
      {
        vs: "raccoon",
        decisiveCue:
          "눈 밑 부위 — 강아지상은 눈 밑이 평평, 너구리상은 눈 밑 살이 도드라짐",
      },
      {
        vs: "rabbit",
        decisiveCue:
          "눈 크기와 이목구비 배치 — 토끼상은 눈이 더 동그랗고 이목구비가 중앙에 밀집",
      },
    ],
    scoringRules: {
      // 한국인 평균 대역 (P25~P75) — dog 가드레일: 너무 평균이면 dog, 극단이면 다른 동물
      must: [
        {
          metric: "faceRatio",
          op: "between",
          value: [0.91, 1.28],
          weight: 3,
          softness: 0.03,
        },
        {
          metric: "eyeCornerAngle",
          op: "lt",
          value: 6.25,
          weight: 3,
          softness: 1,
        },
        {
          metric: "eyeAspectRatio",
          op: "between",
          value: [2.67, 4.0],
          weight: 2,
          softness: 0.2,
        },
      ],
      supporting: [
        { metric: "mouthWidthRatio", op: "gt", value: 0.365, weight: 1 },
        { metric: "eyeSizeRatio", op: "lt", value: 0.065, weight: 1 },
      ],
      never: [
        { metric: "eyeCornerAngle", op: "gt", value: 8.67, weight: -8 },
        { metric: "eyeAspectRatio", op: "gt", value: 4.2, weight: -8 },
        { metric: "faceRatio", op: "gt", value: 1.35, weight: -6 },
        { metric: "faceRatio", op: "lt", value: 0.87, weight: -4 },
      ],
    },
  },
  cat: {
    id: "cat",
    label: { ko: "고양이상", en: "Cat", ja: "ネコ顔" },
    impressionKeywords: ["신비로움", "쿨함", "독립적", "날카로움"],
    mustCues: [
      "눈이 확연히 가로로 길고 좁은 세장안",
      "눈꼬리가 뚜렷하게 올라감 + 얼굴이 갸름함",
    ],
    supportingCues: [
      "턱 너비가 좁은 편",
      "코와 입술 선이 또렷하게 정의됨",
      "광대가 옆으로 크게 돌출하지 않음",
    ],
    neverCues: [
      "눈이 한국인 평균 범위 → 고양이상 아님",
      "눈꼬리 상승이 한국인 기본 수준 → 고양이상 아님",
      "얼굴이 평균 갸름도 → 고양이상 아님",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "여우상은 눈꼬리가 더 급격 + 광대 돌출, 고양이상은 광대 평평",
      },
      {
        vs: "deer",
        decisiveCue: "고양이상은 세장안, 사슴상은 원안(크고 둥근 눈)",
      },
      {
        vs: "wolf",
        decisiveCue:
          "늑대상은 눈꼬리 처짐 + 좁고 긴 얼굴, 고양이상은 올라간 눈꼬리",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "eyeAspectRatio",
          op: "gt",
          value: 3.92,
          weight: 4,
          softness: 0.15,
        },
        {
          metric: "eyeCornerAngle",
          op: "between",
          value: [5, 9],
          weight: 3,
          softness: 0.5,
        },
        {
          metric: "faceRatio",
          op: "gt",
          value: 1.0,
          weight: 2,
          softness: 0.04,
        },
      ],
      supporting: [
        { metric: "philtrumRatio", op: "lt", value: 0.41, weight: 1 },
        { metric: "mouthWidthRatio", op: "lt", value: 0.37, weight: 1 },
      ],
      never: [
        { metric: "eyeAspectRatio", op: "lt", value: 3.5, weight: -8 },
        { metric: "eyeCornerAngle", op: "lt", value: 4, weight: -6 },
        { metric: "faceRatio", op: "lt", value: 0.9, weight: -6 },
      ],
    },
  },
  fox: {
    id: "fox",
    label: { ko: "여우상", en: "Fox", ja: "キツネ顔" },
    impressionKeywords: ["영리함", "세련됨", "매혹적", "카리스마"],
    mustCues: [
      "눈꼬리가 급격히 올라감",
      "광대가 옆으로 돌출되어 얼굴에 입체감이 있음",
    ],
    supportingCues: [
      "턱 라인이 갸름하고 V자",
      "눈 사이 거리가 좁은 편",
      "코가 높고 또렷한 편",
    ],
    neverCues: [
      "눈꼬리 상승이 한국인 평균 수준 → 여우상 아님",
      "얼굴이 넓고 각짐 → 호랑이상/사자상",
    ],
    tieBreakers: [
      {
        vs: "cat",
        decisiveCue:
          "여우상은 눈꼬리 급상승 + 광대 돌출, 고양이상은 중간 상승 + 광대 평평",
      },
      {
        vs: "wolf",
        decisiveCue: "여우상은 눈꼬리 올라감, 늑대상은 눈꼬리 수평~처짐",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "eyeCornerAngle",
          op: "gt",
          value: 8.67,
          weight: 5,
          softness: 0.4,
        },
        {
          metric: "faceRatio",
          op: "gt",
          value: 1.02,
          weight: 2,
          softness: 0.04,
        },
      ],
      supporting: [
        { metric: "eyeAspectRatio", op: "gt", value: 3.32, weight: 2 },
        { metric: "noseLengthRatio", op: "gt", value: 0.22, weight: 1 },
      ],
      never: [
        { metric: "eyeCornerAngle", op: "lt", value: 6, weight: -10 },
        { metric: "faceRatio", op: "lt", value: 0.95, weight: -5 },
      ],
    },
  },
  bear: {
    id: "bear",
    label: { ko: "곰상", en: "Bear", ja: "クマ顔" },
    impressionKeywords: ["포근함", "듬직함", "온화함", "믿음직함"],
    mustCues: [
      "얼굴이 넓음 + 이목구비가 크고 굵음",
      "턱선이 둥글고 볼 라인이 넉넉함",
    ],
    supportingCues: [
      "눈이 크고 눈꼬리 방향이 수평~약간 처짐",
      "코가 크고 넓은 편",
      "이마가 넓고 둥근 편",
    ],
    neverCues: [
      "이목구비가 작고 가벼움 → 강아지상",
      "턱이 각지고 위엄감이 있음 → 사자상",
      "얼굴이 갸름하거나 세로로 긴 편 → 곰상 아님",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue:
          "곰상은 눈·코·입 모두 큼, 강아지상은 이목구비가 작고 가벼움",
      },
      {
        vs: "lion",
        decisiveCue: "곰상은 턱이 둥글고 부드러움, 사자상은 턱이 각짐",
      },
    ],
    scoringRules: {
      // 실측상 eyeSizeRatio>0.06 또는 mouthWidthRatio>0.38 중 하나만 뚜렷해도 곰상 후보.
      // 스코어러는 OR을 직접 지원하지 않으므로 supporting 가중치를 크게 두어 어느 쪽이든 가점되도록 한다.
      must: [
        {
          metric: "faceRatio",
          op: "lt",
          value: 0.95,
          weight: 3,
          softness: 0.03,
        },
        {
          metric: "eyeSizeRatio",
          op: "gt",
          value: 0.06,
          weight: 3,
          softness: 0.005,
        },
      ],
      supporting: [
        { metric: "mouthWidthRatio", op: "gt", value: 0.38, weight: 3 },
        { metric: "philtrumRatio", op: "gt", value: 0.41, weight: 1 },
      ],
      never: [
        { metric: "faceRatio", op: "gt", value: 1.15, weight: -6 },
        { metric: "eyeCornerAngle", op: "gt", value: 7, weight: -4 },
      ],
    },
  },
  rabbit: {
    id: "rabbit",
    label: { ko: "토끼상", en: "Rabbit", ja: "ウサギ顔" },
    impressionKeywords: ["순수함", "귀여움", "청순함", "사랑스러움"],
    mustCues: [
      "눈이 크고 둥근 형태 + 눈꼬리 중립",
      "이목구비가 작고 아담하며 얼굴 중앙에 밀집",
    ],
    supportingCues: [
      "코가 작고 오뚝한 편",
      "인중이 짧은 편",
      "얼굴형이 둥글고 아담",
    ],
    neverCues: [
      "인중이 길고 얼굴이 세로로 김 → 사슴상",
      "눈꼬리가 확실히 올라감 → 토끼상 아님",
      "이목구비가 크고 또렷함 → 토끼상 아님",
    ],
    tieBreakers: [
      {
        vs: "deer",
        decisiveCue:
          "토끼상은 인중 짧음 + 둥근 얼굴, 사슴상은 인중 긴 편 + 세로로 긴 얼굴",
      },
      {
        vs: "dog",
        decisiveCue:
          "토끼상은 눈꼬리 중립 + 이목구비 중앙 밀집, 강아지상은 눈꼬리 처짐",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "eyeAspectRatio",
          op: "lt",
          value: 2.67,
          weight: 4,
          softness: 0.15,
        },
        {
          metric: "mouthWidthRatio",
          op: "lt",
          value: 0.37,
          weight: 2,
          softness: 0.02,
        },
        {
          metric: "philtrumRatio",
          op: "lt",
          value: 0.41,
          weight: 2,
          softness: 0.03,
        },
      ],
      supporting: [
        { metric: "eyeSizeRatio", op: "gt", value: 0.06, weight: 2 },
        {
          metric: "faceRatio",
          op: "between",
          value: [0.91, 1.3],
          weight: 1,
        },
      ],
      never: [
        { metric: "eyeAspectRatio", op: "gt", value: 3.5, weight: -10 },
        { metric: "eyeCornerAngle", op: "gt", value: 7, weight: -6 },
        { metric: "faceRatio", op: "gt", value: 1.35, weight: -4 },
      ],
    },
  },
  deer: {
    id: "deer",
    label: { ko: "사슴상", en: "Deer", ja: "シカ顔" },
    impressionKeywords: ["우아함", "청초함", "고귀함", "섬세함"],
    mustCues: ["얼굴형이 세로로 길고 갸름", "눈이 크고 둥근 형태"],
    supportingCues: ["인중이 긴 편", "입이 작고 단정", "코가 얇고 또렷한 편"],
    neverCues: [
      "눈이 좁고 긴 형태 → 고양이상",
      "얼굴이 둥글고 아담 → 토끼상",
      "눈꼬리가 급격히 올라감 → 여우상",
    ],
    tieBreakers: [
      {
        vs: "rabbit",
        decisiveCue:
          "사슴상은 세로로 긴 얼굴 + 긴 인중, 토끼상은 둥근 얼굴 + 짧은 인중",
      },
      {
        vs: "cat",
        decisiveCue: "사슴상은 원안(크고 둥근 눈), 고양이상은 세장안",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "gt",
          value: 1.28,
          weight: 4,
          softness: 0.04,
        },
        {
          metric: "eyeAspectRatio",
          op: "lt",
          value: 3.32,
          weight: 3,
          softness: 0.2,
        },
      ],
      supporting: [
        { metric: "philtrumRatio", op: "gt", value: 0.41, weight: 2 },
        { metric: "mouthWidthRatio", op: "lt", value: 0.37, weight: 1 },
      ],
      never: [
        { metric: "faceRatio", op: "lt", value: 1.1, weight: -6 },
        { metric: "eyeAspectRatio", op: "gt", value: 3.92, weight: -6 },
      ],
    },
  },
  tiger: {
    id: "tiger",
    label: { ko: "호랑이상", en: "Tiger", ja: "トラ顔" },
    impressionKeywords: ["강렬함", "카리스마", "리더십", "날카로움"],
    mustCues: [
      "얼굴이 넓고 광대가 높고 옆으로 돌출 + 턱이 각짐",
      "눈꼬리가 뚜렷하게 올라감 + 눈매가 날카로움",
    ],
    supportingCues: [
      "눈썹이 짙고 진한 편",
      "쌍꺼풀이 뚜렷한 편",
      "이목구비 선이 날렵하고 각진 느낌",
    ],
    neverCues: [
      "턱선이 둥글고 인상이 부드러움 → 호랑이상 아님",
      "얼굴이 좁고 세로로 긴 편 → 늑대상",
    ],
    tieBreakers: [
      {
        vs: "lion",
        decisiveCue:
          "호랑이상은 선이 날렵, 사자상은 이목구비가 굵고 둥근 곡선 섞임",
      },
      {
        vs: "wolf",
        decisiveCue: "호랑이상은 얼굴 넓음, 늑대상은 얼굴 좁고 긴 편",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "lt",
          value: 1.05,
          weight: 2,
          softness: 0.04,
        },
        {
          metric: "eyeCornerAngle",
          op: "gt",
          value: 6.25,
          weight: 3,
          softness: 0.5,
        },
        {
          metric: "eyeAspectRatio",
          op: "gt",
          value: 3.32,
          weight: 2,
          softness: 0.2,
        },
      ],
      supporting: [
        { metric: "eyeSizeRatio", op: "gt", value: 0.06, weight: 1 },
      ],
      never: [
        { metric: "faceRatio", op: "gt", value: 1.3, weight: -6 },
        { metric: "eyeCornerAngle", op: "lt", value: 5, weight: -6 },
      ],
    },
  },
  lion: {
    id: "lion",
    label: { ko: "사자상", en: "Lion", ja: "ライオン顔" },
    impressionKeywords: ["위풍당당함", "풍채", "존재감", "웅장함"],
    mustCues: [
      "이목구비가 크고 굵음 + 얼굴이 넓음",
      "턱·광대가 도드라지며 이목구비 선이 굵음",
    ],
    supportingCues: [
      "눈썹이 두껍고 진한 편",
      "코가 크고 콧방울이 넓은 편",
      "전체적으로 이목구비의 볼륨·굵기가 압도적",
    ],
    neverCues: [
      "턱이 둥글고 부드러움 → 곰상",
      "이목구비가 작거나 얼굴이 갸름 → 사자상 아님",
    ],
    tieBreakers: [
      {
        vs: "tiger",
        decisiveCue: "사자상은 이목구비 굵음, 호랑이상은 선이 날렵",
      },
      {
        vs: "bear",
        decisiveCue: "사자상은 턱 각지고 광대 돌출, 곰상은 턱 둥글고 볼 넉넉",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "lt",
          value: 1.0,
          weight: 2,
          softness: 0.03,
        },
        {
          metric: "mouthWidthRatio",
          op: "gt",
          value: 0.38,
          weight: 3,
          softness: 0.02,
        },
        {
          metric: "eyeSizeRatio",
          op: "gt",
          value: 0.06,
          weight: 2,
          softness: 0.005,
        },
      ],
      supporting: [
        { metric: "noseLengthRatio", op: "gt", value: 0.22, weight: 1 },
      ],
      never: [
        { metric: "faceRatio", op: "gt", value: 1.2, weight: -6 },
        { metric: "mouthWidthRatio", op: "lt", value: 0.34, weight: -6 },
      ],
    },
  },
  panda: {
    id: "panda",
    label: { ko: "판다상", en: "Panda", ja: "パンダ顔" },
    impressionKeywords: ["사랑스러움", "유니크함", "눈에 띔", "익살스러움"],
    mustCues: ["눈이 크고 눈 주변이 강조됨", "이목구비의 명암 대비가 강함"],
    supportingCues: [
      "볼이 둥글고 통통한 편",
      "얼굴 윤곽이 둥근 편",
      "눈 밑 부위가 어두운 음영 또는 도톰함",
    ],
    neverCues: [
      "눈 주변이 밋밋함 → 판다상 아님",
      "얼굴 비율이 납작하고 가로가 넓음 → 너구리상",
    ],
    tieBreakers: [
      {
        vs: "raccoon",
        decisiveCue: "판다상은 흑백 대비 강조, 너구리상은 얼굴 가로 넓은 비율",
      },
      {
        vs: "rabbit",
        decisiveCue: "판다상은 눈 밑 음영, 토끼상은 눈 밑 깨끗",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "lt",
          value: 1.1,
          weight: 2,
          softness: 0.03,
        },
        {
          metric: "eyeSizeRatio",
          op: "gt",
          value: 0.06,
          weight: 3,
          softness: 0.005,
        },
        {
          metric: "eyeAspectRatio",
          op: "lt",
          value: 3.5,
          weight: 2,
          softness: 0.15,
        },
      ],
      supporting: [
        { metric: "philtrumRatio", op: "gt", value: 0.41, weight: 1 },
      ],
      never: [
        { metric: "eyeAspectRatio", op: "gt", value: 3.92, weight: -8 },
        { metric: "eyeSizeRatio", op: "lt", value: 0.05, weight: -6 },
      ],
    },
  },
  eagle: {
    id: "eagle",
    label: { ko: "독수리상", en: "Eagle", ja: "ワシ顔" },
    impressionKeywords: ["예리함", "통찰력", "냉철함", "고고함"],
    mustCues: [
      "이마·미간 구간이 강조됨 — 삼정 상정 비율이 높음",
      "코가 높고 길며 날렵",
    ],
    supportingCues: [
      "측면 윤곽이 날카롭고 각짐",
      "눈이 깊게 들어간 편",
      "입이 작고 닫힌 느낌",
    ],
    neverCues: [
      "이마·미간이 평범하고 코가 짧은 편 → 독수리상 아님",
      "얼굴이 넓고 광대가 크며 눈이 강렬 → 호랑이상",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue: "독수리상은 상정 강조, 늑대상은 중정·하정 강조",
      },
      {
        vs: "tiger",
        decisiveCue: "독수리상은 코·이마 강조, 호랑이상은 광대·턱 강조",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "samjeongUpper",
          op: "gt",
          value: 0.2,
          weight: 3,
          softness: 0.02,
        },
        {
          metric: "noseLengthRatio",
          op: "gt",
          value: 0.23,
          weight: 3,
          softness: 0.01,
        },
      ],
      supporting: [{ metric: "faceRatio", op: "gt", value: 1.0, weight: 1 }],
      never: [
        { metric: "noseLengthRatio", op: "lt", value: 0.21, weight: -8 },
        { metric: "samjeongUpper", op: "lt", value: 0.17, weight: -6 },
      ],
    },
  },
  wolf: {
    id: "wolf",
    label: { ko: "늑대상", en: "Wolf", ja: "オオカミ顔" },
    impressionKeywords: ["야성미", "신비로움", "집요함", "깊이"],
    mustCues: [
      "눈꼬리가 수평 이하로 내려가면서도 눈매 자체가 날카로움",
      "얼굴이 좁고 세로로 긴 편",
    ],
    supportingCues: [
      "턱이 각지고 선명",
      "눈썹이 가늘고 짙은 편",
      "코가 높고 곧은 편",
    ],
    neverCues: ["눈꼬리가 올라감 → 여우상", "얼굴이 넓고 각짐 → 호랑이상"],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue: "늑대상은 눈꼬리 처짐, 여우상은 눈꼬리 올라감",
      },
      {
        vs: "tiger",
        decisiveCue: "늑대상은 좁고 긴 얼굴, 호랑이상은 넓은 얼굴",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "gt",
          value: 1.3,
          weight: 3,
          softness: 0.04,
        },
        {
          metric: "eyeCornerAngle",
          op: "lt",
          value: 3,
          weight: 3,
          softness: 0.5,
        },
        {
          metric: "eyeAspectRatio",
          op: "gt",
          value: 3.0,
          weight: 2,
          softness: 0.2,
        },
      ],
      supporting: [
        { metric: "philtrumRatio", op: "gt", value: 0.41, weight: 1 },
      ],
      never: [
        { metric: "eyeCornerAngle", op: "gt", value: 5, weight: -8 },
        { metric: "faceRatio", op: "lt", value: 1.1, weight: -6 },
      ],
    },
  },
  raccoon: {
    id: "raccoon",
    label: { ko: "너구리상", en: "Raccoon", ja: "タヌキ顔" },
    impressionKeywords: ["친근함", "아기자기함", "유쾌함", "허당 매력"],
    mustCues: [
      "눈 밑이 도톰하고 볼이 통통하며 가로로 넓은 얼굴 비율",
      "눈이 크고 동그란 편",
    ],
    supportingCues: [
      "전체적으로 납작한 인상",
      "입꼬리가 수평~약간 올라간 편",
      "이마가 넓고 헤어라인이 둥근 편",
    ],
    neverCues: [
      "눈 밑이 평평하고 깨끗함 → 강아지상",
      "얼굴이 세로로 긴 편 → 너구리상 아님",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue: "너구리상은 가로 넓은 얼굴, 강아지상은 더 세로로 김",
      },
      {
        vs: "panda",
        decisiveCue: "너구리상은 납작 비율, 판다상은 흑백 대비",
      },
    ],
    scoringRules: {
      must: [
        {
          metric: "faceRatio",
          op: "lt",
          value: 0.9,
          weight: 4,
          softness: 0.03,
        },
        {
          metric: "eyeSizeRatio",
          op: "between",
          value: [0.05, 0.07],
          weight: 2,
          softness: 0.005,
        },
      ],
      supporting: [
        { metric: "mouthWidthRatio", op: "gt", value: 0.35, weight: 1 },
        { metric: "philtrumRatio", op: "gt", value: 0.41, weight: 1 },
      ],
      never: [
        { metric: "faceRatio", op: "gt", value: 1.1, weight: -8 },
        { metric: "eyeCornerAngle", op: "gt", value: 7, weight: -4 },
      ],
    },
  },
};

/** 프롬프트 조립용: 12종 id 배열 (enum 강제 용도) */
export const ANIMAL_TYPE_LIST: readonly AnimalType[] = [
  "dog",
  "cat",
  "fox",
  "bear",
  "rabbit",
  "deer",
  "tiger",
  "lion",
  "panda",
  "eagle",
  "wolf",
  "raccoon",
] as const;

/**
 * FaceMetrics + 파생 지표에서 ScoringMetricKey에 해당하는 스칼라 값을 꺼낸다.
 * 스코어러와 테스트가 공유하는 단일 진리 함수.
 */
export const readScoringMetric = (
  metrics: FaceMetrics,
  key: ScoringMetricKey
): number => {
  switch (key) {
    case "faceRatio":
      return metrics.faceRatio;
    case "jawWidthRatio":
      return metrics.jawWidthRatio;
    case "jawAngularity":
      return metrics.jawAngularity;
    case "foreheadWidthRatio":
      return metrics.foreheadWidthRatio;
    case "eyeAspectRatio":
      return metrics.eyeAspectRatio;
    case "eyeCornerAngle":
      return metrics.eyeCornerAngle;
    case "eyeSpacingRatio":
      return metrics.eyeSpacingRatio;
    case "eyeSizeRatio":
      return metrics.eyeSizeRatio;
    case "noseLengthRatio":
      return metrics.noseLengthRatio;
    case "mouthWidthRatio":
      return metrics.mouthWidthRatio;
    case "philtrumRatio":
      return metrics.philtrumRatio;
    case "samjeongUpper":
      return metrics.samjeong.upper;
    case "samjeongMiddle":
      return metrics.samjeong.middle;
    case "samjeongLower":
      return metrics.samjeong.lower;
  }
};
