import { isPositiveBrightness } from "../calculators";
import type {
  Brightness,
  FortuneSection,
  Palace,
  StarInfo,
  ZiweiChart,
} from "../types";
import {
  CAIBAI_INTERPRETATIONS,
  FUQI_INTERPRETATIONS,
  GUANLU_INTERPRETATIONS,
  HEADLINE_TEMPLATES,
  JIYE_INTERPRETATIONS,
  MING_GONG_INTERPRETATIONS,
  STAR_EMOJI,
} from "./templates";

// ============================================================
// 궁 분석 결과 타입
// ============================================================

interface PalaceAnalysis {
  palace: Palace;
  mainStarInterpretations: string[];
  minorStarSummary: string;
  overallScore: number;
}

// ============================================================
// 주성 해석 조회
// ============================================================

/**
 * 주성의 해석 텍스트 조회
 */
const getMainStarInterpretation = (
  star: StarInfo,
  palaceName: string
): string | null => {
  let interpretationTable: Record<string, Record<Brightness, string>> | null =
    null;

  switch (palaceName) {
    case "명궁":
      interpretationTable = MING_GONG_INTERPRETATIONS;
      break;
    case "재백궁":
      interpretationTable = CAIBAI_INTERPRETATIONS;
      break;
    case "관록궁":
      interpretationTable = GUANLU_INTERPRETATIONS;
      break;
    case "부처궁":
      interpretationTable = FUQI_INTERPRETATIONS;
      break;
    case "질액궁":
      interpretationTable = JIYE_INTERPRETATIONS;
      break;
    default:
      return null;
  }

  const starInterpretations = interpretationTable[star.name];
  if (!starInterpretations) {
    return null;
  }

  return starInterpretations[star.brightness];
};

// ============================================================
// 점수 계산
// ============================================================

/**
 * 밝기 점수 반환
 */
const getBrightnessScore = (brightness: Brightness): number => {
  const scores: Record<Brightness, number> = {
    묘: 100,
    왕: 85,
    득: 70,
    리: 50,
    평: 30,
    함: 10,
  };
  return scores[brightness];
};

/**
 * 사화 점수 반환
 */
const getSihuaScore = (star: StarInfo): number => {
  if (!star.sihua) return 0;

  switch (star.sihua) {
    case "화록":
      return 20;
    case "화권":
      return 15;
    case "화과":
      return 10;
    case "화기":
      return -20;
    default:
      return 0;
  }
};

/**
 * 궁의 전체 점수 계산
 */
const calculatePalaceScore = (palace: Palace): number => {
  if (palace.mainStars.length === 0) {
    return 50; // 주성이 없는 궁은 중립
  }

  let totalScore = 0;
  let starCount = 0;

  // 주성 점수 계산
  for (const star of palace.mainStars) {
    totalScore += getBrightnessScore(star.brightness);
    totalScore += getSihuaScore(star);
    starCount++;
  }

  // 보조성 가산점
  for (const star of palace.minorStars) {
    if (["좌보", "우필", "천괴", "천월", "문창", "문곡"].includes(star.name)) {
      totalScore += 10; // 길성
    } else if (
      ["화성", "영성", "양인", "타라", "지겁", "지공"].includes(star.name)
    ) {
      totalScore -= 10; // 살성
    }
    totalScore += getSihuaScore(star);
  }

  return Math.round(totalScore / starCount);
};

// ============================================================
// 보조성 요약
// ============================================================

/**
 * 보조성 요약 텍스트 생성
 */
const summarizeMinorStars = (palace: Palace): string => {
  const positiveStars: string[] = [];
  const negativeStars: string[] = [];

  for (const star of palace.minorStars) {
    const emoji = STAR_EMOJI[star.name] || "⭐";
    const starText = `${emoji} ${star.name}`;

    if (
      ["좌보", "우필", "천괴", "천월", "문창", "문곡", "천마"].includes(
        star.name
      )
    ) {
      positiveStars.push(starText);
    } else if (
      ["화성", "영성", "양인", "타라", "지겁", "지공"].includes(star.name)
    ) {
      negativeStars.push(starText);
    } else if (["홍란", "천희"].includes(star.name)) {
      positiveStars.push(starText); // 연애궁에서 길성
    }
  }

  const parts: string[] = [];

  if (positiveStars.length > 0) {
    parts.push(
      `길성 ${positiveStars.join(", ")}이(가) 함께하여 운세를 돕습니다.`
    );
  }

  if (negativeStars.length > 0) {
    parts.push(
      `살성 ${negativeStars.join(", ")}이(가) 있어 주의가 필요합니다.`
    );
  }

  return parts.join(" ");
};

// ============================================================
// 궁 분석
// ============================================================

/**
 * 특정 궁 분석
 */
export const analyzePalace = (palace: Palace): PalaceAnalysis => {
  const mainStarInterpretations: string[] = [];

  // 주성 해석 수집
  for (const star of palace.mainStars) {
    const interpretation = getMainStarInterpretation(star, palace.name);
    if (interpretation) {
      const emoji = STAR_EMOJI[star.name] || "⭐";
      let prefix = `${emoji} ${star.name}(${star.brightness})`;

      if (star.sihua) {
        prefix += ` [${star.sihua}]`;
      }

      mainStarInterpretations.push(`${prefix}: ${interpretation}`);
    }
  }

  // 주성이 없는 경우
  if (palace.mainStars.length === 0) {
    mainStarInterpretations.push(
      "주성이 없는 궁입니다. 대궁(對宮)의 영향을 받으며, 다른 궁의 별들과의 관계가 중요합니다."
    );
  }

  return {
    palace,
    mainStarInterpretations,
    minorStarSummary: summarizeMinorStars(palace),
    overallScore: calculatePalaceScore(palace),
  };
};

/**
 * 궁 이름으로 궁 찾기
 */
export const findPalaceByName = (
  chart: ZiweiChart,
  palaceName: string
): Palace | undefined => {
  return chart.palaces.find((p) => p.name === palaceName);
};

// ============================================================
// 섹션별 분석
// ============================================================

/**
 * 재백궁 분석 → 재물운 생성
 */
export const analyzeWealth = (chart: ZiweiChart): FortuneSection => {
  const palace = findPalaceByName(chart, "재백궁");
  if (!palace) {
    return {
      title: "💰 재물운",
      content: "재백궁 정보를 찾을 수 없습니다.",
      highlights: [],
    };
  }

  const analysis = analyzePalace(palace);
  const highlights: string[] = [];

  // 하이라이트 추출
  for (const star of palace.mainStars) {
    if (isPositiveBrightness(star.brightness)) {
      highlights.push(`${star.name}이(가) ${star.brightness}으로 빛남`);
    }
    if (star.sihua === "화록") {
      highlights.push(`${star.name}에 화록 - 재물복 상승`);
    }
  }

  // 천마가 있으면 유동 자산운 강조
  if (palace.minorStars.some((s) => s.name === "천마")) {
    highlights.push("천마 동궁 - 유동적 재물운");
  }

  const content = [
    ...analysis.mainStarInterpretations,
    analysis.minorStarSummary,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: "💰 재물운",
    content,
    highlights,
  };
};

/**
 * 관록궁 분석 → 직업운 생성
 */
export const analyzeCareer = (chart: ZiweiChart): FortuneSection => {
  const palace = findPalaceByName(chart, "관록궁");
  if (!palace) {
    return {
      title: "💼 직업운",
      content: "관록궁 정보를 찾을 수 없습니다.",
      highlights: [],
    };
  }

  const analysis = analyzePalace(palace);
  const highlights: string[] = [];

  // 하이라이트 추출
  for (const star of palace.mainStars) {
    if (isPositiveBrightness(star.brightness)) {
      highlights.push(`${star.name}이(가) 직업궁에서 빛남`);
    }
    if (star.sihua === "화권") {
      highlights.push(`${star.name}에 화권 - 권력/승진운`);
    }
  }

  // 문창/문곡이 있으면 학업/시험운 강조
  const hasWenStars = palace.minorStars.some((s) =>
    ["문창", "문곡"].includes(s.name)
  );
  if (hasWenStars) {
    highlights.push("문창/문곡 동궁 - 시험/자격증운 좋음");
  }

  const content = [
    ...analysis.mainStarInterpretations,
    analysis.minorStarSummary,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: "💼 직업운",
    content,
    highlights,
  };
};

/**
 * 부처궁 분석 → 인연운 생성
 */
export const analyzeRelationship = (chart: ZiweiChart): FortuneSection => {
  const palace = findPalaceByName(chart, "부처궁");
  if (!palace) {
    return {
      title: "💑 인연운",
      content: "부처궁 정보를 찾을 수 없습니다.",
      highlights: [],
    };
  }

  const analysis = analyzePalace(palace);
  const highlights: string[] = [];

  // 하이라이트 추출
  for (const star of palace.mainStars) {
    if (isPositiveBrightness(star.brightness)) {
      highlights.push(`${star.name}이(가) 배우자궁에서 빛남`);
    }
    if (star.sihua === "화기") {
      highlights.push(`${star.name}에 화기 - 배우자와 갈등 주의`);
    }
  }

  // 홍란/천희 확인
  const hasLoveStars = palace.minorStars.some((s) =>
    ["홍란", "천희"].includes(s.name)
  );
  if (hasLoveStars) {
    highlights.push("홍란/천희 동궁 - 이성운 좋음");
  }

  const content = [
    ...analysis.mainStarInterpretations,
    analysis.minorStarSummary,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: "💑 인연운",
    content,
    highlights,
  };
};

/**
 * 질액궁 분석 → 건강운 생성
 */
export const analyzeHealth = (chart: ZiweiChart): FortuneSection => {
  const palace = findPalaceByName(chart, "질액궁");
  if (!palace) {
    return {
      title: "🏥 건강운",
      content: "질액궁 정보를 찾을 수 없습니다.",
      highlights: [],
    };
  }

  const analysis = analyzePalace(palace);
  const highlights: string[] = [];

  // 하이라이트 추출
  for (const star of palace.mainStars) {
    if (star.brightness === "함" || star.brightness === "평") {
      highlights.push(`${star.name} ${star.brightness} - 건강 주의 필요`);
    }
    if (star.sihua === "화기") {
      highlights.push(`${star.name}에 화기 - 질병 주의`);
    }
  }

  // 살성 확인
  const hasShaStars = palace.minorStars.some((s) =>
    ["화성", "영성", "양인", "타라"].includes(s.name)
  );
  if (hasShaStars) {
    highlights.push("살성 동궁 - 사고/부상 주의");
  }

  const content = [
    ...analysis.mainStarInterpretations,
    analysis.minorStarSummary,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    title: "🏥 건강운",
    content,
    highlights,
  };
};

// ============================================================
// 명궁 분석 (미리보기용)
// ============================================================

/**
 * 명궁 주성 중 가장 밝은 별 찾기
 */
export const findBrightestMainStar = (chart: ZiweiChart): StarInfo | null => {
  const mingPalace = findPalaceByName(chart, "명궁");
  if (!mingPalace || mingPalace.mainStars.length === 0) {
    return null;
  }

  const brightnessOrder: Brightness[] = ["묘", "왕", "득", "리", "평", "함"];

  return mingPalace.mainStars.reduce((brightest, star) => {
    const currentOrder = brightnessOrder.indexOf(star.brightness);
    const brightestOrder = brightnessOrder.indexOf(brightest.brightness);
    return currentOrder < brightestOrder ? star : brightest;
  });
};

/**
 * 헤드라인 생성 (미리보기용)
 */
export const generateHeadline = (chart: ZiweiChart): string => {
  const brightestStar = findBrightestMainStar(chart);

  if (!brightestStar) {
    return "당신만의 특별한 인생 여정";
  }

  const starTemplates = HEADLINE_TEMPLATES[brightestStar.name];
  if (starTemplates) {
    return (
      starTemplates[brightestStar.brightness] ||
      `${brightestStar.name}의 기운을 받은 인생`
    );
  }

  return `${brightestStar.name} 기반의 독특한 인생 여정`;
};

/**
 * 명궁 미리보기 설명 생성
 */
export const generatePreviewDescription = (chart: ZiweiChart): string => {
  const mingPalace = findPalaceByName(chart, "명궁");
  if (!mingPalace) {
    return "명궁 정보를 분석할 수 없습니다.";
  }

  const analysis = analyzePalace(mingPalace);

  if (analysis.mainStarInterpretations.length > 0) {
    // 첫 번째 해석만 미리보기로 반환 (100자 제한)
    const [firstInterpretation] = analysis.mainStarInterpretations;
    if (firstInterpretation.length > 100) {
      return `${firstInterpretation.substring(0, 100)}...`;
    }
    return firstInterpretation;
  }

  return "주성이 없는 특별한 구조의 명반입니다. 자세한 해석을 확인해보세요.";
};
