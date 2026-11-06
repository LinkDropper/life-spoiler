import type { Locale } from "@/i18n/config";

/**
 * 인생 운세 LLM 출력 검증기.
 *
 * 프롬프트의 "전문 용어 출력 금지"는 모델에게 문구일 뿐이라 실제로 별 이름이
 * 화면까지 노출된 사례가 있었다(docs/lifetime-fortune-quality-2026-11.md §2-1).
 * 여기서는 오탐이 적은 규칙만 강제한다. 일상어와 겹치는 용어(태양·화성·영성·
 * 천상·대운·유년·사주·명반·지지·대한 등)는 일부러 제외하고, 겹칠 수 있는
 * 용어는 부정 전방탐색으로 일상 표현을 비켜 간다.
 * 어휘 반복·양면 헤지 같은 '품질' 지표는 회귀 스크립트에서 측정한다.
 */

export type OutputViolationCode = "FORBIDDEN_TERM" | "META_PHRASE";

export interface OutputViolation {
  code: OutputViolationCode;
  /** 걸린 표현 */
  match: string;
  /** 걸린 필드 경로 (예: "subSections.1.body") */
  path: string;
}

const KO_FORBIDDEN_TERMS: RegExp[] = [
  // 궁 이름
  /(명궁|형제궁|부처궁|자녀궁|재백궁|질액궁|천이궁|교우궁|노복궁|관록궁|전택궁|복덕궁|부모궁)/g,
  // 주성 (천기누설·천부적 같은 일상어 제외)
  /(자미|천기(?!누설)|무곡|천동|염정|천부(?!적|인권)|태음|탐랑|거문(?!고)|천량|칠살|파군)/g,
  // 보좌·살성 (타라는 "~하라고" 류 활용형과 겹쳐 제외, 양인은 서양인·동양인 제외)
  /(좌보|우필|문창|문곡|천괴|천월|록존|홍란|경양|(?<![서동])양인|지겁|지공)/g,
  // 사화·기법 용어 (화기애애·화과자 제외)
  /(화록|화권|화과(?!자)|화기(?!애애|엄금)|삼방사정|원국|격국|천간)/g,
];

const EN_FORBIDDEN_TERMS: RegExp[] = [
  /\b(Life|Siblings|Spouse|Children|Wealth|Health|Travel|Friends|Servants|Career|Property|Fortune|Parents) Palace\b/g,
  /\b(Zi ?Wei|Tian ?Ji|Tai ?Yang|Wu ?Qu|Tian ?Tong|Lian ?Zhen|Tian ?Fu|Tai ?Yin|Tan ?Lang|Ju ?Men|Tian ?Xiang|Tian ?Liang|Qi ?Sha|Po ?Jun)\b/g,
  /\b(Zuo ?Fu|You ?Bi|Wen ?Chang|Wen ?Qu|Tian ?Kui|Tian ?Yue|Lu ?Cun|Hong ?Luan|Qing ?Yang|Yang ?Ren|Tuo ?Luo|Di ?Jie|Di ?Kong)\b/g,
  /\b(Hua ?Lu|Hua ?Quan|Hua ?Ke|Hua ?Ji|Dayun|San ?Fang ?Si ?Zheng|Si ?Hua|Ge ?Ju)\b/gi,
];

const JA_FORBIDDEN_TERMS: RegExp[] = [
  /(命宮|兄弟宮|夫妻宮|子女宮|財帛宮|疾厄宮|遷移宮|交友宮|奴僕宮|官禄宮|田宅宮|福徳宮|父母宮)/g,
  /(紫微|天機|武曲|天同|廉貞|天府|太陰|貪狼|巨門|天梁|七殺|破軍)/g,
  /(左輔|右弼|文昌|文曲|天魁|天鉞|禄存|紅鸞|擎羊|羊刃|陀羅|地劫|地空)/g,
  /(化禄|化権|化科|化忌|三方四正|原局|格局|四化)/g,
];

const FORBIDDEN_TERMS_BY_LOCALE: Record<Locale, RegExp[]> = {
  ko: KO_FORBIDDEN_TERMS,
  en: EN_FORBIDDEN_TERMS,
  ja: JA_FORBIDDEN_TERMS,
};

const META_PHRASES_BY_LOCALE: Record<Locale, RegExp[]> = {
  ko: [
    /(참고용입니다|재미로 봐주세요|도움이 되셨|원하시면 다른|추가 질문이 있으시면)/g,
  ],
  en: [/(for entertainment purposes|hope this helps|let me know if you)/gi],
  ja: [/(参考程度に|お役に立てれば|ご質問があれば)/g],
};

/** 검사에서 제외하는 필드 (엔진이 넘긴 나이 구간을 그대로 복사하는 값) */
const SKIPPED_KEYS = new Set(["period"]);

const collectStrings = (
  value: unknown,
  path: string,
  out: { path: string; text: string }[]
): void => {
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStrings(item, path ? `${path}.${index}` : `${index}`, out)
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (SKIPPED_KEYS.has(key)) continue;
      collectStrings(child, path ? `${path}.${key}` : key, out);
    }
  }
};

const matchAll = (
  patterns: RegExp[],
  code: OutputViolationCode,
  fields: { path: string; text: string }[]
): OutputViolation[] =>
  fields.flatMap(({ path, text }) =>
    patterns.flatMap((pattern) =>
      Array.from(text.matchAll(pattern), (m) => ({ code, match: m[0], path }))
    )
  );

/**
 * LLM 응답(파싱된 JSON)에서 금지 용어·메타 문구 위반을 찾는다.
 */
export const findOutputViolations = (
  output: unknown,
  language: Locale = "ko"
): OutputViolation[] => {
  const fields: { path: string; text: string }[] = [];
  collectStrings(output, "", fields);

  return [
    ...matchAll(FORBIDDEN_TERMS_BY_LOCALE[language], "FORBIDDEN_TERM", fields),
    ...matchAll(META_PHRASES_BY_LOCALE[language], "META_PHRASE", fields),
  ];
};

/**
 * 재생성 요청에 붙일 피드백 문구. 위반 표현만 짚고 내용은 유지하도록 요청한다.
 */
export const buildViolationFeedback = (
  violations: OutputViolation[]
): string => {
  const terms = Array.from(new Set(violations.map((v) => v.match)));
  return `The previous answer contained forbidden expressions: ${terms
    .map((t) => `"${t}"`)
    .join(", ")}.
Rewrite the same JSON in the same language without these expressions. Replace technical terms with plain descriptions of what they mean, and remove meta phrases entirely. Keep the meaning and structure.`;
};
