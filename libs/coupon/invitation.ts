/**
 * 쿠폰함 = 시사회 초대장 서랍 (2026-11-06).
 * 결제 화면이 가진 쿠폰을 자동으로 보여 주므로, 초대장의 주 행동은 "그 운세 보러 가기"다.
 */

/** /api/coupon/list 한 줄 */
export interface CouponInvitation {
  id: string;
  code: string;
  benefitType: "free_fortune" | "discount";
  fortuneType: string;
  discountPercent: number | null;
  status: "active" | "used" | "expired";
  validUntil: string | null;
  campaignName: string | null;
  createdAt: string;
}

/** 초대장 문구 키 (messages `coupon.films.*`) */
export type InvitationFilm =
  | "all"
  | "lifetime"
  | "yearly"
  | "compatibility"
  | "past_life"
  | "yearly_2027";

const FILMS: readonly InvitationFilm[] = [
  "all",
  "lifetime",
  "yearly",
  "compatibility",
  "past_life",
  "yearly_2027",
];

export const toInvitationFilm = (fortuneType: string): InvitationFilm =>
  FILMS.find((film) => film === fortuneType) ?? "all";

/** 초대장으로 볼 운세의 입구: 프로필 운세는 출연진 명단(누가 주연인지), 궁합은 라인업, 전체는 홈 */
const FILM_HREF: Record<InvitationFilm, string> = {
  all: "/home",
  lifetime: "/profiles?type=lifetime",
  yearly: "/profiles?type=yearly",
  compatibility: "/compatibility",
  past_life: "/profiles?type=past-life",
  yearly_2027: "/profiles?type=yearly_2027",
};

export const getInvitationHref = (fortuneType: string): string =>
  FILM_HREF[toInvitationFilm(fortuneType)];

const STATUS_ORDER: Record<CouponInvitation["status"], number> = {
  active: 0,
  used: 1,
  expired: 2,
};

/** 쓸 수 있는 초대장부터, 같은 상태끼리는 받은 순서(최신 먼저) 그대로 */
export const sortInvitations = (
  coupons: readonly CouponInvitation[]
): CouponInvitation[] =>
  coupons
    .map((coupon, index) => ({ coupon, index }))
    .sort(
      (a, b) =>
        STATUS_ORDER[a.coupon.status] - STATUS_ORDER[b.coupon.status] ||
        a.index - b.index
    )
    .map(({ coupon }) => coupon);

/** 2026-12-31T… → 2026.12.31 */
export const formatInvitationDate = (value: string | null): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${month}.${day}`;
};
