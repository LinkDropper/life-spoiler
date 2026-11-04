/**
 * 친구 시사회 엔딩 크레딧 — 보여 줄 관객 / 접을 관객 계획 (순수 함수).
 *
 * 1~3위는 "베스트 관객"(항상 보임), 4~5위까지만 목록에 펼쳐 두고 나머지는
 * "관객 N명 더보기"로 접는다. 내 행은 접지 않는다: 6위 밖이면 접힌 목록 앞쪽에
 * 점선으로 떨어져 항상 보인다.
 */

/** 베스트 관객 수 (1위 큰 패널 + 2·3위 두 칸) */
export const CREDITS_BEST_COUNT = 3;

/** 접기 전에 보이는 순위 상한 (1~5위) */
export const CREDITS_VISIBLE_RANK_LIMIT = 5;

export interface CreditsEntry<T> {
  /** 1부터 시작하는 순위 (동점도 배열 순서대로 순위가 갈린다) */
  rank: number;
  guest: T;
  isMine: boolean;
  /** "더보기" 전에는 감춰진다 */
  isFolded: boolean;
  /** 내 행이 보이는 순위 밖이라 점선으로 떨어져 보이는 경우 */
  isDetached: boolean;
}

export interface CreditsPlan<T> {
  best: CreditsEntry<T>[];
  rest: CreditsEntry<T>[];
  /** 접혀 있는 관객 수 ("관객 N명 더보기"의 N) */
  foldedCount: number;
}

/** `guests`는 점수 내림차순으로 이미 정렬돼 있어야 한다 */
export const buildCreditsPlan = <T extends { starSeed: string }>(
  guests: readonly T[],
  selfStarSeed: string | null
): CreditsPlan<T> => {
  const entries = guests.map((guest, index): CreditsEntry<T> => {
    const rank = index + 1;
    const isMine = selfStarSeed !== null && guest.starSeed === selfStarSeed;
    const isBeyondVisible = rank > CREDITS_VISIBLE_RANK_LIMIT;

    return {
      rank,
      guest,
      isMine,
      isFolded: isBeyondVisible && !isMine,
      isDetached: isBeyondVisible && isMine,
    };
  });

  const best = entries.slice(0, CREDITS_BEST_COUNT);
  const rest = entries.slice(CREDITS_BEST_COUNT);

  return {
    best,
    rest,
    foldedCount: rest.filter((entry) => entry.isFolded).length,
  };
};

/** 좌석 배치도의 열 링크가 가리키는, 크레딧 속 그 열 첫 관객의 앵커 id */
export const ROW_ANCHOR_PREFIX = "screening-row-";

export const getRowAnchorId = (rowLabel: string): string =>
  `${ROW_ANCHOR_PREFIX}${rowLabel}`;
