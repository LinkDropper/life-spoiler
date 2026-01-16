import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import type {
  YearlyFortuneInterpretation,
  YearlyInterpretationRequest,
  YearlyPalaceData,
  YearlyPeachBlossomData,
  YearlySihuaData,
} from "@/libs/services/ai";
import {
  createYearlyFallbackInterpretation,
  generateYearlyInterpretation,
} from "@/libs/services/ai";
import {
  generateChartHash,
  getCachedResult,
  saveFortune,
  setCachedResult,
} from "@/libs/supabase";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateDayun,
  calculateYearlyFortune,
  getCurrentDayun,
  getLuckyAndCautionMonths,
} from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";
import { ZiweiInputSchema } from "@/libs/zi-wei-dou-shu/types";

// ============================================================
// 요청 스키마
// ============================================================

const YearlyRequestSchema = ZiweiInputSchema.extend({
  targetYear: z.number().int().min(1900).max(2100),
  profileId: z.string().optional(),
});

// ============================================================
// 유틸리티
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

// ============================================================
// API 라우트
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = YearlyRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "입력값이 유효하지 않습니다.",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { targetYear, profileId, ...inputData } = parseResult.data;
    const input: ZiweiInput = inputData;

    // 캐시 키 생성 (연도 포함)
    const cacheKey = `yearly-${targetYear}` as const;
    const chartHash = generateChartHash({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      gender: input.gender,
      calendarType: input.calendarType,
      isLeapMonth: input.isLeapMonth,
      relationshipStatus: input.relationshipStatus,
      occupationStatus: input.occupationStatus,
    });

    // 명반 생성
    const chart = generateZiweiChart(input);

    // 유년 운세 계산
    const currentAge = calculateAge(input.birthDate);
    const yearlyFortune = calculateYearlyFortune(chart, targetYear, currentAge);

    // 캐시 확인
    const cachedResult = await getCachedResult<YearlyFortuneInterpretation>(
      chartHash,
      cacheKey
    );

    if (cachedResult) {
      // 캐시 히트 시에도 fortunes 저장
      if (profileId) {
        saveFortune({
          profileId,
          fortuneType: "yearly",
          year: targetYear,
          result: cachedResult,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        data: {
          year: targetYear,
          chart: {
            wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
            mingGong: EARTHLY_BRANCHES[chart.mingGong],
          },
          yearlySihua: yearlyFortune.sihua,
          yearlyPalaces: yearlyFortune.yearlyPalaces,
          peachBlossom: yearlyFortune.peachBlossom,
          currentDayun: yearlyFortune.currentDayun,
          scores: yearlyFortune.scores,
          monthlyFortunes: yearlyFortune.monthlyFortunes,
          ...getLuckyAndCautionMonths(yearlyFortune.monthlyFortunes),
          interpretation: cachedResult,
        },
      });
    }

    // 대운 정보 가져오기
    const dayunResult = calculateDayun(chart);
    const currentDayunPeriod = getCurrentDayun(dayunResult, currentAge);

    // AI 해석 요청 데이터 구성
    const lunarBirthInfo = `${chart.lunarDate.year}년 ${chart.lunarDate.month}월 ${chart.lunarDate.day}일${chart.lunarDate.isLeapMonth ? " (윤달)" : ""}`;

    const yearlySihuaData: YearlySihuaData = {
      yearStemName: yearlyFortune.sihua.yearStemName,
      yearBranchName: yearlyFortune.sihua.yearBranchName,
      hualu: yearlyFortune.sihua.hualu,
      huaquan: yearlyFortune.sihua.huaquan,
      huake: yearlyFortune.sihua.huake,
      huaji: yearlyFortune.sihua.huaji,
    };

    // 유년궁 정보 (AI 프롬프트용)
    const yearlyPalacesData: YearlyPalaceData = {
      yearlyMingGong: {
        palaceName: yearlyFortune.yearlyPalaces.yearlyMingGong.palaceName,
        mainStars: yearlyFortune.yearlyPalaces.yearlyMingGong.mainStars,
      },
      yearlySpousePalace: {
        palaceName: yearlyFortune.yearlyPalaces.yearlySpousePalace.palaceName,
        hasPeachBlossom:
          yearlyFortune.yearlyPalaces.yearlySpousePalace.hasPeachBlossom,
      },
    };

    // 유년 도화성 정보 (AI 프롬프트용)
    const peachBlossomData: YearlyPeachBlossomData = {
      isPeachBlossomActive: yearlyFortune.peachBlossom.isPeachBlossomActive,
      peachBlossomNotes: yearlyFortune.peachBlossom.peachBlossomNotes,
      hongluanPalace: yearlyFortune.peachBlossom.hongluan.palaceName,
      tianxiPalace: yearlyFortune.peachBlossom.tianxi.palaceName,
    };

    const interpretRequest: Omit<YearlyInterpretationRequest, "requestType"> = {
      user: {
        gender: input.gender,
        lunarBirthInfo,
        currentAge,
        relationshipStatus: input.relationshipStatus ?? undefined,
        relationshipStatusCustom: input.relationshipStatusCustom ?? undefined,
        occupationStatus: input.occupationStatus ?? undefined,
        occupationStatusCustom: input.occupationStatusCustom ?? undefined,
      },
      chart: {
        wuxingJu: WUXING_JU_NAMES[chart.wuxingJu] || `${chart.wuxingJu}국`,
        mingGongPosition: EARTHLY_BRANCHES[chart.mingGong],
      },
      targetYear,
      yearlySihua: yearlySihuaData,
      yearlyPalaces: yearlyPalacesData,
      peachBlossom: peachBlossomData,
      currentDayun: currentDayunPeriod
        ? {
            period: `${currentDayunPeriod.startAge}-${currentDayunPeriod.endAge}세`,
            palaceName: currentDayunPeriod.palaceName,
            mainStars: currentDayunPeriod.palace.mainStars.map((s) => s.name),
          }
        : undefined,
      scores: yearlyFortune.scores,
    };

    let result: YearlyFortuneInterpretation;

    try {
      result = await generateYearlyInterpretation(interpretRequest);

      // 캐시 저장
      setCachedResult(chartHash, cacheKey, result).catch(() => {});

      // fortunes 저장
      if (profileId) {
        saveFortune({
          profileId,
          fortuneType: "yearly",
          year: targetYear,
          result,
        }).catch(() => {});
      }
    } catch (error) {
      console.error("AI 해석 오류:", error);
      result = createYearlyFallbackInterpretation(targetYear, error as Error);
    }

    return NextResponse.json({
      success: true,
      data: {
        year: targetYear,
        chart: {
          wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
          mingGong: EARTHLY_BRANCHES[chart.mingGong],
        },
        yearlySihua: yearlyFortune.sihua,
        yearlyPalaces: yearlyFortune.yearlyPalaces,
        peachBlossom: yearlyFortune.peachBlossom,
        currentDayun: yearlyFortune.currentDayun,
        scores: yearlyFortune.scores,
        monthlyFortunes: yearlyFortune.monthlyFortunes,
        ...getLuckyAndCautionMonths(yearlyFortune.monthlyFortunes),
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
