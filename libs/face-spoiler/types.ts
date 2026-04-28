// ============================================================
// 관상 리포트 데이터 타입 (Phase 21 — 단일 OpenAI 호출 + JSON 강제 구조).
//
// 흐름: NEW_PROMPT + 사진 단일 호출 + `response_format: json_schema strict`로
// 반환받는 sections 배열을 그대로 저장. UI는 파싱 없이 .map만으로 렌더한다.
// ============================================================

export interface FaceReportSection {
  /** 섹션 순번 (1~17, NEW_PROMPT의 "구성" 번호와 일치). */
  number: number;
  /** 섹션 제목 (번호·기호 없이 이름만). */
  title: string;
  /** 섹션 본문 (마크다운 — 표·소제목·리스트 가능). */
  body: string;
}

export interface FaceReportData {
  /** 스키마 버전. v5부터 sections 구조. */
  version: 5;
  sections: FaceReportSection[];
  /** 생성 시각 (ISO 8601). */
  generatedAt: string;
}

const isValidSection = (value: unknown): value is FaceReportSection => {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<FaceReportSection>;
  return (
    typeof s.number === "number" &&
    typeof s.title === "string" &&
    typeof s.body === "string"
  );
};

export const isFaceReport = (value: unknown): value is FaceReportData => {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<FaceReportData>;
  return (
    v.version === 5 &&
    Array.isArray(v.sections) &&
    v.sections.length > 0 &&
    v.sections.every(isValidSection) &&
    typeof v.generatedAt === "string"
  );
};
