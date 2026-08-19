import { FRIEND_COMPATIBILITY_TIERS } from "@/libs/zi-wei-dou-shu/constants/friend-compatibility-table";

/**
 * tier 슬러그 → 한국어 라벨.
 *
 * 등급 구간/라벨은 엔진 상수를 단일 소스로 쓴다. UI에서 재정의하면
 * 슬러그·라벨·경계값이 두 곳에 존재하게 되어 조용히 어긋난다.
 *
 * 이 모듈은 클라이언트 번들에 포함되므로 엔진 루트 배럴(`@/libs/zi-wei-dou-shu`)이 아니라
 * 상수 모듈을 직접 가리킨다. 배럴을 쓰면 계산기·명반 생성 코드까지 함께 끌려온다.
 * (상수 모듈은 타입 import 하나뿐이라 자기완결적이다)
 */
const LABEL_BY_TIER = new Map(
  FRIEND_COMPATIBILITY_TIERS.map((tier) => [tier.tier, tier.labelKo])
);

export const getTierLabelKo = (tier: string): string =>
  LABEL_BY_TIER.get(tier) ?? tier;
