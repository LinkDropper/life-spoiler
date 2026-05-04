import { NextRequest, NextResponse } from "next/server";

import { createAuthClient } from "@/libs/supabase";
import type {
  CompatibilityInterpretationRequest,
  HuajiCrossAnalysis,
  PalaceData,
  SihuaData,
  StarData,
} from "@/libs/services/ai";
import { calculateAge } from "@/libs/utils";
import {
  generateCompatibilityInterpretation,
  createCompatibilityFallbackResult,
} from "@/libs/services/ai";
import {
  analyzeZodiacCompatibility,
  analyzeFiveElementCompatibility,
  calculateBaseScoreRange,
  buildPersonalityProfile,
  analyzeCompatibility,
} from "@/libs/zi-wei-dou-shu/calculators";
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu/core";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";
import type {
  Palace,
  ZiweiChart,
  BranchIndex,
} from "@/libs/zi-wei-dou-shu/types";
import type { CompatibilityPairRow, ProfileRow } from "@/libs/supabase/types";
import type { CompatibilityResult } from "@/libs/hooks/compatibility/types";

// ============================================================
// ⚠️ 임시 캐시 우회 토글 — 프롬프트 변경(마크다운 + 잡소리 차단 룰) 검증 중.
// 켜져 있으면 compatibility_pairs.result에 이미 저장된 결과를 무시하고 항상
// 새로 LLM 호출을 실행한다. 결과 쓰기는 그대로 유지되므로 토글을 false로
// 되돌리면 즉시 정상 동작 복구. 검증 끝나면 false로 되돌리거나 이 블록 자체를
// 제거할 것.
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

const convertToPalaceData = (palace: Palace): PalaceData => {
  const mainStars: StarData[] = palace.mainStars.map((star) => ({
    name: star.name,
    brightness: star.brightness,
    sihua: star.sihua,
  }));

  const minorStars = palace.minorStars.map((star) => ({
    name: star.name,
    brightness: star.brightness,
    sihua: star.sihua,
  }));

  return {
    name: palace.name,
    branch: EARTHLY_BRANCHES[palace.branch],
    mainStars,
    minorStars,
    ...(palace.isShenGong && { isShenGong: true }),
  };
};

const buildChartData = (chart: ZiweiChart) => {
  const starToPalaceMap = new Map<string, string>();
  for (const palace of chart.palaces) {
    for (const star of [...palace.mainStars, ...palace.minorStars]) {
      starToPalaceMap.set(star.name, palace.name);
    }
  }
  const findPalaceForStar = (starName: string): string =>
    starToPalaceMap.get(starName) ?? "불명";

  const sihuaData: SihuaData = {
    hualu: {
      star: chart.sihua.hualu,
      palace: findPalaceForStar(chart.sihua.hualu),
    },
    huaquan: {
      star: chart.sihua.huaquan,
      palace: findPalaceForStar(chart.sihua.huaquan),
    },
    huake: {
      star: chart.sihua.huake,
      palace: findPalaceForStar(chart.sihua.huake),
    },
    huaji: {
      star: chart.sihua.huaji,
      palace: findPalaceForStar(chart.sihua.huaji),
    },
  };

  const palacesMap: Record<string, PalaceData> = {};
  for (const palace of chart.palaces) {
    palacesMap[palace.name] = convertToPalaceData(palace);
  }

  return {
    chartInfo: {
      wuxingJu: WUXING_JU_NAMES[chart.wuxingJu] || `${chart.wuxingJu}국`,
      mingGongPosition: EARTHLY_BRANCHES[chart.mingGong],
      shenGongPosition: EARTHLY_BRANCHES[chart.shenGong],
      sihua: sihuaData,
    },
    palacesMap,
  };
};

const getLunarBirthInfo = (chart: ZiweiChart): string => {
  const { lunarDate } = chart;
  return `${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`;
};

// ============================================================
// 화기 교차 분석
// ============================================================

const calculateHuajiCrossAnalysis = (
  chartA: ZiweiChart,
  chartB: ZiweiChart,
  palacesMapA: Record<string, PalaceData>,
  palacesMapB: Record<string, PalaceData>
): HuajiCrossAnalysis => {
  // A의 화기 별이 위치한 궁의 지지(branch) 확인
  const huajiStarA = chartA.sihua.huaji;
  const huajiStarB = chartB.sihua.huaji;

  const isHuaji = (s: StarData) => s.sihua === "화기";

  const huajiPalaceA = Object.values(palacesMapA).find((p) =>
    p.mainStars.some((s) => s.name === huajiStarA && isHuaji(s))
  );
  const huajiPalaceB = Object.values(palacesMapB).find((p) =>
    p.mainStars.some((s) => s.name === huajiStarB && isHuaji(s))
  );

  const huajiBranchA = huajiPalaceA?.branch;
  const huajiBranchB = huajiPalaceB?.branch;

  // A의 화기 지지와 같은 지지에 있는 B의 궁 찾기
  const aHuajiAffectsBPalaces = huajiBranchA
    ? Object.values(palacesMapB)
        .filter((p) => p.branch === huajiBranchA)
        .map((p) => p.name)
    : [];

  // B의 화기 지지와 같은 지지에 있는 A의 궁 찾기
  const bHuajiAffectsAPalaces = huajiBranchB
    ? Object.values(palacesMapA)
        .filter((p) => p.branch === huajiBranchB)
        .map((p) => p.name)
    : [];

  // 양쪽 화기가 같은 영역인지 판단
  const bothHuajiSameArea =
    !!huajiBranchA && !!huajiBranchB && huajiBranchA === huajiBranchB;

  return {
    huajiPalaceA: huajiPalaceA?.name || "불명",
    huajiPalaceB: huajiPalaceB?.name || "불명",
    aHuajiAffectsBPalaces,
    bHuajiAffectsAPalaces,
    bothHuajiSameArea,
  };
};

// ============================================================
// API 라우트
// ============================================================

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pairId } = await params;

    // 1. 인증 확인
    const supabase = await createAuthClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 2. pair 조회
    const { data: pairData, error: pairError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("compatibility_pairs") as any)
        .select("*")
        .eq("id", pairId)
        .single();

    if (pairError || !pairData) {
      return NextResponse.json(
        { success: false, error: "궁합 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const pair = pairData as CompatibilityPairRow;

    // 3. 소유권 확인
    if (pair.user_id !== authUser.id) {
      return NextResponse.json(
        { success: false, error: "접근 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 3-1. paid_at 이 NULL 이면 profile_free_access(promo) 보유 시 paid_at 승격
    if (!pair.paid_at) {
      const now = new Date().toISOString();
      const { data: freeAccess } = await supabase
        .from("profile_free_access")
        .select("id")
        .eq("pair_id", pairId)
        .eq("fortune_type", "compatibility")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();
      if (freeAccess) {
        const { error: updateError } =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("compatibility_pairs") as any)
            .update({ paid_at: now })
            .eq("id", pairId);
        if (updateError) {
          console.error("궁합 페어 paid_at 자동 승격 실패:", {
            pairId,
            error: updateError,
          });
        } else {
          pair.paid_at = now;
        }
      }
    }

    // 4. 이미 결과가 있으면 기존 결과 반환 (BYPASS 모드면 스킵)
    if (pair.result !== null && !BYPASS_INTERPRETATION_CACHE) {
      return NextResponse.json({
        success: true,
        data: pair.result as unknown as CompatibilityResult,
        isAIGenerated: true,
        isPaid: !!pair.paid_at,
        relationshipType: pair.relationship_type,
      });
    }

    // 5. 두 프로필 조회
    const { data: profilesData, error: profilesError } =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("profiles") as any)
        .select("*")
        .in("id", [pair.profile_a_id, pair.profile_b_id]);

    const profiles = profilesData as ProfileRow[] | null;

    if (profilesError || !profiles || profiles.length < 2) {
      return NextResponse.json(
        { success: false, error: "프로필 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const profileA = profiles.find((p) => p.id === pair.profile_a_id)!;
    const profileB = profiles.find((p) => p.id === pair.profile_b_id)!;

    // 6. 두 명반 생성
    const chartA = generateZiweiChart({
      name: profileA.name,
      birthDate: profileA.birth_date,
      birthTime: profileA.birth_time_unknown
        ? "unknown"
        : profileA.birth_time?.slice(0, 5) || "unknown",
      gender: profileA.gender,
      calendarType: profileA.calendar_type,
    });

    const isPetRelationship =
      pair.relationship_type === "cat_owner" ||
      pair.relationship_type === "dog_owner";

    const chartB = generateZiweiChart({
      name: profileB.name,
      birthDate: profileB.birth_date,
      birthTime:
        isPetRelationship || profileB.birth_time_unknown
          ? "unknown"
          : profileB.birth_time?.slice(0, 5) || "unknown",
      gender: profileB.gender,
      calendarType: profileB.calendar_type,
    });

    // 7. 띠/오행 궁합 계산
    const zodiacCompat = analyzeZodiacCompatibility(
      chartA.lunarDate.yearBranch as BranchIndex,
      chartB.lunarDate.yearBranch as BranchIndex
    );
    const fiveElementCompat = analyzeFiveElementCompatibility(
      chartA.wuxingJu,
      chartB.wuxingJu
    );

    // 8. 점수 범위 계산
    const scoreRange = calculateBaseScoreRange(zodiacCompat, fiveElementCompat);

    // 9. 차트 데이터 변환
    const chartDataA = buildChartData(chartA);
    const chartDataB = buildChartData(chartB);

    // 관계 유형 레이블
    const relationshipLabel =
      pair.relationship_type === "custom"
        ? pair.relationship_type_custom || "기타"
        : {
            lover: "연인",
            some: "썸",
            friend: "친구",
            colleague: "동료",
            family: "가족",
            ex_partner: "전 연인",
            ex_spouse: "전 배우자",
            cat_owner: "집사/고양이",
            dog_owner: "집사/강아지",
            custom: "기타",
          }[pair.relationship_type] || "기타";

    // 10. 화기 교차 분석
    const huajiCrossAnalysis = calculateHuajiCrossAnalysis(
      chartA,
      chartB,
      chartDataA.palacesMap,
      chartDataB.palacesMap
    );

    // 11. 나이 계산
    const ageA = calculateAge(profileA.birth_date);
    const ageB = calculateAge(profileB.birth_date);

    // 12. 성격 프로필 사전 계산
    const personalityA = buildPersonalityProfile(chartA);
    const personalityB = buildPersonalityProfile(chartB);

    // 12. 교차 분석 사전 계산
    const compatAnalysis = analyzeCompatibility(
      chartA,
      chartB,
      personalityA,
      personalityB
    );

    const interpretRequest: Omit<
      CompatibilityInterpretationRequest,
      "requestType"
    > = {
      profileA: {
        name: profileA.name,
        gender: profileA.gender,
        lunarBirthInfo: getLunarBirthInfo(chartA),
        birthYear: chartA.lunarDate.year,
        currentAge: ageA,
      },
      profileB: {
        name: profileB.name,
        gender: profileB.gender,
        lunarBirthInfo: getLunarBirthInfo(chartB),
        birthYear: chartB.lunarDate.year,
        currentAge: ageB,
      },
      chartA: chartDataA.chartInfo,
      chartB: chartDataB.chartInfo,
      palacesA: chartDataA.palacesMap,
      palacesB: chartDataB.palacesMap,
      huajiCrossAnalysis,
      personalityA,
      personalityB,
      analysis: compatAnalysis,
      relationshipType: relationshipLabel,
      relationshipTypeKey: pair.relationship_type,
      zodiacCompatibility: zodiacCompat.description,
      fiveElementCompatibility: fiveElementCompat.description,
      scoreRange: { min: scoreRange.min, max: scoreRange.max },
    };

    // 9. AI 전체 해석 실행
    let result: CompatibilityResult;
    let isAISuccess = false;

    try {
      result = await generateCompatibilityInterpretation(interpretRequest);

      // rawChart & profileId 채우기
      result.charts.profileA.profileId = profileA.id;
      result.charts.profileA.rawChart = chartA;
      result.charts.profileB.profileId = profileB.id;
      result.charts.profileB.rawChart = chartB;

      isAISuccess = true;
    } catch (error) {
      console.error("궁합 AI 해석 오류:", error);
      result = createCompatibilityFallbackResult(error as Error);

      // fallback에도 chart 정보는 채워줌
      result.charts.profileA.profileId = profileA.id;
      result.charts.profileA.name = profileA.name;
      result.charts.profileA.rawChart = chartA;
      result.charts.profileA.chart = {
        wuxingJu: chartDataA.chartInfo.wuxingJu,
        mingGong: chartDataA.chartInfo.mingGongPosition,
        shenGong: chartDataA.chartInfo.shenGongPosition,
        sihua: {
          hualu: chartDataA.chartInfo.sihua.hualu.star,
          huaquan: chartDataA.chartInfo.sihua.huaquan.star,
          huake: chartDataA.chartInfo.sihua.huake.star,
          huaji: chartDataA.chartInfo.sihua.huaji.star,
        },
      };
      result.charts.profileB.profileId = profileB.id;
      result.charts.profileB.name = profileB.name;
      result.charts.profileB.rawChart = chartB;
      result.charts.profileB.chart = {
        wuxingJu: chartDataB.chartInfo.wuxingJu,
        mingGong: chartDataB.chartInfo.mingGongPosition,
        shenGong: chartDataB.chartInfo.shenGongPosition,
        sihua: {
          hualu: chartDataB.chartInfo.sihua.hualu.star,
          huaquan: chartDataB.chartInfo.sihua.huaquan.star,
          huake: chartDataB.chartInfo.sihua.huake.star,
          huaji: chartDataB.chartInfo.sihua.huaji.star,
        },
      };
    }

    // 10. DB 저장 (AI 성공 시에만)
    if (isAISuccess) {
      const { error: updateError } =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("compatibility_pairs") as any)
          .update({
            result: result as unknown as Record<string, unknown>,
            score: result.score,
          })
          .eq("id", pairId);

      if (updateError) {
        console.error("궁합 결과 저장 실패:", updateError);
      }
    }

    // 11. 결과 반환
    return NextResponse.json({
      success: true,
      data: result,
      isAIGenerated: isAISuccess,
      isPaid: !!pair.paid_at,
      relationshipType: pair.relationship_type,
    });
  } catch (error) {
    console.error("궁합 해석 API 오류:", error);
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
