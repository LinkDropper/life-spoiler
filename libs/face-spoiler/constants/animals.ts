/**
 * 관상스포(Face Spoiler) 동물상 12종 카탈로그.
 *
 * 한국 대중문화에서 통용되는 대표 12종을 관상학적 부위 조합으로 매핑한
 * 상수 테이블이다. Phase 1 (gwansang-expert) 자문 결과를 근거로 작성됨:
 * `specs/face-spoiler-improvement/01-prompt-validation-and-animal-mapping.md`
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
  | "deer"
  | "rabbit"
  | "bear"
  | "tiger"
  | "wolf"
  | "horse"
  | "hamster"
  | "owl"
  | "monkey";

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
  /** AI가 이미지에서 관찰해야 할 부위 조합 힌트 (일상 표현, 한자 금지) */
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
 * 각 항목의 `regionCues`와 `tieBreakers`는 Phase 1 §2 매핑 테이블의
 * "AI 분류 시각 가이드" + "혼동 쌍 매트릭스"를 1~2줄로 압축한 것이다.
 * 프롬프트 조립 시 이 데이터를 그대로 문자열로 직렬화해 주입한다.
 */
export const ANIMAL_CATALOG: Record<AnimalType, AnimalDefinition> = {
  dog: {
    id: "dog",
    label: { ko: "강아지상", en: "Dog", ja: "イヌ顔" },
    impressionKeywords: ["친근", "온기", "수용", "편안함", "진심"],
    regionCues: [
      "둥근 얼굴 윤곽",
      "크고 둥근 눈",
      "자연스럽게 올라간 입꼬리",
      "둥근 코끝",
    ],
    tieBreakers: [
      {
        vs: "bear",
        decisiveCue:
          "이목구비 두께감 — 강아지상은 경계가 부드럽고 가볍게, 곰상은 굵고 두껍게 드러남",
      },
      {
        vs: "hamster",
        decisiveCue:
          "볼의 도드라짐 — 햄스터상은 볼이 통통하며 이목구비가 중앙으로 모임, 강아지상은 얼굴 전체가 균등하게 둥긂",
      },
    ],
  },
  cat: {
    id: "cat",
    label: { ko: "고양이상", en: "Cat", ja: "ネコ顔" },
    impressionKeywords: ["시크", "독립", "섬세", "예리", "자기중심"],
    regionCues: [
      "하관이 좁아지는 역삼각/다이아몬드 윤곽",
      "올라간 눈꼬리와 또렷한 아몬드형 눈",
      "곧은 콧대와 살짝 뾰족한 코끝",
      "작거나 단정한 입",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "눈매 길이 — 고양이상은 아몬드형으로 정제되고, 여우상은 더 가늘게 찢어지며 입꼬리에 장난기가 섞임",
      },
      {
        vs: "deer",
        decisiveCue:
          "눈 사이 거리 — 고양이상은 길고 좁은 편, 사슴상은 크고 둥근 눈에 눈 사이가 넓음",
      },
    ],
  },
  fox: {
    id: "fox",
    label: { ko: "여우상", en: "Fox", ja: "キツネ顔" },
    impressionKeywords: ["매혹", "영민", "장난기", "재치", "화술"],
    regionCues: [
      "갸름한 역삼각 윤곽",
      "가로로 긴 가는 눈매와 뚜렷이 올라간 눈꼬리",
      "가는 콧대와 살짝 뾰족한 코끝",
      "옆으로 드러난 광대",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue:
          "얼굴 선의 결 — 여우상은 가는 선 중심이고, 늑대상은 각진 선과 진한 눈썹이 지배적",
      },
      {
        vs: "monkey",
        decisiveCue:
          "표정의 움직임 — 여우상은 차분하고 가는 눈매, 원숭이상은 활발하고 둥근 눈에 표정 변화가 풍부",
      },
    ],
  },
  deer: {
    id: "deer",
    label: { ko: "사슴상", en: "Deer", ja: "シカ顔" },
    impressionKeywords: ["순수", "청량", "이상", "여림", "우아"],
    regionCues: [
      "세로로 긴 얼굴 윤곽",
      "크고 둥근 눈과 넓은 미간",
      "가는 콧대와 살짝 뾰족한 코끝",
      "얇거나 정제된 입술",
    ],
    tieBreakers: [
      {
        vs: "rabbit",
        decisiveCue:
          "얼굴 세로 길이와 인중 — 사슴상은 긴 얼굴과 긴 인중, 토끼상은 둥근 얼굴과 짧은 인중",
      },
      {
        vs: "horse",
        decisiveCue:
          "눈 크기와 전체 인상 — 사슴상은 눈이 크고 여리며, 말상은 눈이 중간이고 단단한 에너지가 강함",
      },
    ],
  },
  rabbit: {
    id: "rabbit",
    label: { ko: "토끼상", en: "Rabbit", ja: "ウサギ顔" },
    impressionKeywords: ["귀염", "순발", "보호욕", "호기심", "천진"],
    regionCues: [
      "둥글고 짧은 얼굴 윤곽",
      "크고 동그랗게 열린 눈",
      "짧은 인중과 작고 도톰한 입",
      "둥근 턱",
    ],
    tieBreakers: [
      {
        vs: "hamster",
        decisiveCue:
          "눈 크기 — 토끼상은 눈이 상대적으로 크고, 햄스터상은 눈이 작으며 볼이 특히 통통함",
      },
      {
        vs: "deer",
        decisiveCue:
          "얼굴형 기조 — 토끼상은 둥글고 짧으며 이목구비가 모여 있고, 사슴상은 세로로 긴 얼굴에 이목구비 간격이 여유로움",
      },
    ],
  },
  bear: {
    id: "bear",
    label: { ko: "곰상", en: "Bear", ja: "クマ顔" },
    impressionKeywords: ["듬직", "포용", "느긋", "신뢰", "안정"],
    regionCues: [
      "얼굴 전체가 크고 이목구비가 굵음",
      "진하고 굵은 눈썹",
      "크고 둥근 코와 넓은 콧방울",
      "넓고 두꺼운 턱",
    ],
    tieBreakers: [
      {
        vs: "tiger",
        decisiveCue:
          "눈빛과 광대의 결 — 곰상은 눈빛이 순하고 광대가 부드러움, 호랑이상은 눈빛이 강하고 광대가 또렷하게 솟음",
      },
      {
        vs: "dog",
        decisiveCue:
          "이목구비 두께감 — 곰상은 이목구비가 굵고 윤곽이 두꺼움, 강아지상은 부드럽고 경계가 가벼움",
      },
    ],
  },
  tiger: {
    id: "tiger",
    label: { ko: "호랑이상", en: "Tiger", ja: "トラ顔" },
    impressionKeywords: ["카리스마", "추진", "권위", "결단", "위엄"],
    regionCues: [
      "넓고 각진 얼굴 윤곽",
      "진하고 굵은 눈썹이 살짝 올라감",
      "또렷하고 강한 눈빛",
      "앞쪽으로 솟은 광대",
    ],
    tieBreakers: [
      {
        vs: "wolf",
        decisiveCue:
          "얼굴 기조 — 호랑이상은 넓고 각지며 광대가 옆으로 크고, 늑대상은 더 좁고 길며 턱이 V형",
      },
      {
        vs: "bear",
        decisiveCue:
          "눈빛 강도 — 호랑이상은 눈빛이 강하고 선명, 곰상은 눈빛이 순함",
      },
    ],
  },
  wolf: {
    id: "wolf",
    label: { ko: "늑대상", en: "Wolf", ja: "オオカミ顔" },
    impressionKeywords: ["예리", "독립", "집중", "야성", "냉정"],
    regionCues: [
      "길고 좁은 얼굴 윤곽",
      "진하고 직선적인 눈썹",
      "가늘고 길며 날카로운 눈매",
      "곧은 긴 콧대와 V형 하관",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "얼굴 선의 결 — 늑대상은 각진 선과 진한 눈썹이 강조, 여우상은 가는 선 중심",
      },
      {
        vs: "tiger",
        decisiveCue:
          "얼굴 폭 — 늑대상은 좁고 길며 V턱, 호랑이상은 넓고 각지며 광대가 옆으로 큼",
      },
    ],
  },
  horse: {
    id: "horse",
    label: { ko: "말상", en: "Horse", ja: "ウマ顔" },
    impressionKeywords: ["열정", "에너지", "직진", "성실", "활기"],
    regionCues: [
      "세로로 매우 긴 얼굴 윤곽",
      "넓고 긴 이마",
      "길고 곧은 코",
      "긴 인중",
    ],
    tieBreakers: [
      {
        vs: "deer",
        decisiveCue:
          "눈과 전체 인상 — 말상은 눈이 중간 크기에 에너지가 단단하고, 사슴상은 크고 둥근 눈에 여린 인상",
      },
      {
        vs: "wolf",
        decisiveCue:
          "하관의 날카로움 — 말상은 하관이 뾰족하지 않고 길게 흐르며, 늑대상은 V형으로 각짐",
      },
    ],
  },
  hamster: {
    id: "hamster",
    label: { ko: "햄스터상", en: "Hamster", ja: "ハムスター顔" },
    impressionKeywords: ["앙증", "천진", "온화", "부드러움", "편안"],
    regionCues: [
      "둥글고 하단이 통통한 얼굴",
      "도드라진 볼과 중앙으로 모인 이목구비",
      "작고 짧은 코",
      "작고 도톰한 입과 짧은 둥근 턱",
    ],
    tieBreakers: [
      {
        vs: "rabbit",
        decisiveCue:
          "눈 크기 — 햄스터상은 눈이 작고 볼이 특히 통통, 토끼상은 눈이 크고 얼굴이 균등하게 둥긂",
      },
      {
        vs: "dog",
        decisiveCue:
          "이목구비 분포 — 햄스터상은 볼이 도드라지고 이목구비가 상대적으로 작음, 강아지상은 이목구비가 비교적 크고 균등",
      },
    ],
  },
  owl: {
    id: "owl",
    label: { ko: "부엉이상", en: "Owl", ja: "フクロウ顔" },
    impressionKeywords: ["관조", "지성", "신비", "고요", "통찰"],
    regionCues: [
      "둥글거나 살짝 넓은 원형/계란형 윤곽",
      "넓고 높은 이마",
      "크고 둥근 눈에 넓은 미간",
      "깊고 차분한 눈빛",
    ],
    tieBreakers: [
      {
        vs: "deer",
        decisiveCue:
          "얼굴 세로 길이 — 부엉이상은 둥글고 짧은 원형, 사슴상은 세로로 긴 장형",
      },
      {
        vs: "cat",
        decisiveCue:
          "눈 모양과 미간 — 부엉이상은 둥근 눈과 넓은 미간, 고양이상은 아몬드형 눈과 좁은 미간",
      },
    ],
  },
  monkey: {
    id: "monkey",
    label: { ko: "원숭이상", en: "Monkey", ja: "サル顔" },
    impressionKeywords: ["재치", "영리", "사교", "표현", "적응"],
    regionCues: [
      "다이아몬드/역삼각 중간 크기 윤곽",
      "또렷하고 도드라진 광대",
      "움직임이 많고 반짝이는 눈빛",
      "표현이 풍부한 입꼬리",
    ],
    tieBreakers: [
      {
        vs: "fox",
        decisiveCue:
          "눈 모양과 표정 — 원숭이상은 둥근 눈에 활발한 표정 움직임, 여우상은 가는 눈매에 차분한 영민함",
      },
      {
        vs: "cat",
        decisiveCue:
          "표정 생동감 — 원숭이상은 표정 변화가 풍부하고 입이 큼, 고양이상은 정제되고 입이 작음",
      },
    ],
  },
};

/** 프롬프트 조립용: 12종 id 배열 (enum 강제 용도) */
export const ANIMAL_TYPE_LIST: readonly AnimalType[] = [
  "dog",
  "cat",
  "fox",
  "deer",
  "rabbit",
  "bear",
  "tiger",
  "wolf",
  "horse",
  "hamster",
  "owl",
  "monkey",
] as const;
