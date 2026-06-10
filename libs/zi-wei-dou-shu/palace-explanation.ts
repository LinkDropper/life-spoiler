import type { Locale } from "@/i18n/config";

import {
  BRIGHTNESS_INFO,
  MINOR_STAR_INFO,
  PALACE_INFO,
  SIHUA_INFO,
  STAR_COMBOS,
  STAR_IN_PALACE,
} from "./constants/explanations";
import type { BrightnessKey, SihuaKey } from "./constants/explanations";
import type { PalaceName } from "./constants/palaces";
import type { MainStarName, MinorStarName } from "./constants/stars";
import {
  translateMainStar,
  translateMinorStar,
  translatePalaceName,
} from "./i18n";
import type { Palace, Sihua } from "./types";

// ============================================================
// 출력 타입
// ============================================================

/** 패널 상단에 이름만 보여줄 별 칩 */
export interface PalaceStarChip {
  name: string;
  rawName: string;
  isMain: boolean;
}

/**
 * 한 궁(셀)에 놓인 별들을 "하나의 조합"으로 합성한 해석.
 * 별을 하나하나 따로 설명하지 않고, 메인 조합을 핵심으로 두고
 * 밝기·사화·보조성(길성/살성)의 영향을 한 단락으로 녹인다.
 */
export interface PalaceExplanation {
  rawPalaceName: string;
  palaceName: string;
  /** 일반어 한 줄 라벨 */
  title: string;
  /** 이 궁이 무엇을 보는 자리인지 (부제) */
  meaning: string;
  /** 주인공 주성이 없는 궁(공궁)인지 */
  isEmpty: boolean;
  /** 이 자리에 있는 별들 (이름 칩 표시용) */
  stars: PalaceStarChip[];
  /** 통합 해석 한 단락 (강점·핵심) */
  reading: string;
  /** 통합 주의 한 단락 (양면성) */
  caution?: string;
}

// ============================================================
// 내부 헬퍼
// ============================================================

const PALACE_NAMES_SET = new Set<string>(Object.keys(PALACE_INFO));

const isPalaceName = (name: string): name is PalaceName =>
  PALACE_NAMES_SET.has(name);

const LIST_SEP: Record<Locale, string> = { ko: "·", en: ", ", ja: "・" };

const join = (parts: Array<string | undefined | null>): string =>
  parts.filter((p) => p && p.trim().length > 0).join(" ");

// 두 주성 동궁 노트 (정렬 순서 무관 조회)
const lookupCombo = (
  starA: string,
  starB: string,
  locale: Locale
): string | undefined => {
  const combo =
    STAR_COMBOS[`${starA}+${starB}`] ?? STAR_COMBOS[`${starB}+${starA}`];
  return combo?.note[locale];
};

// 메인 별 조합의 핵심 풀이 (긍정/핵심) + 단독일 때의 주의
const buildCore = (
  palace: Palace,
  allPalaces: Palace[],
  locale: Locale,
  palaceName: PalaceName
): { core: string; coreCaution?: string } => {
  const mains = palace.mainStars;
  const palaceStarMap = STAR_IN_PALACE[palaceName];

  if (mains.length === 0) {
    return { core: buildEmptyCore(palace, allPalaces, locale) };
  }

  if (mains.length === 1) {
    const entry = palaceStarMap[mains[0].name as MainStarName];
    return {
      core: entry?.energy[locale] ?? "",
      coreCaution: entry?.caution[locale],
    };
  }

  // 2개 이상: 두 주성이 합쳐진 동궁 풀이를 핵심으로 (각각 설명하지 않음)
  const comboNote = lookupCombo(mains[0].name, mains[1].name, locale);
  if (comboNote) {
    return { core: comboNote };
  }
  // 폴백: 동궁 노트가 없으면 첫 주성의 궁별 풀이
  const entry = palaceStarMap[mains[0].name as MainStarName];
  return {
    core: entry?.energy[locale] ?? "",
    coreCaution: entry?.caution[locale],
  };
};

const buildEmptyCore = (
  palace: Palace,
  allPalaces: Palace[],
  locale: Locale
): string => {
  const oppositeBranch = ((palace.branch + 6) % 12) as Palace["branch"];
  const oppositePalace = allPalaces.find((p) => p.branch === oppositeBranch);
  const oppositeTitle =
    oppositePalace && isPalaceName(oppositePalace.name)
      ? PALACE_INFO[oppositePalace.name].title[locale]
      : undefined;

  if (locale === "en") {
    const facing = oppositeTitle ? ` (${oppositeTitle})` : "";
    return `There's no leading main star here, so this area has a lighter fixed color and responds more flexibly to the facing area${facing} and the smaller stars nearby.`;
  }
  if (locale === "ja") {
    const facing = oppositeTitle ? `(${oppositeTitle})` : "";
    return `ここには中心となる主役の星がないので、決まった色が薄く、向かい合う場所${facing}の気運やそばの小さな星に柔軟に反応します。`;
  }
  const facing = oppositeTitle ? `(${oppositeTitle})` : "맞은편 자리";
  return `이 자리엔 중심이 되는 주인공 별이 없어서, 정해진 색이 옅고 마주 보는 자리${facing}의 기운과 곁의 작은 별들에 더 유연하게 반응해요.`;
};

// 밝기 → 긍정 절(reading) / 주의 절(caution)
const brightnessClause = (
  brightness: string | undefined,
  locale: Locale
): { positive?: string; caution?: string } => {
  if (brightness === "묘" || brightness === "왕") {
    return {
      positive: BRIGHTNESS_INFO[brightness as BrightnessKey].phrase[locale],
    };
  }
  if (brightness === "평" || brightness === "함") {
    return {
      caution: BRIGHTNESS_INFO[brightness as BrightnessKey].phrase[locale],
    };
  }
  return {}; // 득·리는 생략 (군더더기 방지)
};

// 사화 → 긍정 절 / 주의 절
const sihuaClauses = (
  sihuas: Sihua[],
  locale: Locale
): { positive: string[]; caution: string[] } => {
  const positive: string[] = [];
  const caution: string[] = [];
  for (const sihua of sihuas) {
    const phrase = SIHUA_INFO[sihua as SihuaKey]?.phrase[locale];
    if (!phrase) continue;
    if (sihua === "화기") caution.push(phrase);
    else positive.push(phrase);
  }
  return { positive, caution };
};

// 보조성 그룹별 통합 절
const minorClauses = (
  minorStars: Palace["minorStars"],
  locale: Locale
): { helper?: string; mobile?: string; challenger?: string } => {
  const helpers: string[] = [];
  const challengers: string[] = [];
  let hasMobile = false;

  for (const star of minorStars) {
    const entry = MINOR_STAR_INFO[star.name as MinorStarName];
    if (!entry) continue;
    if (entry.group === "helper") helpers.push(entry.keyword[locale]);
    else if (entry.group === "challenger")
      challengers.push(entry.keyword[locale]);
    else if (entry.group === "mobile") hasMobile = true;
  }

  const sep = LIST_SEP[locale];
  const result: { helper?: string; mobile?: string; challenger?: string } = {};

  if (helpers.length > 0) {
    const kw = helpers.join(sep);
    result.helper =
      locale === "en"
        ? `Alongside, supportive energies like ${kw} make things flow more smoothly.`
        : locale === "ja"
          ? `そばで${kw}のような気運が支えてくれて、ずっとスムーズに運びます。`
          : `곁에서 ${kw} 같은 기운이 받쳐줘서 한결 수월하게 풀려요.`;
  }

  if (hasMobile) {
    result.mobile =
      locale === "en"
        ? `There's also an energy of movement and change — the more you move, the more doors open.`
        : locale === "ja"
          ? `ここには移動と変化の気運があり、動くほど道が開けます。`
          : `여기에 이동과 변화의 기운이 있어, 자리를 옮기거나 움직일수록 길이 열려요.`;
  }

  if (challengers.length > 0) {
    const kw = challengers.join(sep);
    result.challenger =
      locale === "en"
        ? `That said, rougher energies like ${kw} also slip in, so things can swing or go off track — pace yourself and slow down a beat to get through.`
        : locale === "ja"
          ? `ただし${kw}のような荒い気運も混じり、流れに波が出たり物事がずれやすくなります。ペースを調整し、一拍遅らせると乗り越えられます。`
          : `다만 ${kw} 같은 거친 기운도 함께 끼어서, 흐름에 기복이 생기거나 일이 어긋나기 쉬워요. 속도를 조절하고 한 박자 늦추면 넘길 수 있어요.`;
  }

  return result;
};

// ============================================================
// 메인: 궁 → 하나로 합성된 해석
// ============================================================

/**
 * 한 궁에 놓인 모든 별을 "하나의 조합"으로 합성해 패널에 바로
 * 렌더링할 수 있는 구조로 반환한다. AI 호출 없음, 순수 함수.
 *
 * @param palace 대상 궁
 * @param allPalaces 같은 명반의 전체 12궁 (공궁의 대궁 조회용)
 * @param locale 표시 언어
 */
export const buildPalaceExplanation = (
  palace: Palace,
  allPalaces: Palace[],
  locale: Locale
): PalaceExplanation | null => {
  if (!isPalaceName(palace.name)) {
    return null;
  }
  const palaceName = palace.name;
  const info = PALACE_INFO[palaceName];

  const stars: PalaceStarChip[] = [
    ...palace.mainStars.map((s) => ({
      name: translateMainStar(s.name, locale),
      rawName: s.name,
      isMain: true,
    })),
    ...palace.minorStars.map((s) => ({
      name: translateMinorStar(s.name, locale),
      rawName: s.name,
      isMain: false,
    })),
  ];

  const { core, coreCaution } = buildCore(
    palace,
    allPalaces,
    locale,
    palaceName
  );

  // 대표 밝기 = 첫 주성 (조합 전체의 기세를 한 번만 언급)
  const primaryBrightness = palace.mainStars[0]?.brightness;
  const bright = brightnessClause(primaryBrightness, locale);

  // 사화는 본궁의 모든 별에서 수집 (중복 제거)
  const sihuaSet = new Set<Sihua>();
  for (const s of [...palace.mainStars, ...palace.minorStars]) {
    if (s.sihua) sihuaSet.add(s.sihua);
  }
  const sihua = sihuaClauses([...sihuaSet], locale);

  const minor = minorClauses(palace.minorStars, locale);

  const reading = join([
    core,
    bright.positive,
    ...sihua.positive,
    minor.helper,
    minor.mobile,
  ]);

  const cautionText = join([
    coreCaution,
    bright.caution,
    ...sihua.caution,
    minor.challenger,
  ]);

  return {
    rawPalaceName: palaceName,
    palaceName: translatePalaceName(palaceName, locale),
    title: info.title[locale],
    meaning: info.meaning[locale],
    isEmpty: palace.mainStars.length === 0,
    stars,
    reading,
    caution: cautionText.length > 0 ? cautionText : undefined,
  };
};
