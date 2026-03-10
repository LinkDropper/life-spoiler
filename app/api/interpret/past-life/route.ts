import { NextRequest, NextResponse } from "next/server";

import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import type {
  PalaceData,
  PastLifeFortuneInterpretation,
  SihuaData,
  StarData,
  ZiweiInterpretationRequest,
} from "@/libs/services/ai";
import {
  createPastLifeFallbackInterpretation,
  generatePastLifeInterpretation,
} from "@/libs/services/ai";
import {
  generateChartHash,
  getCachedResult,
  getFortune,
  saveFortune,
  setCachedResult,
  type PastLifeFortuneData,
} from "@/libs/supabase";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import { identifyGeokGuk } from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
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
 * Palace를 PalaceData로 변환
 */
const convertToPalaceData = (palace: Palace): PalaceData => {
  const mainStars: StarData[] = palace.mainStars.map((star) => ({
    name: star.name,
    brightness: star.brightness,
    sihua: star.sihua,
  }));

  const minorStars: StarData[] = palace.minorStars.map((star) => ({
    name: star.name,
    brightness: star.brightness,
    sihua: star.sihua,
  }));

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
  chart: ZiweiChart
): Omit<ZiweiInterpretationRequest, "requestType"> => {
  const { input, lunarDate, palaces, sihua, wuxingJu, mingGong, shenGong } =
    chart;

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
    huaquan: {
      star: sihua.huaquan,
      palace: findPalaceForStar(sihua.huaquan),
    },
    huake: { star: sihua.huake, palace: findPalaceForStar(sihua.huake) },
    huaji: { star: sihua.huaji, palace: findPalaceForStar(sihua.huaji) },
  };

  const palacesMap: Record<string, PalaceData> = {};
  for (const palace of palaces) {
    palacesMap[palace.name] = convertToPalaceData(palace);
  }

  // 격국 분석
  const geokGukResults = identifyGeokGuk(chart);

  return {
    user: {
      gender: input.gender,
      lunarBirthInfo,
      relationshipStatus: input.relationshipStatus ?? null,
      relationshipStatusCustom: input.relationshipStatusCustom ?? null,
      occupationStatus: input.occupationStatus ?? null,
      occupationStatusCustom: input.occupationStatusCustom ?? null,
    },
    chart: {
      wuxingJu: WUXING_JU_NAMES[wuxingJu] || `${wuxingJu}국`,
      mingGongPosition: EARTHLY_BRANCHES[mingGong],
      shenGongPosition: EARTHLY_BRANCHES[shenGong],
      sihua: sihuaData,
    },
    palaces: palacesMap,
    geokGuk: geokGukResults.length > 0 ? geokGukResults : undefined,
  };
};

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
    const profileId =
      typeof body.profileId === "string" ? body.profileId : undefined;

    // 언어 파라미터 검증
    const requestedLanguage = body.language;
    const language: Locale =
      typeof requestedLanguage === "string" &&
      (locales as readonly string[]).includes(requestedLanguage)
        ? (requestedLanguage as Locale)
        : defaultLocale;

    // 캐시 키에 언어 포함
    const cacheKey = `full-past_life-${language}` as `full-past_life-${Locale}`;

    // 1. profileId가 있으면 저장된 fortune 먼저 확인
    if (profileId) {
      const existingFortune = await getFortune(profileId, "past_life", 0);
      if (existingFortune?.result) {
        const storedData =
          existingFortune.result as unknown as PastLifeFortuneData;
        if (
          storedData.interpretation &&
          storedData.rawChart &&
          storedData.language === language
        ) {
          return NextResponse.json({
            success: true,
            data: storedData,
            isAIGenerated: true,
            isPaid: !!existingFortune.paid_at,
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

    const cachedResult = await getCachedResult<PastLifeFortuneInterpretation>(
      chartHash,
      cacheKey
    );

    // 응답 데이터 구조 (재사용)
    const buildResponseData = (
      interpretation: PastLifeFortuneInterpretation
    ): PastLifeFortuneData => ({
      language,
      chart: {
        wuxingJu: WUXING_JU_NAMES[chart.wuxingJu],
        mingGong: EARTHLY_BRANCHES[chart.mingGong],
        shenGong: EARTHLY_BRANCHES[chart.shenGong],
        sihua: chart.sihua,
      },
      rawChart: chart,
      interpretation,
    });

    if (cachedResult) {
      const responseData = buildResponseData(cachedResult);

      if (profileId) {
        const saved = await saveFortune({
          profileId,
          fortuneType: "past_life",
          year: 0,
          result: responseData,
        });
        if (!saved) {
          console.error("캐시 히트 시 fortune 저장 실패:", {
            profileId,
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

    const interpretRequest = {
      ...convertChartToRequest(chart),
      language,
    };

    let result: PastLifeFortuneInterpretation;
    let isAISuccess = false;

    try {
      result = await generatePastLifeInterpretation(
        interpretRequest,
        profileId ?? chartHash
      );
      isAISuccess = true;

      // 캐시 저장 (AI 성공 시에만)
      await setCachedResult(chartHash, cacheKey, result);
    } catch (error) {
      console.error("AI 해석 오류:", error);
      result = createPastLifeFallbackInterpretation(error as Error);
    }

    const responseData = buildResponseData(result);

    // fortunes에 전체 데이터 저장 (AI 성공 시, profileId가 있으면)
    if (profileId && isAISuccess) {
      const saved = await saveFortune({
        profileId,
        fortuneType: "past_life",
        year: 0,
        result: responseData,
      });
      if (!saved) {
        console.error("AI 성공 후 fortune 저장 실패:", {
          profileId,
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
