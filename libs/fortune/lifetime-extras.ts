import type { PartnerProfile, TimingSection } from "@/libs/services/ai/types";

/**
 * 인생 운세 v4 추가 정보(타이밍·직업 분야·만날 사람)의 화면 노출 규칙.
 * 원칙: 데이터가 있는 것만 그린다. 구 결과(v3 이하)에는 필드가 없으므로 아무것도 그리지 않는다.
 */

export type TimingTopicKey = TimingSection["topic"];

const TIMING_ORDER: TimingTopicKey[] = ["love", "career", "move"];

const hasReason = (item: { reason: string }): boolean =>
  item.reason.trim().length > 0;

/**
 * 이유 문장이 없는 연도는 빼고(LLM이 그 연도를 빠뜨린 경우),
 * 그 결과 후보 연도도 조심할 해도 없는 주제는 뺀다.
 */
export const getVisibleTiming = (
  timing: TimingSection[] | undefined
): TimingSection[] =>
  (timing ?? [])
    .map((entry) => ({
      topic: entry.topic,
      likely: entry.likely.filter(hasReason),
      ...(entry.caution && hasReason(entry.caution)
        ? { caution: entry.caution }
        : {}),
    }))
    .filter((entry) => entry.likely.length > 0 || Boolean(entry.caution))
    .sort(
      (a, b) => TIMING_ORDER.indexOf(a.topic) - TIMING_ORDER.indexOf(b.topic)
    );

export interface TimingRow {
  year: number;
  reason: string;
  kind: "likely" | "caution";
}

/** 한 주제의 가능성이 높은 해와 조심할 해를 연도순 한 목록으로 */
export const toTimingRows = (entry: TimingSection): TimingRow[] =>
  [
    ...entry.likely.map((item) => ({ ...item, kind: "likely" as const })),
    ...(entry.caution ? [{ ...entry.caution, kind: "caution" as const }] : []),
  ].sort((a, b) => a.year - b.year);

/**
 * 추가 정보를 읽는 데 필요한 최소 형태.
 * 예고편 응답 타입(LifetimePreviewResult)도 이 형태로 받을 수 있게 모두 선택 필드다.
 */
export interface LifetimeExtrasSource {
  timing?: TimingSection[];
  categories?: {
    career?: { fields?: string[] };
    relationship?: { partner?: PartnerProfile };
  };
}

export const getCareerFields = (source: LifetimeExtrasSource): string[] =>
  (source.categories?.career?.fields ?? []).filter(
    (field) => field.trim().length > 0
  );

/** 성향·역할·만나는 길이 하나라도 비면 노출하지 않는다 */
export const getPartner = (
  source: LifetimeExtrasSource
): PartnerProfile | null => {
  const partner = source.categories?.relationship?.partner;
  if (!partner) return null;
  const traits = partner.traits.filter(Boolean);
  const meetingPaths = partner.meetingPaths.filter(Boolean);
  if (traits.length === 0 || meetingPaths.length === 0 || !partner.role) {
    return null;
  }
  return { traits, role: partner.role, meetingPaths };
};

export type LockedQuestion =
  | { kind: "timing"; topic: TimingTopicKey; count: number }
  | { kind: "caution"; topic: TimingTopicKey }
  | { kind: "fields"; count: number }
  | { kind: "partner" };

/** 예고편 잠금 라벨: 본편에 실제로 답이 있는 질문만 */
export const buildLockedQuestions = (
  source: LifetimeExtrasSource
): LockedQuestion[] => {
  const questions: LockedQuestion[] = [];
  for (const entry of getVisibleTiming(source.timing)) {
    if (entry.likely.length > 0) {
      questions.push({
        kind: "timing",
        topic: entry.topic,
        count: entry.likely.length,
      });
    }
    if (entry.caution) {
      questions.push({ kind: "caution", topic: entry.topic });
    }
  }
  const fields = getCareerFields(source);
  if (fields.length > 0) {
    questions.push({ kind: "fields", count: fields.length });
  }
  if (getPartner(source)) {
    questions.push({ kind: "partner" });
  }
  return questions;
};
