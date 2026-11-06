import type { Locale } from "@/i18n/config";
import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
} from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateSihua,
  identifyGeokGuk,
  type DayunResult,
} from "@/libs/zi-wei-dou-shu/calculators";
import {
  buildLifetimeFactSheet,
  type LifetimeFactSheet,
} from "@/libs/zi-wei-dou-shu/calculators/lifetime-facts";
import type { Palace, ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

import type {
  DayunData,
  PalaceData,
  SihuaData,
  StarData,
  ZiweiInterpretationRequest,
} from "./types";

/**
 * 인생 운세 LLM 요청 조립.
 * app/api/interpret/route.ts 와 품질 회귀 스크립트(scripts/fortune-quality)가
 * 같은 입력을 쓰도록 라우트에서 분리했다.
 */

export const WUXING_JU_NAMES: Record<number, string> = {
  2: "수이국(水二局)",
  3: "목삼국(木三局)",
  4: "금사국(金四局)",
  5: "토오국(土五局)",
  6: "화육국(火六局)",
};

/**
 * 만 나이 계산. 회귀 스크립트가 결과를 고정할 수 있도록 기준일을 받는다.
 */
export const calculateAge = (birthDate: string, today = new Date()): number => {
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * 사실 시트 조립.
 * 타이밍 후보가 기준 연도에 따라 달라지므로 기준일을 받는다(회귀 스크립트 고정용).
 */
export const buildRequestFactSheet = (
  chart: ZiweiChart,
  dayunResult: DayunResult,
  today = new Date()
): LifetimeFactSheet =>
  buildLifetimeFactSheet(chart, dayunResult, {
    birthYear: chart.lunarDate.year,
    currentYear: today.getFullYear(),
  });

/**
 * 대운 구간을 로케일에 맞는 나이 표기로 변환
 * (AI 프롬프트가 이 문자열을 그대로 복사하므로 로케일 무관 "세" 고정 금지)
 */
const formatAgeRange = (
  startAge: number,
  endAge: number,
  locale: Locale
): string => {
  switch (locale) {
    case "en":
      return `Age ${startAge}-${endAge}`;
    case "ja":
      return `${startAge}-${endAge}歳`;
    default:
      return `${startAge}-${endAge}세`;
  }
};

/**
 * DayunResult를 DayunData[]로 변환
 */
export const convertToDayunData = (
  dayunResult: DayunResult,
  palaces: Palace[],
  locale: Locale
): DayunData[] => {
  // 별→궁 맵을 한 번만 생성하여 조회 성능 개선
  const starToPalaceMap = new Map<string, string>();
  for (const palace of palaces) {
    for (const star of [...palace.mainStars, ...palace.minorStars]) {
      starToPalaceMap.set(star.name, palace.name);
    }
  }
  const findPalaceForStar = (starName: string): string =>
    starToPalaceMap.get(starName) ?? "불명";

  return dayunResult.periods.map((period) => {
    // 주성 이름 + 밝기 + 사화 목록 (예: "자미(묘)", "무곡(왕, 화록)")
    const mainStars = period.palace.mainStars.map((s) => {
      if (s.sihua) {
        return `${s.name}(${s.brightness}, ${s.sihua})`;
      }
      return `${s.name}(${s.brightness})`;
    });

    // 보성 이름 + 밝기 (예: "문창(리)")
    const minorStars = period.palace.minorStars.map(
      (s) => `${s.name}(${s.brightness})`
    );

    // 대운 천간으로부터 사화 계산
    const dayunSihuaResult = calculateSihua(period.stemIndex);

    return {
      period: formatAgeRange(period.startAge, period.endAge, locale),
      palaceName: period.palaceName,
      mainStars,
      minorStars,
      dayunSihua: {
        hualu: dayunSihuaResult.hualu,
        huaquan: dayunSihuaResult.huaquan,
        huake: dayunSihuaResult.huake,
        huaji: dayunSihuaResult.huaji,
        hualuPalace: findPalaceForStar(dayunSihuaResult.hualu),
        huaquanPalace: findPalaceForStar(dayunSihuaResult.huaquan),
        huakePalace: findPalaceForStar(dayunSihuaResult.huake),
        huajiPalace: findPalaceForStar(dayunSihuaResult.huaji),
      },
      // NOTE: period.score 는 의도적으로 전달하지 않는다.
      // dayun.ts 의 점수 산출이 삼방사정·살성·대한사화를 반영하도록 보강되기 전(P1-6)까지는
      // 검증되지 않은 길흉 점수를 AI 판단의 앵커로 물리면 안 된다.
      // 보강 완료 후 이 줄을 `score: period.score,` 로 되살리면 프롬프트 배선은 이미 준비돼 있다.
    };
  });
};

const toStarData = (star: Palace["mainStars"][number]): StarData => ({
  name: star.name,
  brightness: star.brightness,
  sihua: star.sihua,
});

/**
 * Palace를 PalaceData로 변환.
 * 궁간·신궁·공궁 차성은 엔진이 이미 계산하는 값이라 LLM 입력에서 버리지 않는다.
 */
export const convertToPalaceData = (palace: Palace): PalaceData => ({
  name: palace.name,
  branch: EARTHLY_BRANCHES[palace.branch],
  stem: HEAVENLY_STEMS[palace.stem],
  mainStars: palace.mainStars.map(toStarData),
  minorStars: palace.minorStars.map(toStarData),
  isShenGong: palace.isShenGong,
  borrowedMainStars: palace.borrowedMainStars?.map(toStarData),
  borrowedFromPalace: palace.borrowedFromPalace,
});

/**
 * ZiweiChart를 ZiweiInterpretationRequest로 변환
 */
export const convertChartToRequest = (
  chart: ZiweiChart,
  options?: {
    currentAge?: number;
    dayunPeriods?: DayunData[];
    categoryScores?: ZiweiInterpretationRequest["categoryScores"];
    factSheet?: LifetimeFactSheet;
  }
): Omit<ZiweiInterpretationRequest, "requestType"> => {
  const { input, lunarDate, palaces, sihua, wuxingJu, mingGong, shenGong } =
    chart;
  const { currentAge, dayunPeriods, categoryScores, factSheet } = options ?? {};

  // 음력 생일 정보 문자열
  const lunarBirthInfo = `${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`;

  // 사화 정보 변환 - 각 사화가 어느 궁에 있는지 찾기
  const findPalaceForStar = (starName: string): string => {
    for (const palace of palaces) {
      const found =
        palace.mainStars.find((s) => s.name === starName) ||
        palace.minorStars.find((s) => s.name === starName);
      if (found) {
        return palace.name;
      }
    }
    return "불명";
  };

  const sihuaData: SihuaData = {
    hualu: { star: sihua.hualu, palace: findPalaceForStar(sihua.hualu) },
    huaquan: { star: sihua.huaquan, palace: findPalaceForStar(sihua.huaquan) },
    huake: { star: sihua.huake, palace: findPalaceForStar(sihua.huake) },
    huaji: { star: sihua.huaji, palace: findPalaceForStar(sihua.huaji) },
  };

  const palacesMap: Record<string, PalaceData> = {};
  for (const palace of palaces) {
    palacesMap[palace.name] = convertToPalaceData(palace);
  }

  if (!palacesMap["명궁"]) {
    throw new Error("명반에서 명궁을 찾을 수 없습니다.");
  }

  const shenGongPalace = palaces.find((p) => p.isShenGong)?.name;

  // 격국 분석
  const geokGukResults = identifyGeokGuk(chart);

  return {
    user: {
      gender: input.gender,
      lunarBirthInfo,
      currentAge,
      relationshipStatus: input.relationshipStatus ?? null,
      relationshipStatusCustom: input.relationshipStatusCustom ?? null,
      occupationStatus: input.occupationStatus ?? null,
      occupationStatusCustom: input.occupationStatusCustom ?? null,
    },
    chart: {
      wuxingJu: WUXING_JU_NAMES[wuxingJu] || `${wuxingJu}국`,
      mingGongPosition: EARTHLY_BRANCHES[mingGong],
      shenGongPosition: EARTHLY_BRANCHES[shenGong],
      shenGongPalace,
      sihua: sihuaData,
    },
    palaces: palacesMap,
    dayunPeriods,
    geokGuk: geokGukResults.length > 0 ? geokGukResults : undefined,
    categoryScores,
    factSheet,
  };
};
