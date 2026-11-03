/**
 * 랜딩 "내 명반 그려보기"에서 입력한 생년월일시를 로그인 뒤 첫 프로필 입력에 이어 쓰기 위한 임시 보관.
 *
 * - 서버에는 보내지 않고 이 브라우저의 localStorage에만 둔다. 카카오·구글 로그인이 다른 도메인을
 *   거쳐 돌아오고, 인앱 브라우저는 로그인 창을 새로 띄우기도 해서 sessionStorage로는 끊긴다.
 * - 30분이 지나면 버린다. 한 번 꺼내 쓰면 바로 지운다(다음 프로필에 다시 채워지지 않게).
 * - 저장소 접근이 막힌 환경(사생활 보호 모드 등)에선 조용히 아무것도 하지 않는다. 이어 쓰기는
 *   편의 기능이라 실패해도 사용자는 직접 입력하면 된다.
 */

import type { CalendarType, Gender } from "@/libs/stores/user";

export interface LandingBirthDraft {
  birthDate: string;
  /** HH:mm. 시간을 모르면 빈 문자열 */
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: CalendarType;
  gender: Gender;
}

interface StoredDraft extends LandingBirthDraft {
  savedAt: number;
}

export const LANDING_BIRTH_DRAFT_KEY = "lifespoiler:landing-birth-draft";
export const LANDING_BIRTH_DRAFT_TTL_MS = 30 * 60 * 1000;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getStorage = (): DraftStorage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const isStoredDraft = (value: unknown): value is StoredDraft => {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.birthDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) &&
    typeof draft.birthTime === "string" &&
    typeof draft.birthTimeUnknown === "boolean" &&
    (draft.calendarType === "solar" || draft.calendarType === "lunar") &&
    (draft.gender === "female" || draft.gender === "male") &&
    typeof draft.savedAt === "number"
  );
};

export const saveLandingBirthDraft = (
  draft: LandingBirthDraft,
  storage: DraftStorage | null = getStorage(),
  now: number = Date.now()
): void => {
  try {
    storage?.setItem(
      LANDING_BIRTH_DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: now } satisfies StoredDraft)
    );
  } catch {
    // 저장 공간이 가득 찼거나 막힌 경우 — 이어 쓰기만 포기한다
  }
};

/** 보관된 입력값을 꺼내고 지운다. 없거나 만료됐거나 형식이 깨졌으면 null */
export const consumeLandingBirthDraft = (
  storage: DraftStorage | null = getStorage(),
  now: number = Date.now()
): LandingBirthDraft | null => {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LANDING_BIRTH_DRAFT_KEY);
    storage.removeItem(LANDING_BIRTH_DRAFT_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isStoredDraft(parsed)) return null;
    if (now - parsed.savedAt > LANDING_BIRTH_DRAFT_TTL_MS) return null;

    return {
      birthDate: parsed.birthDate,
      birthTime: parsed.birthTime,
      birthTimeUnknown: parsed.birthTimeUnknown,
      calendarType: parsed.calendarType,
      gender: parsed.gender,
    };
  } catch {
    return null;
  }
};
