import { FRIEND_COMPATIBILITY_TIERS } from "@/libs/zi-wei-dou-shu/constants/friend-compatibility-table";

/**
 * 친구 시사회 좌석 배치도 — 점수 → 열/좌석 배정 (순수 함수).
 *
 * 열은 점수 구간이다. 구간 경계는 엔진 등급(FRIEND_COMPATIBILITY_TIERS)에서
 * 그대로 파생해 숫자를 따로 두지 않는다 (등급 구간이 바뀌어도 어긋나지 않게).
 * 높은 등급이 A열(스크린 바로 앞)이다.
 *
 * 클라이언트 번들에 포함되므로 엔진 루트 배럴이 아니라 상수 모듈을 직접 가리킨다
 * (`tier.ts`와 같은 이유).
 */

/** 한 열의 좌석 수 */
export const SEATS_PER_ROW = 9;

/**
 * 한 열 안에서 앉는 순서(좌석 번호). 점수 높은 사람부터 가운데에서 바깥으로 채운다.
 * 마지막 좌석(9번)은 열이 넘칠 때 "+N" 자리가 된다.
 */
export const SEAT_FILL_ORDER = [5, 4, 6, 3, 7, 2, 8, 1, 9] as const;

/** 열이 넘칠 때 실제 관객이 앉는 좌석 수 (마지막 한 자리는 "+N") */
const VISIBLE_SEATS_WHEN_FULL = SEATS_PER_ROW - 1;

const ROW_TIERS = [...FRIEND_COMPATIBILITY_TIERS].sort(
  (a, b) => b.minScore - a.minScore
);

/** A, B, C … 점수가 높은 열부터 */
export const SEAT_ROW_LABELS: readonly string[] = ROW_TIERS.map((_, index) =>
  String.fromCharCode("A".charCodeAt(0) + index)
);

export interface SeatMapGuestInput {
  starSeed: string;
  name: string;
  score: number;
}

export type SeatCell =
  | { kind: "empty" }
  | { kind: "guest"; starSeed: string; initial: string; isMine: boolean }
  | { kind: "overflow"; count: number };

export interface SeatMapRow {
  label: string;
  /** 인덱스 0 = 1번 좌석 … 인덱스 8 = 9번 좌석 */
  cells: SeatCell[];
  /** 이 열에 앉아야 하는 전체 관객 수 (넘친 인원 포함) */
  audienceCount: number;
  /** "+N"으로 접힌 인원 수 (넘치지 않으면 0) */
  overflowCount: number;
}

export interface GuestSeat {
  rowLabel: string;
  /** 열이 넘쳐 좌석을 못 받았으면 null (열 단위로만 표기한다) */
  seatNumber: number | null;
}

export interface SeatMap {
  rows: SeatMapRow[];
  seatsByStarSeed: Map<string, GuestSeat>;
}

/** 점수가 앉을 열의 인덱스. 어느 구간에도 안 걸리면 맨 뒷열 */
export const getSeatRowIndex = (score: number): number => {
  const index = ROW_TIERS.findIndex((tier) => score >= tier.minScore);
  return index === -1 ? ROW_TIERS.length - 1 : index;
};

/** "E8" 같은 좌석 번호. 좌석을 못 받았으면 null */
export const formatSeatLabel = (seat: GuestSeat): string | null =>
  seat.seatNumber === null ? null : `${seat.rowLabel}${seat.seatNumber}`;

/** 이름 첫 글자 (이모지·결합 문자가 깨지지 않게 grapheme 단위) */
export const getNameInitial = (name: string): string => {
  const trimmed = name.trim();

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    const [first] = segmenter.segment(trimmed);
    return (first?.segment ?? "").toUpperCase();
  }

  return (Array.from(trimmed)[0] ?? "").toUpperCase();
};

const createEmptyCells = (): SeatCell[] =>
  Array.from({ length: SEATS_PER_ROW }, () => ({ kind: "empty" }));

/**
 * 좌석 배정.
 *
 * - 열: 점수 구간. 열 안 순서: 점수 내림차순, 동점은 `guests` 배열 순서.
 * - 한 열이 9명을 넘으면 8명만 앉고 9번 자리가 "+N"이 된다.
 * - 내 자리는 항상 보인다: 내가 넘치는 쪽이면 마지막 보이는 자리를 내가 차지하고
 *   밀려난 사람은 "+N"에 센다.
 */
export const buildSeatMap = (
  guests: readonly SeatMapGuestInput[],
  selfStarSeed: string | null
): SeatMap => {
  const membersByRow: SeatMapGuestInput[][] = ROW_TIERS.map(() => []);

  guests.forEach((guest) => {
    membersByRow[getSeatRowIndex(guest.score)]?.push(guest);
  });

  const seatsByStarSeed = new Map<string, GuestSeat>();

  const rows = membersByRow.map((rawMembers, rowIndex): SeatMapRow => {
    const label = SEAT_ROW_LABELS[rowIndex] ?? "";
    // Array.prototype.sort는 안정 정렬이라 동점은 입력 순서를 유지한다
    const members = [...rawMembers].sort((a, b) => b.score - a.score);
    const isOverflowing = members.length > SEATS_PER_ROW;
    const visibleCount = isOverflowing
      ? VISIBLE_SEATS_WHEN_FULL
      : members.length;
    const seated = members.slice(0, visibleCount);

    if (isOverflowing && selfStarSeed !== null) {
      const selfIndex = members.findIndex(
        (member) => member.starSeed === selfStarSeed
      );
      const self = members[selfIndex];

      if (self && selfIndex >= visibleCount) {
        seated[visibleCount - 1] = self;
      }
    }

    const cells = createEmptyCells();
    const seatedStarSeeds = new Set<string>();

    seated.forEach((member, order) => {
      const seatNumber = SEAT_FILL_ORDER[order];

      if (seatNumber === undefined) {
        return;
      }

      cells[seatNumber - 1] = {
        kind: "guest",
        starSeed: member.starSeed,
        initial: getNameInitial(member.name),
        isMine: member.starSeed === selfStarSeed,
      };
      seatedStarSeeds.add(member.starSeed);
      seatsByStarSeed.set(member.starSeed, { rowLabel: label, seatNumber });
    });

    const overflowCount = members.length - seated.length;

    if (overflowCount > 0) {
      const overflowSeatNumber = SEAT_FILL_ORDER[VISIBLE_SEATS_WHEN_FULL];

      if (overflowSeatNumber !== undefined) {
        cells[overflowSeatNumber - 1] = {
          kind: "overflow",
          count: overflowCount,
        };
      }

      members
        .filter((member) => !seatedStarSeeds.has(member.starSeed))
        .forEach((member) => {
          seatsByStarSeed.set(member.starSeed, {
            rowLabel: label,
            seatNumber: null,
          });
        });
    }

    return {
      label,
      cells,
      audienceCount: members.length,
      overflowCount,
    };
  });

  return { rows, seatsByStarSeed };
};
