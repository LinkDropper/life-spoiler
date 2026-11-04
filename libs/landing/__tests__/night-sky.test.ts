import { SKY_HEIGHT, SKY_WIDTH, createNightSky } from "../night-sky";

describe("createNightSky", () => {
  it("같은 시드면 같은 하늘", () => {
    expect(createNightSky("복덕궁-25", "#d8a6ff", ["천부"])).toEqual(
      createNightSky("복덕궁-25", "#d8a6ff", ["천부"])
    );
  });

  it("시드가 다르면 다른 하늘", () => {
    expect(
      createNightSky("복덕궁-25", "#d8a6ff", ["천부"]).fieldStars
    ).not.toEqual(createNightSky("관록궁-45", "#d8a6ff", ["천부"]).fieldStars);
  });

  it("주성마다 이름 붙은 별을 화면 가운데 띠에 둔다", () => {
    const sky = createNightSky("관록궁-45", "#93b1ff", ["염정", "탐랑"]);

    expect(sky.mainStars.map((star) => star.name)).toEqual(["염정", "탐랑"]);
    for (const star of sky.mainStars) {
      expect(star.x).toBeGreaterThan(SKY_WIDTH * 0.2);
      expect(star.x).toBeLessThan(SKY_WIDTH * 0.85);
      expect(star.y).toBeGreaterThan(SKY_HEIGHT * 0.3);
      expect(star.y).toBeLessThan(SKY_HEIGHT * 0.6);
    }
  });

  it("주성이 없어도 별자리 선은 왼쪽에서 오른쪽으로 이어진다", () => {
    const { mainStars, constellation, fieldStars } = createNightSky(
      "부모궁-15",
      "#b9cf9a",
      []
    );

    expect(mainStars).toEqual([]);
    expect(fieldStars).toHaveLength(170);
    const xs = constellation.map((point) => point.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });
});
