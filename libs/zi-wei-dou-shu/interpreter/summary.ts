import { getWuxingJuName } from "../calculators";
import { EARTHLY_BRANCHES, HEAVENLY_STEMS } from "../constants";
import type { FortuneResult, ZiweiChart } from "../types";
import {
  analyzeCareer,
  analyzeHealth,
  analyzeRelationship,
  analyzeWealth,
  findBrightestMainStar,
  findPalaceByName,
  generateHeadline,
  generatePreviewDescription,
} from "./analyzer";
import { STAR_EMOJI } from "./templates";

// ============================================================
// 전체 요약 생성
// ============================================================

/**
 * 명반 구조 요약 생성
 */
const generateChartStructureSummary = (chart: ZiweiChart): string => {
  const { lunarDate, wuxingJu, mingGong, shenGong } = chart;

  const yearStemName = HEAVENLY_STEMS[lunarDate.yearStem];
  const yearBranchName = EARTHLY_BRANCHES[lunarDate.yearBranch];
  const mingGongName = EARTHLY_BRANCHES[mingGong];
  const shenGongName = EARTHLY_BRANCHES[shenGong];
  const wuxingName = getWuxingJuName(wuxingJu);

  return [
    `📅 음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일생`,
    `🔮 ${yearStemName}${yearBranchName}년, ${wuxingName}`,
    `🏠 명궁: ${mingGongName}궁 / 신궁: ${shenGongName}궁`,
  ].join("\n");
};

/**
 * 주요 별 배치 요약
 */
const generateStarPlacementSummary = (chart: ZiweiChart): string => {
  const mingPalace = findPalaceByName(chart, "명궁");
  if (!mingPalace) {
    return "";
  }

  const starSummaries: string[] = [];

  // 명궁 주성
  if (mingPalace.mainStars.length > 0) {
    const starNames = mingPalace.mainStars
      .map((s) => {
        const emoji = STAR_EMOJI[s.name] || "⭐";
        let text = `${emoji} ${s.name}(${s.brightness})`;
        if (s.sihua) {
          text += ` [${s.sihua}]`;
        }
        return text;
      })
      .join(", ");
    starSummaries.push(`명궁에 ${starNames}`);
  }

  // 사화 배치
  const { sihua } = chart;
  const sihuaSummary = [
    `화록: ${sihua.hualu}`,
    `화권: ${sihua.huaquan}`,
    `화과: ${sihua.huake}`,
    `화기: ${sihua.huaji}`,
  ].join(" / ");
  starSummaries.push(`사화: ${sihuaSummary}`);

  return starSummaries.join("\n");
};

/**
 * 전체 운세 점수 계산
 */
const calculateOverallScore = (chart: ZiweiChart): number => {
  let totalScore = 0;
  let palaceCount = 0;

  // 명궁 (가중치 2)
  const mingPalace = findPalaceByName(chart, "명궁");
  if (mingPalace) {
    const mingScore = calculatePalaceStrength(mingPalace);
    totalScore += mingScore * 2;
    palaceCount += 2;
  }

  // 재백궁
  const caibaiPalace = findPalaceByName(chart, "재백궁");
  if (caibaiPalace) {
    totalScore += calculatePalaceStrength(caibaiPalace);
    palaceCount++;
  }

  // 관록궁
  const guanluPalace = findPalaceByName(chart, "관록궁");
  if (guanluPalace) {
    totalScore += calculatePalaceStrength(guanluPalace);
    palaceCount++;
  }

  // 부처궁
  const fuqiPalace = findPalaceByName(chart, "부처궁");
  if (fuqiPalace) {
    totalScore += calculatePalaceStrength(fuqiPalace);
    palaceCount++;
  }

  return palaceCount > 0 ? Math.round(totalScore / palaceCount) : 50;
};

/**
 * 궁의 강도 점수 계산
 */
const calculatePalaceStrength = (
  palace: ReturnType<typeof findPalaceByName>
): number => {
  if (!palace) return 50;

  let score = 50; // 기본 점수

  // 주성 밝기 점수
  for (const star of palace.mainStars) {
    switch (star.brightness) {
      case "묘":
        score += 25;
        break;
      case "왕":
        score += 20;
        break;
      case "득":
        score += 15;
        break;
      case "리":
        score += 5;
        break;
      case "평":
        score -= 5;
        break;
      case "함":
        score -= 15;
        break;
    }

    // 사화 가산
    if (star.sihua === "화록") score += 15;
    if (star.sihua === "화권") score += 10;
    if (star.sihua === "화과") score += 8;
    if (star.sihua === "화기") score -= 20;
  }

  // 보조성 가산
  for (const star of palace.minorStars) {
    if (["좌보", "우필", "천괴", "천월"].includes(star.name)) {
      score += 5;
    }
    if (["화성", "영성", "양인", "타라"].includes(star.name)) {
      score -= 8;
    }
  }

  return Math.max(0, Math.min(100, score)); // 0~100 범위로 제한
};

/**
 * 점수 기반 총평 생성
 */
const generateScoreBasedSummary = (score: number): string => {
  if (score >= 80) {
    return "매우 좋은 명반 구조입니다. 타고난 복이 있으며, 인생의 주요 영역에서 순조로운 흐름이 예상됩니다.";
  } else if (score >= 65) {
    return "좋은 명반 구조입니다. 전반적으로 안정적인 운세를 타고났으며, 노력에 따라 더 큰 성취가 가능합니다.";
  } else if (score >= 50) {
    return "평균적인 명반 구조입니다. 장점을 살리고 약점을 보완하면 균형 잡힌 인생을 살 수 있습니다.";
  } else if (score >= 35) {
    return "도전적인 명반 구조입니다. 어려움이 있을 수 있으나, 이를 극복하면 더 큰 성장을 이룰 수 있습니다.";
  } else {
    return "시련이 예상되는 명반 구조입니다. 하지만 노력과 지혜로 운명을 개척해 나갈 수 있습니다.";
  }
};

/**
 * 주요 특징 추출
 */
const extractKeyFeatures = (chart: ZiweiChart): string[] => {
  const features: string[] = [];
  const brightestStar = findBrightestMainStar(chart);

  // 명궁 주성 특징
  if (brightestStar) {
    features.push(
      `명궁에 ${brightestStar.name}(${brightestStar.brightness}) - 주요 성격 지표`
    );
  }

  // 사화 특징
  const { sihua } = chart;
  if (["자미", "천부", "태양", "태음"].includes(sihua.hualu)) {
    features.push(`${sihua.hualu}에 화록 - 강력한 재물복`);
  }
  if (["자미", "천부", "무곡", "염정"].includes(sihua.huaquan)) {
    features.push(`${sihua.huaquan}에 화권 - 권력/지도력 운`);
  }
  if (["탐랑", "염정", "파군"].includes(sihua.huaji)) {
    features.push(`${sihua.huaji}에 화기 - 해당 영역 주의 필요`);
  }

  return features;
};

// ============================================================
// 최종 결과 생성
// ============================================================

/**
 * 전체 운세 결과 생성
 */
export const generateFortuneResult = (chart: ZiweiChart): FortuneResult => {
  // 각 섹션 분석
  const wealth = analyzeWealth(chart);
  const career = analyzeCareer(chart);
  const relationship = analyzeRelationship(chart);
  const health = analyzeHealth(chart);

  // 전체 점수 및 요약
  const overallScore = calculateOverallScore(chart);
  const scoreBasedSummary = generateScoreBasedSummary(overallScore);
  const keyFeatures = extractKeyFeatures(chart);

  // 전체 요약 생성
  const summaryParts = [
    `## 📊 명반 분석 결과 (종합 점수: ${overallScore}점)`,
    "",
    "### 기본 정보",
    generateChartStructureSummary(chart),
    "",
    "### 주요 별 배치",
    generateStarPlacementSummary(chart),
    "",
    "### 총평",
    scoreBasedSummary,
  ];

  if (keyFeatures.length > 0) {
    summaryParts.push("", "### 주요 특징");
    keyFeatures.forEach((f) => summaryParts.push(`- ${f}`));
  }

  return {
    summary: summaryParts.join("\n"),
    preview: {
      summary: generateHeadline(chart),
      description: generatePreviewDescription(chart),
    },
    wealth,
    career,
    relationship,
    health,
  };
};

/**
 * 간단한 미리보기 생성 (결제 전)
 */
export const generatePreviewOnly = (
  chart: ZiweiChart
): FortuneResult["preview"] => {
  return {
    summary: generateHeadline(chart),
    description: generatePreviewDescription(chart),
  };
};
