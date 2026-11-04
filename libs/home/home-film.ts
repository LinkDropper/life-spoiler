import {
  translatePalaceName,
  translateStarName,
} from "@/libs/zi-wei-dou-shu/i18n";
import type { Locale } from "@/i18n/config";
import type { ChartSnapshotFrame } from "@/libs/landing/chart-snapshot";

/**
 * 홈 히어로의 "내 인생 필름" 한 칸.
 * 랜딩 인생 필름(components/landing/cinema/FilmScene)과 같은 모양으로 그리되,
 * 소장자에게는 랜딩이 잠가 둔 그 10년의 줄거리 한 줄(ageScenarios headline)을 연다.
 */
export interface HomeFilmFrame {
  startAge: number;
  endAge: number;
  /** 엔진 궁 이름(한국어). 장면 색(PALACE_TINTS)과 스틸 시드에 쓴다 */
  palaceKey: string;
  palaceName: string;
  stars: string[];
  /** 소장자: 이 10년의 줄거리 headline / 미소장: 궁이 보는 삶의 영역 */
  caption: string | null;
  /** 줄거리가 열렸는가(본편 소장) */
  isUnlocked: boolean;
}

/** 랜딩 필름 장면과 같은 나이 기준(올해 − 출생 연도) */
export const getFilmAge = (birthDate: string, now = new Date()): number =>
  now.getFullYear() - Number(birthDate.slice(0, 4));

export const findNowIndex = (frames: HomeFilmFrame[], age: number): number =>
  frames.findIndex((frame) => frame.startAge <= age && age <= frame.endAge);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** "34~43세", "Ages 34-43" 같은 구간 표기에서 시작 나이를 꺼낸다 */
const readPeriodStart = (period: unknown): number | null => {
  if (typeof period !== "string") {
    return null;
  }
  const match = period.match(/\d+/);
  return match ? Number(match[0]) : null;
};

const readScenarioHeadlines = (
  interpretation: unknown
): Map<number, string> => {
  const headlines = new Map<number, string>();
  if (
    !isRecord(interpretation) ||
    !Array.isArray(interpretation.ageScenarios)
  ) {
    return headlines;
  }
  for (const scenario of interpretation.ageScenarios) {
    if (!isRecord(scenario) || typeof scenario.headline !== "string") {
      continue;
    }
    const start = readPeriodStart(scenario.period);
    if (start !== null && scenario.headline.trim()) {
      headlines.set(start, scenario.headline.trim());
    }
  }
  return headlines;
};

/**
 * 결제한 인생 운세 결과(JSON)에서 필름을 만든다.
 * 운영 DB 결제 3,453건 전부에 dayun.periods·ageScenarios가 있다(2026-11-03 집계).
 * 형식이 다르면 빈 배열을 돌려 호출부가 생년월일시 계산으로 대신 채운다.
 */
export const readOwnedFilm = (
  result: unknown,
  locale: Locale
): HomeFilmFrame[] => {
  if (!isRecord(result) || !isRecord(result.dayun)) {
    return [];
  }
  const { periods } = result.dayun;
  if (!Array.isArray(periods)) {
    return [];
  }
  const headlines = readScenarioHeadlines(result.interpretation);

  return periods.flatMap((period): HomeFilmFrame[] => {
    if (!isRecord(period) || !isRecord(period.palace)) {
      return [];
    }
    const startAge = readNumber(period.startAge);
    const endAge = readNumber(period.endAge);
    const palaceKey = period.palace.name;
    if (startAge === null || endAge === null || typeof palaceKey !== "string") {
      return [];
    }
    const mainStars = Array.isArray(period.palace.mainStars)
      ? period.palace.mainStars
      : [];
    return [
      {
        startAge,
        endAge,
        palaceKey,
        palaceName: translatePalaceName(palaceKey, locale),
        stars: mainStars.flatMap((star) =>
          isRecord(star) && typeof star.name === "string"
            ? [translateStarName(star.name, locale)]
            : []
        ),
        caption: headlines.get(startAge) ?? null,
        isUnlocked: true,
      },
    ];
  });
};

/** 명반 요약 API(랜딩 "내 명반 그려보기"와 같은 계산) 결과로 필름을 만든다. 줄거리는 잠긴다 */
export const fromSnapshotFrames = (
  frames: ChartSnapshotFrame[]
): HomeFilmFrame[] =>
  frames.map((frame) => ({
    startAge: frame.startAge,
    endAge: frame.endAge,
    palaceKey: frame.palaceKey,
    palaceName: frame.palaceName,
    stars: frame.stars,
    caption: frame.theme || null,
    isUnlocked: false,
  }));
