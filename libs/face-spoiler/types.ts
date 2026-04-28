// ============================================================
// 관상 리포트 데이터 타입 (Phase 21 — 단일 OpenAI 호출 흐름).
//
// 새 흐름은 `NEW_PROMPT + 사진` 단일 호출로 plain text를 받는다.
// 이전 v2/v3 구조(signature/overallScore/regionScores/interestAreas/closing)
// 는 폐기되고, 클라이언트는 rawText를 markdown으로 렌더한다.
// ============================================================

export interface FaceReportData {
  /** 스키마 버전. v4부터 새 흐름. */
  version: 4;
  /** OpenAI가 반환한 텍스트 그대로. 마크다운으로 렌더된다. */
  rawText: string;
  /** 생성 시각 (ISO 8601). */
  generatedAt: string;
}

export const isFaceReport = (value: unknown): value is FaceReportData => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FaceReportData>;
  return (
    v.version === 4 &&
    typeof v.rawText === "string" &&
    v.rawText.length > 0 &&
    typeof v.generatedAt === "string"
  );
};
