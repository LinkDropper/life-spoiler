import { createHash } from "crypto";

import type { Locale } from "@/i18n/config";

import type { ZiweiInterpretationRequest } from "./types";

// ============================================================
// 전생 캐릭터 좌표 시드
// ----------------------------------------------------------------
// 같은 사용자에 대해서는 결정론적으로 같은 좌표를 산출한다.
// 좌표는 6개 축에서 1개씩 골라 ~14만 가지 조합을 만든다.
// "캐릭터를 표에서 직접 매핑"하던 구조를 "좌표 안에서 LLM이
// 실존하는 종(種)을 자유 창작"하는 구조로 전환하기 위한 입력이다.
// ============================================================

export interface PastLifeCoordinates {
  region: string;
  era: string;
  category: string;
  scale: string;
  drama: string;
  position: string;
}

type AxisName = keyof PastLifeCoordinates;

const AXIS_OPTIONS: Record<Locale, Record<AxisName, string[]>> = {
  ko: {
    region: [
      "동아시아",
      "동남아시아",
      "남아시아",
      "중앙아시아",
      "중동",
      "북아프리카",
      "사하라 이남 아프리카",
      "유럽",
      "북·중미",
      "남미·안데스",
      "오세아니아·태평양 섬",
      "북극·시베리아 툰드라",
      "심해·대양",
      "사막·건조지대",
      "고산·고원지대",
    ],
    era: [
      "선사·신화 시대",
      "고대 (~AD 500)",
      "중세 (500~1500)",
      "근세 (1500~1800)",
      "근대 (1800~1900)",
      "20세기 초중반",
      "빙하기·간빙기",
      "공룡 시대 전후",
    ],
    category: [
      "인간",
      "포유류 (육상)",
      "조류",
      "파충류·양서류",
      "어류·해양생물",
      "곤충·절지류",
      "꽃·풀·관목",
      "교목·고목",
      "균류·이끼",
      "광물·암석",
      "기상 현상 (바람·구름·비)",
      "지형·지질 (강·산·동굴)",
    ],
    scale: [
      "미시 (벌·이끼 단위)",
      "작음 (작은 동물·풀)",
      "중간 (사람·중형 동물)",
      "큼 (고래·고목)",
      "거대 (산·해류)",
    ],
    drama: [
      "놀라우리만치 평온한 일생",
      "은은한 굴곡",
      "전형적인 산과 골",
      "격렬한 시련과 전성기",
      "찰나의 격변·이른 끝맺음",
    ],
    position: [
      "정점·중심 인물",
      "인정받는 일원",
      "평범한 일원",
      "주변·관찰자",
      "은둔·외톨이",
      "이방인·떠돌이",
    ],
  },
  en: {
    region: [
      "East Asia",
      "Southeast Asia",
      "South Asia",
      "Central Asia",
      "Middle East",
      "North Africa",
      "Sub-Saharan Africa",
      "Europe",
      "North & Central America",
      "South America / Andes",
      "Oceania & Pacific islands",
      "Arctic & Siberian tundra",
      "Deep ocean",
      "Desert & arid lands",
      "High mountains & plateaus",
    ],
    era: [
      "Prehistoric / mythic era",
      "Antiquity (~AD 500)",
      "Medieval (500~1500)",
      "Early modern (1500~1800)",
      "Modern (1800~1900)",
      "Early-to-mid 20th century",
      "Ice ages / interglacials",
      "Around the dinosaur era",
    ],
    category: [
      "Human",
      "Land mammal",
      "Bird",
      "Reptile / amphibian",
      "Fish / marine creature",
      "Insect / arthropod",
      "Flower / grass / shrub",
      "Tree / ancient tree",
      "Fungi / moss",
      "Mineral / rock",
      "Weather phenomenon (wind, cloud, rain)",
      "Landform (river, mountain, cave)",
    ],
    scale: [
      "Micro (bee / moss scale)",
      "Small (small animal / grass)",
      "Medium (human / mid-sized animal)",
      "Large (whale / ancient tree)",
      "Vast (mountain / ocean current)",
    ],
    drama: [
      "Surprisingly serene whole life",
      "Subtle ups and downs",
      "Classic peaks and valleys",
      "Fierce trials and triumphs",
      "Brief upheaval / early ending",
    ],
    position: [
      "Apex / central figure",
      "Respected member",
      "Ordinary member",
      "Outskirts / observer",
      "Recluse / loner",
      "Outsider / wanderer",
    ],
  },
  ja: {
    region: [
      "東アジア",
      "東南アジア",
      "南アジア",
      "中央アジア",
      "中東",
      "北アフリカ",
      "サハラ以南アフリカ",
      "ヨーロッパ",
      "北・中米",
      "南米・アンデス",
      "オセアニア・太平洋諸島",
      "北極・シベリアのツンドラ",
      "深海・大洋",
      "砂漠・乾燥地帯",
      "高山・高原地帯",
    ],
    era: [
      "先史・神話時代",
      "古代（〜AD 500）",
      "中世（500〜1500）",
      "近世（1500〜1800）",
      "近代（1800〜1900）",
      "20世紀前中半",
      "氷河期・間氷期",
      "恐竜時代前後",
    ],
    category: [
      "人間",
      "陸棲哺乳類",
      "鳥類",
      "爬虫類・両生類",
      "魚類・海洋生物",
      "昆虫・節足動物",
      "花・草・低木",
      "高木・古木",
      "菌類・苔",
      "鉱物・岩石",
      "気象現象（風・雲・雨）",
      "地形・地質（川・山・洞窟）",
    ],
    scale: [
      "極微（蜂・苔スケール）",
      "小（小動物・草）",
      "中（人間・中型動物）",
      "大（鯨・古木）",
      "巨大（山・海流）",
    ],
    drama: [
      "驚くほど穏やかな一生",
      "ほのかな起伏",
      "典型的な山と谷",
      "激しい試練と栄光",
      "刹那の激変・早い終わり",
    ],
    position: [
      "頂点・中心人物",
      "認められる一員",
      "平凡な一員",
      "周辺・観察者",
      "隠者・孤独者",
      "異邦人・放浪者",
    ],
  },
};

// ============================================================
// 명반 → 소프트 가중치
// ----------------------------------------------------------------
// 캐릭터 결정의 70%는 시드(균등 분포)에서, 30%는 명반에서.
// 가중치가 너무 강하면 다시 "복덕궁 = 캐릭터" 구조로 돌아가므로
// 인덱스를 ±2 이내로만 미세 조정한다.
// ============================================================

interface ChartBias {
  category: number;
  scale: number;
  drama: number;
  position: number;
}

const STAR_GROUPS: Record<string, string[]> = {
  human: ["자미", "태양", "거문", "천량", "천상", "무곡", "천기", "문창", "문곡"],
  wild: ["탐랑", "칠살", "파군", "염정"],
  quiet: ["천동", "태음"],
  storm: ["칠살", "파군"],
  calm: ["천동", "천부"],
  big: ["자미", "무곡", "파군"],
  small: ["천동", "천기", "태음"],
  apex: ["자미", "무곡", "태양"],
  loner: ["천량", "칠살", "파군", "천동"],
};

const computeChartBias = (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): ChartBias => {
  const fortunePalace = request.palaces["복덕궁"];
  const firstStar = fortunePalace?.mainStars[0]?.name ?? "";
  const brightness = fortunePalace?.mainStars[0]?.brightness ?? "";
  const sihua = request.chart.sihua;

  let category = 0;
  let scale = 0;
  let drama = 0;
  let position = 0;

  // category: 인간↔야생↔식물 방향만 살짝
  if (STAR_GROUPS.human.includes(firstStar)) category -= 2;
  if (STAR_GROUPS.wild.includes(firstStar)) category += 1;
  if (STAR_GROUPS.quiet.includes(firstStar)) category += 5;

  // scale: 큰 별이면 +, 작은 별이면 -
  if (STAR_GROUPS.big.includes(firstStar)) scale += 1;
  if (STAR_GROUPS.small.includes(firstStar)) scale -= 1;

  // drama: 격변 별 + 화기 위치 + 어두운 밝기
  if (STAR_GROUPS.storm.includes(firstStar)) drama += 2;
  if (STAR_GROUPS.calm.includes(firstStar)) drama -= 2;
  if (sihua.huaji.palace === "복덕궁" || sihua.huaji.palace === "질액궁") {
    drama += 1;
  }
  if (sihua.hualu.palace === "복덕궁") drama -= 1;
  if (brightness === "평" || brightness === "함") drama += 1;

  // position: 정점 vs 외톨이
  if (STAR_GROUPS.apex.includes(firstStar)) position -= 2;
  if (STAR_GROUPS.loner.includes(firstStar)) position += 2;

  return { category, scale, drama, position };
};

// ============================================================
// 좌표 추출
// ============================================================

const pickByByte = <T>(options: T[], byte: number, bias = 0): T => {
  const len = options.length;
  const idx = (((byte + bias) % len) + len) % len;
  return options[idx];
};

const buildSeedKey = (
  request: Omit<ZiweiInterpretationRequest, "requestType">
): string =>
  [
    request.user.lunarBirthInfo,
    request.user.gender,
    request.user.relationshipStatus ?? "",
    request.user.occupationStatus ?? "",
  ].join("|");

export const generatePastLifeCoordinates = (
  request: Omit<ZiweiInterpretationRequest, "requestType">,
  locale: Locale
): PastLifeCoordinates => {
  const hash = createHash("sha256").update(buildSeedKey(request)).digest();
  const opts = AXIS_OPTIONS[locale] ?? AXIS_OPTIONS.ko;
  const bias = computeChartBias(request);

  return {
    region: pickByByte(opts.region, hash[0]),
    era: pickByByte(opts.era, hash[1]),
    category: pickByByte(opts.category, hash[2], bias.category),
    scale: pickByByte(opts.scale, hash[3], bias.scale),
    drama: pickByByte(opts.drama, hash[4], bias.drama),
    position: pickByByte(opts.position, hash[5], bias.position),
  };
};

// ============================================================
// 프롬프트 주입용 포맷터
// ============================================================

const COORDINATE_LABELS: Record<Locale, Record<AxisName, string>> = {
  ko: {
    region: "무대 (대륙·지역)",
    era: "시대",
    category: "존재 카테고리",
    scale: "규모",
    drama: "드라마성",
    position: "사회·생태적 위계",
  },
  en: {
    region: "Stage (continent / region)",
    era: "Era",
    category: "Being category",
    scale: "Scale",
    drama: "Dramaturgy",
    position: "Social / ecological position",
  },
  ja: {
    region: "舞台（大陸・地域）",
    era: "時代",
    category: "存在カテゴリ",
    scale: "規模",
    drama: "ドラマ性",
    position: "社会・生態的位置",
  },
};

const COORDINATE_INTRO: Record<Locale, string> = {
  ko: `## 🎯 이번 사용자의 전생 좌표 (반드시 준수)
아래 좌표는 명반 기운 + 사용자 고유 시드로 산출된 이번 사용자만의 무대입니다.
이 좌표 안에서 **실존하는(했던) 구체적 종(種)·존재**를 직접 골라 캐릭터를 창작하세요.
좌표를 무시하고 다른 카테고리/시대/지역으로 이동하지 마세요.`,
  en: `## 🎯 This user's past life coordinates (mandatory)
These coordinates are derived from the chart's energy plus a deterministic per-user seed.
Pick a **specific real species / being that exists (or existed)** within these coordinates and create the character.
Do not drift to a different category, era, or region.`,
  ja: `## 🎯 このユーザーの前世座標（必ず遵守）
以下の座標は命盤の気運とユーザー固有のシードから算出された、このユーザー固有の舞台です。
この座標内で**実在する（した）具体的な種・存在**を直接選び、キャラクターを創作してください。
座標を無視して別のカテゴリ／時代／地域に移動しないこと。`,
};

const COORDINATE_OUTRO: Record<Locale, string> = {
  ko: `위 좌표는 캐릭터 본체(headline / existenceType / description / imagePrompt)와 세계 묘사(world / birth / journey / end)에 모두 일관되게 반영하세요.
좌표가 어색하다고 다른 좌표로 갈아타지 말 것 — 그 안에서 창작하는 게 다양성의 핵심입니다.
- "드라마성: 찰나의 격변·이른 끝맺음" → 며칠/한 계절짜리 짧은 일생.
- "카테고리: 광물·암석" → 흑요석·자수정·소금·운모 같은 실존 광물 이름.
- "카테고리: 기상 현상" → 계절풍·천둥구름·아침안개·우박 같은 실존 현상.
- "카테고리: 균류·이끼" → 송이버섯·붉은 영지·바위이끼 같은 실존 종.
- "위계: 이방인·떠돌이" → 고향이 없거나 이주 중인 존재.
좌표가 인간이 아니면 imagePrompt에서 "portrait/face/person/human" 단어 절대 금지.`,
  en: `Apply these coordinates consistently across the character body (headline / existenceType / description / imagePrompt) and the world description (world / birth / journey / end).
If a coordinate feels awkward, do NOT switch to another — creating within it is the whole point of diversity.
- "Dramaturgy: brief upheaval / early ending" → a life of days or one season.
- "Category: Mineral / rock" → real mineral names (obsidian, amethyst, salt, mica).
- "Category: Weather phenomenon" → real phenomena (monsoon, thunderhead, morning fog, hail).
- "Category: Fungi / moss" → real species (matsutake, reishi, rock moss).
- "Position: Outsider / wanderer" → a being with no homeland or in migration.
If the category is non-human, NEVER use "portrait/face/person/human" in imagePrompt.`,
  ja: `上記の座標はキャラクター本体（headline / existenceType / description / imagePrompt）と世界描写（world / birth / journey / end）の両方に一貫して反映してください。
座標が不自然に思えても別の座標に乗り換えないこと — その中で創作するのが多様性の核心です。
- 「ドラマ性：刹那の激変・早い終わり」→ 数日〜一季節の短い一生。
- 「カテゴリ：鉱物・岩石」→ 黒曜石・アメジスト・塩・雲母など実在の鉱物名。
- 「カテゴリ：気象現象」→ モンスーン・雷雲・朝霧・雹など実在の現象。
- 「カテゴリ：菌類・苔」→ 松茸・霊芝・岩苔など実在の種。
- 「位置：異邦人・放浪者」→ 故郷を持たない、または移住中の存在。
カテゴリが人間でなければ imagePrompt で "portrait/face/person/human" を絶対に使わないこと。`,
};

export const formatCoordinatesForPrompt = (
  coords: PastLifeCoordinates,
  locale: Locale
): string => {
  const labels = COORDINATE_LABELS[locale] ?? COORDINATE_LABELS.ko;
  const intro = COORDINATE_INTRO[locale] ?? COORDINATE_INTRO.ko;
  const outro = COORDINATE_OUTRO[locale] ?? COORDINATE_OUTRO.ko;

  const lines = [
    `- **${labels.region}**: ${coords.region}`,
    `- **${labels.era}**: ${coords.era}`,
    `- **${labels.category}**: ${coords.category}`,
    `- **${labels.scale}**: ${coords.scale}`,
    `- **${labels.drama}**: ${coords.drama}`,
    `- **${labels.position}**: ${coords.position}`,
  ].join("\n");

  return `${intro}\n\n${lines}\n\n${outro}`;
};

// ============================================================
// 카테고리 라벨 → schema enum 매핑
// ----------------------------------------------------------------
// 좌표가 정한 카테고리를 LLM이 spoiler.existenceType으로
// 변환할 때 헷갈리지 않도록 명시적 매핑 가이드를 제공한다.
// 실패 시 "human"으로 폴백.
// ============================================================

const CATEGORY_TO_TYPE: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /인간|human|人間/i, type: "human" },
  { pattern: /포유류|mammal|哺乳/i, type: "mammal" },
  { pattern: /조류|bird|鳥/i, type: "bird" },
  { pattern: /파충|양서|reptile|amphibian|爬虫|両生/i, type: "reptile" },
  { pattern: /어류|해양|fish|marine|魚|海洋/i, type: "fish" },
  { pattern: /곤충|절지|insect|arthropod|昆虫|節足/i, type: "insect" },
  { pattern: /꽃|풀|관목|교목|고목|tree|flower|grass|shrub|花|草|低木|高木|古木/i, type: "plant" },
  { pattern: /균류|이끼|fungi|moss|菌|苔/i, type: "fungi" },
  { pattern: /광물|암석|mineral|rock|鉱物|岩石/i, type: "mineral" },
  { pattern: /기상|weather|wind|cloud|rain|気象|風|雲|雨/i, type: "weather" },
  { pattern: /지형|지질|landform|river|mountain|cave|地形|地質|川|山|洞窟/i, type: "landform" },
];

export const categoryLabelToExistenceType = (categoryLabel: string): string => {
  for (const { pattern, type } of CATEGORY_TO_TYPE) {
    if (pattern.test(categoryLabel)) return type;
  }
  return "human";
};
