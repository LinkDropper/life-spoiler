// ============================================================
// 관상스포 결제 전 미리보기 파서.
//
// LLM이 반환한 sections[].body 마크다운을 디자인의 카드 구조에 맞게 분해한다.
// 데이터(DB) 자체는 LLM 원본 그대로 보존하고, 렌더 시점에만 변환한다.
//
// - section 1 (종합 인상): lead paragraph + 핵심 포인트 불릿 + "한 줄 평" 요약
// - section 2 (부위별 특징): 소제목 기반 sub-section 카드 + 마지막 한 줄 평
// - section 3 (동물상): 본문에서 동물상 짧은 이름(예: "여우상") 추출.
//   prompt에 정의된 12종 화이트리스트와 매칭하며, "X% + Y%" 같은 비율 표현이
//   있으면 가장 높은 비율의 동물상을 채택한다.
// ============================================================

import type { FaceReportSection } from "./types";

const ANIMAL_NAMES = [
  "강아지상",
  "고양이상",
  "여우상",
  "사슴상",
  "곰상",
  "토끼상",
  "늑대상",
  "공룡상",
  "판다상",
  "호랑이상",
  "독수리상",
  "너구리상",
] as const;

export type AnimalShortName = (typeof ANIMAL_NAMES)[number];

interface AnimalHit {
  name: AnimalShortName;
  ratio: number;
  firstIndex: number;
}

const collectAnimalHits = (body: string): AnimalHit[] => {
  const hits: AnimalHit[] = [];

  for (const name of ANIMAL_NAMES) {
    const firstIndex = body.indexOf(name);
    if (firstIndex === -1) continue;

    const ratioRegex = new RegExp(
      `${name}\\s*([0-9]{1,3})\\s*%|([0-9]{1,3})\\s*%\\s*${name}`,
      "g"
    );
    let bestRatio = 0;
    let m: RegExpExecArray | null;
    while ((m = ratioRegex.exec(body)) !== null) {
      const value = Number(m[1] ?? m[2] ?? "0");
      if (Number.isFinite(value) && value > bestRatio) bestRatio = value;
    }

    hits.push({ name, ratio: bestRatio, firstIndex });
  }

  hits.sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return a.firstIndex - b.firstIndex;
  });

  return hits;
};

/**
 * 동물상 섹션(번호 3) 본문에서 대표 동물상 이름을 추출한다.
 * - 본문 안의 "비율%" 패턴을 우선 탐지해 가장 높은 비율의 동물상을 선택.
 * - 비율 표기가 없으면 본문에서 가장 먼저 등장하는 동물상을 채택.
 * - 화이트리스트와 매칭되는 게 없으면 null 반환.
 */
export const extractAnimalShortName = (
  section3Body: string
): AnimalShortName | null => {
  if (!section3Body) return null;
  const hits = collectAnimalHits(section3Body);
  return hits.length > 0 ? hits[0].name : null;
};

export interface AnimalRatio {
  name: AnimalShortName;
  /** 0~100 정수. 비율 표기가 없으면 0. */
  ratio: number;
}

/**
 * 동물상 섹션 본문에서 첫 줄/단락이 비율 메타("**여우상 65% + 곰상 35%**" 같은
 * 라벨성 라인)면 제거한다. 카드 상단 배지(oneLiner) 와 중복되는 것을 막는다.
 *
 * 판단 기준: 첫 단락에 동물상 이름이 등장하고, 텍스트의 절반 이상이 비율/이름/
 * 마크다운 강조/구분자로만 이뤄져 있으면 메타로 본다.
 */
export const stripAnimalRatioPrefix = (section3Body: string): string => {
  if (!section3Body) return "";
  const paragraphs = section3Body.split(/\n{2,}/);
  if (paragraphs.length === 0) return section3Body;

  const first = paragraphs[0].trim();
  const compact = first.replace(/\s+/g, "");
  const hasAnimal = ANIMAL_NAMES.some((name) => first.includes(name));
  const hasRatio = /[0-9]{1,3}\s*%/.test(first);
  // 이 줄이 본문 설명이 아닌 메타 라벨인지 — 글자 수가 짧고 비율 토큰이 들어 있을 때.
  const isLikelyMeta =
    hasAnimal && hasRatio && compact.length <= 40 && !/[.!?]/.test(first);

  if (!isLikelyMeta) return section3Body;
  return paragraphs.slice(1).join("\n\n").trim();
};

export interface AnimalSectionParsed {
  /** 본문(prose) — 비율 메타 + 한 줄 정리 subsection 제거 후. */
  description: string;
  /** "한 줄 정리" 등의 한 줄 평. 알림 카드로 별도 노출. */
  summary: string | null;
}

const ANIMAL_SUMMARY_HEADING_REGEX =
  /^#{1,6}\s*\**\s*(?:최종\s*)?(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로|기억에\s*남는\s*한\s*줄|마지막\s*한\s*마디)\s*\**\s*$/u;

/**
 * 다른 소제목(heading) 으로 보이는 라인 — summary block 종료 판정용.
 *
 * markdown 표준은 `# ` 뒤에 공백을 요구하지만, LLM 이 \`###제목\` 처럼 공백 없이
 * 출력하는 경우도 종료 시그널로 인정해야 한다(그러지 않으면 summary block 이
 * 영속되어 본문이 통째로 잘려 데이터 손실로 이어짐).
 * (?!#) 로 7+ 연속 해시(코드/구분자)는 제외.
 */
const HEADING_LINE_REGEX = /^#{1,6}(?!#)/;

/**
 * "**한 줄 평:** ...", "**최종 한 줄 평:** ..." 같은 인라인 한 줄 평 라인.
 * 라벨 + 콜론 + 본문 형태가 한 줄 안에 들어 있는 경우만 매칭.
 */
const ONE_LINER_INLINE_LINE_REGEX =
  /^\s*\**\s*(?:최종\s*)?(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로|기억에\s*남는\s*한\s*줄|마지막\s*한\s*마디)\s*\**\s*[:：]\s*\**\s*\S.*$/u;

/**
 * body 에서 한 줄 평 / 한 줄 정리 / 최종 한 줄 평 등의 subsection 과 인라인
 * 한 줄 평 라인을 모두 제거한다.
 *
 * - 헤딩(`### 한 줄 정리`, `### 최종 한 줄 평` 등) + 그 아래 본문(다음 헤딩까지)
 *   을 통째로 버린다.
 * - "**한 줄 평:** ..." 같은 인라인 한 줄도 라인 단위로 버린다.
 * - 동물상 섹션의 비율 prefix 처리는 별도 (stripAnimalRatioPrefix).
 *
 * 새 프롬프트는 이런 subsection 을 만들지 않도록 지시하지만, legacy 리포트나
 * LLM 비순응 케이스를 위해 UI 측에서도 방어적으로 잘라낸다.
 */
export const stripOneLinerSubsections = (body: string): string => {
  if (!body) return "";

  const lines = body.split(/\n/);
  const kept: string[] = [];
  let inSummaryBlock = false;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (ANIMAL_SUMMARY_HEADING_REGEX.test(trimmed)) {
      inSummaryBlock = true;
      continue;
    }

    // summary block 진행 중인데 새로운 헤딩(다른 소제목)을 만나면 종료
    if (inSummaryBlock && HEADING_LINE_REGEX.test(raw)) {
      inSummaryBlock = false;
      kept.push(raw);
      continue;
    }

    if (inSummaryBlock) continue;

    // 단독 인라인 한 줄 평 라인 — 라인 통째 제거
    if (ONE_LINER_INLINE_LINE_REGEX.test(trimmed)) continue;

    kept.push(raw);
  }

  return kept
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

/**
 * 동물상 섹션 본문을 description(평문) + summary(한 줄 알림) 으로 분리한다.
 *
 * - body 안에 `### 한 줄 정리` 류 헤딩이 있으면 그 아래 본문을 summary 로 빼낸다.
 * - 빼낸 summary 는 불릿/줄바꿈을 평탄화해 평문 한 문장으로 정규화한다.
 * - 비율 메타 prefix(stripAnimalRatioPrefix) 도 description 에서 제거한다.
 * - summary 가 헤딩 형태로 없으면 인라인 `**한 줄 평:** ...` 패턴도 시도.
 */
export const parseAnimalSection = (
  section3Body: string
): AnimalSectionParsed => {
  if (!section3Body) return { description: "", summary: null };

  const stripped = stripAnimalRatioPrefix(section3Body);
  const lines = stripped.split(/\n/);

  // 헤딩 기반 추출
  const keptLines: string[] = [];
  const summaryLines: string[] = [];
  let inSummaryBlock = false;
  let foundSummaryHeading = false;

  for (const raw of lines) {
    if (ANIMAL_SUMMARY_HEADING_REGEX.test(raw.trim())) {
      foundSummaryHeading = true;
      inSummaryBlock = true;
      continue;
    }
    // 새 헤딩을 만나면 summary block 종료 (공백 없는 \`###제목\` 도 인정)
    if (inSummaryBlock && HEADING_LINE_REGEX.test(raw)) {
      inSummaryBlock = false;
      keptLines.push(raw);
      continue;
    }
    if (inSummaryBlock) {
      summaryLines.push(raw);
    } else {
      keptLines.push(raw);
    }
  }

  const description = keptLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  let summary: string | null = null;
  if (foundSummaryHeading) {
    summary = flattenToPlainSentence(summaryLines.join("\n")) || null;
  } else {
    // 인라인 패턴 fallback
    summary = extractOneLinerSummary(stripped);
  }

  return { description, summary };
};

/**
 * 동물상 섹션 본문에서 최대 2개 동물상과 비율을 추출한다.
 * - 비율이 명시된 hit 우선, 그 다음 등장 순.
 * - 단일 동물상(100%)인 경우엔 1개만 반환.
 * - 두 개의 비율 합이 100이 안되면 부족분은 0으로 둔다 (UI 측에서 처리).
 */
export const parseAnimalRatios = (section3Body: string): AnimalRatio[] => {
  if (!section3Body) return [];
  const hits = collectAnimalHits(section3Body);
  if (hits.length === 0) return [];

  const top = hits.slice(0, 2).map((h) => ({ name: h.name, ratio: h.ratio }));

  // 둘 다 비율이 있으면 그대로 반환.
  // 단일 동물상이면 100%로 보정 (비율 표기가 없는 경우).
  if (top.length === 1 && top[0].ratio === 0) {
    return [{ name: top[0].name, ratio: 100 }];
  }

  return top;
};

const stripBold = (text: string): string =>
  text.replace(/\*\*(.+?)\*\*/g, "$1").trim();

const stripLeadingBullet = (line: string): string =>
  line.replace(/^\s*[-*+]\s+/, "").trim();

// 불릿 리스트/줄바꿈이 섞인 짧은 요약을 한 줄 평문으로 평탄화한다.
// "- 첫째\n- 둘째" → "첫째 둘째"
const flattenToPlainSentence = (text: string): string =>
  text
    .split(/\n/)
    .map((line) => stripBold(stripLeadingBullet(line)).trim())
    .filter((line) => line.length > 0)
    .join(" ");

const splitParagraphs = (body: string): string[] =>
  body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

const extractFirstBulletList = (body: string): string[] => {
  const lines = body.split(/\n/);
  const items: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const isBullet = /^\s*[-*+]\s+/.test(raw);
    if (isBullet) {
      inList = true;
      items.push(stripBold(stripLeadingBullet(raw)));
    } else if (inList) {
      if (raw.trim() === "") {
        if (items.length >= 3) break;
        continue;
      }
      // bullet가 아닌 본문이면 리스트 종료
      break;
    }
  }
  return items;
};

const ONE_LINER_LABEL_REGEX =
  /^(?:#{1,6}\s*)?\**\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로)\s*\**\s*[:：]?\s*/u;

const extractOneLinerSummary = (body: string): string | null => {
  // case 1: "**한 줄 평:** ..." 인라인 패턴
  const inlineMatch = body.match(
    /\*\*\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로)\s*\**\s*[:：]?\s*\**\s*([^\n]+)/u
  );
  if (inlineMatch) {
    return stripBold(inlineMatch[1])
      .replace(/^["“”']+|["“”']+$/g, "")
      .trim();
  }

  // case 2: "### 한 줄 평\n본문" 헤딩 패턴
  const lines = body.split(/\n/);
  for (let i = 0; i < lines.length; i++) {
    if (ONE_LINER_LABEL_REGEX.test(lines[i])) {
      const collected: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next === "") {
          if (collected.length > 0) break;
          continue;
        }
        if (/^#{1,6}\s/.test(next)) break;
        collected.push(stripBold(stripLeadingBullet(next)));
      }
      if (collected.length > 0) return collected.join(" ").trim();
    }
  }

  return null;
};

const stripOneLinerBlock = (body: string): string => {
  // 인라인 "**한 줄 평:** ..." 한 줄 제거
  const out = body.replace(
    /\n?\s*\*\*\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로)\s*\**\s*[:：]?\s*\**\s*[^\n]+/gu,
    ""
  );

  // 헤딩 + 후속 단락 블록 제거
  const lines = out.split(/\n/);
  const kept: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (ONE_LINER_LABEL_REGEX.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping) {
      // 새 헤딩 만나면 skipping 종료 후 해당 라인 keep
      if (/^#{1,6}\s/.test(line)) {
        skipping = false;
        kept.push(line);
      }
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n").trim();
};

export interface FirstImpressionParsed {
  /** 도입 단락 — 카드 본문 진입부에 표시. */
  lead: string;
  /** 핵심 포인트 3개 (있으면). */
  points: string[];
  /** "한마디로" 카드에 노출될 한 줄 요약. */
  summary: string | null;
}

/**
 * section 1 (종합 인상) 본문을 lead / points / summary 로 분해한다.
 *
 * 본문 형태가 다양해서 (### 소제목 + 불릿 / 단순 단락 + **강조** / 표) 이 함수는
 * 보장된 결과를 주지 않는다. 누락 시 컴포넌트가 graceful 하게 fallback 한다.
 */
export const parseFirstImpression = (
  section1Body: string
): FirstImpressionParsed => {
  const cleaned = stripOneLinerBlock(section1Body);
  const paragraphs = splitParagraphs(cleaned);

  // 헤딩과 본문이 같은 단락에 묶인 경우(`### 제목\n본문`) 헤딩 라인을 떼어낸다.
  let lead = "";
  for (const p of paragraphs) {
    const withoutHeading = p
      .split(/\n/)
      .filter((line) => !/^#{1,6}\s/.test(line) && !/^\s*[-*+]\s+/.test(line))
      .join("\n")
      .trim();
    if (withoutHeading) {
      lead = stripBold(withoutHeading);
      break;
    }
  }

  const points = extractFirstBulletList(section1Body).slice(0, 3);
  const summary = extractOneLinerSummary(section1Body);

  return { lead, points, summary };
};

export interface PartsSubSection {
  /** sub-section 이름 (예: "눈", "코", "입", "얼굴형 / 전체 구조"). */
  name: string;
  /** sub-section 본문. 평문(마크다운 강조는 stripBold 처리됨). */
  body: string;
}

/**
 * 부위별 특징 sub-section 이름 정규화 — LLM 응답이 표기를 자유롭게 변형해도
 * UI 에 노출되는 라벨은 고정된 카피로 통일한다.
 *
 * - "얼굴형/윤곽", "얼굴형 / 전체 윤곽" 등 → "얼굴형 / 전체 구조"
 * - "기억에 남는 한 줄", "기억에 남는 한줄" → "한 줄 정리"
 */
const normalizePartsSubSectionName = (raw: string): string => {
  const trimmed = raw.trim();
  if (/^얼굴형/.test(trimmed)) return "얼굴형 / 전체 구조";
  if (/^기억에\s*남는\s*한\s*줄$/u.test(trimmed)) return "한 줄 정리";
  return trimmed;
};

export interface PartsParsed {
  items: PartsSubSection[];
  summary: string | null;
}

/**
 * section 2 (부위별 특징) 본문을 sub-section 배열 + 한 줄 평으로 분해한다.
 *
 * 마크다운 헤딩 (`### 눈`, `### 코` 등) 단위로 분리. 헤딩 자체가 "한 줄 평"
 * 같은 메타 라벨이면 summary 로 빼낸다. 헤딩이 전혀 없는 본문이면 items 가
 * 빈 배열이 된다 (이 경우 PreviewPartsSection 이 fallback 처리).
 */
export const parseParts = (section2Body: string): PartsParsed => {
  const lines = section2Body.split(/\n/);
  const items: PartsSubSection[] = [];
  let current: { name: string; body: string[] } | null = null;
  const flushCurrent = () => {
    if (!current) return;
    const trimmedBody = current.body
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (current.name && trimmedBody) {
      // body 는 마크다운 그대로 보존 — 컴포넌트가 ReactMarkdown 으로 렌더한다.
      items.push({ name: current.name, body: trimmedBody });
    }
    current = null;
  };

  for (const raw of lines) {
    const headingMatch = raw.match(/^#{1,6}\s+(.+?)\s*$/);
    if (headingMatch) {
      flushCurrent();
      const rawName = stripBold(headingMatch[1]).trim();
      current = { name: normalizePartsSubSectionName(rawName), body: [] };
    } else if (current) {
      current.body.push(raw);
    }
  }
  flushCurrent();

  // "한 줄 평" 류 sub-section 은 summary 로 분리
  const summaryIndex = items.findIndex((it) =>
    /^(한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한\s*줄\s*정리|한마디로)$/u.test(
      it.name
    )
  );
  let summary: string | null = null;
  if (summaryIndex !== -1) {
    // 불릿/줄바꿈이 섞여 있어도 한 줄 평문으로 평탄화해서 노출한다.
    summary = flattenToPlainSentence(items[summaryIndex].body) || null;
    items.splice(summaryIndex, 1);
  }

  // sub-section 이 없으면 본문 안의 인라인 "한 줄 평" 패턴도 시도
  if (!summary) {
    summary = extractOneLinerSummary(section2Body);
  }

  return { items, summary };
};

/**
 * sections 배열에서 번호로 섹션을 찾는다. 없으면 null.
 */
export const findSectionByNumber = (
  sections: FaceReportSection[],
  number: number
): FaceReportSection | null =>
  sections.find((s) => s.number === number) ?? null;
