import type { Brightness } from "../types";
import type { MainStarName } from "./stars";
import type { Locale } from "@/i18n/config";

/**
 * 주성 × 밝기 조합 키워드 (다국어 지원)
 *
 * @용도 연간 운세 키워드 8개 추출
 * @추출방식 12궁 주성의 밝기 조합 (영향력 점수순 정렬)
 * @총개수 78개 (주성별 유효 밝기 조합)
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
    ko: "타고난 대장 사자",
    en: "Born Leader Lion",
    ja: "生まれながらのリーダー獅子",
  },
  자미_왕: {
    ko: "카리스마 넘치는 백호",
    en: "Charismatic White Tiger",
    ja: "カリスマ溢れる白虎",
  },
  자미_득: {
    ko: "듬직한 맏형 코끼리",
    en: "Reliable Big Bro Elephant",
    ja: "頼れる長兄ゾウ",
  },
  자미_리: {
    ko: "조용히 이끄는 올빼미",
    en: "Quietly Leading Owl",
    ja: "静かに導くフクロウ",
  },
  자미_평: {
    ko: "왕관 무거운 펭귄",
    en: "Crown-Burdened Penguin",
    ja: "王冠が重いペンギン",
  },
  자미_함: {
    ko: "체면 차리느라 바쁜 공작새",
    en: "Image-Obsessed Peacock",
    ja: "体面ばかり気にする孔雀",
  },

  // ========================================
  // 천기 (지혜성 - 두뇌, 기획) - 6개
  // ========================================
  천기_묘: {
    ko: "천재적 두뇌 문어",
    en: "Genius-Brained Octopus",
    ja: "天才的頭脳のタコ",
  },
  천기_왕: {
    ko: "전략가 기질 여우",
    en: "Strategic Fox",
    ja: "戦略家キツネ",
  },
  천기_득: {
    ko: "눈치 백단 미어캣",
    en: "Sharp-Eyed Meerkat",
    ja: "空気を読むミーアキャット",
  },
  천기_리: {
    ko: "생각 많은 수달",
    en: "Overthinking Otter",
    ja: "考えすぎるカワウソ",
  },
  천기_평: {
    ko: "오버씽킹 햄스터",
    en: "Anxious Hamster",
    ja: "考えすぎハムスター",
  },
  천기_함: {
    ko: "꼼수만 늘어나는 너구리",
    en: "Scheming Raccoon",
    ja: "小細工ばかりのタヌキ",
  },

  // ========================================
  // 태양 (광명성 - 명예, 활동) - 4개
  // 리, 평 없음
  // ========================================
  태양_묘: {
    ko: "관종끼 다분한 고양이",
    en: "Attention-Loving Cat",
    ja: "注目されたがりの猫",
  },
  태양_왕: {
    ko: "어디서든 센터 공작새",
    en: "Always-Center-Stage Peacock",
    ja: "どこでもセンターの孔雀",
  },
  태양_득: {
    ko: "존재감 뿜뿜 골든리트리버",
    en: "Scene-Stealing Golden Retriever",
    ja: "存在感抜群のゴールデンレトリバー",
  },
  태양_함: {
    ko: "기죽은 반딧불이",
    en: "Dimmed Firefly",
    ja: "元気のないホタル",
  },

  // ========================================
  // 무곡 (재성 - 재물, 실행력) - 5개
  // 함 없음
  // ========================================
  무곡_묘: {
    ko: "돈 냄새 귀신 하이에나",
    en: "Money-Sniffing Hyena",
    ja: "お金の匂いを嗅ぎ分けるハイエナ",
  },
  무곡_왕: {
    ko: "재테크 본능 다람쥐",
    en: "Investment-Savvy Squirrel",
    ja: "財テク本能のリス",
  },
  무곡_득: {
    ko: "실속 챙기는 까치",
    en: "Practical Magpie",
    ja: "実利を取るカササギ",
  },
  무곡_리: {
    ko: "통장 지킴이 거북이",
    en: "Savings-Guard Turtle",
    ja: "貯金を守るカメ",
  },
  무곡_평: {
    ko: "돈과 인연 없는 나무늘보",
    en: "Money-Distant Sloth",
    ja: "お金に縁のないナマケモノ",
  },

  // ========================================
  // 천동 (복성 - 행복, 여유) - 6개
  // ========================================
  천동_묘: {
    ko: "팔자 좋은 판다",
    en: "Lucky-Life Panda",
    ja: "運のいいパンダ",
  },
  천동_왕: {
    ko: "행복회로 장착 쿼카",
    en: "Happiness-Wired Quokka",
    ja: "幸せ回路搭載クオッカ",
  },
  천동_득: {
    ko: "낙천주의 돌고래",
    en: "Optimistic Dolphin",
    ja: "楽天主義のイルカ",
  },
  천동_리: {
    ko: "소확행 추구 고슴도치",
    en: "Small-Joys Hedgehog",
    ja: "小さな幸せ追求ハリネズミ",
  },
  천동_평: {
    ko: "귀차니즘 만랩 나무늘보",
    en: "Ultimate Lazy Sloth",
    ja: "めんどくさがり極めたナマケモノ",
  },
  천동_함: {
    ko: "만사 귀찮은 해파리",
    en: "Everything-Is-Tiresome Jellyfish",
    ja: "何もかも面倒なクラゲ",
  },

  // ========================================
  // 염정 (정성 - 열정, 매력) - 6개
  // ========================================
  염정_묘: {
    ko: "플러팅 장인 여우",
    en: "Flirting Master Fox",
    ja: "フラーティングの達人キツネ",
  },
  염정_왕: {
    ko: "치명적 매력 흑표범",
    en: "Fatally Charming Panther",
    ja: "致命的な魅力の黒豹",
  },
  염정_득: {
    ko: "분위기 메이커 앵무새",
    en: "Mood-Maker Parrot",
    ja: "ムードメーカーのオウム",
  },
  염정_리: {
    ko: "은근 끼쟁이 고양이",
    en: "Subtly Charming Cat",
    ja: "さりげなく魅力的な猫",
  },
  염정_평: {
    ko: "매력 봉인 두더지",
    en: "Charm-Sealed Mole",
    ja: "魅力封印モグラ",
  },
  염정_함: {
    ko: "과몰입 불나방",
    en: "Obsessive Moth",
    ja: "のめり込みすぎる蛾",
  },

  // ========================================
  // 천부 (재고성 - 안정, 관리) - 5개
  // 함 없음
  // ========================================
  천부_묘: {
    ko: "재산관리 철저 개미",
    en: "Asset-Managing Ant",
    ja: "資産管理徹底アリ",
  },
  천부_왕: {
    ko: "안정 제일주의 바다거북",
    en: "Stability-First Sea Turtle",
    ja: "安定第一主義のウミガメ",
  },
  천부_득: {
    ko: "알뜰살뜰 비버",
    en: "Thrifty Beaver",
    ja: "倹約家のビーバー",
  },
  천부_리: {
    ko: "현상유지 달팽이",
    en: "Status-Quo Snail",
    ja: "現状維持カタツムリ",
  },
  천부_평: {
    ko: "변화 극혐 조개",
    en: "Change-Hating Clam",
    ja: "変化が大嫌いな貝",
  },

  // ========================================
  // 태음 (음성 - 감성, 섬세) - 5개
  // 평 없음
  // ========================================
  태음_묘: {
    ko: "감성 충만 나이팅게일",
    en: "Emotional Nightingale",
    ja: "感性豊かなナイチンゲール",
  },
  태음_왕: {
    ko: "섬세함 끝판왕 토끼",
    en: "Ultra-Sensitive Rabbit",
    ja: "繊細さ極めたウサギ",
  },
  태음_득: {
    ko: "감수성 풍부한 백조",
    en: "Sentimental Swan",
    ja: "感受性豊かな白鳥",
  },
  태음_리: {
    ko: "몽상가 기질 해파리",
    en: "Dreamy Jellyfish",
    ja: "夢見がちなクラゲ",
  },
  태음_함: {
    ko: "유리멘탈 도베르만",
    en: "Glass-Heart Doberman",
    ja: "ガラスのハートのドーベルマン",
  },

  // ========================================
  // 탐랑 (욕망성 - 다재다능, 도화) - 6개
  // ========================================
  탐랑_묘: {
    ko: "팔방미인 카멜레온",
    en: "Multi-Talented Chameleon",
    ja: "八方美人カメレオン",
  },
  탐랑_왕: {
    ko: "뭐든 잘하는 돌고래",
    en: "Good-At-Everything Dolphin",
    ja: "何でもできるイルカ",
  },
  탐랑_득: {
    ko: "호기심 대장 수달",
    en: "Curiosity-King Otter",
    ja: "好奇心旺盛カワウソ",
  },
  탐랑_리: {
    ko: "취미 부자 라쿤",
    en: "Hobby-Rich Raccoon",
    ja: "多趣味なアライグマ",
  },
  탐랑_평: {
    ko: "이것저것 찍먹 참새",
    en: "Try-Everything Sparrow",
    ja: "あれこれつまみ食いスズメ",
  },
  탐랑_함: {
    ko: "욕심만 큰 뻐꾸기",
    en: "All-Greed Cuckoo",
    ja: "欲だけ大きいカッコウ",
  },

  // ========================================
  // 거문 (구설성 - 언변, 분석) - 6개
  // ========================================
  거문_묘: {
    ko: "말빨 천재 변호사",
    en: "Silver-Tongued Lawyer",
    ja: "弁舌の天才弁護士",
  },
  거문_왕: {
    ko: "논리 끝판왕 까마귀",
    en: "Logic-Master Crow",
    ja: "論理の王様カラス",
  },
  거문_득: {
    ko: "팩트폭격 부엉이",
    en: "Fact-Bombing Owl",
    ja: "ファクト爆撃フクロウ",
  },
  거문_리: {
    ko: "할말은 하는 스컹크",
    en: "Speaks-Mind Skunk",
    ja: "言うべきことは言うスカンク",
  },
  거문_평: {
    ko: "안 들리는 척하는 곰",
    en: "Pretends-Not-To-Hear Bear",
    ja: "聞こえないふりをするクマ",
  },
  거문_함: {
    ko: "말실수 장인 앵무새",
    en: "Foot-In-Mouth Parrot",
    ja: "失言の達人オウム",
  },

  // ========================================
  // 천상 (인덕성 - 봉사, 조력) - 6개
  // ========================================
  천상_묘: {
    ko: "인복 터진 래브라도",
    en: "People-Blessed Labrador",
    ja: "人福に恵まれたラブラドール",
  },
  천상_왕: {
    ko: "만인의 친구 골든리트리버",
    en: "Everyone's Friend Golden Retriever",
    ja: "万人の友ゴールデンレトリバー",
  },
  천상_득: {
    ko: "배려심 갑 알파카",
    en: "Considerate Alpaca",
    ja: "思いやり抜群アルパカ",
  },
  천상_리: {
    ko: "착한 척 물개",
    en: "Nice-Acting Seal",
    ja: "いい人ぶるアザラシ",
  },
  천상_평: {
    ko: "호구 체질 양",
    en: "Easy-Target Sheep",
    ja: "カモ体質の羊",
  },
  천상_함: {
    ko: "눈치 없는 조력자",
    en: "Clueless Helper",
    ja: "空気の読めない助っ人",
  },

  // ========================================
  // 천량 (수복성 - 귀인, 건강) - 5개
  // 평 없음
  // ========================================
  천량_묘: {
    ko: "귀인 끌어당기는 코알라",
    en: "Mentor-Attracting Koala",
    ja: "貴人を引き寄せるコアラ",
  },
  천량_왕: {
    ko: "운 좋은 네잎클로버",
    en: "Lucky Four-Leaf Clover",
    ja: "幸運の四つ葉のクローバー",
  },
  천량_득: {
    ko: "든든한 백 있는 펠리컨",
    en: "Well-Backed Pelican",
    ja: "頼れるバックのあるペリカン",
  },
  천량_리: {
    ko: "버티기 달인 선인장",
    en: "Endurance-Master Cactus",
    ja: "耐え忍ぶ達人サボテン",
  },
  천량_함: {
    ko: "복 나간 검은 고양이",
    en: "Luck-Drained Black Cat",
    ja: "運に見放された黒猫",
  },

  // ========================================
  // 칠살 (고독성 - 개척, 결단) - 6개
  // ========================================
  칠살_묘: {
    ko: "마이웨이 불도저",
    en: "My-Way Bulldozer",
    ja: "マイウェイブルドーザー",
  },
  칠살_왕: {
    ko: "외로운 늑대",
    en: "Lone Wolf",
    ja: "孤高の狼",
  },
  칠살_득: {
    ko: "개척자 정신 매",
    en: "Pioneer Hawk",
    ja: "開拓者精神の鷹",
  },
  칠살_리: {
    ko: "혼밥 익숙한 고양이",
    en: "Solo-Dining Cat",
    ja: "一人飯に慣れた猫",
  },
  칠살_평: {
    ko: "우유부단 해마",
    en: "Indecisive Seahorse",
    ja: "優柔不断なタツノオトシゴ",
  },
  칠살_함: {
    ko: "사회성 제로 고슴도치",
    en: "Zero-Social Hedgehog",
    ja: "社会性ゼロのハリネズミ",
  },

  // ========================================
  // 파군 (변동성 - 변화, 혁신) - 6개
  // ========================================
  파군_묘: {
    ko: "혁신가 기질 독수리",
    en: "Innovator Eagle",
    ja: "革新者気質の鷲",
  },
  파군_왕: {
    ko: "집에 못 붙어있는 야생마",
    en: "Can't-Stay-Home Mustang",
    ja: "家にいられない野生馬",
  },
  파군_득: {
    ko: "변화 추구 철새",
    en: "Change-Seeking Migrant Bird",
    ja: "変化を求める渡り鳥",
  },
  파군_리: {
    ko: "가만히 못 있는 원숭이",
    en: "Can't-Sit-Still Monkey",
    ja: "じっとしていられない猿",
  },
  파군_평: {
    ko: "퇴사 마려운 앵무새",
    en: "Ready-To-Quit Parrot",
    ja: "退職したいオウム",
  },
  파군_함: {
    ko: "불 지르고 다니는 불개미",
    en: "Bridge-Burning Fire Ant",
    ja: "火をつけて回るヒアリ",
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
