import { NextRequest, NextResponse } from "next/server";

import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
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
import {
  generateChartHash,
  getCachedResult,
  getFortune,
  saveFortune,
  setCachedResult,
  type LifetimeFortuneData,
} from "@/libs/supabase";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import {
  calculateDayun,
  calculateAllDayunScores,
  calculateSihua,
  identifyGeokGuk,
  type DayunResult,
} from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import type {
  Palace,
  ZiweiChart,
  ZiweiInput,
} from "@/libs/zi-wei-dou-shu/types";
import { ZiweiInputSchema } from "@/libs/zi-wei-dou-shu/types";

// ============================================================
// ⚠️ 임시 캐시 우회 토글 — 프롬프트 변경(마크다운 + 잡소리 차단 룰) 검증 중.
// 켜져 있으면 기존 fortunes 행 / chart-hash 캐시를 모두 무시하고 항상 새로
// LLM 호출을 실행한다. 캐시 쓰기는 그대로 유지되므로 토글을 false로 되돌리면
// 즉시 정상 동작 복구.
//
// 검증 끝나면 false로 되돌리거나 이 블록 자체를 제거할 것.
// ============================================================
const BYPASS_INTERPRETATION_CACHE = false;

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
const convertToDayunData = (
  dayunResult: DayunResult,
  palaces: Palace[]
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

    // 대운 천간으로부터 사화 계산
    const dayunSihuaResult = calculateSihua(period.stemIndex);

    return {
      period: `${period.startAge}-${period.endAge}세`,
      palaceName: period.palaceName,
      mainStars,
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
  chart: ZiweiChart,
  options?: { currentAge?: number; dayunPeriods?: DayunData[] }
): Omit<ZiweiInterpretationRequest, "requestType"> => {
  const { input, lunarDate, palaces, sihua, wuxingJu, mingGong, shenGong } =
    chart;
  const { currentAge, dayunPeriods } = options ?? {};

  // 음력 생일 정보 문자열
  const lunarBirthInfo = `${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`;

  // 사용자 상태 정보 (프로필 기반)
  const relationshipStatus = input.relationshipStatus ?? null;
  const relationshipStatusCustom = input.relationshipStatusCustom ?? null;
  const occupationStatus = input.occupationStatus ?? null;
  const occupationStatusCustom = input.occupationStatusCustom ?? null;

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

  // 격국 분석
  const geokGukResults = identifyGeokGuk(chart);

  return {
    user: {
      gender: input.gender,
      lunarBirthInfo,
      currentAge,
      relationshipStatus,
      relationshipStatusCustom,
      occupationStatus,
      occupationStatusCustom,
    },
    chart: {
      wuxingJu: WUXING_JU_NAMES[wuxingJu] || `${wuxingJu}국`,
      mingGongPosition: EARTHLY_BRANCHES[mingGong],
      shenGongPosition: EARTHLY_BRANCHES[shenGong],
      sihua: sihuaData,
    },
    palaces: palacesMap,
    dayunPeriods,
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

    // 캐시 키에 언어 포함 (항상 full 타입으로 저장)
    const cacheKey = `full-${language}` as `full-${Locale}`;

    // 1. profileId가 있으면 저장된 fortune 먼저 확인 (BYPASS 모드면 스킵)
    if (profileId && !BYPASS_INTERPRETATION_CACHE) {
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
            data: storedData,
            isAIGenerated: true, // 저장된 데이터는 AI 성공 시에만 저장되므로 true
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

    const dayunResult = calculateAllDayunScores(
      calculateDayun(chart, 100, language)
    );
    // chart-hash 글로벌 캐시도 BYPASS 모드면 스킵 (캐시 쓰기는 아래에서 그대로 진행)
    const cachedResult = BYPASS_INTERPRETATION_CACHE
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
        data: responseData,
        isAIGenerated: true,
        isPaid: false,
      });
    }

    const currentAge = calculateAge(input.birthDate);
    const dayunPeriods = convertToDayunData(dayunResult, chart.palaces);
    const interpretRequest = {
      ...convertChartToRequest(chart, {
        currentAge,
        dayunPeriods,
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
