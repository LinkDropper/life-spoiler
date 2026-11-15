import { NextRequest, NextResponse } from "next/server";

import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import type { FortuneInterpretation } from "@/libs/services/ai";
import {
  createFallbackInterpretation,
  generateFullInterpretation,
} from "@/libs/services/ai";
import {
  buildRequestFactSheet,
  calculateAge,
  convertChartToRequest,
  convertToDayunData,
  WUXING_JU_NAMES,
} from "@/libs/services/ai/lifetime-request";
import {
  generateChartHash,
  getCachedResult,
  getFortune,
  LIFETIME_PROMPT_VERSION,
  saveFortune,
  setCachedResult,
  type LifetimeFortuneData,
} from "@/libs/supabase";
import { toLifetimePreview } from "@/libs/fortune/preview-payload";
import { checkFortuneAccess } from "@/libs/supabase/fortune-access";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateDayun,
  calculateAllDayunScores,
} from "@/libs/zi-wei-dou-shu/calculators";
import { calculateLifetimeCategoryScores } from "@/libs/zi-wei-dou-shu/calculators/lifetime-score";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type { ZiweiInput } from "@/libs/zi-wei-dou-shu/types";
import { ZiweiInputSchema } from "@/libs/zi-wei-dou-shu/types";

// ============================================================
// ⚠️ 임시 캐시 우회 토글 — 검증 시 true 반환하도록 수정.
// false 면 기존 fortunes 행 / chart-hash 캐시를 정상 사용한다.
// ============================================================
const shouldBypassInterpretationCache = (_language: Locale): boolean => false;

// ============================================================
// API 라우트
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parseResult = ZiweiInputSchema.safeParse(body);
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

    const input: ZiweiInput = parseResult.data;
    const includeDetails = body.includeDetails ?? false;
    const profileId =
      typeof body.profileId === "string" ? body.profileId : undefined;

    // 언어 파라미터 검증
    const requestedLanguage = body.language;
    const language: Locale =
      typeof requestedLanguage === "string" &&
      (locales as readonly string[]).includes(requestedLanguage)
        ? (requestedLanguage as Locale)
        : defaultLocale;

    // 캐시 키에 언어 + 프롬프트 버전 포함 (항상 full 타입으로 저장)
    // 프롬프트를 고치면 LIFETIME_PROMPT_VERSION만 올리면 됨 — 상세: libs/supabase/analysis-cache.ts
    const cacheKey =
      `full-${LIFETIME_PROMPT_VERSION}-${new Date().getFullYear()}-${language}` as const;
    const bypassCache = shouldBypassInterpretationCache(language);

    // 로그인·프로필 소유 확인, 결제 여부 판정 (결제 전이면 예고편 필드만 내려줌)
    const access = await checkFortuneAccess(profileId, "lifetime", 0);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }
    const { isPaid } = access;

    // 1. profileId가 있으면 저장된 fortune 먼저 확인 (BYPASS 모드면 스킵)
    if (profileId && !bypassCache) {
      const existingFortune = await getFortune(profileId, "lifetime", 0);
      if (existingFortune?.result) {
        const storedData =
          existingFortune.result as unknown as LifetimeFortuneData;
        // 저장된 데이터에 interpretation이 있고, 언어가 일치하는지 확인
        if (
          storedData.interpretation &&
          storedData.rawChart &&
          storedData.language === language
        ) {
          return NextResponse.json({
            success: true,
            data: isPaid ? storedData : toLifetimePreview(storedData),
            isAIGenerated: true, // 저장된 데이터는 AI 성공 시에만 저장되므로 true
            isPaid,
          });
        }
      }
    }

    // 2. 저장된 데이터가 없으면 새로 계산
    const chart = generateZiweiChart(input);

    const chartHash = generateChartHash({
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      gender: input.gender,
      calendarType: input.calendarType,
      isLeapMonth: input.isLeapMonth,
      relationshipStatus: input.relationshipStatus,
      occupationStatus: input.occupationStatus,
    });

    const dayunResult = calculateAllDayunScores(
      calculateDayun(chart, 100, language)
    );
    // chart-hash 글로벌 캐시도 BYPASS 모드면 스킵 (캐시 쓰기는 아래에서 그대로 진행)
    const cachedResult = bypassCache
      ? null
      : await getCachedResult(chartHash, cacheKey);

    // 응답 데이터 구조 (재사용)
    const buildResponseData = (
      interpretation: FortuneInterpretation
    ): LifetimeFortuneData => ({
      language,
      chart: {
        wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
        mingGong: EARTHLY_BRANCHES[chart.mingGong],
        shenGong: EARTHLY_BRANCHES[chart.shenGong],
        sihua: chart.sihua,
      },
      rawChart: chart,
      dayun: dayunResult,
      interpretation,
    });

    if (cachedResult) {
      const responseData = buildResponseData(cachedResult);

      // 캐시 히트 시에도 fortunes에 전체 데이터 저장 (profileId가 있으면 저장)
      if (profileId) {
        const saved = await saveFortune({
          profileId,
          fortuneType: "lifetime",
          year: 0,
          result: responseData,
        });
        if (!saved) {
          console.error("캐시 히트 시 fortune 저장 실패:", { profileId });
        }
      }

      return NextResponse.json({
        success: true,
        data: isPaid ? responseData : toLifetimePreview(responseData),
        isAIGenerated: true,
        isPaid,
      });
    }

    const currentAge = calculateAge(input.birthDate);
    const dayunPeriods = convertToDayunData(
      dayunResult,
      chart.palaces,
      language
    );
    const interpretRequest = {
      ...convertChartToRequest(chart, {
        currentAge,
        dayunPeriods,
        categoryScores: calculateLifetimeCategoryScores(chart),
        factSheet: buildRequestFactSheet(chart, dayunResult),
      }),
      language,
    };

    let result: FortuneInterpretation;
    let isAISuccess = false;

    try {
      result = await generateFullInterpretation(interpretRequest, {
        includeDetails,
      });
      isAISuccess = true;

      // 캐시 저장 (AI 성공 시에만)
      await setCachedResult(chartHash, cacheKey, result);
    } catch (error) {
      console.error("AI 해석 오류:", error);
      result = createFallbackInterpretation(error as Error);
    }

    const responseData = buildResponseData(result);

    // fortunes에 전체 데이터 저장 (AI 성공 시, profileId가 있으면 저장)
    if (profileId && isAISuccess) {
      const saved = await saveFortune({
        profileId,
        fortuneType: "lifetime",
        year: 0,
        result: responseData,
      });
      if (!saved) {
        console.error("AI 성공 후 fortune 저장 실패:", { profileId });
      }
    }

    return NextResponse.json({
      success: true,
      data: isPaid ? responseData : toLifetimePreview(responseData),
      isAIGenerated: isAISuccess,
      isPaid,
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
