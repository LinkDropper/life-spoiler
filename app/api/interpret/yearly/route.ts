import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
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
  getFortune,
  saveFortune,
  setCachedResult,
  type YearlyFortuneData,
} from "@/libs/supabase";
import { calculateAge } from "@/libs/utils";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateDayun,
  calculateYearlyFortune,
  getCurrentDayun,
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

    // 언어 파라미터 검증
    const requestedLanguage = body.language;
    const language: Locale =
      typeof requestedLanguage === "string" &&
      (locales as readonly string[]).includes(requestedLanguage)
        ? (requestedLanguage as Locale)
        : defaultLocale;

    // 1. profileId가 있으면 저장된 fortune 먼저 확인
    if (profileId) {
      const existingFortune = await getFortune(profileId, "yearly", targetYear);
      if (existingFortune?.result) {
        const storedData =
          existingFortune.result as unknown as YearlyFortuneData;
        // 저장된 데이터에 interpretation이 있고, 언어가 일치하는지 확인
        if (
          storedData.interpretation &&
          storedData.yearlySihua &&
          storedData.language === language
        ) {
          return NextResponse.json({
            success: true,
            data: storedData,
            isAIGenerated: true, // 저장된 데이터는 AI 성공 시에만 저장되므로 true
            isPaid: !!existingFortune.paid_at,
          });
        }
      }
    }

    // 2. 저장된 데이터가 없으면 새로 계산
    // 캐시 키 생성 (연도 및 언어 포함)
    const cacheKey =
      `yearly-${targetYear}-${language}` as `yearly-${number}-${Locale}`;
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

    // 응답 데이터 구조 (재사용)
    const buildResponseData = (
      interpretation: YearlyFortuneInterpretation
    ): YearlyFortuneData => ({
      language,
      year: targetYear,
      chart: {
        wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
        mingGong: EARTHLY_BRANCHES[chart.mingGong],
      },
      rawChart: chart,
      yearlySihua: yearlyFortune.sihua,
      yearlyPalaces: yearlyFortune.yearlyPalaces,
      peachBlossom: yearlyFortune.peachBlossom,
      currentDayun: yearlyFortune.currentDayun,
      interpretation,
    });

    if (cachedResult) {
      const responseData = buildResponseData(cachedResult);

      // 캐시 히트 시에도 fortunes에 전체 데이터 저장 (profileId가 있으면 저장)
      if (profileId) {
        const saved = await saveFortune({
          profileId,
          fortuneType: "yearly",
          year: targetYear,
          result: responseData,
        });
        if (!saved) {
          console.error("캐시 히트 시 fortune 저장 실패:", {
            profileId,
            targetYear,
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: responseData,
        isAIGenerated: true,
        isPaid: false,
      });
    }

    // 대운 정보 가져오기
    const dayunResult = calculateDayun(chart, 100, language);
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
        relationshipStatus: input.relationshipStatus,
        relationshipStatusCustom: input.relationshipStatusCustom,
        occupationStatus: input.occupationStatus,
        occupationStatusCustom: input.occupationStatusCustom,
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
      language,
    };

    let result: YearlyFortuneInterpretation;
    let isAISuccess = false;

    try {
      result = await generateYearlyInterpretation(interpretRequest);
      isAISuccess = true;

      // 캐시 저장 (AI 성공 시에만)
      await setCachedResult(chartHash, cacheKey, result);
    } catch (error) {
      console.error("AI 해석 오류:", error);
      result = createYearlyFallbackInterpretation(targetYear, error as Error);
    }

    const responseData = buildResponseData(result);

    // fortunes에 전체 데이터 저장 (AI 성공 시, profileId가 있으면 저장)
    if (profileId && isAISuccess) {
      const saved = await saveFortune({
        profileId,
        fortuneType: "yearly",
        year: targetYear,
        result: responseData,
      });
      if (!saved) {
        console.error("AI 성공 후 fortune 저장 실패:", {
          profileId,
          targetYear,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      isAIGenerated: isAISuccess,
      isPaid: false,
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
