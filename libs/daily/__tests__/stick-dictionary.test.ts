import { DAILY_DICTIONARY_KO } from "../dictionary/ko";
import { DAILY_STICK_KO } from "../dictionary/stick-ko";

/** 막대에 세로로 쓰는 글자 수 상한 (공백 제외) */
const MAX_STICK_CHARS = 7;

const BRAND_BANNED = [
  "뼈 때리",
  "소름",
  "충격",
  "대박",
  "인생역전",
  "운명을 바꿔",
  "럭키",
  "적중",
  "무조건",
  "대길",
  "반드시",
];

/** 표면 문구에 쓰지 않는 자미두수 용어 */
const JARGON = [
  "자미",
  "천기",
  "태양",
  "무곡",
  "천동",
  "염정",
  "천부",
  "태음",
  "탐랑",
  "거문",
  "천상",
  "천량",
  "칠살",
  "파군",
  "명반",
  "명궁",
  "오행",
  "사화",
  "화록",
  "화권",
  "화과",
  "화기",
  "일진",
  "기운",
];

const entries = Object.entries(DAILY_STICK_KO);

describe("산통 막대 문구 사전", () => {
  it("총운 본문 슬러그와 같은 키 70개를 빠짐없이 가진다", () => {
    const overallSlugs = Object.keys(DAILY_DICTIONARY_KO).filter((slug) =>
      slug.startsWith("df-ob-")
    );

    expect(entries).toHaveLength(70);
    expect(Object.keys(DAILY_STICK_KO).sort()).toEqual(overallSlugs.sort());
  });

  it("70개 문구가 모두 서로 다르다", () => {
    expect(new Set(Object.values(DAILY_STICK_KO)).size).toBe(entries.length);
  });

  it.each(entries)("%s: 공백 제외 7자 이하, '날'로 끝난다", (_, text) => {
    expect(text.replace(/\s+/g, "").length).toBeLessThanOrEqual(
      MAX_STICK_CHARS
    );
    expect(text.endsWith("날")).toBe(true);
    expect(text).toBe(text.trim());
  });

  it.each(entries)("%s: 금지 표현·전문 용어가 없다", (_, text) => {
    [...BRAND_BANNED, ...JARGON].forEach((word) => {
      expect(text).not.toContain(word);
    });
  });
});
