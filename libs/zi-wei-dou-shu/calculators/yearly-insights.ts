import { EARTHLY_BRANCHES } from "../constants";
import type { BranchIndex, Palace, StemIndex, ZiweiChart } from "../types";
import type { Locale } from "@/i18n/config";

import {
  calculateYearlySihua,
  calculateYearlyPalaces,
  calculateYearlyPeachBlossom,
  calculateMonthlyFortunes,
  getYearStemBranch,
  type YearlySihua,
  type YearlyPalaceInfo,
  type YearlyPeachBlossomInfo,
  type MonthlyFortune,
} from "./yearly";

// ============================================================
// 타입 정의
// ============================================================

/** 최고의 달/조심할 달 */
export interface MonthInsight {
  month: number;
  score: number;
  reason: string;
}

/** 재물 공략 */
export interface WealthStrategy {
  /** 핵심 전략 */
  mainStrategy: string;
  /** 추천 분야 */
  recommendedAreas: string[];
  /** 주의사항 */
  cautions: string[];
  /** 재물운 점수 (0-100) */
  score: number;
}

/** 연애 모드 */
export interface RomanceMode {
  /** 모드 이름 */
  mode: string;
  /** 설명 */
  description: string;
  /** 조언 */
  advice: string;
  /** 연애운 점수 (0-100) */
  score: number;
  /** 도화 활성화 여부 */
  isPeachBlossomActive: boolean;
}

/** 행운의 장소 */
export interface LuckyPlace {
  /** 방위 */
  direction: string;
  /** 추천 장소 유형 */
  placeTypes: string[];
  /** 이유 */
  reason: string;
}

/** 귀인 (맞는 띠) */
export interface NobleHelper {
  /** 삼합 귀인 (최고 궁합) */
  samhap: {
    animals: string[];
    branches: string[];
    description: string;
  };
  /** 육합 귀인 (짝꿍 궁합) */
  yukhap: {
    animal: string;
    branch: string;
    description: string;
  };
}

/** 건강 주의사항 */
export interface HealthWarning {
  /** 주의 부위/증상 */
  concerns: string[];
  /** 예방 조언 */
  preventions: string[];
  /** 건강운 점수 (0-100) */
  score: number;
}

/** 행운의 색상 */
export interface LuckyColor {
  /** 메인 색상 */
  primary: string;
  /** 보조 색상 */
  secondary: string;
  /** 오행 */
  element: string;
  /** 이유 */
  reason: string;
}

/** 연간 인사이트 종합 */
export interface YearlyInsights {
  year: number;
  /** 최고의 달 (상위 3개) */
  bestMonths: MonthInsight[];
  /** 조심할 달 (하위 3개) */
  cautionMonths: MonthInsight[];
  /** 재물 공략 */
  wealthStrategy: WealthStrategy;
  /** 연애 모드 */
  romanceMode: RomanceMode;
  /** 행운의 장소 */
  luckyPlaces: LuckyPlace[];
  /** 나의 귀인 */
  nobleHelper: NobleHelper;
  /** 건강 주의 */
  healthWarning: HealthWarning;
  /** 행운의 색상 */
  luckyColor: LuckyColor;
}

// ============================================================
// 다국어 텍스트 타입
// ============================================================

interface I18nText {
  ko: string;
  en: string;
  ja: string;
}

const t = (text: I18nText, locale: Locale): string => text[locale];

// ============================================================
// 상수 정의 (다국어)
// ============================================================

/** 천간 → 오행 매핑 */
const STEM_TO_ELEMENT: Record<StemIndex, string> = {
  0: "목",
  1: "목",
  2: "화",
  3: "화",
  4: "토",
  5: "토",
  6: "금",
  7: "금",
  8: "수",
  9: "수",
};

/** 오행 이름 다국어 */
const ELEMENT_NAMES: Record<string, I18nText> = {
  목: { ko: "목", en: "Wood", ja: "木" },
  화: { ko: "화", en: "Fire", ja: "火" },
  토: { ko: "토", en: "Earth", ja: "土" },
  금: { ko: "금", en: "Metal", ja: "金" },
  수: { ko: "수", en: "Water", ja: "水" },
};

/** 오행 → 색상 매핑 (다국어) */
const ELEMENT_TO_COLORS: Record<
  string,
  { primary: I18nText; secondary: I18nText }
> = {
  목: {
    primary: { ko: "초록색", en: "Green", ja: "緑色" },
    secondary: { ko: "청색", en: "Blue-green", ja: "青色" },
  },
  화: {
    primary: { ko: "빨간색", en: "Red", ja: "赤色" },
    secondary: { ko: "주황색", en: "Orange", ja: "オレンジ色" },
  },
  토: {
    primary: { ko: "노란색", en: "Yellow", ja: "黄色" },
    secondary: { ko: "갈색", en: "Brown", ja: "茶色" },
  },
  금: {
    primary: { ko: "흰색", en: "White", ja: "白色" },
    secondary: { ko: "금색", en: "Gold", ja: "金色" },
  },
  수: {
    primary: { ko: "검은색", en: "Black", ja: "黒色" },
    secondary: { ko: "파란색", en: "Blue", ja: "青色" },
  },
};

/** 오행 상생 관계 */
const ELEMENT_GENERATES: Record<string, string> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

/** 지지 → 띠 동물 (다국어) */
const BRANCH_TO_ANIMAL: Record<BranchIndex, I18nText> = {
  0: { ko: "쥐", en: "Rat", ja: "子（ねずみ）" },
  1: { ko: "소", en: "Ox", ja: "丑（うし）" },
  2: { ko: "호랑이", en: "Tiger", ja: "寅（とら）" },
  3: { ko: "토끼", en: "Rabbit", ja: "卯（うさぎ）" },
  4: { ko: "용", en: "Dragon", ja: "辰（たつ）" },
  5: { ko: "뱀", en: "Snake", ja: "巳（へび）" },
  6: { ko: "말", en: "Horse", ja: "午（うま）" },
  7: { ko: "양", en: "Sheep", ja: "未（ひつじ）" },
  8: { ko: "원숭이", en: "Monkey", ja: "申（さる）" },
  9: { ko: "닭", en: "Rooster", ja: "酉（とり）" },
  10: { ko: "개", en: "Dog", ja: "戌（いぬ）" },
  11: { ko: "돼지", en: "Pig", ja: "亥（いのしし）" },
};

/** 삼합 그룹 */
const SAMHAP_GROUPS: BranchIndex[][] = [
  [8, 0, 4],
  [2, 6, 10],
  [5, 9, 1],
  [11, 3, 7],
];

/** 육합 쌍 */
const YUKHAP_PAIRS: Record<BranchIndex, BranchIndex> = {
  0: 1,
  1: 0,
  2: 11,
  3: 10,
  4: 9,
  5: 8,
  6: 7,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
};

/** 지지 → 방위 (다국어) */
const BRANCH_TO_DIRECTION: Record<BranchIndex, I18nText> = {
  0: { ko: "북쪽", en: "North", ja: "北" },
  1: { ko: "북동쪽", en: "Northeast", ja: "北東" },
  2: { ko: "동쪽", en: "East", ja: "東" },
  3: { ko: "동쪽", en: "East", ja: "東" },
  4: { ko: "동남쪽", en: "Southeast", ja: "南東" },
  5: { ko: "남쪽", en: "South", ja: "南" },
  6: { ko: "남쪽", en: "South", ja: "南" },
  7: { ko: "남서쪽", en: "Southwest", ja: "南西" },
  8: { ko: "서쪽", en: "West", ja: "西" },
  9: { ko: "서쪽", en: "West", ja: "西" },
  10: { ko: "북서쪽", en: "Northwest", ja: "北西" },
  11: { ko: "북쪽", en: "North", ja: "北" },
};

/** 오행 → 장소 유형 (다국어) */
const ELEMENT_TO_PLACES: Record<string, I18nText[]> = {
  목: [
    { ko: "공원", en: "Park", ja: "公園" },
    { ko: "숲", en: "Forest", ja: "森" },
    { ko: "식물원", en: "Botanical garden", ja: "植物園" },
    { ko: "서점", en: "Bookstore", ja: "書店" },
  ],
  화: [
    { ko: "카페", en: "Cafe", ja: "カフェ" },
    { ko: "문화센터", en: "Cultural center", ja: "文化センター" },
    { ko: "공연장", en: "Theater", ja: "劇場" },
    { ko: "미술관", en: "Art museum", ja: "美術館" },
  ],
  토: [
    { ko: "산", en: "Mountain", ja: "山" },
    { ko: "부동산", en: "Real estate office", ja: "不動産" },
    { ko: "전통시장", en: "Traditional market", ja: "伝統市場" },
  ],
  금: [
    { ko: "은행", en: "Bank", ja: "銀行" },
    { ko: "금융기관", en: "Financial institution", ja: "金融機関" },
    { ko: "오피스", en: "Office", ja: "オフィス" },
    { ko: "병원", en: "Hospital", ja: "病院" },
  ],
  수: [
    { ko: "물가", en: "Waterside", ja: "水辺" },
    { ko: "수영장", en: "Swimming pool", ja: "プール" },
    { ko: "온천", en: "Hot spring", ja: "温泉" },
    { ko: "바닷가", en: "Beach", ja: "海辺" },
  ],
};

/** 주성 → 재물 전략 (다국어) */
const STAR_WEALTH_STRATEGY: Record<
  string,
  { strategy: I18nText; areas: I18nText[] }
> = {
  자미: {
    strategy: {
      ko: "큰 그림을 보는 투자",
      en: "Big-picture investment",
      ja: "大局的な投資",
    },
    areas: [
      {
        ko: "리더십 관련 사업",
        en: "Leadership business",
        ja: "リーダーシップ事業",
      },
      { ko: "프리미엄 시장", en: "Premium market", ja: "プレミアム市場" },
    ],
  },
  천기: {
    strategy: {
      ko: "정보력을 활용한 투자",
      en: "Information-based investment",
      ja: "情報力を活用した投資",
    },
    areas: [
      { ko: "기술 분야", en: "Technology sector", ja: "技術分野" },
      { ko: "컨설팅", en: "Consulting", ja: "コンサルティング" },
    ],
  },
  태양: {
    strategy: {
      ko: "공개적이고 정당한 수입",
      en: "Open and legitimate income",
      ja: "公明正大な収入",
    },
    areas: [
      { ko: "공공사업", en: "Public projects", ja: "公共事業" },
      { ko: "미디어", en: "Media", ja: "メディア" },
    ],
  },
  무곡: {
    strategy: {
      ko: "적극적인 재테크",
      en: "Active financial management",
      ja: "積極的な財テク",
    },
    areas: [
      { ko: "주식", en: "Stocks", ja: "株式" },
      { ko: "부동산", en: "Real estate", ja: "不動産" },
    ],
  },
  천동: {
    strategy: {
      ko: "안정적인 수입 유지",
      en: "Stable income maintenance",
      ja: "安定収入の維持",
    },
    areas: [
      { ko: "서비스업", en: "Service industry", ja: "サービス業" },
      { ko: "취미 수익화", en: "Hobby monetization", ja: "趣味の収益化" },
    ],
  },
  염정: {
    strategy: {
      ko: "인맥을 통한 기회",
      en: "Opportunities through networking",
      ja: "人脈を通じた機会",
    },
    areas: [
      { ko: "엔터테인먼트", en: "Entertainment", ja: "エンタメ" },
      { ko: "뷰티", en: "Beauty", ja: "ビューティー" },
    ],
  },
  천부: {
    strategy: {
      ko: "보수적인 자산 관리",
      en: "Conservative asset management",
      ja: "保守的な資産管理",
    },
    areas: [
      { ko: "저축", en: "Savings", ja: "貯蓄" },
      { ko: "보험", en: "Insurance", ja: "保険" },
    ],
  },
  태음: {
    strategy: {
      ko: "은밀하고 조용한 투자",
      en: "Quiet and discreet investment",
      ja: "静かで控えめな投資",
    },
    areas: [
      { ko: "부동산", en: "Real estate", ja: "不動産" },
      { ko: "장기 투자", en: "Long-term investment", ja: "長期投資" },
    ],
  },
  탐랑: {
    strategy: {
      ko: "다양한 수입원 확보",
      en: "Diversified income sources",
      ja: "多様な収入源の確保",
    },
    areas: [
      { ko: "부업", en: "Side business", ja: "副業" },
      { ko: "다각화 투자", en: "Diversified investment", ja: "分散投資" },
    ],
  },
  거문: {
    strategy: {
      ko: "분석 기반 투자",
      en: "Analysis-based investment",
      ja: "分析に基づく投資",
    },
    areas: [
      { ko: "문서/계약", en: "Documents/Contracts", ja: "文書・契約" },
      { ko: "법률 관련", en: "Legal field", ja: "法律関連" },
    ],
  },
  천상: {
    strategy: {
      ko: "인맥 활용 투자",
      en: "Network-leveraged investment",
      ja: "人脈活用投資",
    },
    areas: [
      { ko: "파트너십", en: "Partnership", ja: "パートナーシップ" },
      { ko: "공동사업", en: "Joint venture", ja: "共同事業" },
    ],
  },
  천량: {
    strategy: {
      ko: "귀인의 도움을 받는 투자",
      en: "Investment with noble help",
      ja: "貴人の助けを得る投資",
    },
    areas: [
      { ko: "건강 관련", en: "Health-related", ja: "健康関連" },
      { ko: "안정적 배당", en: "Stable dividends", ja: "安定配当" },
    ],
  },
  칠살: {
    strategy: {
      ko: "과감한 결단이 필요한 투자",
      en: "Investment requiring bold decisions",
      ja: "大胆な決断が必要な投資",
    },
    areas: [
      { ko: "창업", en: "Startup", ja: "起業" },
      { ko: "해외 진출", en: "Overseas expansion", ja: "海外進出" },
    ],
  },
  파군: {
    strategy: {
      ko: "변화를 통한 수익",
      en: "Profit through change",
      ja: "変化を通じた収益",
    },
    areas: [
      { ko: "구조조정", en: "Restructuring", ja: "リストラ" },
      { ko: "신사업", en: "New business", ja: "新規事業" },
    ],
  },
};

/** 주성 → 건강 주의 (다국어) */
const STAR_HEALTH_CONCERNS: Record<
  string,
  { concerns: I18nText[]; preventions: I18nText[] }
> = {
  자미: {
    concerns: [
      { ko: "스트레스", en: "Stress", ja: "ストレス" },
      { ko: "과로", en: "Overwork", ja: "過労" },
      { ko: "혈압", en: "Blood pressure", ja: "血圧" },
    ],
    preventions: [
      { ko: "충분한 휴식", en: "Adequate rest", ja: "十分な休息" },
      { ko: "스트레스 관리", en: "Stress management", ja: "ストレス管理" },
    ],
  },
  천기: {
    concerns: [
      { ko: "신경계", en: "Nervous system", ja: "神経系" },
      { ko: "불면증", en: "Insomnia", ja: "不眠症" },
      { ko: "두통", en: "Headache", ja: "頭痛" },
    ],
    preventions: [
      { ko: "수면 관리", en: "Sleep management", ja: "睡眠管理" },
      { ko: "명상", en: "Meditation", ja: "瞑想" },
    ],
  },
  태양: {
    concerns: [
      { ko: "눈", en: "Eyes", ja: "目" },
      { ko: "심장", en: "Heart", ja: "心臓" },
      { ko: "혈압", en: "Blood pressure", ja: "血圧" },
    ],
    preventions: [
      { ko: "눈 건강 관리", en: "Eye care", ja: "目の健康管理" },
      { ko: "심혈관 운동", en: "Cardio exercise", ja: "有酸素運動" },
    ],
  },
  무곡: {
    concerns: [
      { ko: "폐", en: "Lungs", ja: "肺" },
      { ko: "호흡기", en: "Respiratory system", ja: "呼吸器" },
      { ko: "피부", en: "Skin", ja: "肌" },
    ],
    preventions: [
      { ko: "호흡기 관리", en: "Respiratory care", ja: "呼吸器ケア" },
      { ko: "금연", en: "Quit smoking", ja: "禁煙" },
    ],
  },
  천동: {
    concerns: [
      { ko: "소화기", en: "Digestive system", ja: "消化器" },
      { ko: "비만", en: "Obesity", ja: "肥満" },
      { ko: "당뇨", en: "Diabetes", ja: "糖尿病" },
    ],
    preventions: [
      { ko: "식이 조절", en: "Diet control", ja: "食事管理" },
      { ko: "규칙적 운동", en: "Regular exercise", ja: "定期的な運動" },
    ],
  },
  염정: {
    concerns: [
      { ko: "심장", en: "Heart", ja: "心臓" },
      { ko: "혈액순환", en: "Blood circulation", ja: "血液循環" },
      { ko: "피부 트러블", en: "Skin troubles", ja: "肌トラブル" },
    ],
    preventions: [
      {
        ko: "심장 건강 체크",
        en: "Heart health check",
        ja: "心臓健康チェック",
      },
      { ko: "유산소 운동", en: "Aerobic exercise", ja: "有酸素運動" },
    ],
  },
  천부: {
    concerns: [
      { ko: "위장", en: "Stomach", ja: "胃腸" },
      { ko: "소화불량", en: "Indigestion", ja: "消化不良" },
      { ko: "체중", en: "Weight", ja: "体重" },
    ],
    preventions: [
      { ko: "규칙적 식사", en: "Regular meals", ja: "規則的な食事" },
      { ko: "과식 주의", en: "Avoid overeating", ja: "食べ過ぎ注意" },
    ],
  },
  태음: {
    concerns: [
      { ko: "신장", en: "Kidneys", ja: "腎臓" },
      { ko: "비뇨기", en: "Urinary system", ja: "泌尿器" },
      { ko: "우울감", en: "Depression", ja: "うつ感" },
    ],
    preventions: [
      { ko: "수분 섭취", en: "Stay hydrated", ja: "水分摂取" },
      { ko: "정신건강 관리", en: "Mental health care", ja: "メンタルケア" },
    ],
  },
  탐랑: {
    concerns: [
      { ko: "간", en: "Liver", ja: "肝臓" },
      { ko: "숙취", en: "Hangover", ja: "二日酔い" },
      { ko: "피로", en: "Fatigue", ja: "疲労" },
    ],
    preventions: [
      { ko: "음주 절제", en: "Moderate drinking", ja: "飲酒を控える" },
      { ko: "간 건강 관리", en: "Liver care", ja: "肝臓ケア" },
    ],
  },
  거문: {
    concerns: [
      { ko: "구강", en: "Oral health", ja: "口腔" },
      { ko: "위장", en: "Stomach", ja: "胃腸" },
      { ko: "목/인후", en: "Throat", ja: "喉" },
    ],
    preventions: [
      { ko: "구강 위생", en: "Oral hygiene", ja: "口腔衛生" },
      { ko: "위산 관리", en: "Stomach acid control", ja: "胃酸管理" },
    ],
  },
  천상: {
    concerns: [
      { ko: "면역력", en: "Immunity", ja: "免疫力" },
      { ko: "알레르기", en: "Allergies", ja: "アレルギー" },
      { ko: "피부", en: "Skin", ja: "肌" },
    ],
    preventions: [
      { ko: "면역력 강화", en: "Boost immunity", ja: "免疫力強化" },
      { ko: "청결 유지", en: "Stay clean", ja: "清潔を保つ" },
    ],
  },
  천량: {
    concerns: [
      { ko: "관절", en: "Joints", ja: "関節" },
      { ko: "뼈", en: "Bones", ja: "骨" },
      { ko: "만성피로", en: "Chronic fatigue", ja: "慢性疲労" },
    ],
    preventions: [
      { ko: "칼슘 섭취", en: "Calcium intake", ja: "カルシウム摂取" },
      { ko: "적절한 운동", en: "Moderate exercise", ja: "適度な運動" },
    ],
  },
  칠살: {
    concerns: [
      { ko: "외상", en: "Injury", ja: "外傷" },
      { ko: "사고", en: "Accident", ja: "事故" },
      { ko: "급성 질환", en: "Acute illness", ja: "急性疾患" },
    ],
    preventions: [
      { ko: "안전 주의", en: "Be careful", ja: "安全注意" },
      {
        ko: "무리한 활동 자제",
        en: "Avoid overexertion",
        ja: "無理な活動を控える",
      },
    ],
  },
  파군: {
    concerns: [
      { ko: "골절", en: "Fracture", ja: "骨折" },
      { ko: "수술", en: "Surgery", ja: "手術" },
      { ko: "돌발 상황", en: "Emergencies", ja: "突発事態" },
    ],
    preventions: [
      {
        ko: "위험 활동 주의",
        en: "Avoid risky activities",
        ja: "危険な活動注意",
      },
      { ko: "정기 검진", en: "Regular checkups", ja: "定期検診" },
    ],
  },
};

/** 연애 모드 텍스트 (다국어) */
const ROMANCE_MODES: Record<
  string,
  { mode: I18nText; description: I18nText; advice: I18nText }
> = {
  stable: {
    mode: { ko: "안정 유지 모드", en: "Stable Mode", ja: "安定維持モード" },
    description: {
      ko: "현재 관계를 유지하며 내실을 다지는 시기",
      en: "Time to maintain current relationships and build stability",
      ja: "現在の関係を維持し、内実を固める時期",
    },
    advice: {
      ko: "급격한 변화보다 안정을 추구하세요",
      en: "Seek stability rather than sudden changes",
      ja: "急激な変化より安定を求めてください",
    },
  },
  popular: {
    mode: { ko: "인기 만개 모드", en: "Popular Mode", ja: "人気満開モード" },
    description: {
      ko: "이성에게 주목받는 시기, 자연스러운 매력 발산",
      en: "A time of attention from others, radiating natural charm",
      ja: "異性から注目される時期、自然な魅力を発散",
    },
    advice: {
      ko: "적극적으로 외부 활동을 늘려보세요",
      en: "Try to increase your external activities",
      ja: "積極的に外部活動を増やしてみてください",
    },
  },
  destiny: {
    mode: { ko: "인연 결실 모드", en: "Destiny Mode", ja: "縁結びモード" },
    description: {
      ko: "연애가 결혼으로, 만남이 인연으로 발전하는 시기",
      en: "Dating evolving to marriage, meetings becoming fate",
      ja: "恋愛が結婚へ、出会いが縁へと発展する時期",
    },
    advice: {
      ko: "진지한 만남에 열린 마음을 가지세요",
      en: "Be open to serious relationships",
      ja: "真剣な出会いに心を開いてください",
    },
  },
  joyful: {
    mode: { ko: "기쁜 인연 모드", en: "Joyful Mode", ja: "喜びの縁モード" },
    description: {
      ko: "경사스러운 만남이 예상되는 시기",
      en: "A time when auspicious meetings are expected",
      ja: "おめでたい出会いが予想される時期",
    },
    advice: {
      ko: "좋은 인연을 놓치지 마세요",
      en: "Don't miss good connections",
      ja: "良い縁を逃さないでください",
    },
  },
  diverse: {
    mode: {
      ko: "다양한 만남 모드",
      en: "Diverse Mode",
      ja: "多様な出会いモード",
    },
    description: {
      ko: "여러 이성과의 교류가 활발한 시기",
      en: "A time of active interactions with various people",
      ja: "様々な異性との交流が活発な時期",
    },
    advice: {
      ko: "선택과 집중이 필요합니다",
      en: "You need to choose and focus",
      ja: "選択と集中が必要です",
    },
  },
  passionate: {
    mode: { ko: "열정 연애 모드", en: "Passionate Mode", ja: "情熱恋愛モード" },
    description: {
      ko: "감정이 불타오르는 뜨거운 연애 운",
      en: "Passionate romance with burning emotions",
      ja: "感情が燃え上がる熱い恋愛運",
    },
    advice: {
      ko: "감정 조절에 주의하세요",
      en: "Be careful with emotional control",
      ja: "感情のコントロールに注意してください",
    },
  },
  comfortable: {
    mode: {
      ko: "편안한 연애 모드",
      en: "Comfortable Mode",
      ja: "快適な恋愛モード",
    },
    description: {
      ko: "부담 없는 자연스러운 만남 운",
      en: "Natural and comfortable meeting luck",
      ja: "気負わない自然な出会いの運",
    },
    advice: {
      ko: "여유를 가지고 천천히 진행하세요",
      en: "Take your time and proceed slowly",
      ja: "余裕を持ってゆっくり進めてください",
    },
  },
  review: {
    mode: { ko: "관계 점검 모드", en: "Review Mode", ja: "関係点検モード" },
    description: {
      ko: "기존 관계를 돌아보고 소통이 필요한 시기",
      en: "Time to reflect on existing relationships and communicate",
      ja: "既存の関係を振り返り、コミュニケーションが必要な時期",
    },
    advice: {
      ko: "오해가 생기지 않도록 대화를 많이 하세요",
      en: "Communicate a lot to avoid misunderstandings",
      ja: "誤解が生じないようにたくさん対話してください",
    },
  },
};

/** 계절 텍스트 (다국어) */
const SEASON_TEXTS: Record<string, I18nText> = {
  spring: { ko: "봄의 생동감", en: "Spring vitality", ja: "春の生命力" },
  summer: { ko: "여름의 활력", en: "Summer energy", ja: "夏の活力" },
  autumn: { ko: "가을의 결실", en: "Autumn harvest", ja: "秋の実り" },
  winter: { ko: "겨울의 휴식", en: "Winter rest", ja: "冬の休息" },
};

/** 공통 텍스트 (다국어) */
const COMMON_TEXTS = {
  anyDirection: { ko: "어디서든", en: "Anywhere", ja: "どこでも" },
  variousDirections: {
    ko: "다양한 방위",
    en: "Various directions",
    ja: "様々な方位",
  },
  defaultWealthStrategy: {
    ko: "안정적인 재정 관리",
    en: "Stable financial management",
    ja: "安定的な財務管理",
  },
  defaultCaution: {
    ko: "분수에 맞는 소비",
    en: "Spend within your means",
    ja: "身の丈に合った消費",
  },
  defaultHealthConcern: {
    ko: "일반적인 건강 관리",
    en: "General health care",
    ja: "一般的な健康管理",
  },
  defaultHealthPrevention: {
    ko: "균형 잡힌 생활 습관 유지",
    en: "Maintain balanced lifestyle",
    ja: "バランスの取れた生活習慣を維持",
  },
  wealthInflow: {
    ko: "재물 유입이 활발한 해",
    en: "Year of active wealth inflow",
    ja: "財物の流入が活発な年",
  },
  wealthControl: {
    ko: "재물에 대한 통제력 상승",
    en: "Increased control over wealth",
    ja: "財物へのコントロール力上昇",
  },
  honorableIncome: {
    ko: "명예로운 수입 가능",
    en: "Honorable income possible",
    ja: "名誉ある収入が可能",
  },
  expenseManagement: {
    ko: "지출 관리 필수",
    en: "Expense management essential",
    ja: "支出管理必須",
  },
  avoidRiskyInvestment: {
    ko: "무리한 투자 자제",
    en: "Avoid risky investments",
    ja: "無理な投資を控える",
  },
  mainJobIncome: {
    ko: "본업 수입 증가",
    en: "Main job income increase",
    ja: "本業収入増加",
  },
  careerFinanceWarning: {
    ko: "직장/사업 관련 재정 주의",
    en: "Caution with career/business finances",
    ja: "職場・事業関連の財政注意",
  },
  activeInvestment: {
    ko: "적극적 투자 권장",
    en: "Active investment recommended",
    ja: "積極的な投資推奨",
  },
  romanceLuck: {
    ko: "인연복이 있는 해, 적극적으로 나서세요",
    en: "A lucky year for love, be proactive",
    ja: "縁に恵まれる年、積極的に動いてください",
  },
  healthCheckRequired: {
    ko: "전반적인 건강 관리 필요",
    en: "Overall health management needed",
    ja: "全般的な健康管理が必要",
  },
  regularCheckup: {
    ko: "정기 건강검진 필수",
    en: "Regular health checkups essential",
    ja: "定期健康診断必須",
  },
  healthLuck: {
    ko: "건강 관련 행운이 따름",
    en: "Health-related luck follows",
    ja: "健康関連の幸運がついてくる",
  },
  yearHarmony: {
    ko: "연간 기운과 조화",
    en: "Harmony with yearly energy",
    ja: "年間の気運と調和",
  },
  yearConflict: {
    ko: "연간 기운과 충돌",
    en: "Conflict with yearly energy",
    ja: "年間の気運と衝突",
  },
  samhapDesc: {
    ko: "띠와 삼합으로 최고의 궁합",
    en: "Best compatibility through Samhap",
    ja: "三合で最高の相性",
  },
  yukhapDesc: {
    ko: "띠와 육합으로 특별한 인연",
    en: "Special connection through Yukhap",
    ja: "六合で特別な縁",
  },
  yearElementPlace: {
    ko: "올해의 기운과 조화로운 장소",
    en: "Places harmonious with this year's energy",
    ja: "今年の気運と調和する場所",
  },
  generatingElementPlace: {
    ko: "나를 생해주는 기운의 장소",
    en: "Places with energy that supports you",
    ja: "自分を生かしてくれる気運の場所",
  },
  huaLuPlace: {
    ko: "에 있어 행운 유입",
    en: " brings luck inflow",
    ja: "にあり幸運流入",
  },
  yearColorReason: {
    ko: "올해 천간의 오행과 조화로운 색상",
    en: "Colors harmonious with this year's heavenly stem element",
    ja: "今年の天干の五行と調和する色",
  },
};

/** 궁 → 장소 유형 (다국어) */
const PALACE_TO_PLACES: Record<string, I18nText[]> = {
  재백궁: [
    { ko: "금융기관", en: "Financial institution", ja: "金融機関" },
    { ko: "쇼핑센터", en: "Shopping center", ja: "ショッピングセンター" },
  ],
  관록궁: [
    { ko: "오피스", en: "Office", ja: "オフィス" },
    { ko: "회사", en: "Company", ja: "会社" },
  ],
  부처궁: [
    { ko: "소개팅 장소", en: "Dating spots", ja: "お見合い場所" },
    { ko: "로맨틱한 카페", en: "Romantic cafes", ja: "ロマンチックなカフェ" },
  ],
  명궁: [
    {
      ko: "자기계발 장소",
      en: "Self-improvement places",
      ja: "自己啓発の場所",
    },
    { ko: "헬스장", en: "Gym", ja: "ジム" },
  ],
  형제궁: [
    { ko: "동호회 모임", en: "Club gatherings", ja: "同好会の集まり" },
    { ko: "스터디 카페", en: "Study cafe", ja: "スタディカフェ" },
  ],
  자녀궁: [
    { ko: "놀이공원", en: "Amusement park", ja: "遊園地" },
    { ko: "창작 공방", en: "Creative workshop", ja: "創作工房" },
  ],
  천이궁: [
    { ko: "여행지", en: "Travel destinations", ja: "旅行先" },
    { ko: "공항", en: "Airport", ja: "空港" },
  ],
  교우궁: [
    { ko: "파티장", en: "Party venue", ja: "パーティー会場" },
    {
      ko: "네트워킹 모임",
      en: "Networking events",
      ja: "ネットワーキングイベント",
    },
  ],
  전택궁: [
    { ko: "부동산", en: "Real estate", ja: "不動産" },
    { ko: "인테리어샵", en: "Interior shop", ja: "インテリアショップ" },
  ],
  복덕궁: [
    { ko: "명상센터", en: "Meditation center", ja: "瞑想センター" },
    { ko: "힐링 공간", en: "Healing space", ja: "ヒーリングスペース" },
  ],
  부모궁: [
    { ko: "도서관", en: "Library", ja: "図書館" },
    { ko: "학원", en: "Academy", ja: "塾" },
  ],
  질액궁: [
    { ko: "병원", en: "Hospital", ja: "病院" },
    { ko: "건강센터", en: "Health center", ja: "健康センター" },
  ],
};

// ============================================================
// 알고리즘 함수
// ============================================================

/**
 * 지지로 궁 찾기
 */
const findPalaceByBranch = (
  chart: ZiweiChart,
  branch: BranchIndex
): Palace | undefined => {
  return chart.palaces.find((p) => p.branch === branch);
};

/**
 * 최고의 달 / 조심할 달 추출
 */
const extractMonthInsights = (
  monthlyFortunes: MonthlyFortune[],
  yearlySihua: YearlySihua,
  locale: Locale
): { bestMonths: MonthInsight[]; cautionMonths: MonthInsight[] } => {
  const sorted = [...monthlyFortunes].sort((a, b) => b.score - a.score);

  const getMonthReason = (fortune: MonthlyFortune, isGood: boolean): string => {
    const reasons: string[] = [];

    if (fortune.monthStemName === yearlySihua.yearStemName) {
      reasons.push(
        t(isGood ? COMMON_TEXTS.yearHarmony : COMMON_TEXTS.yearConflict, locale)
      );
    }

    if ([2, 3, 4].includes(fortune.monthBranch)) {
      reasons.push(t(SEASON_TEXTS.spring, locale));
    } else if ([5, 6, 7].includes(fortune.monthBranch)) {
      reasons.push(t(SEASON_TEXTS.summer, locale));
    } else if ([8, 9, 10].includes(fortune.monthBranch)) {
      reasons.push(t(SEASON_TEXTS.autumn, locale));
    } else {
      reasons.push(t(SEASON_TEXTS.winter, locale));
    }

    return reasons.join(", ");
  };

  const bestMonths = sorted.slice(0, 3).map((m) => ({
    month: m.month,
    score: m.score,
    reason: getMonthReason(m, true),
  }));

  const cautionMonths = sorted.slice(-3).map((m) => ({
    month: m.month,
    score: m.score,
    reason: getMonthReason(m, false),
  }));

  return { bestMonths, cautionMonths };
};

/**
 * 재물 공략 추출
 */
const extractWealthStrategy = (
  yearlyPalaces: YearlyPalaceInfo,
  yearlySihua: YearlySihua,
  locale: Locale
): WealthStrategy => {
  const wealthStars = yearlyPalaces.yearlyWealthPalace.mainStars;
  const strategies: string[] = [];
  const areas: string[] = [];
  const cautions: string[] = [];
  let score = 50;

  for (const star of wealthStars) {
    const starStrategy = STAR_WEALTH_STRATEGY[star];
    if (starStrategy) {
      strategies.push(t(starStrategy.strategy, locale));
      areas.push(...starStrategy.areas.map((a) => t(a, locale)));
    }
  }

  if (yearlySihua.hualu.palace === "재백궁") {
    strategies.unshift(t(COMMON_TEXTS.wealthInflow, locale));
    areas.unshift(t(COMMON_TEXTS.activeInvestment, locale));
    score += 25;
  }
  if (yearlySihua.huaquan.palace === "재백궁") {
    strategies.push(t(COMMON_TEXTS.wealthControl, locale));
    score += 15;
  }
  if (yearlySihua.huake.palace === "재백궁") {
    strategies.push(t(COMMON_TEXTS.honorableIncome, locale));
    score += 10;
  }
  if (yearlySihua.huaji.palace === "재백궁") {
    cautions.push(t(COMMON_TEXTS.expenseManagement, locale));
    cautions.push(t(COMMON_TEXTS.avoidRiskyInvestment, locale));
    score -= 20;
  }

  if (yearlySihua.hualu.palace === "관록궁") {
    areas.push(t(COMMON_TEXTS.mainJobIncome, locale));
    score += 10;
  }
  if (yearlySihua.huaji.palace === "관록궁") {
    cautions.push(t(COMMON_TEXTS.careerFinanceWarning, locale));
  }

  if (cautions.length === 0) {
    cautions.push(t(COMMON_TEXTS.defaultCaution, locale));
  }

  return {
    mainStrategy:
      strategies[0] || t(COMMON_TEXTS.defaultWealthStrategy, locale),
    recommendedAreas: [...new Set(areas)].slice(0, 5),
    cautions: [...new Set(cautions)].slice(0, 3),
    score: Math.max(0, Math.min(100, score)),
  };
};

/**
 * 연애 모드 추출
 */
const extractRomanceMode = (
  yearlyPalaces: YearlyPalaceInfo,
  peachBlossom: YearlyPeachBlossomInfo,
  yearlySihua: YearlySihua,
  locale: Locale
): RomanceMode => {
  let modeKey = "stable";
  let score = 50;

  const mingStars = yearlyPalaces.yearlyMingGong.mainStars;

  if (peachBlossom.isPeachBlossomActive) {
    score += 20;

    if (peachBlossom.hongluan.palaceName === "명궁") {
      modeKey = "popular";
      score += 15;
    } else if (peachBlossom.hongluan.palaceName === "부처궁") {
      modeKey = "destiny";
      score += 20;
    }

    if (
      peachBlossom.tianxi.palaceName === "명궁" ||
      peachBlossom.tianxi.palaceName === "부처궁"
    ) {
      modeKey = "joyful";
      score += 10;
    }
  }

  if (mingStars.includes("탐랑")) {
    modeKey = "diverse";
    score += 15;
  }
  if (mingStars.includes("염정")) {
    modeKey = "passionate";
    score += 12;
  }
  if (mingStars.includes("천동")) {
    modeKey = "comfortable";
    score += 8;
  }

  if (yearlySihua.hualu.palace === "부처궁") {
    score += 15;
  }
  if (yearlySihua.huaji.palace === "부처궁") {
    score -= 15;
    modeKey = "review";
  }

  const modeData = ROMANCE_MODES[modeKey];

  return {
    mode: t(modeData.mode, locale),
    description: t(modeData.description, locale),
    advice:
      yearlySihua.hualu.palace === "부처궁"
        ? t(COMMON_TEXTS.romanceLuck, locale)
        : t(modeData.advice, locale),
    score: Math.max(0, Math.min(100, score)),
    isPeachBlossomActive: peachBlossom.isPeachBlossomActive,
  };
};

/**
 * 행운의 장소 추출
 */
const extractLuckyPlaces = (
  yearStem: StemIndex,
  yearBranch: BranchIndex,
  yearlySihua: YearlySihua,
  locale: Locale
): LuckyPlace[] => {
  const places: LuckyPlace[] = [];
  const yearElement = STEM_TO_ELEMENT[yearStem];

  places.push({
    direction: t(BRANCH_TO_DIRECTION[yearBranch], locale),
    placeTypes: (ELEMENT_TO_PLACES[yearElement] || []).map((p) => t(p, locale)),
    reason: t(COMMON_TEXTS.yearElementPlace, locale),
  });

  const generatingElement = Object.entries(ELEMENT_GENERATES).find(
    ([, v]) => v === yearElement
  )?.[0];
  if (generatingElement && ELEMENT_TO_PLACES[generatingElement]) {
    places.push({
      direction: t(COMMON_TEXTS.variousDirections, locale),
      placeTypes: ELEMENT_TO_PLACES[generatingElement].map((p) => t(p, locale)),
      reason: `${t(ELEMENT_NAMES[generatingElement], locale)} - ${t(COMMON_TEXTS.generatingElementPlace, locale)}`,
    });
  }

  const palacePlaces = PALACE_TO_PLACES[yearlySihua.hualu.palace];
  if (palacePlaces) {
    places.push({
      direction: t(COMMON_TEXTS.anyDirection, locale),
      placeTypes: palacePlaces.map((p) => t(p, locale)),
      reason: `${yearlySihua.hualu.palace}${t(COMMON_TEXTS.huaLuPlace, locale)}`,
    });
  }

  return places.slice(0, 3);
};

/**
 * 나의 귀인 추출
 */
const extractNobleHelper = (
  yearBranch: BranchIndex,
  locale: Locale
): NobleHelper => {
  const samhapGroup = SAMHAP_GROUPS.find((group) =>
    group.includes(yearBranch)
  ) || [yearBranch];
  const samhapPartners = samhapGroup.filter((b) => b !== yearBranch);
  const yukhapPartner = YUKHAP_PAIRS[yearBranch];

  const samhapAnimals = samhapPartners.map((b) =>
    t(BRANCH_TO_ANIMAL[b], locale)
  );

  return {
    samhap: {
      animals: samhapAnimals,
      branches: samhapPartners.map((b) => EARTHLY_BRANCHES[b]),
      description: `${samhapAnimals.join(", ")} ${t(COMMON_TEXTS.samhapDesc, locale)}`,
    },
    yukhap: {
      animal: t(BRANCH_TO_ANIMAL[yukhapPartner], locale),
      branch: EARTHLY_BRANCHES[yukhapPartner],
      description: `${t(BRANCH_TO_ANIMAL[yukhapPartner], locale)} ${t(COMMON_TEXTS.yukhapDesc, locale)}`,
    },
  };
};

/**
 * 건강 주의 추출
 */
const extractHealthWarning = (
  chart: ZiweiChart,
  yearBranch: BranchIndex,
  yearlySihua: YearlySihua,
  locale: Locale
): HealthWarning => {
  const yearlyJilekBranch = ((yearBranch + 8) % 12) as BranchIndex;
  const yearlyJilekPalace = findPalaceByBranch(chart, yearlyJilekBranch);

  const concerns: string[] = [];
  const preventions: string[] = [];
  let score = 70;

  if (yearlyJilekPalace) {
    for (const star of yearlyJilekPalace.mainStars) {
      const healthInfo = STAR_HEALTH_CONCERNS[star.name];
      if (healthInfo) {
        concerns.push(...healthInfo.concerns.map((c) => t(c, locale)));
        preventions.push(...healthInfo.preventions.map((p) => t(p, locale)));
      }
    }
  }

  if (yearlySihua.huaji.palace === "질액궁") {
    concerns.unshift(t(COMMON_TEXTS.healthCheckRequired, locale));
    preventions.unshift(t(COMMON_TEXTS.regularCheckup, locale));
    score -= 20;
  }
  if (yearlySihua.hualu.palace === "질액궁") {
    preventions.push(t(COMMON_TEXTS.healthLuck, locale));
    score += 10;
  }

  if (concerns.length === 0) {
    concerns.push(t(COMMON_TEXTS.defaultHealthConcern, locale));
  }
  if (preventions.length === 0) {
    preventions.push(t(COMMON_TEXTS.defaultHealthPrevention, locale));
  }

  return {
    concerns: [...new Set(concerns)].slice(0, 4),
    preventions: [...new Set(preventions)].slice(0, 4),
    score: Math.max(0, Math.min(100, score)),
  };
};

/**
 * 행운의 색상 추출
 */
const extractLuckyColor = (yearStem: StemIndex, locale: Locale): LuckyColor => {
  const yearElement = STEM_TO_ELEMENT[yearStem];
  const colors = ELEMENT_TO_COLORS[yearElement];

  const generatingElement = Object.entries(ELEMENT_GENERATES).find(
    ([, v]) => v === yearElement
  )?.[0];

  return {
    primary: t(colors.primary, locale),
    secondary:
      generatingElement && ELEMENT_TO_COLORS[generatingElement]
        ? t(ELEMENT_TO_COLORS[generatingElement].primary, locale)
        : t(colors.secondary, locale),
    element: t(ELEMENT_NAMES[yearElement], locale),
    reason: t(COMMON_TEXTS.yearColorReason, locale),
  };
};

// ============================================================
// 메인 함수
// ============================================================

/**
 * 연간 인사이트 종합 계산
 *
 * @param chart 자미두수 명반
 * @param targetYear 대상 연도
 * @param locale 언어 (ko/en/ja)
 * @returns 연간 인사이트 종합
 */
export const calculateYearlyInsights = (
  chart: ZiweiChart,
  targetYear: number,
  locale: Locale = "ko"
): YearlyInsights => {
  const { stem: yearStem, branch: yearBranch } = getYearStemBranch(targetYear);

  const yearlySihua = calculateYearlySihua(chart, targetYear);
  const yearlyPalaces = calculateYearlyPalaces(chart, yearBranch);
  const peachBlossom = calculateYearlyPeachBlossom(
    chart,
    yearBranch,
    yearlyPalaces
  );

  const scores = { wealth: 50, career: 50, relationship: 50, health: 50 };
  const monthlyFortunes = calculateMonthlyFortunes(
    chart,
    targetYear,
    yearlySihua,
    scores
  );

  const { bestMonths, cautionMonths } = extractMonthInsights(
    monthlyFortunes,
    yearlySihua,
    locale
  );

  const wealthStrategy = extractWealthStrategy(
    yearlyPalaces,
    yearlySihua,
    locale
  );

  const romanceMode = extractRomanceMode(
    yearlyPalaces,
    peachBlossom,
    yearlySihua,
    locale
  );

  const luckyPlaces = extractLuckyPlaces(
    yearStem,
    yearBranch,
    yearlySihua,
    locale
  );

  const nobleHelper = extractNobleHelper(yearBranch, locale);

  const healthWarning = extractHealthWarning(
    chart,
    yearBranch,
    yearlySihua,
    locale
  );

  const luckyColor = extractLuckyColor(yearStem, locale);

  return {
    year: targetYear,
    bestMonths,
    cautionMonths,
    wealthStrategy,
    romanceMode,
    luckyPlaces,
    nobleHelper,
    healthWarning,
    luckyColor,
  };
};
