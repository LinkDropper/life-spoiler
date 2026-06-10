import type { PalaceInfoTable } from "./types";

/**
 * 궁(宮)별 일반어 설명.
 * - title: 화면 헤더에 쓰는 한 줄 라벨 (전문 용어 최소화)
 * - meaning: 이 궁이 무엇을 보는 자리인지 1~2문장
 */
export const PALACE_INFO: PalaceInfoTable = {
  명궁: {
    title: {
      ko: "타고난 나, 성격과 기질",
      en: "Your innate self, character and temperament",
      ja: "生まれ持った自分、性格と気質",
    },
    meaning: {
      ko: "본래 어떤 결을 타고났는지, 성향과 기질, 인생을 대하는 기본 태도를 보는 가장 중심이 되는 자리예요.",
      en: "The most central area, showing your innate nature, disposition, and the basic attitude with which you face life.",
      ja: "本来どんな質を持って生まれたか、性向や気質、人生に向き合う基本姿勢を見る、最も中心となる場所です。",
    },
  },
  형제궁: {
    title: {
      ko: "형제와 가까운 동료",
      en: "Siblings and close peers",
      ja: "兄弟と身近な仲間",
    },
    meaning: {
      ko: "형제자매, 그리고 어깨를 나란히 하는 동료·친구와의 관계와 거리감을 보는 자리예요.",
      en: "Shows your relationships and sense of distance with siblings, and with the peers and friends who stand alongside you.",
      ja: "兄弟姉妹、そして肩を並べる仲間や友人との関係や距離感を見る場所です。",
    },
  },
  부처궁: {
    title: {
      ko: "사랑과 평생의 짝",
      en: "Love and lifelong partner",
      ja: "愛と生涯のパートナー",
    },
    meaning: {
      ko: "연애와 결혼, 배우자나 깊은 파트너와의 관계가 어떻게 흐르는지 보는 자리예요.",
      en: "Shows how your romance and marriage flow, and your relationship with a spouse or deep partner.",
      ja: "恋愛と結婚、配偶者や深いパートナーとの関係がどう流れるかを見る場所です。",
    },
  },
  자녀궁: {
    title: {
      ko: "자녀와 새로 낳는 것",
      en: "Children and what you create",
      ja: "子どもと新しく生み出すもの",
    },
    meaning: {
      ko: "자녀와의 인연, 그리고 내가 새로 만들어내는 것(아이디어·작품)과 아랫사람과의 관계를 보는 자리예요.",
      en: "Shows your bond with children, the things you newly create (ideas, works), and your relationship with juniors.",
      ja: "子どもとの縁、そして自分が新しく生み出すもの(アイデア・作品)や目下の人との関係を見る場所です。",
    },
  },
  재백궁: {
    title: {
      ko: "돈이 들고 나는 흐름",
      en: "How money flows in and out",
      ja: "お金が出入りする流れ",
    },
    meaning: {
      ko: "돈을 버는 방식과 쓰는 습관, 재물이 들어오고 나가는 흐름을 보는 자리예요.",
      en: "Shows how you earn and spend, and the way money flows in and out of your life.",
      ja: "お金の稼ぎ方と使い方の習慣、財が出入りする流れを見る場所です。",
    },
  },
  질액궁: {
    title: {
      ko: "몸과 건강의 신호",
      en: "Body and health signals",
      ja: "体と健康のサイン",
    },
    meaning: {
      ko: "타고난 체질과 약해지기 쉬운 부분, 몸이 보내는 건강 신호를 보는 자리예요.",
      en: "Shows your innate constitution, the parts that tend to weaken, and the health signals your body sends.",
      ja: "生まれ持った体質や弱りやすい部分、体が送る健康のサインを見る場所です。",
    },
  },
  천이궁: {
    title: {
      ko: "바깥에서의 나",
      en: "You out in the world",
      ja: "外での自分",
    },
    meaning: {
      ko: "집 밖, 사회와 타향에서 어떻게 움직이고 평가받는지 — 이동과 외부 활동을 보는 자리예요.",
      en: "Shows how you move and are perceived outside the home, in society and away places — travel and outward activity.",
      ja: "家の外、社会や他郷でどう動き評価されるか — 移動と外部の活動を見る場所です。",
    },
  },
  교우궁: {
    title: {
      ko: "친구와 사람들",
      en: "Friends and people around you",
      ja: "友人と周りの人々",
    },
    meaning: {
      ko: "친구·동료·아랫사람 등 넓은 인간관계에서 어떤 인연을 맺는지 보는 자리예요.",
      en: "Shows what kind of bonds you form in your wider circle — friends, colleagues, and juniors.",
      ja: "友人・同僚・目下の人など、広い人間関係でどんな縁を結ぶかを見る場所です。",
    },
  },
  관록궁: {
    title: {
      ko: "일과 사회적 성취",
      en: "Work and achievement",
      ja: "仕事と社会的な達成",
    },
    meaning: {
      ko: "직업과 커리어, 사회에서 무엇을 이루고 어떻게 인정받는지 보는 자리예요.",
      en: "Shows your job and career — what you accomplish in society and how you earn recognition.",
      ja: "職業とキャリア、社会で何を成し遂げどう認められるかを見る場所です。",
    },
  },
  전택궁: {
    title: {
      ko: "집과 머무는 공간",
      en: "Home and the space you keep",
      ja: "家と留まる空間",
    },
    meaning: {
      ko: "부동산과 가정 환경, 내가 뿌리내리고 쌓아두는 공간을 보는 자리예요.",
      en: "Shows real estate and home environment — the space where you put down roots and accumulate.",
      ja: "不動産と家庭環境、自分が根を下ろし蓄える空間を見る場所です。",
    },
  },
  복덕궁: {
    title: {
      ko: "마음의 여유와 복",
      en: "Peace of mind and fortune",
      ja: "心のゆとりと福",
    },
    meaning: {
      ko: "정신적 만족과 취미, 타고난 복과 행복을 느끼는 결을 보는 자리예요.",
      en: "Shows mental contentment and hobbies, your innate fortune, and the way you feel happiness.",
      ja: "精神的な満足と趣味、生まれ持った福や幸福を感じる質を見る場所です。",
    },
  },
  부모궁: {
    title: {
      ko: "부모와 윗사람",
      en: "Parents and elders",
      ja: "親と目上の人",
    },
    meaning: {
      ko: "부모님과 윗사람·스승과의 관계, 그리고 초년의 배움을 보는 자리예요.",
      en: "Shows your relationship with parents, elders, and mentors, as well as your early-life learning.",
      ja: "親や目上の人・師との関係、そして幼少期の学びを見る場所です。",
    },
  },
};
