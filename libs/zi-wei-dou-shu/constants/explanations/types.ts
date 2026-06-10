import type { Locale } from "@/i18n/config";

import type { PalaceName } from "../palaces";
import type { MainStarName, MinorStarName } from "../stars";

/**
 * 다국어 텍스트 (ko/en/ja 모두 필수)
 */
export type LocalizedText = Record<Locale, string>;

/**
 * 특정 궁(宮)에 놓인 특정 주성(主星)의 해석.
 *
 * 자미두수에서 같은 별이라도 어느 궁에 있느냐에 따라 의미가 달라지므로,
 * 14주성 × 12궁 = 168개 조합을 각각 명시적으로 작성한다.
 *
 * - energy: 그 별이 그 영역에서 만들어내는 핵심 기운 (강점·긍정 중심)
 * - caution: 양면성 — 과하거나 약할 때의 주의점과 대처 ("다만 ~")
 */
export interface StarInPalaceEntry {
  energy: LocalizedText;
  caution: LocalizedText;
}

/**
 * 한 궁에 대한 14주성 해석 맵.
 * 어떤 주성이든 그 궁에 올 수 있으므로 14개 전부 정의한다.
 */
export type PalaceStarMap = Record<MainStarName, StarInPalaceEntry>;

/**
 * 별×궁 전체 매트릭스 (12궁 × 14주성).
 */
export type StarInPalaceTable = Record<PalaceName, PalaceStarMap>;

/**
 * 궁 자체의 의미 설명 (용어 최소화).
 * - title: 일반어 한 줄 라벨 (예: "돈이 들고 나는 흐름")
 * - meaning: 이 궁이 무엇을 보는 자리인지 1~2문장
 */
export interface PalaceInfoEntry {
  title: LocalizedText;
  meaning: LocalizedText;
}

export type PalaceInfoTable = Record<PalaceName, PalaceInfoEntry>;

/**
 * 보조성(보좌성·살성 등) 해석.
 * 통합 해석에서는 별 하나하나를 따로 설명하지 않고, 메인 조합에 미치는
 * 영향(받쳐줌/거칢/이동)으로 묶어서 녹인다.
 */
export interface MinorStarEntry {
  /** helper=길성(받쳐줌), challenger=살성(거칢), mobile=이동·변화 */
  group: "helper" | "challenger" | "mobile";
  /** 통합 문장에 끼워 쓸 짧은 명사구 (예: "도움 주는 귀인", "속 타는 조급함") */
  keyword: LocalizedText;
  /** (참고·툴팁용) 단독 한 줄 설명 */
  note: LocalizedText;
}

export type MinorStarTable = Record<MinorStarName, MinorStarEntry>;

/** 밝기(亮度) 단계 */
export type BrightnessKey = "묘" | "왕" | "득" | "리" | "평" | "함";

export interface BrightnessEntry {
  /** 그 밝기에서 별이 어떻게 발현되는지 한 줄 */
  phrase: LocalizedText;
}

export type BrightnessTable = Record<BrightnessKey, BrightnessEntry>;

/** 사화(四化) */
export type SihuaKey = "화록" | "화권" | "화과" | "화기";

export interface SihuaEntry {
  phrase: LocalizedText;
}

export type SihuaTable = Record<SihuaKey, SihuaEntry>;

/**
 * 두 주성이 한 궁에 함께 있을 때(동궁, 同宮)의 상호작용 노트.
 * 키는 두 별 이름을 가나다 정렬 후 "+"로 연결 (예: "무곡+천부").
 */
export type StarComboTable = Record<string, { note: LocalizedText }>;
