import { translateBranch } from "@/libs/zi-wei-dou-shu/i18n";
import type { Locale } from "@/i18n/config";
import type { BranchIndex, Gender } from "@/libs/zi-wei-dou-shu";

import { buildChartSnapshot } from "./chart-snapshot";
import type { ChartSnapshot, ChartSnapshotCell } from "./chart-snapshot";

/**
 * 랜딩 스크롤 연출에 쓰는 예시 인물.
 * 명궁에 주성이 있어(태양·천량) 명반이 비어 보이지 않고, 공궁이 2개뿐인 생년월일시를 골랐다.
 */
export const LANDING_PROTAGONIST = {
  birthDate: "1997-08-22",
  birthTime: "09:10",
  gender: "female" as Gender,
} as const;

export interface LandingHourVariant {
  branch: BranchIndex;
  /** 시진 이름 (자, 축, ... / Rat, Ox, ...) */
  label: string;
  /** 시진이 덮는 시각 범위 (23시~1시 → 23, 1) */
  fromHour: number;
  toHour: number;
  mingBranch: BranchIndex;
  mingStars: string[];
  oneLiner: string | null;
  cells: ChartSnapshotCell[];
}

export interface LandingCinemaData {
  protagonist: ChartSnapshot & {
    birthDate: string;
    birthTime: string;
    gender: Gender;
  };
  hours: LandingHourVariant[];
}

/** 자시(23~01시)부터 2시간 간격. 각 시진의 가운데 시각으로 계산한다 */
const HOUR_BRANCHES = Array.from(
  { length: 12 },
  (_, index) => index as BranchIndex
);

const toTime = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

export const buildLandingCinemaData = (locale: Locale): LandingCinemaData => {
  const baseInput = {
    name: "landing",
    birthDate: LANDING_PROTAGONIST.birthDate,
    gender: LANDING_PROTAGONIST.gender,
    calendarType: "solar" as const,
  };

  const protagonist = buildChartSnapshot(
    { ...baseInput, birthTime: LANDING_PROTAGONIST.birthTime },
    locale
  );

  const hours = HOUR_BRANCHES.map((branch) => {
    const snapshot = buildChartSnapshot(
      { ...baseInput, birthTime: toTime((branch * 2) % 24) },
      locale
    );
    const ming = snapshot.cells.find(
      (cell) => cell.branch === snapshot.mingBranch
    );
    return {
      branch,
      label: translateBranch(branch, locale),
      fromHour: (branch * 2 + 23) % 24,
      toHour: (branch * 2 + 1) % 24,
      mingBranch: snapshot.mingBranch,
      mingStars: ming?.mainStars ?? [],
      oneLiner: snapshot.oneLiner,
      cells: snapshot.cells,
    };
  });

  return {
    protagonist: { ...protagonist, ...LANDING_PROTAGONIST },
    hours,
  };
};
