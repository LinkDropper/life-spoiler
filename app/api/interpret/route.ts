import { NextRequest, NextResponse } from "next/server";

import type {
  DayunData,
  FortuneInterpretation,
  PalaceData,
  SihuaData,
  StarData,
  ZiweiInterpretationRequest,
} from "@/libs/services/ai";
import {
  createFallbackInterpretation,
  generateFullInterpretation,
} from "@/libs/services/ai";
import { generateChartHash, getOrCreateCachedResult } from "@/libs/supabase";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateDayun,
  calculateAllDayunScores,
  type DayunResult,
} from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import { generateLifestyleRecommendation } from "@/libs/zi-wei-dou-shu/lifestyle";
import type {
  Palace,
  ZiweiChart,
  ZiweiInput,
} from "@/libs/zi-wei-dou-shu/types";
import { ZiweiInputSchema } from "@/libs/zi-wei-dou-shu/types";

// ============================================================
// 차트 변환 유틸리티
// ============================================================

const WUXING_JU_NAMES: Record<number, string> = {
  2: "수이국(水二局)",
  3: "목삼국(木三局)",
  4: "금사국(金四局)",
  5: "토오국(土五局)",
  6: "화육국(火六局)",
};

/**
 * 현재 나이 계산
 */
const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * DayunResult를 DayunData[]로 변환
 */
const convertToDayunData = (dayunResult: DayunResult): DayunData[] => {
  return dayunResult.periods.map((period) => {
    // 주성 이름 목록
    const mainStars = period.palace.mainStars.map((s) => s.name);

    // 사화가 있는 별 목록
    const sihua = period.palace.mainStars
      .filter((s) => s.sihua)
      .map((s) => `${s.name}(${s.sihua})`);

    return {
      period: `${period.startAge}-${period.endAge}세`,
      palaceName: period.palaceName,
      mainStars,
      sihua: sihua.length > 0 ? sihua : undefined,
    };
  });
};

/**
 * Palace를 PalaceData로 변환
 */
const convertToPalaceData = (palace: Palace): PalaceData => {
  const mainStars: StarData[] = palace.mainStars.map((star) => ({
    name: star.name,
    brightness: star.brightness,
    sihua: star.sihua,
  }));

  const minorStars = palace.minorStars.map((star) => {
    if (star.sihua) {
      return `${star.name}[${star.sihua}]`;
    }
    return star.name;
  });

  return {
    name: palace.name,
    branch: EARTHLY_BRANCHES[palace.branch],
    mainStars,
    minorStars,
  };
};

/**
 * ZiweiChart를 ZiweiInterpretationRequest로 변환
 */
const convertChartToRequest = (
  chart: ZiweiChart,
  options?: { currentAge?: number; dayunPeriods?: DayunData[] }
): Omit<ZiweiInterpretationRequest, "requestType"> => {
  const { input, lunarDate, palaces, sihua, wuxingJu, mingGong, shenGong } =
    chart;
  const { currentAge, dayunPeriods } = options ?? {};

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

  // 명궁 찾기
  const mingGongPalace = palaces.find((p) => p.name === "명궁");
  if (!mingGongPalace) {
    throw new Error("명반에서 명궁을 찾을 수 없습니다.");
  }
  const targetPalace = convertToPalaceData(mingGongPalace);

  // 대궁 (명궁의 반대편 = 천이궁)
  const oppositePalace = palaces.find((p) => p.name === "천이궁");

  // 전체 궁 변환
  const allPalaces = palaces.map(convertToPalaceData);

  return {
    user: {
      name: input.name,
      gender: input.gender,
      lunarBirthInfo,
      currentAge,
    },
    chart: {
      wuxingJu: WUXING_JU_NAMES[wuxingJu] || `${wuxingJu}국`,
      mingGongPosition: EARTHLY_BRANCHES[mingGong],
      shenGongPosition: EARTHLY_BRANCHES[shenGong],
      sihua: sihuaData,
    },
    targetPalace,
    oppositePalace: oppositePalace
      ? convertToPalaceData(oppositePalace)
      : undefined,
    allPalaces,
    dayunPeriods,
  };
};

// ============================================================
// API 라우트
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 입력값 유효성 검사
    const parseResult = ZiweiInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "입력값이 유효하지 않습니다.",
          details: parseResult.error.errors,
        },
        { status: 400 }
      );
    }

    const input: ZiweiInput = parseResult.data;

    // 1. 명반 생성
    const chart = generateZiweiChart(input);

    // 2. 대운 계산
    const dayunResult = calculateAllDayunScores(calculateDayun(chart));

    // 3. 라이프스타일 추천 생성
    const lifestyle = generateLifestyleRecommendation(chart);

    // 4. 캐시 키 생성
    const chartHash = generateChartHash({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      gender: input.gender,
      calendarType: input.calendarType,
      isLeapMonth: input.isLeapMonth,
    });

    // 5. AI 해석 요청 데이터 준비 (대운 정보 포함)
    const currentAge = calculateAge(input.birthDate);
    const dayunPeriods = convertToDayunData(dayunResult);
    const interpretRequest = convertChartToRequest(chart, {
      currentAge,
      dayunPeriods,
    });

    // 6. 캐시 확인 또는 새로 생성
    const includeDetails = body.includeDetails ?? false;
    const cacheKey = includeDetails ? "full" : "preview";

    let result: FortuneInterpretation;

    try {
      result = await getOrCreateCachedResult(chartHash, cacheKey, () =>
        generateFullInterpretation(interpretRequest, { includeDetails })
      );
    } catch (error) {
      console.error("AI 해석 오류:", error);
      result = createFallbackInterpretation(error as Error);
    }

    return NextResponse.json({
      success: true,
      data: {
        // 기존 요약 데이터
        chart: {
          wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
          mingGong: EARTHLY_BRANCHES[chart.mingGong],
          shenGong: EARTHLY_BRANCHES[chart.shenGong],
          sihua: chart.sihua,
        },
        // 전체 명반 데이터 (시각화용)
        rawChart: chart,
        // 대운 데이터 (그래프용)
        dayun: dayunResult,
        // 라이프스타일 추천
        lifestyle,
        // AI 해석 결과
        interpretation: result,
      },
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
