/**
 * 관상스포(Face Spoiler) 동물상 12종 카탈로그.
 *
 * 한국 대중문화에서 통용되는 대표 12종을 얼굴 특징 기반으로 매핑한 상수 테이블.
 * 기준 원본: `a.md` (유저 확정 동물상 스펙)
 *
 * 사용 원칙
 * - 동물상은 **시각적 인상의 은유**이며 인종·민족·국적·외모 등급과 무관하다.
 * - 매칭은 반드시 **2개 이상 부위 조합** 근거. 단일 부위(예: "큰 눈 = 강아지") 금지.
 * - 동물상 라벨은 텍스트로만 노출. 아이콘/이모지 필드는 의도적으로 두지 않는다.
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
  /** 내부 식별자 (AnimalType과 동일) */
  id: AnimalType;
  /** 다국어 라벨. UI 노출용 */
  label: AnimalLabel;
  /** 인상 키워드 3~5개. 톤/분위기 묘사에 사용 */
  impressionKeywords: string[];
  /** AI가 이미지에서 관찰해야 할 얼굴 특징 (일상 표현, 한자 금지) */
  regionCues: string[];
  /** 혼동 쌍별 결정적 구분 기준 ("vs 대상" 관점) */
  tieBreakers: Array<{
    vs: AnimalType;
    decisiveCue: string;
  }>;
}

/**
 * 12종 동물상 카탈로그.
 *
 * 각 항목의 `regionCues`와 `tieBreakers`는 a.md 스펙의 얼굴 특징을
 * 기반으로 AI 분류 힌트와 혼동 쌍 구분 기준을 정의한 것이다.
 */
export const ANIMAL_CATALOG: Record<AnimalType, AnimalDefinition> = {
  dog: {
    id: "dog",
    label: { ko: "강아지상", en: "Dog", ja: "イヌ顔" },
    impressionKeywords: ["친근함", "따뜻함", "신뢰", "사랑스러움"],
    regionCues: [
      "둥글고 부드러운 전체 윤곽",
      "처진 듯 부드러운 눈꼬리",
      "도톰하고 넉넉한 입술",
      "광대보다 뺨이 도드라지는 얼굴",
    ],
    tieBreakers: [
      {
        vs: "bear",
        decisiveCue:
          "전체 크기감 — 강아지상은 이목구비가 부드럽고 가벼운 느낌, 곰상은 얼굴 전체가 크고 이목구비가 굵고 두꺼움",
      },
      {
        vs: "raccoon",
        decisiveCue:
          "표정 인상 — 강아지상은 감정이 솔직하게 드러나며, 너구리상은 눈 밑이 도톰하고 볼이 통통하며 익살스러운 느낌",
      },
    ],
  },
  cat: {
    id: "cat",
    label: { ko: "고양이상", en: "Cat", ja: "ネコ顔" },
    impressionKeywords: ["신비로움", "쿨함", "독립적", "날카로움"],
    regionCues: [
      "올라간 눈꼬리",
      "상대적으로 좁고 긴 눈 형태",
      "또렷하게 정의된 코와 입술 선",
      "갸름하거나 삼각형에 가까운 얼굴형",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "분위기 차이 — 고양이상은 감정을 드러내지 않는 도도함, 여우상은 영리하고 사로잡는 매혹적인 느낌",
      },
      {
        vs: "deer",
        decisiveCue:
          "눈의 크기와 느낌 — 고양이상은 좁고 날카로운 눈, 사슴상은 크고 선명한 눈에 순수한 느낌",
      },
    ],
  },
  fox: {
    id: "fox",
    label: { ko: "여우상", en: "Fox", ja: "キツネ顔" },
    impressionKeywords: ["영리함", "세련됨", "매혹적", "카리스마"],
    regionCues: [
      "눈꼬리가 뚜렷하게 올라가 있음",
      "광대가 살짝 튀어나온 편",
      "갸름한 턱 라인",
      "눈 사이 거리가 적당히 좁은 편",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue:
          "눈매의 방향 — 여우상은 눈꼬리가 올라가며 매혹적, 늑대상은 처진 듯하면서도 날카롭고 강렬함",
      },
      {
        vs: "cat",
        decisiveCue:
          "광대와 카리스마 — 여우상은 광대가 도드라지고 지적인 카리스마, 고양이상은 얼굴선이 정돈되고 차분한 시크함",
      },
    ],
  },
  bear: {
    id: "bear",
    label: { ko: "곰상", en: "Bear", ja: "クマ顔" },
    impressionKeywords: ["포근함", "듬직함", "온화함", "믿음직함"],
    regionCues: [
      "넓고 둥근 얼굴형",
      "크고 부드러운 눈",
      "두툼하고 넉넉한 볼 라인",
      "뚜렷한 광대보다 전체적 볼륨감이 앞서는 얼굴",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue:
          "이목구비 크기감 — 곰상은 얼굴 전체가 크고 이목구비가 굵고 두꺼움, 강아지상은 이목구비가 부드럽고 가벼움",
      },
      {
        vs: "lion",
        decisiveCue:
          "인상의 결 — 곰상은 부드럽고 포근한 느낌, 사자상은 위엄이 있고 당당한 느낌",
      },
    ],
  },
  rabbit: {
    id: "rabbit",
    label: { ko: "토끼상", en: "Rabbit", ja: "ウサギ顔" },
    impressionKeywords: ["순수함", "귀여움", "청순함", "사랑스러움"],
    regionCues: [
      "전체적으로 작고 아담한 이목구비",
      "크고 동그란 눈",
      "오뚝하고 작은 코",
      "얇고 예쁜 입술 선",
    ],
    tieBreakers: [
      {
        vs: "deer",
        decisiveCue:
          "얼굴형 — 토끼상은 둥글고 아담한 얼굴에 이목구비가 모여 있음, 사슴상은 세로로 길고 갸름한 얼굴에 인중이 긴 편",
      },
      {
        vs: "panda",
        decisiveCue:
          "눈 주변 — 토끼상은 맑고 동그란 눈, 판다상은 눈 주변이 특히 강조되며 흑백 대비가 강함",
      },
    ],
  },
  deer: {
    id: "deer",
    label: { ko: "사슴상", en: "Deer", ja: "シカ顔" },
    impressionKeywords: ["우아함", "청초함", "고귀함", "섬세함"],
    regionCues: [
      "세로로 길고 갸름한 얼굴형",
      "크고 선명한 눈 (주로 쌍꺼풀 있거나 큰 눈)",
      "긴 인중",
      "작고 단정한 입",
    ],
    tieBreakers: [
      {
        vs: "rabbit",
        decisiveCue:
          "얼굴 세로 길이 — 사슴상은 세로로 긴 얼굴과 긴 인중, 토끼상은 둥글고 아담한 얼굴과 짧은 인중",
      },
      {
        vs: "cat",
        decisiveCue:
          "눈의 느낌 — 사슴상은 크고 맑은 순수한 눈, 고양이상은 좁고 날카로운 시크한 눈",
      },
    ],
  },
  tiger: {
    id: "tiger",
    label: { ko: "호랑이상", en: "Tiger", ja: "トラ顔" },
    impressionKeywords: ["강렬함", "카리스마", "리더십", "날카로움"],
    regionCues: [
      "눈매가 날카롭고 강한 눈빛",
      "뚜렷한 쌍꺼풀과 짙은 눈썹",
      "높고 단단한 광대",
      "각진 턱 라인",
    ],
    tieBreakers: [
      {
        vs: "lion",
        decisiveCue:
          "인상의 방향 — 호랑이상은 날카롭고 날렵한 카리스마, 사자상은 넓고 웅장한 위엄",
      },
      {
        vs: "wolf",
        decisiveCue:
          "얼굴 폭 — 호랑이상은 넓고 각지며 광대가 옆으로 큼, 늑대상은 좁고 긴 얼굴에 처진 듯 날카로운 눈매",
      },
    ],
  },
  lion: {
    id: "lion",
    label: { ko: "사자상", en: "Lion", ja: "ライオン顔" },
    impressionKeywords: ["위풍당당함", "풍채", "존재감", "웅장함"],
    regionCues: [
      "넓고 각진 얼굴형",
      "두꺼운 눈썹",
      "도드라지는 광대와 턱",
      "또렷하고 큰 이목구비",
    ],
    tieBreakers: [
      {
        vs: "tiger",
        decisiveCue:
          "카리스마의 결 — 사자상은 넉넉하고 웅장한 위엄, 호랑이상은 날카롭고 집중적인 강렬함",
      },
      {
        vs: "bear",
        decisiveCue:
          "인상의 무게 — 사자상은 압도적 존재감과 위엄, 곰상은 부드럽고 포근한 느낌",
      },
    ],
  },
  panda: {
    id: "panda",
    label: { ko: "판다상", en: "Panda", ja: "パンダ顔" },
    impressionKeywords: ["사랑스러움", "유니크함", "눈에 띔", "익살스러움"],
    regionCues: [
      "눈 주변이 강조되는 인상 (눈 밑 음영이나 눈 크기가 도드라짐)",
      "둥글고 포동포동한 볼",
      "전체적으로 흑백 대비가 강한 이목구비",
      "둥근 얼굴 윤곽",
    ],
    tieBreakers: [
      {
        vs: "raccoon",
        decisiveCue:
          "전체 인상 — 판다상은 흑백 대비가 강하고 독특한 귀여움, 너구리상은 납작하고 친근한 비율에 익살스러움",
      },
      {
        vs: "rabbit",
        decisiveCue:
          "눈 주변 강조 — 판다상은 눈 밑 음영·크기가 특히 두드러짐, 토끼상은 맑고 동그란 눈에 음영 없음",
      },
    ],
  },
  eagle: {
    id: "eagle",
    label: { ko: "독수리상", en: "Eagle", ja: "ワシ顔" },
    impressionKeywords: ["예리함", "통찰력", "냉철함", "고고함"],
    regionCues: [
      "깊게 패인 미간",
      "눈 위 이마 라인이 강조된 인상",
      "높고 날렵한 코",
      "날카롭게 각진 측면 윤곽",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue:
          "눈과 이마 — 독수리상은 이마와 미간이 특히 강조되고 관찰자 느낌, 늑대상은 눈매 자체가 처진 듯 날카롭고 집요한 느낌",
      },
      {
        vs: "tiger",
        decisiveCue:
          "인상의 온도 — 독수리상은 차갑고 고지식한 지성파, 호랑이상은 뜨겁고 강렬한 실행파",
      },
    ],
  },
  wolf: {
    id: "wolf",
    label: { ko: "늑대상", en: "Wolf", ja: "オオカミ顔" },
    impressionKeywords: ["야성미", "신비로움", "집요함", "깊이"],
    regionCues: [
      "약간 처진 듯하면서도 날카로운 눈매",
      "좁고 긴 얼굴 윤곽",
      "가늘고 짙은 눈썹",
      "선명하고 각진 턱",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "눈매 방향 — 늑대상은 아래 눈꼬리가 내려가며 강렬함, 여우상은 눈꼬리가 올라가며 매혹적",
      },
      {
        vs: "tiger",
        decisiveCue:
          "얼굴 폭과 눈 — 늑대상은 좁고 긴 얼굴에 처진 듯 날카로운 눈, 호랑이상은 넓고 각진 얼굴에 올라간 강한 눈빛",
      },
    ],
  },
  raccoon: {
    id: "raccoon",
    label: { ko: "너구리상", en: "Raccoon", ja: "タヌキ顔" },
    impressionKeywords: ["친근함", "아기자기함", "유쾌함", "허당 매력"],
    regionCues: [
      "눈이 크고 동그라며 눈 밑이 도톰한 인상",
      "볼이 통통하고 부드러운 윤곽",
      "전체적으로 납작하고 친근한 비율",
      "밉지 않은 무해한 인상",
    ],
    tieBreakers: [
      {
        vs: "dog",
        decisiveCue:
          "볼과 눈 밑 — 너구리상은 볼이 통통하고 눈 밑이 도톰하며 익살스러움, 강아지상은 전체가 균등하게 둥글고 따뜻함",
      },
      {
        vs: "panda",
        decisiveCue:
          "얼굴 비율 — 너구리상은 납작하고 친근한 비율, 판다상은 흑백 대비가 강하고 눈 주변이 특히 도드라짐",
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
