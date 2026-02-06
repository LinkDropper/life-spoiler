import type { Brightness } from "../types";
import type { MainStarName } from "./stars";
import type { Locale } from "@/i18n/config";

/**
 * 주성 × 밝기 조합 키워드 (다국어 지원)
 *
 * @용도 연간 운세 키워드 8개 추출
 * @추출방식 12궁 주성의 밝기 조합 (영향력 점수순 정렬)
 * @총개수 78개 (주성별 유효 밝기 조합)
 * @컨셉 현대 사회 풍자 (공감+유머)
 */

type StarBrightnessKey = `${MainStarName}_${Brightness}`;

interface KeywordTranslations {
  ko: string;
  en: string;
  ja: string;
}

/**
 * 주성 × 밝기 키워드 맵 (다국어)
 */
export const STAR_BRIGHTNESS_KEYWORDS: Partial<
  Record<StarBrightnessKey, KeywordTranslations>
> = {
  // ========================================
  // 자미 (황제성 - 리더십, 품격) - 6개
  // ========================================
  자미_묘: {
    ko: "타고난 대장 기질",
    en: "Born Leader",
    ja: "生まれながらのリーダー気質",
  },
  자미_왕: {
    ko: "직진 화법의 매력",
    en: "Charm of Direct Speech",
    ja: "直球話法の魅力",
  },
  자미_득: {
    ko: "든든한 맏이 바이브",
    en: "Reliable Eldest Vibe",
    ja: "頼れる長子バイブ",
  },
  자미_리: {
    ko: "오지랖 대마왕",
    en: "Meddling Master",
    ja: "おせっかい大王",
  },
  자미_평: {
    ko: "말만 번지르르",
    en: "All Talk No Walk",
    ja: "口だけ番長",
  },
  자미_함: {
    ko: "잠재적 꼰대력",
    en: "Latent Boomer Energy",
    ja: "潜在的老害力",
  },

  // ========================================
  // 천기 (지혜성 - 두뇌, 기획) - 6개
  // ========================================
  천기_묘: {
    ko: "뇌섹의 정석",
    en: "Textbook Brain-Sexy",
    ja: "脳セクの教科書",
  },
  천기_왕: {
    ko: "걸어다니는 위키",
    en: "Walking Wikipedia",
    ja: "歩くウィキペディア",
  },
  천기_득: {
    ko: "계획충의 미학",
    en: "Beauty of Planning Mania",
    ja: "計画マニアの美学",
  },
  천기_리: {
    ko: "생각 과잉 체질",
    en: "Overthinking Constitution",
    ja: "考えすぎ体質",
  },
  천기_평: {
    ko: "계획 부자 실행 거지",
    en: "Rich in Plans, Poor in Action",
    ja: "計画リッチ実行プア",
  },
  천기_함: {
    ko: "티끌 모아 빚더미",
    en: "Pennies to Debt Mountain",
    ja: "ちりも積もれば借金の山",
  },

  // ========================================
  // 태양 (광명성 - 명예, 활동) - 4개
  // ========================================
  태양_묘: {
    ko: "사랑받는 관종",
    en: "Lovable Attention Seeker",
    ja: "愛されるかまってちゃん",
  },
  태양_왕: {
    ko: "감성 마케터 기질",
    en: "Emotional Marketer Vibes",
    ja: "エモマーケター気質",
  },
  태양_득: {
    ko: "어디서든 주인공",
    en: "Main Character Anywhere",
    ja: "どこでも主人公",
  },
  태양_함: {
    ko: "겉바속촉 츤데레",
    en: "Crispy Outside, Soft Inside",
    ja: "外カリ中しっとりツンデレ",
  },

  // ========================================
  // 무곡 (재성 - 재물, 실행력) - 5개
  // ========================================
  무곡_묘: {
    ko: "인생은 한방",
    en: "Life is One Big Shot",
    ja: "人生は一発勝負",
  },
  무곡_왕: {
    ko: "야망만 재벌 3세",
    en: "Ambition of a Chaebol Heir",
    ja: "野望だけ財閥3世",
  },
  무곡_득: {
    ko: "가성비 집착",
    en: "Cost-Effectiveness Obsession",
    ja: "コスパ執着",
  },
  무곡_리: {
    ko: "금융치료 신봉자",
    en: "Retail Therapy Believer",
    ja: "散財セラピー信者",
  },
  무곡_평: {
    ko: "월급? 있었는데요 없습니다",
    en: "Salary? Gone Before You Know It",
    ja: "給料？あったのになくなりました",
  },

  // ========================================
  // 천동 (복성 - 행복, 여유) - 6개
  // ========================================
  천동_묘: {
    ko: "팔자가 상팔자",
    en: "Born Under Lucky Stars",
    ja: "運命が上々",
  },
  천동_왕: {
    ko: "쾌락주의자",
    en: "Hedonist",
    ja: "快楽主義者",
  },
  천동_득: {
    ko: "소확행 장인",
    en: "Small Happiness Expert",
    ja: "小さな幸せの達人",
  },
  천동_리: {
    ko: "현실도피형 낭만",
    en: "Escapist Romance",
    ja: "現実逃避型ロマン",
  },
  천동_평: {
    ko: "무기력의 늪",
    en: "Swamp of Lethargy",
    ja: "無気力の沼",
  },
  천동_함: {
    ko: "휴식 불능 체질",
    en: "Rest-Disabled Constitution",
    ja: "休息不能体質",
  },

  // ========================================
  // 염정 (정성 - 열정, 매력) - 6개
  // ========================================
  염정_묘: {
    ko: "본능적 플러팅",
    en: "Instinctive Flirting",
    ja: "本能的フラーティング",
  },
  염정_왕: {
    ko: "연애 만렙",
    en: "Romance Level Max",
    ja: "恋愛レベルMAX",
  },
  염정_득: {
    ko: "인간 비타민",
    en: "Human Vitamin",
    ja: "人間ビタミン",
  },
  염정_리: {
    ko: "밀당의 희생자",
    en: "Victim of Push-Pull",
    ja: "駆け引きの犠牲者",
  },
  염정_평: {
    ko: "솔로계의 전설",
    en: "Legend of Solo Life",
    ja: "ソロ界のレジェンド",
  },
  염정_함: {
    ko: "감정 올인형",
    en: "Emotional All-In Type",
    ja: "感情オールイン型",
  },

  // ========================================
  // 천부 (재고성 - 안정, 관리) - 5개
  // ========================================
  천부_묘: {
    ko: "금수저 DNA",
    en: "Silver Spoon DNA",
    ja: "金のスプーンDNA",
  },
  천부_왕: {
    ko: "가격표는 장식일 뿐",
    en: "Price Tags Are Just Decoration",
    ja: "値札は飾りに過ぎない",
  },
  천부_득: {
    ko: "예쁜 쓰레기 수집가",
    en: "Pretty Trash Collector",
    ja: "可愛いゴミ収集家",
  },
  천부_리: {
    ko: "소비 후 죄책감형",
    en: "Post-Purchase Guilt Type",
    ja: "消費後罪悪感型",
  },
  천부_평: {
    ko: "극한의 절약정신",
    en: "Extreme Frugality Spirit",
    ja: "極限の節約精神",
  },

  // ========================================
  // 태음 (음성 - 감성, 섬세) - 5개
  // ========================================
  태음_묘: {
    ko: "감성팔이 장인",
    en: "Emotional Marketing Master",
    ja: "エモ売りの達人",
  },
  태음_왕: {
    ko: "눈물샘 풍부",
    en: "Abundant Tear Ducts",
    ja: "涙腺豊富",
  },
  태음_득: {
    ko: "공감 능력 만렙",
    en: "Empathy Level Max",
    ja: "共感能力MAX",
  },
  태음_리: {
    ko: "셀프 감동형",
    en: "Self-Touching Type",
    ja: "セルフ感動型",
  },
  태음_함: {
    ko: "유리멘탈 주의보",
    en: "Glass Mental Warning",
    ja: "ガラスメンタル注意報",
  },

  // ========================================
  // 탐랑 (욕망성 - 다재다능, 도화) - 6개
  // ========================================
  탐랑_묘: {
    ko: "만능 엔터테이너",
    en: "All-Round Entertainer",
    ja: "万能エンターテイナー",
  },
  탐랑_왕: {
    ko: "재능 낭비류 甲",
    en: "Top-Tier Talent Waster",
    ja: "才能の無駄遣い甲",
  },
  탐랑_득: {
    ko: "취미 부자",
    en: "Hobby Millionaire",
    ja: "趣味リッチ",
  },
  탐랑_리: {
    ko: "찍먹 인생관",
    en: "Sampling Life Philosophy",
    ja: "つまみ食い人生観",
  },
  탐랑_평: {
    ko: "3일 열정형",
    en: "3-Day Passion Type",
    ja: "3日熱情型",
  },
  탐랑_함: {
    ko: "야망만 재벌급",
    en: "Chaebol-Level Ambition Only",
    ja: "野望だけ財閥級",
  },

  // ========================================
  // 거문 (구설성 - 언변, 분석) - 6개
  // ========================================
  거문_묘: {
    ko: "말빨로 먹고 삼",
    en: "Lives on Eloquence",
    ja: "話術で食っていく",
  },
  거문_왕: {
    ko: "토론 무패 전설",
    en: "Undefeated Debate Legend",
    ja: "討論無敗伝説",
  },
  거문_득: {
    ko: "팩폭 장인",
    en: "Fact Bomb Master",
    ja: "ファクト爆撃の達人",
  },
  거문_리: {
    ko: "할말하않 장인",
    en: "Bites Tongue Expert",
    ja: "言いたいこと我慢達人",
  },
  거문_평: {
    ko: "읽씹의 미학",
    en: "Art of Leaving on Read",
    ja: "既読スルーの美学",
  },
  거문_함: {
    ko: "TMI 폭격기",
    en: "TMI Bomber",
    ja: "TMI爆撃機",
  },

  // ========================================
  // 천상 (인덕성 - 봉사, 조력) - 6개
  // ========================================
  천상_묘: {
    ko: "인복 터진 팔자",
    en: "Blessed with Good People",
    ja: "人福爆発の運命",
  },
  천상_왕: {
    ko: "거절 불가 예스맨",
    en: "Yes-Man Who Can't Say No",
    ja: "断れないイエスマン",
  },
  천상_득: {
    ko: "유해 성분 0%",
    en: "0% Harmful Ingredients",
    ja: "有害成分0%",
  },
  천상_리: {
    ko: "착한 사람 증후군",
    en: "Nice Person Syndrome",
    ja: "いい人症候群",
  },
  천상_평: {
    ko: "호구 체질",
    en: "Pushover Constitution",
    ja: "カモ体質",
  },
  천상_함: {
    ko: "민폐형 선의",
    en: "Nuisance-Type Goodwill",
    ja: "迷惑型善意",
  },

  // ========================================
  // 천량 (수복성 - 귀인, 건강) - 5개
  // ========================================
  천량_묘: {
    ko: "운빨 캐리어",
    en: "Luck Carrier",
    ja: "運キャリー",
  },
  천량_왕: {
    ko: "될놈될 표본",
    en: "Meant-to-Succeed Specimen",
    ja: "なるべくしてなる見本",
  },
  천량_득: {
    ko: "조상님이 하드캐리",
    en: "Ancestors Hard Carrying",
    ja: "ご先祖様がハードキャリー",
  },
  천량_리: {
    ko: "운빨 의존형",
    en: "Luck-Dependent Type",
    ja: "運頼み型",
  },
  천량_함: {
    ko: "만사 꼬임 체질",
    en: "Everything-Goes-Wrong Type",
    ja: "万事こじれ体質",
  },

  // ========================================
  // 칠살 (고독성 - 개척, 결단) - 6개
  // ========================================
  칠살_묘: {
    ko: "혼자서도 잘해요",
    en: "Does Well Alone",
    ja: "一人でも大丈夫",
  },
  칠살_왕: {
    ko: "행복한 아싸",
    en: "Happy Loner",
    ja: "幸せな陰キャ",
  },
  칠살_득: {
    ko: "철벽 독립심",
    en: "Iron-Wall Independence",
    ja: "鉄壁の独立心",
  },
  칠살_리: {
    ko: "선택적 사회생활",
    en: "Selective Social Life",
    ja: "選択的社会生活",
  },
  칠살_평: {
    ko: "결정장애 만렙",
    en: "Decision Paralysis Max",
    ja: "決定障害MAX",
  },
  칠살_함: {
    ko: "인류애 상실",
    en: "Lost Faith in Humanity",
    ja: "人類愛喪失",
  },

  // ========================================
  // 파군 (변동성 - 변화, 혁신) - 6개
  // ========================================
  파군_묘: {
    ko: "가만있으면 죽는 병",
    en: "Can't Sit Still Syndrome",
    ja: "じっとしてると死ぬ病",
  },
  파군_왕: {
    ko: "급발진의 아이콘",
    en: "Icon of Sudden Acceleration",
    ja: "急発進のアイコン",
  },
  파군_득: {
    ko: "뒷일은 내일 생각함",
    en: "Tomorrow's Problem is Tomorrow's",
    ja: "後のことは明日考える",
  },
  파군_리: {
    ko: "정착 불가 체질",
    en: "Can't-Settle-Down Type",
    ja: "定着不可体質",
  },
  파군_평: {
    ko: "귀막은 마이웨이",
    en: "Deaf-Eared My Way",
    ja: "耳を塞いだマイウェイ",
  },
  파군_함: {
    ko: "엎어치기 전문",
    en: "Flip-the-Table Expert",
    ja: "ひっくり返し専門",
  },
};

/**
 * 주성과 밝기로 키워드 조회 (다국어)
 */
export const getStarBrightnessKeyword = (
  star: MainStarName,
  brightness: Brightness,
  locale: Locale = "ko"
): string | null => {
  const key = `${star}_${brightness}` as StarBrightnessKey;
  return STAR_BRIGHTNESS_KEYWORDS[key]?.[locale] ?? null;
};

/**
 * 키워드 총 개수
 */
export const KEYWORD_COUNT = Object.keys(STAR_BRIGHTNESS_KEYWORDS).length;
