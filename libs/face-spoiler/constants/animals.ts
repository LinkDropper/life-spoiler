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
 */

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

interface AnimalDefinition {
  id: AnimalType;
  label: AnimalLabel;
  impressionKeywords: string[];
  /** 필수 단서 — 반드시 2개 이상 충족. 모두 물리적 관찰 지표. */
  mustCues: string[];
  /** 보조 단서 — 필수 충족 후 추가 확신. */
  supportingCues: string[];
  /** 배타 단서 — 해당 시 즉시 탈락. */
  neverCues: string[];
  /** 혼동 쌍별 결정적 구분 기준 */
  tieBreakers: Array<{
    vs: AnimalType;
    decisiveCue: string;
  }>;
}

export const ANIMAL_CATALOG: Record<AnimalType, AnimalDefinition> = {
  dog: {
    id: "dog",
    label: { ko: "강아지상", en: "Dog", ja: "イヌ顔" },
    impressionKeywords: ["친근함", "따뜻함", "신뢰", "사랑스러움"],
    mustCues: [
      "눈꼬리가 수평 이하로 내려감 (측정값 eyeCornerAngle < -2°)",
      "이목구비 전체가 둥근 곡선 — 턱선 jawAngularity < 0.4, 코끝 둥근 편, 입꼬리 수평 이상",
    ],
    supportingCues: [
      "입술이 도톰한 편 (윗입술·아랫입술 모두 두께가 있음)",
      "광대가 옆으로 퍼지지 않고 뺨 볼이 부드럽게 도드라짐",
      "이목구비 크기가 얼굴 대비 작은~보통 (eyeSizeRatio < 0.07)",
    ],
    neverCues: [
      "눈꼬리가 올라감 (eyeCornerAngle > 3°)",
      "이목구비가 얼굴 대비 크고 굵음 → 곰상 확인",
      "눈 밑 살이 도드라지게 도톰함 → 너구리상 확인",
      "얼굴이 넓고 큼 (faceRatio < 1.1 + cheekWidth 상위) → 곰상/사자상 확인",
    ],
    tieBreakers: [
      {
        vs: "bear",
        decisiveCue:
          "이목구비 크기 대 얼굴 크기 비율 — 강아지상은 이목구비가 얼굴 대비 작고 가벼움. 곰상은 이목구비 자체가 크고 굵음. 눈·코·입 모두의 크기를 비교",
      },
      {
        vs: "raccoon",
        decisiveCue:
          "눈 밑 부위(와잠) — 강아지상은 눈 밑이 평평하고 깨끗함. 너구리상은 눈 밑 살이 도드라지고 볼이 가로로 넓음. 눈 밑 도톰함 유무가 결정적",
      },
      {
        vs: "rabbit",
        decisiveCue:
          "눈꼬리 방향 — 강아지상은 눈꼬리가 확실히 아래로 처짐. 토끼상은 눈꼬리가 중립(수평)이고 눈이 더 동그랗고 이목구비가 얼굴 중앙에 밀집",
      },
    ],
  },
  cat: {
    id: "cat",
    label: { ko: "고양이상", en: "Cat", ja: "ネコ顔" },
    impressionKeywords: ["신비로움", "쿨함", "독립적", "날카로움"],
    mustCues: [
      "눈이 가로로 길고 좁음 (eyeAspectRatio > 2.5 = 세장안)",
      "눈꼬리가 살짝 올라감 (eyeCornerAngle 2°~8°, 여우상보다 완만)",
    ],
    supportingCues: [
      "얼굴형이 갸름함 (faceRatio > 1.3, jawWidthRatio < 0.8)",
      "코와 입술 선이 또렷하게 정의됨 — 코끝이 날렵하고 입술 경계가 선명",
      "광대가 옆으로 크게 돌출하지 않음 (cheekbone 평평한 편)",
    ],
    neverCues: [
      "눈이 크고 둥근 형태 (eyeAspectRatio < 2.0) → 사슴상/토끼상 확인",
      "광대가 옆으로 도드라지게 돌출 → 여우상 확인",
      "인중이 긴 편 (philtrumRatio > 0.4) + 얼굴이 세로로 긴 편 → 사슴상 확인",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "눈꼬리 각도 + 광대 돌출 — 고양이상은 눈꼬리 2°~8° 완만 상승 + 광대 평평. 여우상은 눈꼬리 > 8° 급격 상승 + 광대가 옆으로 돌출. 두 지표 모두 비교",
      },
      {
        vs: "deer",
        decisiveCue:
          "눈의 가로세로 비율 — 고양이상은 세장안(eyeAspectRatio > 2.5, 좁고 긴 눈). 사슴상은 원안(eyeAspectRatio < 2.0, 크고 둥근 눈). 이것이 가장 결정적",
      },
      {
        vs: "wolf",
        decisiveCue:
          "얼굴 너비 + 턱선 — 고양이상은 갸름하고 턱이 둥근 편. 늑대상은 얼굴이 좁고 길며(faceRatio > 1.45) 턱이 각짐(jawAngularity > 0.6)",
      },
    ],
  },
  fox: {
    id: "fox",
    label: { ko: "여우상", en: "Fox", ja: "キツネ顔" },
    impressionKeywords: ["영리함", "세련됨", "매혹적", "카리스마"],
    mustCues: [
      "눈꼬리가 뚜렷하게 올라감 (eyeCornerAngle > 8°)",
      "광대가 옆으로 돌출되어 얼굴에 입체감이 있음",
    ],
    supportingCues: [
      "턱 라인이 갸름하고 V자 — jawWidthRatio < 0.75",
      "눈 사이 거리가 좁은 편 (eyeSpacingRatio < 0.33)",
      "코가 높고 또렷한 편 (noseLengthRatio > 0.28)",
    ],
    neverCues: [
      "눈꼬리가 수평 이하로 내려감 → 여우상이 아님",
      "광대가 평평하고 얼굴이 정돈된 느낌 → 고양이상 확인",
      "얼굴이 넓고 각짐 (faceRatio < 1.2 + jawAngularity > 0.7) → 호랑이상/사자상",
    ],
    tieBreakers: [
      {
        vs: "cat",
        decisiveCue:
          "눈꼬리 각도 + 광대 — 여우상은 eyeCornerAngle > 8° + 광대 돌출. 고양이상은 eyeCornerAngle 2°~8° + 광대 평평. 눈꼬리 각도와 광대 돌출 동시 비교",
      },
      {
        vs: "wolf",
        decisiveCue:
          "눈꼬리 방향 — 여우상은 올라감(>8°). 늑대상은 내려감(<-2°)이면서 날카로움. 눈꼬리 상승/하강이 결정적",
      },
      {
        vs: "deer",
        decisiveCue:
          "눈 형태 — 여우상은 세장안(좁고 긴 눈) + 올라간 눈꼬리. 사슴상은 원안(크고 둥근 눈) + 중립~약간 올라간 눈꼬리",
      },
    ],
  },
  bear: {
    id: "bear",
    label: { ko: "곰상", en: "Bear", ja: "クマ顔" },
    impressionKeywords: ["포근함", "듬직함", "온화함", "믿음직함"],
    mustCues: [
      "얼굴이 넓음 (faceRatio < 1.25) + 이목구비가 크고 굵음 (eyeSizeRatio > 0.07, 입·코도 큰 편)",
      "턱선이 둥글고 볼 라인이 넉넉함 (jawAngularity < 0.5, jawWidthRatio > 0.8)",
    ],
    supportingCues: [
      "눈이 크고 눈꼬리 방향이 수평~약간 처짐",
      "코가 크고 넓은 편 (콧방울 포함)",
      "이마가 넓고 둥근 편",
    ],
    neverCues: [
      "이목구비가 작고 가벼움 → 강아지상 확인",
      "턱이 각지고 위엄감이 있음 → 사자상 확인",
      "얼굴이 갸름하거나 세로로 긴 편 (faceRatio > 1.35) → 곰상 아님",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue:
          "이목구비의 절대 크기 — 곰상은 눈·코·입 모두 얼굴 대비 크고 굵음. 강아지상은 이목구비가 작고 가벼움. eyeSizeRatio, mouthWidthRatio 비교",
      },
      {
        vs: "lion",
        decisiveCue:
          "턱선 형태 — 곰상은 턱이 둥글고 부드러움(jawAngularity < 0.5). 사자상은 턱이 각지고 이목구비가 또렷(jawAngularity > 0.6)",
      },
    ],
  },
  rabbit: {
    id: "rabbit",
    label: { ko: "토끼상", en: "Rabbit", ja: "ウサギ顔" },
    impressionKeywords: ["순수함", "귀여움", "청순함", "사랑스러움"],
    mustCues: [
      "눈이 크고 둥근 형태 (eyeAspectRatio < 2.0 = 원안) + 눈꼬리 중립~수평 (eyeCornerAngle -2°~3°)",
      "이목구비가 작고 아담하며 얼굴 중앙에 밀집 (mouthWidthRatio < 0.4, 코·입 모두 작은 편)",
    ],
    supportingCues: [
      "코가 작고 오뚝한 편 (noseLengthRatio < 0.28)",
      "인중이 짧은 편 (philtrumRatio < 0.3)",
      "얼굴형이 둥글고 아담 (faceRatio 1.1~1.3)",
    ],
    neverCues: [
      "인중이 길고 얼굴이 세로로 김 (philtrumRatio > 0.4 + faceRatio > 1.4) → 사슴상",
      "눈 밑에 음영이 진함 → 판다상 확인",
      "눈꼬리가 확실히 올라감 (eyeCornerAngle > 5°) → 토끼상 아님",
      "이목구비가 크고 또렷함 → 토끼상 아님",
    ],
    tieBreakers: [
      {
        vs: "deer",
        decisiveCue:
          "인중 길이 + 얼굴 세로 비율 — 토끼상은 인중 짧음(philtrumRatio < 0.3) + 둥근 얼굴(faceRatio < 1.3). 사슴상은 인중 긴 편(philtrumRatio > 0.35) + 세로로 긴 얼굴(faceRatio > 1.35). 이 두 수치가 결정적",
      },
      {
        vs: "dog",
        decisiveCue:
          "눈꼬리 방향 + 이목구비 배치 — 토끼상은 눈꼬리 중립 + 이목구비가 중앙 밀집. 강아지상은 눈꼬리 확실히 처짐 + 이목구비 분산",
      },
    ],
  },
  deer: {
    id: "deer",
    label: { ko: "사슴상", en: "Deer", ja: "シカ顔" },
    impressionKeywords: ["우아함", "청초함", "고귀함", "섬세함"],
    mustCues: [
      "얼굴형이 세로로 길고 갸름 (faceRatio > 1.35, jawWidthRatio < 0.78)",
      "눈이 크고 둥근 형태 (eyeAspectRatio < 2.0 = 원안, eyeSizeRatio > 0.065)",
    ],
    supportingCues: [
      "인중이 긴 편 (philtrumRatio > 0.35)",
      "입이 작고 단정 (mouthWidthRatio < 0.38)",
      "코가 얇고 또렷한 편",
    ],
    neverCues: [
      "눈이 좁고 긴 형태 (eyeAspectRatio > 2.5) → 고양이상 확인",
      "얼굴이 둥글고 아담 (faceRatio < 1.25) → 토끼상 확인",
      "눈꼬리가 급격히 올라감 (eyeCornerAngle > 8°) → 여우상 확인",
    ],
    tieBreakers: [
      {
        vs: "rabbit",
        decisiveCue:
          "얼굴 세로 비율 + 인중 — 사슴상은 faceRatio > 1.35 + philtrumRatio > 0.35. 토끼상은 faceRatio < 1.3 + philtrumRatio < 0.3. 수치 비교가 결정적",
      },
      {
        vs: "cat",
        decisiveCue:
          "눈 가로세로 비율 — 사슴상은 원안(eyeAspectRatio < 2.0). 고양이상은 세장안(eyeAspectRatio > 2.5). 이 수치 하나로 구분 가능",
      },
    ],
  },
  tiger: {
    id: "tiger",
    label: { ko: "호랑이상", en: "Tiger", ja: "トラ顔" },
    impressionKeywords: ["강렬함", "카리스마", "리더십", "날카로움"],
    mustCues: [
      "얼굴이 넓고 광대가 높고 옆으로 돌출 (faceRatio < 1.3, 광대 도드라짐)",
      "눈꼬리가 올라가며 눈빛이 강렬 (eyeCornerAngle > 3°) + 눈썹이 짙음",
    ],
    supportingCues: [
      "턱 라인이 각짐 (jawAngularity > 0.6)",
      "쌍꺼풀이 뚜렷한 편",
      "이목구비가 전체적으로 크고 또렷",
    ],
    neverCues: [
      "턱선이 둥글고 인상이 부드러움 (jawAngularity < 0.4) → 호랑이상 아님",
      "얼굴이 좁고 세로로 긴 편 (faceRatio > 1.45) → 늑대상 확인",
      "이목구비가 작고 가벼움 → 호랑이상 아님",
    ],
    tieBreakers: [
      {
        vs: "lion",
        decisiveCue:
          "이목구비 선의 날카로움 — 호랑이상은 눈·눈썹·턱선이 날렵하고 각짐. 사자상은 이목구비가 크고 굵지만 둥근 곡선이 섞임. 선의 날카로움 vs 둥글함",
      },
      {
        vs: "wolf",
        decisiveCue:
          "얼굴 폭 — 호랑이상은 faceRatio < 1.3 (넓은 얼굴). 늑대상은 faceRatio > 1.4 (좁고 긴 얼굴). 얼굴 가로세로 비율이 결정적",
      },
      {
        vs: "eagle",
        decisiveCue:
          "강조 부위 — 호랑이상은 광대·턱·눈매 중심. 독수리상은 이마·미간·코 중심. 얼굴의 어느 구간이 가장 도드라지는지 비교",
      },
    ],
  },
  lion: {
    id: "lion",
    label: { ko: "사자상", en: "Lion", ja: "ライオン顔" },
    impressionKeywords: ["위풍당당함", "풍채", "존재감", "웅장함"],
    mustCues: [
      "이목구비가 크고 또렷 (eyeSizeRatio > 0.07, mouthWidthRatio > 0.42) + 얼굴이 넓음 (faceRatio < 1.25)",
      "턱·광대가 도드라지며 각진 편 (jawAngularity > 0.5, 광대 돌출)",
    ],
    supportingCues: [
      "눈썹이 두껍고 진한 편",
      "코가 크고 콧방울이 넓은 편",
      "얼굴 전체에서 중정(눈~코)이 발달",
    ],
    neverCues: [
      "턱이 둥글고 부드러움 (jawAngularity < 0.4) → 곰상 확인",
      "이목구비가 작거나 얼굴이 갸름 → 사자상 아님",
      "이목구비 선이 날카롭고 날렵 → 호랑이상 확인",
    ],
    tieBreakers: [
      {
        vs: "tiger",
        decisiveCue:
          "이목구비의 굵기 — 사자상은 이목구비가 굵고 큰 볼륨. 호랑이상은 이목구비 선이 날카롭고 날렵. 굵기 vs 날카로움",
      },
      {
        vs: "bear",
        decisiveCue:
          "턱선 + 광대 — 사자상은 턱이 각지고(jawAngularity > 0.5) 광대가 돌출. 곰상은 턱이 둥글고(jawAngularity < 0.5) 볼이 넉넉",
      },
    ],
  },
  panda: {
    id: "panda",
    label: { ko: "판다상", en: "Panda", ja: "パンダ顔" },
    impressionKeywords: ["사랑스러움", "유니크함", "눈에 띔", "익살스러움"],
    mustCues: [
      "눈이 크고 눈 주변이 강조됨 (eyeSizeRatio > 0.07, 눈 밑 음영이나 눈 크기가 도드라짐)",
      "이목구비의 명암 대비가 강함 — 밝은 피부 + 진한 눈·눈썹 색의 대비",
    ],
    supportingCues: [
      "볼이 둥글고 통통한 편",
      "얼굴 윤곽이 둥근 편 (faceRatio < 1.3)",
      "눈 밑 부위가 어두운 음영 또는 도톰함",
    ],
    neverCues: [
      "눈 주변이 밋밋하고 명암 대비가 약함 → 판다상 아님",
      "얼굴 비율이 납작하고 가로가 넓음 → 너구리상 확인",
      "눈이 맑고 동그랗되 음영 없음 → 토끼상 확인",
    ],
    tieBreakers: [
      {
        vs: "raccoon",
        decisiveCue:
          "명암 대비 vs 얼굴 비율 — 판다상은 흑백 대비가 강하고 눈 주변이 도드라짐. 너구리상은 대비보다 얼굴이 가로로 넓고 납작한 비율(faceRatio < 1.15)이 핵심",
      },
      {
        vs: "rabbit",
        decisiveCue:
          "눈 밑 음영 — 판다상은 눈 밑에 음영·어둠이 있음. 토끼상은 눈 밑이 깨끗하고 맑음",
      },
    ],
  },
  eagle: {
    id: "eagle",
    label: { ko: "독수리상", en: "Eagle", ja: "ワシ顔" },
    impressionKeywords: ["예리함", "통찰력", "냉철함", "고고함"],
    mustCues: [
      "이마·미간 구간이 강조됨 — 삼정 상정 비율이 높음 (samjeong.upper > 0.36) 또는 미간 골이 깊음",
      "코가 높고 길며 날렵 (noseLengthRatio > 0.30)",
    ],
    supportingCues: [
      "측면 윤곽이 날카롭고 각짐",
      "눈이 깊게 들어간 편 (눈두덩이 깊음)",
      "입이 작고 닫힌 느낌 (mouthWidthRatio < 0.38)",
    ],
    neverCues: [
      "이마·미간이 평범하고 코가 짧은 편 → 독수리상 아님",
      "얼굴이 넓고 광대가 크며 눈이 강렬 → 호랑이상 확인",
      "눈꼬리 처짐 + 좁고 긴 얼굴 → 늑대상 확인",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue:
          "강조 구간 — 독수리상은 삼정 상정(이마~미간)이 강조. 늑대상은 중정~하정(눈매·턱)이 강조. 얼굴의 어느 세로 구간이 도드라지는지 비교",
      },
      {
        vs: "tiger",
        decisiveCue:
          "코 길이 + 이마 비율 — 독수리상은 코가 길고(noseLengthRatio > 0.30) 이마가 넓음. 호랑이상은 광대가 넓고 턱이 각짐. 코·이마 vs 광대·턱",
      },
    ],
  },
  wolf: {
    id: "wolf",
    label: { ko: "늑대상", en: "Wolf", ja: "オオカミ顔" },
    impressionKeywords: ["야성미", "신비로움", "집요함", "깊이"],
    mustCues: [
      "눈꼬리가 내려가면서도 눈매 자체가 날카로움 (eyeCornerAngle < -2° + eyeAspectRatio > 2.3)",
      "얼굴이 좁고 세로로 긴 편 (faceRatio > 1.4, jawWidthRatio < 0.8)",
    ],
    supportingCues: [
      "턱이 각지고 선명 (jawAngularity > 0.5)",
      "눈썹이 가늘고 짙은 편",
      "코가 높고 곧은 편",
    ],
    neverCues: [
      "눈꼬리가 올라감 (eyeCornerAngle > 3°) → 여우상 확인",
      "눈꼬리가 처지되 인상이 부드럽고 곡선 위주 → 강아지상 확인",
      "얼굴이 넓고 각짐 (faceRatio < 1.25) → 호랑이상 확인",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "눈꼬리 방향 — 늑대상은 eyeCornerAngle < -2°(처짐). 여우상은 eyeCornerAngle > 8°(올라감). 이 수치 하나로 구분",
      },
      {
        vs: "tiger",
        decisiveCue:
          "얼굴 가로세로 비율 — 늑대상은 faceRatio > 1.4 (좁고 김). 호랑이상은 faceRatio < 1.3 (넓음). 수치 비교가 결정적",
      },
      {
        vs: "dog",
        decisiveCue:
          "눈매의 형태 — 늑대상은 처진 눈꼬리 + 세장안(좁고 긴 눈). 강아지상은 처진 눈꼬리 + 원안~보통(둥근 눈). eyeAspectRatio 비교",
      },
    ],
  },
  raccoon: {
    id: "raccoon",
    label: { ko: "너구리상", en: "Raccoon", ja: "タヌキ顔" },
    impressionKeywords: ["친근함", "아기자기함", "유쾌함", "허당 매력"],
    mustCues: [
      "눈 밑이 도톰하고 볼이 통통하며 가로로 넓은 얼굴 비율 (faceRatio < 1.2)",
      "눈이 크고 동그란 편 (eyeAspectRatio < 2.2) + 눈 밑 부위가 도드라짐",
    ],
    supportingCues: [
      "전체적으로 납작한 인상 — 코가 높지 않고 이목구비가 얼굴 표면에 가까움",
      "입꼬리가 수평~약간 올라간 편",
      "이마가 넓고 헤어라인이 둥근 편",
    ],
    neverCues: [
      "눈 밑이 평평하고 깨끗함 → 강아지상 확인",
      "이목구비 명암 대비가 강하고 눈 주변이 어두움 → 판다상 확인",
      "얼굴이 세로로 긴 편 (faceRatio > 1.35) → 너구리상 아님",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue:
          "눈 밑 + 얼굴 비율 — 너구리상은 눈 밑이 도톰하고 얼굴이 가로로 넓음(faceRatio < 1.2). 강아지상은 눈 밑 평평하고 얼굴이 더 세로로 김",
      },
      {
        vs: "panda",
        decisiveCue:
          "핵심 특징 — 너구리상은 얼굴의 납작한 비율(faceRatio)이 핵심. 판다상은 이목구비의 흑백 대비가 핵심. 비율 vs 대비",
      },
    ],
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
