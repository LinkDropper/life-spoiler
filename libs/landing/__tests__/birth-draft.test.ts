import {
  LANDING_BIRTH_DRAFT_KEY,
  LANDING_BIRTH_DRAFT_TTL_MS,
  consumeLandingBirthDraft,
  peekLandingBirthDraft,
  saveLandingBirthDraft,
} from "../birth-draft";

const createMemoryStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    map,
  };
};

const DRAFT = {
  birthDate: "1995-06-15",
  birthTime: "21:30",
  birthTimeUnknown: false,
  calendarType: "solar" as const,
  gender: "female" as const,
};

describe("landing birth draft", () => {
  it("저장한 입력값을 한 번 꺼내 쓰면 지워진다", () => {
    const storage = createMemoryStorage();
    saveLandingBirthDraft(DRAFT, storage, 1000);

    expect(consumeLandingBirthDraft(storage, 2000)).toEqual(DRAFT);
    expect(storage.map.has(LANDING_BIRTH_DRAFT_KEY)).toBe(false);
    expect(consumeLandingBirthDraft(storage, 2000)).toBeNull();
  });

  it("30분이 지나면 버린다", () => {
    const storage = createMemoryStorage();
    saveLandingBirthDraft(DRAFT, storage, 0);

    expect(
      consumeLandingBirthDraft(storage, LANDING_BIRTH_DRAFT_TTL_MS + 1)
    ).toBeNull();
    expect(storage.map.has(LANDING_BIRTH_DRAFT_KEY)).toBe(false);
  });

  it("형식이 깨진 값은 쓰지 않는다", () => {
    const storage = createMemoryStorage();
    storage.setItem(
      LANDING_BIRTH_DRAFT_KEY,
      JSON.stringify({ ...DRAFT, birthDate: "1995/06/15", savedAt: 0 })
    );

    expect(consumeLandingBirthDraft(storage, 1)).toBeNull();
  });

  it("저장소를 쓸 수 없으면 아무것도 하지 않는다", () => {
    expect(() => saveLandingBirthDraft(DRAFT, null)).not.toThrow();
    expect(consumeLandingBirthDraft(null)).toBeNull();
  });

  it("peek은 지우지 않고 읽기만 한다", () => {
    const storage = createMemoryStorage();
    saveLandingBirthDraft(DRAFT, storage, 1000);

    expect(peekLandingBirthDraft(storage, 2000)).toEqual(DRAFT);
    expect(storage.map.has(LANDING_BIRTH_DRAFT_KEY)).toBe(true);
    expect(consumeLandingBirthDraft(storage, 2000)).toEqual(DRAFT);
  });

  it("peek도 30분이 지난 값은 주지 않는다", () => {
    const storage = createMemoryStorage();
    saveLandingBirthDraft(DRAFT, storage, 0);

    expect(
      peekLandingBirthDraft(storage, LANDING_BIRTH_DRAFT_TTL_MS + 1)
    ).toBeNull();
  });
});
