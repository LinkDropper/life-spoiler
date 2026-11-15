import type { Sihua } from "../../types";
import type { LocalizedText } from "../explanations/types";
import type { PalaceName } from "../palaces";
import type { MainStarName } from "../stars";

/**
 * 인생 운세 사실 시트(Phase 2)의 지식 룰 테이블 계약.
 *
 * 엔진이 명반에서 적중한 셀만 골라 섹션별 "주장(FortuneClaim)"으로 만들고,
 * LLM은 그 주장을 문장으로 옮기기만 한다.
 * 설계: docs/lifetime-fortune-quality-2026-11.md §4-1
 */

/** 주장이 배정될 수 있는 섹션 */
export type FactSection =
  | "core"
  | "wealth"
  | "career"
  | "relationship"
  | "health"
  | "timing";

export type FactDirection = "positive" | "negative" | "mixed";

/** 1 = 약한 신호, 5 = 명반 해석의 중심축 */
export type FactStrength = 1 | 2 | 3 | 4 | 5;

/**
 * 룰 테이블 한 셀.
 *
 * - topic: LLM에 넘기는 쉬운 말 주제 한 줄 (KO, 별·궁·사화 이름 금지)
 * - sceneSeeds: 이 기운이 실제로 드러나는 구체 장면 2~3개 (KO, 용어 금지).
 *   LLM이 문장을 만들 재료이므로 "언제·어디서·누구와·무슨 일"이 들어가야 한다.
 * - evidence: 화면에 노출하는 "근거 한 줄". 쉬운 말만, 별 이름 금지
 *   (대표 결정 2026-11-06, §7-1 (a)). 예: "돈을 보는 자리에 계산이 빠른 기운이 있어요"
 */
export interface FactRule {
  topic: string;
  direction: FactDirection;
  strength: FactStrength;
  sceneSeeds: string[];
  evidence: LocalizedText;
}

/** 사화 4종 × 12궁 = 48셀. 생년·궁간 비화·대운 사화 모두 이 표로 해석한다. */
export type SihuaPalaceTable = Record<Sihua, Record<PalaceName, FactRule>>;

/** 주성 직업군 매핑 (14행). 직업 분야명은 이 후보 안에서만 출력한다. */
export interface StarCareerEntry {
  /** 쉬운 말 직업 분야 3~6개 (KO). 예: "기획", "데이터 분석", "IT 개발" */
  fields: string[];
  /** 그 분야에서 이 기운이 쓰이는 방식 한 줄 (KO) */
  how: string;
  evidence: LocalizedText;
}

export type StarCareerTable = Record<MainStarName, StarCareerEntry>;

/** 같은 궁에 함께 앉은 주성 쌍 (약 30쌍) */
export interface StarPairRule {
  stars: [MainStarName, MainStarName];
  rule: FactRule;
}

/**
 * 비행사화(궁간 사화가 다른 궁으로 날아감) 해석 규칙.
 * from 궁의 천간이 만든 sihua가 to 궁에 떨어질 때 적용.
 * to === from 이면 자화(自化).
 */
export interface FlyingSihuaRule {
  from: PalaceName;
  sihua: Sihua;
  /** "self" = 자화 */
  to: PalaceName | "self";
  section: FactSection;
  rule: FactRule;
}

/**
 * 상대(인연) 묘사 — 부처궁 주성 기준. 외모·직업 단정 금지.
 * - traits: 상대 성향 2~3개
 * - role: 관계에서 상대가 맡는 역할
 * - meetingPaths: 만나는 경로 후보 2~3개
 */
export interface PartnerEntry {
  traits: string[];
  role: string;
  meetingPaths: string[];
  evidence: LocalizedText;
}

export type PartnerTable = Record<MainStarName, PartnerEntry>;
