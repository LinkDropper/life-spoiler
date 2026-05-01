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

  type Hit = { name: AnimalShortName; ratio: number; firstIndex: number };
  const hits: Hit[] = [];

  for (const name of ANIMAL_NAMES) {
    const firstIndex = section3Body.indexOf(name);
    if (firstIndex === -1) continue;

    const ratioRegex = new RegExp(
      `${name}\\s*([0-9]{1,3})\\s*%|([0-9]{1,3})\\s*%\\s*${name}`,
      "g"
    );
    let bestRatio = 0;
    let m: RegExpExecArray | null;
    while ((m = ratioRegex.exec(section3Body)) !== null) {
      const value = Number(m[1] ?? m[2] ?? "0");
      if (Number.isFinite(value) && value > bestRatio) bestRatio = value;
    }

    hits.push({ name, ratio: bestRatio, firstIndex });
  }

  if (hits.length === 0) return null;

  hits.sort((a, b) => {
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return a.firstIndex - b.firstIndex;
  });

  return hits[0].name;
};

const stripBold = (text: string): string =>
  text.replace(/\*\*(.+?)\*\*/g, "$1").trim();

const stripLeadingBullet = (line: string): string =>
  line.replace(/^\s*[-*+]\s+/, "").trim();

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
  /^(?:#{1,6}\s*)?\**\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한마디로)\s*\**\s*[:：]?\s*/u;

const extractOneLinerSummary = (body: string): string | null => {
  // case 1: "**한 줄 평:** ..." 인라인 패턴
  const inlineMatch = body.match(
    /\*\*\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한마디로)\s*\**\s*[:：]?\s*\**\s*([^\n]+)/u
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
        collected.push(stripBold(next));
      }
      if (collected.length > 0) return collected.join(" ").trim();
    }
  }

  return null;
};

const stripOneLinerBlock = (body: string): string => {
  // 인라인 "**한 줄 평:** ..." 한 줄 제거
  const out = body.replace(
    /\n?\s*\*\*\s*(?:한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한마디로)\s*\**\s*[:：]?\s*\**\s*[^\n]+/gu,
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
    /^(한\s*줄\s*평|한\s*줄\s*요약|한\s*줄\s*해석|한마디로)$/u.test(it.name)
  );
  let summary: string | null = null;
  if (summaryIndex !== -1) {
    summary = items[summaryIndex].body.replace(/\n+/g, " ").trim();
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
