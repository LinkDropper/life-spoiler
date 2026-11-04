import { describe, expect, it } from "@jest/globals";

import { FRIEND_COMPATIBILITY_TIERS } from "@/libs/zi-wei-dou-shu/constants/friend-compatibility-table";

import {
  SEAT_FILL_ORDER,
  SEAT_ROW_LABELS,
  buildSeatMap,
  formatSeatLabel,
  getNameInitial,
  getSeatRowIndex,
} from "../seat-map";

import type { SeatCell, SeatMapGuestInput } from "../seat-map";

const guest = (
  starSeed: string,
  score: number,
  name = starSeed
): SeatMapGuestInput => ({ starSeed, name, score });

const guestsInRow = (
  count: number,
  score: number,
  prefix: string
): SeatMapGuestInput[] =>
  Array.from({ length: count }, (_, index) =>
    guest(`${prefix}${index + 1}`, score)
  );

const seatOf = (
  map: ReturnType<typeof buildSeatMap>,
  starSeed: string
): string | null => {
  const seat = map.seatsByStarSeed.get(starSeed);
  return seat ? formatSeatLabel(seat) : null;
};

const cellKinds = (cells: SeatCell[]): string[] =>
  cells.map((cell) => cell.kind);

describe("열 구간", () => {
  it("열 이름은 엔진 등급 수만큼 A부터 이어진다", () => {
    expect(SEAT_ROW_LABELS).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(SEAT_ROW_LABELS).toHaveLength(FRIEND_COMPATIBILITY_TIERS.length);
  });

  it("구간 경계 점수가 기획의 열과 일치한다", () => {
    expect(getSeatRowIndex(99)).toBe(0);
    expect(getSeatRowIndex(90)).toBe(0);
    expect(getSeatRowIndex(89)).toBe(1);
    expect(getSeatRowIndex(78)).toBe(1);
    expect(getSeatRowIndex(77)).toBe(2);
    expect(getSeatRowIndex(66)).toBe(2);
    expect(getSeatRowIndex(65)).toBe(3);
    expect(getSeatRowIndex(54)).toBe(3);
    expect(getSeatRowIndex(53)).toBe(4);
    expect(getSeatRowIndex(42)).toBe(4);
    expect(getSeatRowIndex(41)).toBe(5);
    expect(getSeatRowIndex(12)).toBe(5);
  });

  it("엔진 등급의 하한·상한과 열 인덱스가 모두 같다", () => {
    FRIEND_COMPATIBILITY_TIERS.forEach((tier, index) => {
      expect(getSeatRowIndex(tier.minScore)).toBe(index);
      expect(getSeatRowIndex(tier.maxScore)).toBe(index);
    });
  });
});

describe("buildSeatMap 기본 배정", () => {
  it("관객이 0명이면 6열 모두 빈 좌석 9개다", () => {
    const map = buildSeatMap([], null);

    expect(map.rows).toHaveLength(6);
    map.rows.forEach((row) => {
      expect(row.audienceCount).toBe(0);
      expect(row.overflowCount).toBe(0);
      expect(cellKinds(row.cells)).toEqual(Array(9).fill("empty"));
    });
    expect(map.seatsByStarSeed.size).toBe(0);
  });

  it("점수에 맞는 열에 앉고 첫 사람은 가운데 5번이다", () => {
    const map = buildSeatMap(
      [guest("a", 93), guest("b", 77), guest("c", 62), guest("d", 20)],
      null
    );

    expect(seatOf(map, "a")).toBe("A5");
    expect(seatOf(map, "b")).toBe("C5");
    expect(seatOf(map, "c")).toBe("D5");
    expect(seatOf(map, "d")).toBe("F5");
  });

  it("한 열은 5→4→6→3→7→2→8→1→9 순서로 점수 높은 사람부터 앉는다", () => {
    const guests = Array.from({ length: 9 }, (_, index) =>
      guest(`g${index}`, 89 - index)
    );
    const map = buildSeatMap(guests, null);

    SEAT_FILL_ORDER.forEach((seatNumber, order) => {
      expect(seatOf(map, `g${order}`)).toBe(`B${seatNumber}`);
    });
  });

  it("입력 순서가 섞여도 열 안에서는 점수 내림차순으로 앉는다", () => {
    const map = buildSeatMap(
      [guest("low", 80), guest("high", 88), guest("mid", 84)],
      null
    );

    expect(seatOf(map, "high")).toBe("B5");
    expect(seatOf(map, "mid")).toBe("B4");
    expect(seatOf(map, "low")).toBe("B6");
  });

  it("동점이면 입력(응답 배열) 순서대로 앉는다", () => {
    const map = buildSeatMap(
      [guest("first", 60), guest("second", 60), guest("third", 60)],
      null
    );

    expect(seatOf(map, "first")).toBe("D5");
    expect(seatOf(map, "second")).toBe("D4");
    expect(seatOf(map, "third")).toBe("D6");
  });

  it("좌석 칸에는 이름 첫 글자가 들어가고 내 자리만 isMine이다", () => {
    const map = buildSeatMap(
      [guest("a", 50, "민지"), guest("b", 49, "Zed")],
      "b"
    );
    const row = map.rows.at(4);

    expect(row?.cells[4]).toEqual({
      kind: "guest",
      starSeed: "a",
      initial: "민",
      isMine: false,
    });
    expect(row?.cells[3]).toEqual({
      kind: "guest",
      starSeed: "b",
      initial: "Z",
      isMine: true,
    });
  });
});

describe("열이 넘칠 때", () => {
  it("정확히 9명이면 전원 앉고 +N이 없다", () => {
    const map = buildSeatMap(guestsInRow(9, 70, "c"), null);
    const row = map.rows.at(2);

    expect(row?.overflowCount).toBe(0);
    expect(cellKinds(row?.cells ?? [])).toEqual(Array(9).fill("guest"));
    expect(seatOf(map, "c9")).toBe("C9");
  });

  it("10명이면 8명이 앉고 9번 자리가 +2가 된다", () => {
    const map = buildSeatMap(guestsInRow(10, 60, "d"), null);
    const row = map.rows.at(3);

    expect(row?.audienceCount).toBe(10);
    expect(row?.overflowCount).toBe(2);
    expect(row?.cells[8]).toEqual({ kind: "overflow", count: 2 });
    expect(cellKinds(row?.cells.slice(0, 8) ?? [])).toEqual(
      Array(8).fill("guest")
    );
    expect(seatOf(map, "d8")).toBe("D1");
    // 넘친 사람은 좌석 번호 없이 열만 안다
    expect(seatOf(map, "d9")).toBeNull();
    expect(map.seatsByStarSeed.get("d10")).toEqual({
      rowLabel: "D",
      seatNumber: null,
    });
  });

  it("내가 넘치는 쪽이면 마지막 보이는 자리를 차지하고 밀려난 사람도 +N에 센다", () => {
    const guests = guestsInRow(12, 60, "d");
    const map = buildSeatMap(guests, "d11");
    const row = map.rows.at(3);

    expect(row?.overflowCount).toBe(4);
    expect(row?.cells[8]).toEqual({ kind: "overflow", count: 4 });
    // 마지막 보이는 자리(채우는 순서 8번째 = 좌석 1번)를 내가 가진다
    expect(row?.cells[0]).toMatchObject({
      kind: "guest",
      starSeed: "d11",
      isMine: true,
    });
    expect(seatOf(map, "d11")).toBe("D1");
    // 원래 8번째였던 사람은 밀려나 열만 안다
    expect(seatOf(map, "d8")).toBeNull();
    expect(seatOf(map, "d7")).toBe("D8");
  });

  it("내가 보이는 쪽이면 자리가 바뀌지 않는다", () => {
    const map = buildSeatMap(guestsInRow(12, 60, "d"), "d3");

    expect(seatOf(map, "d3")).toBe("D6");
    expect(map.rows[3]?.overflowCount).toBe(4);
  });

  it("넘치지 않는 열에서는 내 위치가 영향받지 않는다", () => {
    const map = buildSeatMap(guestsInRow(9, 60, "d"), "d9");

    expect(seatOf(map, "d9")).toBe("D9");
    expect(map.rows[3]?.overflowCount).toBe(0);
  });
});

describe("getNameInitial", () => {
  it("한글·영문 첫 글자를 돌려준다", () => {
    expect(getNameInitial("지수")).toBe("지");
    expect(getNameInitial("alexandra")).toBe("A");
  });

  it("이모지와 결합 문자를 쪼개지 않는다", () => {
    expect(getNameInitial("👨‍👩‍👧 가족")).toBe("👨‍👩‍👧");
    expect(getNameInitial("é")).toBe("É");
  });

  it("앞 공백은 무시하고 빈 이름은 빈 문자열이다", () => {
    expect(getNameInitial("  하준")).toBe("하");
    expect(getNameInitial("")).toBe("");
  });
});
