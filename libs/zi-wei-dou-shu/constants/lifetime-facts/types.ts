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
 * - evidence: 화면에 노출하는 "근거 한 줄". 쉬운 말만, 별 이름 금지
 *   (대표 결정 2026-11-06, §7-1 (a)). 예: "돈을 보는 자리에 계산이 빠른 기운이 있어요"
 * - material: 장면 재료 (재설계 3단계). 예전 완성 문장 장면 씨앗은 모델이 그대로 옮겨서,
 *   명사구 단서와 대사 재료로 바꿨다.
 */
export interface FactRule {
  topic: string;
  direction: FactDirection;
  strength: FactStrength;
  evidence: LocalizedText;
  material: NarrativeMaterial;
}

/**
 * 주장 하나가 장면을 만들 재료.
 * - lens: 그 주장이 맡을 관점. 섹션별 목록은 lenses.ts(SECTION_LENSES)
 * - cues: 언제·어디서·누구와·무엇을 가리키는 명사구 3~4개 (각 15자 이내, 완성 문장 금지)
 * - voice: 곁 사람이 할 법한 말 한마디 (따옴표 없이, 25자 이내, 반말 구어)
 * - avoid: 잘못 읽기 쉬운 해석 (2~6자 명사)
 */
export interface NarrativeMaterial {
  lens: string;
  cues: string[];
  voice: string;
  avoid: string;
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

/**
 * 사실이 부족한 섹션을 채우는 "별 × 영역" 보충 주장 (LLM 전용).
 *
 * 화면용 궁 설명(STAR_IN_PALACE)은 성격 묘사 문장이라 장면이 없고, LLM 입력으로
 * 쓰면 "뜻이 흐린" 문장이 됐다(일반 독자 판정: 사실 한 줄이 바로 이해됨 49%, 장면 0%).
 * 화면 문구는 그대로 두고, LLM에는 이 표의 쉬운 말 주제와 장면을 넘긴다.
 *
 * - topic: 그 영역에서 실제로 무슨 일이 생기는지 판정 한 줄
 * - lens·cues·voice·avoid: 장면 재료 (NarrativeMaterial)
 * 인연(부처궁)은 연애 재료 표(love-facts.ts)를 쓴다.
 */
export interface FallbackFact extends NarrativeMaterial {
  /** 판정 한 줄 (KO, 45자 이내, "~하는 사람/편", 비유·성격 꼬리표 금지) */
  topic: string;
}

export interface StarPalaceFact {
  /** 강점 쪽 (direction positive, strength 2) */
  energy: FallbackFact;
  /** 주의 쪽 (direction negative, strength 1) */
  caution: FallbackFact;
}

/** 보충 주장을 뽑는 궁: 섹션마다 그 섹션의 본궁 하나 */
export type FallbackPalace = "명궁" | "재백궁" | "관록궁" | "질액궁";

export type StarPalaceFactTable = Record<
  FallbackPalace,
  Record<MainStarName, StarPalaceFact>
>;

/**
 * 인연 섹션 재료 (재설계 3단계, docs/lifetime-prompt-redesign-2026-11.md §3.2).
 *
 * 인연 섹션의 질문은 "연애할 때 나는 어떤 사람인가"다. 부처궁 주성 표 하나만 쓰면
 * 관계 분위기 묘사 두 줄(예: 천동 "편하다 / 미룬다")로 섹션 전체를 채워야 했다.
 * 명궁 주성의 연애 행동, 부처궁 주성의 연애관·끌리는 상대, 도화성을 함께 넘긴다.
 *
 * 문장 대신 필드로 쓴다. 완성 문장 장면 씨앗은 모델이 그대로 옮겼고,
 * 키워드만 주면 gpt-5.4-mini가 장면을 만들지 못해 추상적으로 흘렀다.
 */
export type LoveLens =
  | "마음이 열리는 계기"
  | "연락과 표현"
  | "싸우거나 서운할 때"
  | "상대가 보는 나"
  | "끌리는 사람";

export interface LoveFact extends NarrativeMaterial {
  /** 판정: 연애할 때 이 사람이 실제로 하는 일 (KO, "~하는 사람" 형태, 40자 이내, 별·궁 이름 금지) */
  judgment: string;
  lens: LoveLens;
}

export interface LoveFactPair {
  /** 강점 쪽 (direction positive) */
  energy: LoveFact;
  /** 주의 쪽 (direction negative) */
  caution: LoveFact;
}

/** 도화성: 연애 감정이 겉으로 드러나는 별 */
export type PeachBlossomStar = "홍란" | "천희";

/** 도화성이 연애에 직접 작용하는 자리 */
export type PeachBlossomPalace = "명궁" | "부처궁";
