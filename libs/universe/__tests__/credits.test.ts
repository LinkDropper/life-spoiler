import { describe, expect, it } from "@jest/globals";

import { buildCreditsPlan } from "../credits";

const makeGuests = (count: number): { starSeed: string }[] =>
  Array.from({ length: count }, (_, index) => ({ starSeed: `g${index + 1}` }));

describe("buildCreditsPlan", () => {
  it("관객이 0명이면 비어 있다", () => {
    const plan = buildCreditsPlan([], null);

    expect(plan.best).toEqual([]);
    expect(plan.rest).toEqual([]);
    expect(plan.foldedCount).toBe(0);
  });

  it("1~3위는 베스트, 4위부터는 그 외 관객이다", () => {
    const plan = buildCreditsPlan(makeGuests(6), null);

    expect(plan.best.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(plan.rest.map((entry) => entry.rank)).toEqual([4, 5, 6]);
  });

  it("관객이 1명이나 2명이면 베스트만 채워진다", () => {
    expect(buildCreditsPlan(makeGuests(1), null).best).toHaveLength(1);
    expect(buildCreditsPlan(makeGuests(2), null).best).toHaveLength(2);
    expect(buildCreditsPlan(makeGuests(2), null).rest).toHaveLength(0);
  });

  it("4~5위만 펼쳐 두고 6위부터 접는다", () => {
    const plan = buildCreditsPlan(makeGuests(40), null);

    expect(plan.rest.filter((entry) => !entry.isFolded)).toHaveLength(2);
    expect(plan.rest[1]?.rank).toBe(5);
    expect(plan.rest[1]?.isFolded).toBe(false);
    expect(plan.rest[2]?.rank).toBe(6);
    expect(plan.rest[2]?.isFolded).toBe(true);
    expect(plan.foldedCount).toBe(35);
  });

  it("내 행이 6위 밖이면 접지 않고 떨어뜨려 보여 주며 더보기 수에서도 뺀다", () => {
    const plan = buildCreditsPlan(makeGuests(40), "g38");
    const mine = plan.rest.find((entry) => entry.isMine);

    expect(mine?.rank).toBe(38);
    expect(mine?.isFolded).toBe(false);
    expect(mine?.isDetached).toBe(true);
    expect(plan.foldedCount).toBe(34);
  });

  it("내가 5위 안이면 따로 떨어지지 않는다", () => {
    const plan = buildCreditsPlan(makeGuests(40), "g5");
    const mine = plan.rest.find((entry) => entry.isMine);

    expect(mine?.isDetached).toBe(false);
    expect(mine?.isFolded).toBe(false);
    expect(plan.foldedCount).toBe(35);
  });

  it("내가 베스트에 있으면 표시만 되고 접힘 수는 그대로다", () => {
    const plan = buildCreditsPlan(makeGuests(10), "g2");

    expect(plan.best[1]?.isMine).toBe(true);
    expect(plan.foldedCount).toBe(5);
  });
});
