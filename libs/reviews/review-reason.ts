/**
 * 후기(Review) 칩(좋았던 점·아쉬운 점) 인코딩/디코딩
 *
 * @description
 * `reviews` 테이블에는 칩(불만 유형) 전용 컬럼이 없다. 마이그레이션 없이도
 * 기존 `content`(text, NOT NULL) 컬럼 하나에 칩 선택값과 자유 텍스트를 함께
 * 저장하기 위한 인코딩 포맷이다.
 *
 * 포맷: `[reason1,reason2] 자유 텍스트`
 * - 칩을 하나 이상 선택했으면 앞에 `[코드,코드]` 형태로 대괄호 + 콤마 구분 코드 목록을 붙인다.
 * - 자유 텍스트가 있으면 대괄호 뒤에 공백 하나를 두고 이어붙인다.
 * - 칩이 없으면 대괄호 없이 자유 텍스트만 저장한다.
 * - 칩도 자유 텍스트도 없으면 빈 문자열을 저장한다 (content는 NOT NULL이지만 빈 문자열은 허용).
 *
 * 예)
 * - encodeReviewContent(["generic", "shallow"], "너무 뻔했어요")
 *   → "[generic,shallow] 너무 뻔했어요"
 * - encodeReviewContent(["generic"], "")
 *   → "[generic]"
 * - encodeReviewContent([], "좋았어요")
 *   → "좋았어요"
 * - encodeReviewContent([], "")
 *   → ""
 */

/** 아쉬운 점 칩 (별점 1~3점일 때) */
export const REVIEW_DISLIKE_CODES = [
  "generic",
  "cant_trust",
  "not_matching",
  "shallow",
  "not_specific",
] as const;

/** 좋았던 점 칩 (별점 4~5점일 때, 2026-11 추가) */
export const REVIEW_LIKE_CODES = [
  "relatable",
  "specific",
  "clear_chart",
  "actionable",
  "shareable",
] as const;

/** 후기 칩 코드 전체 (content 인코딩에 쓰이는 값, 언어와 무관하게 고정) */
export const REVIEW_REASON_CODES = [
  ...REVIEW_DISLIKE_CODES,
  ...REVIEW_LIKE_CODES,
] as const;

export type ReviewReasonCode = (typeof REVIEW_REASON_CODES)[number];

/** 이 별점 이하면 아쉬운 점 칩, 넘으면 좋았던 점 칩을 보여 준다 */
export const LOW_RATING_THRESHOLD = 3;

export const getReviewReasonCodes = (
  rating: number
): readonly ReviewReasonCode[] =>
  rating > LOW_RATING_THRESHOLD ? REVIEW_LIKE_CODES : REVIEW_DISLIKE_CODES;

/**
 * 칩 코드 → 번역 키 (messages `fortune.common.review.reasons.*`).
 * 코드는 DB에 저장되는 값이라 snake_case 그대로 두고, 화면 문구만 camelCase 키로 찾는다.
 */
export const REVIEW_REASON_MESSAGE_KEYS: Record<ReviewReasonCode, string> = {
  generic: "generic",
  cant_trust: "cantTrust",
  not_matching: "notMatching",
  shallow: "shallow",
  not_specific: "notSpecific",
  relatable: "relatable",
  specific: "specific",
  clear_chart: "clearChart",
  actionable: "actionable",
  shareable: "shareable",
};

const isReviewReasonCode = (value: string): value is ReviewReasonCode =>
  (REVIEW_REASON_CODES as readonly string[]).includes(value);

const REVIEW_REASON_PREFIX_PATTERN = /^\[([a-z_,]+)\](?: ([\s\S]*))?$/;

/** 칩 인코딩 프리픽스가 가질 수 있는 최대 길이(대괄호 + 콤마 + 뒤 공백 포함) */
export const MAX_REVIEW_REASON_PREFIX_LENGTH =
  `[${REVIEW_REASON_CODES.join(",")}] `.length;

export const encodeReviewContent = (
  reasons: readonly ReviewReasonCode[],
  freeText: string
): string => {
  const trimmedText = freeText.trim();

  if (reasons.length === 0) {
    return trimmedText;
  }

  const prefix = `[${reasons.join(",")}]`;
  return trimmedText ? `${prefix} ${trimmedText}` : prefix;
};

/** 인코딩된 content를 칩 코드 배열 + 자유 텍스트로 분리 (파싱 실패 시 전체를 자유 텍스트로 취급) */
export const decodeReviewContent = (
  content: string
): { reasons: ReviewReasonCode[]; freeText: string } => {
  const match = content.match(REVIEW_REASON_PREFIX_PATTERN);

  if (!match) {
    return { reasons: [], freeText: content };
  }

  const codes = match[1].split(",").filter(isReviewReasonCode);
  if (codes.length === 0) {
    return { reasons: [], freeText: content };
  }

  return { reasons: codes, freeText: match[2] ?? "" };
};
