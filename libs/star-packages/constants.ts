export type StarPackageId = "starter" | "best" | "mania";

export interface StarPackage {
  id: StarPackageId;
  paidFragments: number;
  bonusFragments: number;
  totalFragments: number;
  priceKRW: number;
  priceUSD: number;
}

export const STAR_PACKAGES: Record<StarPackageId, StarPackage> = {
  starter: {
    id: "starter",
    paidFragments: 3,
    bonusFragments: 0,
    totalFragments: 3,
    priceKRW: 990,
    priceUSD: 0.99,
  },
  best: {
    id: "best",
    paidFragments: 9,
    bonusFragments: 1,
    totalFragments: 10,
    priceKRW: 2970,
    priceUSD: 2.99,
  },
  mania: {
    id: "mania",
    paidFragments: 30,
    bonusFragments: 3,
    totalFragments: 33,
    priceKRW: 9900,
    priceUSD: 9.99,
  },
};
