import type { DailyCategory } from "@/libs/zi-wei-dou-shu/calculators/daily-fortune-types";

import type { DailyCta } from "./types";

interface ResolveDailyCtaParams {
  /** 주의 포인트 카테고리. CTA 분석 파라미터의 기준 */
  cautionCategory: DailyCategory;
  /** 해당 프로필의 인생운세 이용 권한 (결제 또는 무료 이용권) */
  hasLifetime: boolean;
}

/**
 * 결과 화면 공통 위치의 유료 CTA 1개를 정한다 (인생운세 단일화).
 *
 * - 미구매: 인생운세 CTA
 * - 구매자: 올해운세/궁합 보기 링크로 대체
 * - 건강: 의료 오해·불안 마케팅을 막기 위해 CTA가 건강 카테고리에 묶이지 않는다.
 *   건강이 주의 포인트여도 공통 위치의 CTA는 그대로 나가되 분석 카테고리는 overall로 둔다.
 */
export const resolveDailyCta = ({
  cautionCategory,
  hasLifetime,
}: ResolveDailyCtaParams): DailyCta => ({
  category: cautionCategory === "health" ? "overall" : cautionCategory,
  product: hasLifetime ? "yearly_compatibility" : "lifetime",
});
