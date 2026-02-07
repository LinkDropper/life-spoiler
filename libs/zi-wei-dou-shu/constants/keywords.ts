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
    ko: "태생이 센터상",
    en: "Born to be Center",
    ja: "生まれつきのセンター",
  },
  자미_왕: {
    ko: "근거 있는 근자감",
    en: "Confidence backed by Facts",
    ja: "根拠のある自信",
  },
  자미_득: {
    ko: "K-장녀/장남 바이브",
    en: "K-Eldest Sibling Vibe",
    ja: "韓国の長女・長男バイブ",
  },
  자미_리: {
    ko: "훈수 두기 1급 자격증",
    en: "Certified Backseat Driver",
    ja: "説教１級資格",
  },
  자미_평: {
    ko: "입으로 천하 통일",
    en: "Conquering World with Mouth",
    ja: "口先だけで天下統一",
  },
  자미_함: {
    ko: "젊은 꼰대 꿈나무",
    en: "Promising Young Boomer",
    ja: "若き老害の有望株",
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
    ko: "파워 J의 계획표",
    en: "Power J's Planner",
    ja: "超几帳面な計画表",
  },
  천기_리: {
    ko: "닥터 스트레인지급 시뮬레이션",
    en: "Dr. Strange-level Simulation",
    ja: "ドクター・ストレンジ級シミュレーション",
  },
  천기_평: {
    ko: "상상 속에선 이미 재벌",
    en: "Already Billionaire in Imagination",
    ja: "想像の中では既に財閥",
  },
  천기_함: {
    ko: "걱정 인형 빙의 중",
    en: "Possessed by Worry Doll",
    ja: "心配人形憑依中",
  },

  // ========================================
  // 태양 (광명성 - 명예, 활동) - 4개
  // ========================================
  태양_묘: {
    ko: "스포트라이트 중독",
    en: "Spotlight Addict",
    ja: "スポットライト中毒",
  },
  태양_왕: {
    ko: "연예인병 초기 증상",
    en: "Early Symptoms of Celebrity Disease",
    ja: "芸能人病の初期症状",
  },
  태양_득: {
    ko: "자발적 골든벨",
    en: "Voluntary Bill Payer",
    ja: "自発的なおごり魔",
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
    ko: "월급은 통장을 스칠 뿐",
    en: "Salary Just Grazes the Account",
    ja: "給料は通帳をかすめるだけ",
  },

  // ========================================
  // 천동 (복성 - 행복, 여유) - 6개
  // ========================================
  천동_묘: {
    ko: "조물주가 사랑한 베짱이",
    en: "Grasshopper Loved by God",
    ja: "神に愛されたキリギリス",
  },
  천동_왕: {
    ko: "뽀로로 유전자 (노는 게 제일 좋아)",
    en: "Pororo Gene (Loves Playing)",
    ja: "ポロロ遺伝子（遊ぶのが一番好き）",
  },
  천동_득: {
    ko: "소확행 수집가",
    en: "Small Happiness Collector",
    ja: "小さな幸せ収集家",
  },
  천동_리: {
    ko: "망상 회로 풀가동",
    en: "Delusion Circuit Full Throttle",
    ja: "妄想回路フル稼働",
  },
  천동_평: {
    ko: "숨 쉬는 것도 귀찮음",
    en: "Too Lazy to Breathe",
    ja: "息をするのも面倒",
  },
  천동_함: {
    ko: "강박적 갓생 중독자",
    en: "Compulsive 'God-saeng' Addict",
    ja: "強迫的な人生頑張り中毒",
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
    ko: "감정 기복 롤러코스터",
    en: "Emotional Rollercoaster",
    ja: "感情起伏ジェットコースター",
  },

  // ========================================
  // 천부 (재고성 - 안정, 관리) - 5개
  // ========================================
  천부_묘: {
    ko: "귀족 영혼의 소유자",
    en: "Owner of a Noble Soul",
    ja: "貴族の魂の持ち主",
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
    ko: "있어 보이는 척 만렙",
    en: "Pretending to Have It All",
    ja: "持ってるふりレベルMAX",
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
    ko: "수도꼭지 눈물샘",
    en: "Faucet Tear Ducts",
    ja: "蛇口のような涙腺",
  },
  태음_득: {
    ko: "프로 공감러",
    en: "Pro Empathizer",
    ja: "プロ共感ラー",
  },
  태음_리: {
    ko: "자기 연민 만취 상태",
    en: "Drunk on Self-Pity",
    ja: "自己憐憫泥酔状態",
  },
  태음_함: {
    ko: "쿠크다스 멘탈",
    en: "Cookie Crumb Mental",
    ja: "クックダスメンタル（脆い精神）",
  },

  // ========================================
  // 탐랑 (욕망성 - 다재다능, 도화) - 6개
  // ========================================
  탐랑_묘: {
    ko: "재능 낭비류 갑",
    en: "Top Tier Talent Waster",
    ja: "才能の無駄遣い甲",
  },
  탐랑_왕: {
    ko: "알코올 요정",
    en: "Alcohol Fairy",
    ja: "アルコールの妖精",
  },
  탐랑_득: {
    ko: "취미 수집가",
    en: "Hobby Collector",
    ja: "趣味収集家",
  },
  탐랑_리: {
    ko: "금사빠 금사식",
    en: "Falling Fast, Cooling Fast",
    ja: "熱しやすく冷めやすい",
  },
  탐랑_평: {
    ko: "작심삼일 프로",
    en: "Pro Quitter in 3 Days",
    ja: "三日坊主のプロ",
  },
  탐랑_함: {
    ko: "욕망의 항아리",
    en: "Pot of Greed",
    ja: "欲望の壺",
  },

  // ========================================
  // 거문 (구설성 - 언변, 분석) - 6개
  // ========================================
  거문_묘: {
    ko: "언어의 마술사",
    en: "Magician of Words",
    ja: "言葉の魔術師",
  },
  거문_왕: {
    ko: "논리왕 말대꾸",
    en: "Logic King Backtalker",
    ja: "論理王口答え",
  },
  거문_득: {
    ko: "뼈 때리는 팩트 폭격기",
    en: "Bone-Hitting Fact Bomber",
    ja: "骨を叩くファクト爆撃機",
  },
  거문_리: {
    ko: "입만 열면 깸",
    en: "Breaks Illusion When Speaking",
    ja: "口を開けば幻滅",
  },
  거문_평: {
    ko: "읽씹이 일상",
    en: "Leaving on Read Daily",
    ja: "既読スルーが日常",
  },
  거문_함: {
    ko: "걸어 다니는 구설수",
    en: "Walking Gossip Magnet",
    ja: "歩くゴシップ磁石",
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
    ko: "자발적 호구",
    en: "Voluntary Pushover",
    ja: "自発的なカモ",
  },
  천상_함: {
    ko: "남 좋은 일만 함",
    en: "Only Doing Good for Others",
    ja: "他人のためだけの善行",
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
    ko: "운만 믿고 나댐",
    en: "Acting Up Trusting Luck",
    ja: "運だけ信じて調子に乗る",
  },
  천량_함: {
    ko: "선비 코스프레",
    en: "Cosplaying Scholar",
    ja: "ソンビ（高尚な学者）コスプレ",
  },

  // ========================================
  // 칠살 (고독성 - 개척, 결단) - 6개
  // ========================================
  칠살_묘: {
    ko: "나 혼자 산다 찍는 중",
    en: "Filming 'I Live Alone'",
    ja: "『私は一人で暮らす』撮影中",
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
    ko: "고독한 늑대 놀이",
    en: "Playing Lone Wolf",
    ja: "孤独な狼ごっこ",
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
    ko: "프로 급발진러",
    en: "Loose Cannon",
    ja: "暴走機関車", // 폭주기관차
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
