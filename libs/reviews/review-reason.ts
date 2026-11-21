/**
 * 후기(Review) 불만 유형 칩 인코딩/디코딩
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

/** 후기 불만 유형 코드 (content 인코딩에 쓰이는 값, 언어와 무관하게 고정) */
export const REVIEW_REASON_CODES = [
  "generic",
  "cant_trust",
  "not_matching",
  "shallow",
  "not_specific",
] as const;

export type ReviewReasonCode = (typeof REVIEW_REASON_CODES)[number];

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
