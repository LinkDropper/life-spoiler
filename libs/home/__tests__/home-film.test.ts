import {
  findNowIndex,
  fromSnapshotFrames,
  getFilmAge,
  readOwnedFilm,
} from "../home-film";

const period = (startAge: number, palace: string, stars: string[]) => ({
  startAge,
  endAge: startAge + 9,
  palaceName: palace,
  palace: { name: palace, mainStars: stars.map((name) => ({ name })) },
});

const RESULT = {
  dayun: {
    periods: [period(4, "명궁", ["자미"]), period(14, "재백궁", [])],
  },
  interpretation: {
    ageScenarios: [
      { period: "4~13세", headline: "첫 장면", oneLiner: "" },
      { period: "14~23세", headline: "둘째 장면", oneLiner: "" },
    ],
  },
};

describe("readOwnedFilm", () => {
  it("대운 구간마다 같은 시작 나이의 줄거리 headline을 붙인다", () => {
    const frames = readOwnedFilm(RESULT, "ko");

    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({
      startAge: 4,
      endAge: 13,
      palaceKey: "명궁",
      palaceName: "명궁",
      stars: ["자미"],
      caption: "첫 장면",
      isUnlocked: true,
    });
    expect(frames[1].caption).toBe("둘째 장면");
  });

  it("다른 언어에서는 궁 이름을 번역하고 엔진 이름은 그대로 둔다", () => {
    const [frame] = readOwnedFilm(RESULT, "en");

    expect(frame.palaceKey).toBe("명궁");
    expect(frame.palaceName).not.toBe("명궁");
  });

  it("형식이 다르면 빈 배열", () => {
    expect(readOwnedFilm(null, "ko")).toEqual([]);
    expect(readOwnedFilm({ dayun: { periods: "x" } }, "ko")).toEqual([]);
  });
});

describe("findNowIndex / getFilmAge", () => {
  it("올해 − 출생 연도로 지금 구간을 찾는다", () => {
    const frames = readOwnedFilm(RESULT, "ko");
    const age = getFilmAge("2010-05-01", new Date("2026-11-03"));

    expect(age).toBe(16);
    expect(findNowIndex(frames, age)).toBe(1);
    expect(findNowIndex(frames, 99)).toBe(-1);
  });
});

describe("fromSnapshotFrames", () => {
  it("계산 결과는 줄거리를 잠그고 궁의 영역을 캡션으로 쓴다", () => {
    expect(
      fromSnapshotFrames([
        {
          startAge: 4,
          endAge: 13,
          palaceKey: "명궁",
          palaceName: "명궁",
          theme: "나 자신",
          stars: [],
        },
      ])[0]
    ).toMatchObject({ caption: "나 자신", isUnlocked: false });
  });
});
