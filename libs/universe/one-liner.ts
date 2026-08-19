import { FRIEND_ONE_LINERS } from "@/libs/zi-wei-dou-shu/constants/friend-compatibility-table";
import { OWNER_ONE_LINERS } from "@/libs/zi-wei-dou-shu/constants/owner-one-liner-table";

/**
 * 한줄평 ID → 한국어 원문.
 *
 * 스냅샷에는 `one_liner_id`만 저장하고 문구는 조회 시점에 채운다.
 * 문구를 얼려두면 오타 수정과 EN/JA 확장이 과거 행에 반영되지 않기 때문이다.
 * (슬러그는 append-only 계약 — ziwei-expert 확약)
 *
 * 슬러그가 사전에 없으면 빈 문자열 대신 중립 문구를 돌려준다.
 * append-only가 지켜지면 발생하지 않지만, 발생 시 카드가 비어 보이는 것보다는 낫다.
 */
const FALLBACK_KO = "두 사람의 궤도를 아직 정리하는 중이에요.";

export const resolveOneLinerKo = (oneLinerId: string): string =>
  FRIEND_ONE_LINERS[oneLinerId]?.ko ?? FALLBACK_KO;

/**
 * owner 한줄평 ID → 한국어 원문.
 *
 * `resolveOneLinerKo`(친구 궁합용)와 동일한 계약: 스냅샷에는 ID만 저장하고 문구는
 * 조회 시점에 `OWNER_ONE_LINERS`에서 조회한다 (append-only, ziwei-expert 소유).
 * 사전에 없는 슬러그는 빈 문자열 대신 중립 문구로 대체한다.
 */
const OWNER_FALLBACK_KO = "아직 이 우주의 이야기를 정리하는 중이에요.";

export const resolveOwnerOneLinerKo = (oneLinerId: string): string =>
  OWNER_ONE_LINERS[oneLinerId]?.ko ?? OWNER_FALLBACK_KO;
