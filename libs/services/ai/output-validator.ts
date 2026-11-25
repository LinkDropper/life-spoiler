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

export type OutputViolationCode =
  | "FORBIDDEN_TERM"
  | "META_PHRASE"
  | "FORMAL_ENDING"
  | "BANNED_PHRASE"
  | "THIRD_PERSON"
  | "ABSTRACT_WORD"
  | "REPEATED_JUDGMENT"
  | "BROKEN_ENDING"
  | "CONTEXT_MISMATCH";

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
  // 사화·기법 용어 (화기애애·소화기·화과자 제외)
  /(화록|화권|화과(?!자)|(?<!소)화기(?!애애|엄금)|삼방사정|원국|격국|천간)/g,
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

/**
 * KO 본문은 해요체. "~니다"는 영어 지시문 문체가 새어 들어온 흔적이라 코드로 잡는다
 * (재설계 1단계: 시스템 프롬프트의 문체 규칙을 줄이는 대신 여기서 강제한다).
 */
const KO_FORMAL_ENDING = /[가-힣]*니다(?=[.!?,\s"'”’)]|$)/g;

/**
 * KO 본문은 손님에게 직접 말하는 글이라 손님을 3인칭으로 가리키지 않는다.
 * v15 프롬프트가 "필요할 때만 '이런 분은'처럼"이라고 쓴 뒤 섹션마다 "이 사람은",
 * "이분은"이 나와 설명서처럼 읽혔다. "이분법", "이런 분위기", "이 사람 저 사람"은 비켜 간다.
 */
const KO_THIRD_PERSON =
  /(?<![가-힣])(이 ?사람(?! 저 ?사람)(?=[은이의도한에]|\s)|이분(?!법)(?=[은이의도께]|\s)|이런 ?분(?=[은이들께의도]|\s)|이런 ?사람(?=[은이들의도]|\s)|이 ?타입)/g;

/**
 * KO 추상어. 뜻을 대신하는 말이라 읽고 나서 장면이 남지 않는다
 * (일반 독자 판정에서 "뜻이 흐림"으로 자주 걸린 말, docs/lifetime-fortune-quality-2026-11.md).
 * v15 재료 개편 뒤에도 "~듣는 흐름", "존재감이 또렷", "체온감이 살아 있는"이 나왔다.
 */
const KO_ABSTRACT_WORDS =
  /(흐름|존재감|기운|에너지|감이 살아|(?<!체)온도|중심을 잡|멀리 가)/g;

/**
 * 유형 꼬리표("~타입이에요")는 쓰지 않고, 판정 맺음("~사람이에요")은 섹션에 두 번까지.
 * 문단마다 같은 말로 맺으면 같은 판정을 되풀이하는 글이 됐다(2003-08-08: 각 3회).
 */
const KO_TYPE_LABEL = /타입이(?:에요|죠|라|고)/g;
const KO_JUDGMENT_ENDING = /사람이(?:에요|죠)/g;
const MAX_JUDGMENT_ENDINGS = 2;

/**
 * 깨진 어미. 겹친 "요요"("사람이에요요")와 르 불규칙 활용 오류("부르요"·"부르어요" → 불러요).
 * "~르요"로 끝나는 바른 해요체 활용은 없다. 연애 운세 1·5회차에서 나왔다.
 */
const KO_BROKEN_ENDING = /[가-힣](?:요요|르요|르어요)(?=[.!?,\s"'”’)]|$)/g;

/** 브랜드 금지 표현 (.claude/rules/brand-voice.md) */
const BANNED_PHRASES_BY_LOCALE: Record<Locale, RegExp[]> = {
  ko: [
    /(뼈 ?때리는|소름 ?돋는|충격적인|대박|인생역전|운명을 바꿔라|럭키 ?컬러|\d+% ?적중)/g,
    /(!{2,}|\?{2,}|[!?]{3,})/g,
  ],
  en: [],
  ja: [],
};

/** 검사에서 제외하는 필드 (엔진이 넘긴 나이 구간을 그대로 복사하는 값) */
const SKIPPED_KEYS = new Set(["period"]);

/**
 * 운세별 검사 옵션. 인생 운세 기준 규칙을 다른 운세에 그대로 쓰면 오탐이 나는 곳만 끈다
 * (예: 전생의 "강의 흐름", 궁합에서 두 사람을 이름으로 부르는 문장).
 */
export interface OutputValidatorOptions {
  /** 이 운세에서 검사하지 않는 규칙 */
  skipCodes?: OutputViolationCode[];
  /** 검사하지 않는 필드 이름 (이미지 프롬프트처럼 화면에 나오지 않는 값) */
  skipKeys?: string[];
  /** "~사람이에요" 맺음 허용 횟수 (기본 2) */
  maxJudgmentEndings?: number;
  /**
   * 운세별 추가 규칙. 손님 정보에 따라 달라지는 규칙(예: 학생인데 "퇴근")처럼
   * 공용 규칙으로 두면 오탐이 나는 것을 호출하는 쪽에서 넣는다.
   */
  extraRules?: { code: OutputViolationCode; pattern: RegExp }[];
}

const collectStrings = (
  value: unknown,
  path: string,
  out: { path: string; text: string }[],
  skippedKeys: ReadonlySet<string> = SKIPPED_KEYS
): void => {
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStrings(
        item,
        path ? `${path}.${index}` : `${index}`,
        out,
        skippedKeys
      )
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (skippedKeys.has(key)) continue;
      collectStrings(child, path ? `${path}.${key}` : key, out, skippedKeys);
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
  language: Locale = "ko",
  options: OutputValidatorOptions = {}
): OutputViolation[] => {
  const {
    skipCodes = [],
    skipKeys = [],
    maxJudgmentEndings = MAX_JUDGMENT_ENDINGS,
    extraRules = [],
  } = options;
  const fields: { path: string; text: string }[] = [];
  collectStrings(output, "", fields, new Set([...SKIPPED_KEYS, ...skipKeys]));

  const violations: OutputViolation[] = [
    ...matchAll(FORBIDDEN_TERMS_BY_LOCALE[language], "FORBIDDEN_TERM", fields),
    ...matchAll(META_PHRASES_BY_LOCALE[language], "META_PHRASE", fields),
    ...matchAll(BANNED_PHRASES_BY_LOCALE[language], "BANNED_PHRASE", fields),
    ...(language === "ko"
      ? [
          ...matchAll([KO_FORMAL_ENDING], "FORMAL_ENDING", fields),
          ...matchAll([KO_THIRD_PERSON], "THIRD_PERSON", fields),
          ...matchAll([KO_ABSTRACT_WORDS], "ABSTRACT_WORD", fields),
          ...matchAll([KO_TYPE_LABEL], "REPEATED_JUDGMENT", fields),
          ...matchAll([KO_BROKEN_ENDING], "BROKEN_ENDING", fields),
          ...matchAll([KO_JUDGMENT_ENDING], "REPEATED_JUDGMENT", fields).slice(
            maxJudgmentEndings
          ),
        ]
      : []),
    ...extraRules.flatMap(({ code, pattern }) =>
      matchAll([pattern], code, fields)
    ),
  ];
  return violations.filter((v) => !skipCodes.includes(v.code));
};

const uniqueMatches = (
  violations: OutputViolation[],
  codes: OutputViolationCode[]
): string[] =>
  Array.from(
    new Set(
      violations.filter((v) => codes.includes(v.code)).map((v) => v.match)
    )
  );

const quote = (terms: string[]): string =>
  terms.map((t) => `"${t}"`).join(", ");

/** KO 피드백. 지시 문체가 출력에 새지 않도록 한국어 해요체로 쓴다. */
const buildKoViolationFeedback = (violations: OutputViolation[]): string => {
  const terms = uniqueMatches(violations, ["FORBIDDEN_TERM"]);
  const phrases = uniqueMatches(violations, ["META_PHRASE", "BANNED_PHRASE"]);
  const formal = uniqueMatches(violations, ["FORMAL_ENDING"]);
  const thirdPerson = uniqueMatches(violations, ["THIRD_PERSON"]);
  const abstract = uniqueMatches(violations, ["ABSTRACT_WORD"]);
  const repeated = uniqueMatches(violations, ["REPEATED_JUDGMENT"]);
  const broken = uniqueMatches(violations, ["BROKEN_ENDING"]);
  const context = uniqueMatches(violations, ["CONTEXT_MISMATCH"]);
  const lines = [
    terms.length > 0
      ? `- 읽는 사람이 모르는 용어가 들어갔어요: ${quote(terms)}. 그 말이 뜻하는 생활 속 모습으로 바꿔 주세요.`
      : "",
    phrases.length > 0
      ? `- 쓰지 않는 표현이 들어갔어요: ${quote(phrases)}. 빼거나 담백한 말로 바꿔 주세요.`
      : "",
    formal.length > 0
      ? `- "~니다"로 끝난 말이 있어요: ${quote(formal)}. 모든 문장을 해요체로 바꿔 주세요.`
      : "",
    thirdPerson.length > 0
      ? `- 읽는 사람을 남 얘기하듯 가리킨 말이 있어요: ${quote(thirdPerson)}. 그 문장의 주어를 빼거나 '나'로 바꿔 다시 써 주세요.`
      : "",
    abstract.length > 0
      ? `- 뜻을 대신하는 말이 있어요: ${quote(abstract)}. 그 자리에 실제로 하는 일이나 생기는 일을 써 주세요.`
      : "",
    repeated.length > 0
      ? `- 같은 맺음이 되풀이되거나 유형 꼬리표가 있어요: ${quote(repeated)}. 판정은 첫 문장에서 한 번만 말하고, 나머지 문단은 장면에서 생기는 일이나 곁 사람의 반응으로 맺어 주세요.`
      : "",
    broken.length > 0
      ? `- 어미가 깨진 곳이 있어요: ${quote(broken)}. 해요체 활용을 바르게 고쳐 주세요.`
      : "",
    context.length > 0
      ? `- 상황과 맞지 않거나 입력 정보를 문장에 옮겨 적은 말이 있어요: ${quote(context)}. 그 부분을 나이나 직업과 상관없는 일상 장면의 행동으로 바꿔 주세요.`
      : "",
  ].filter(Boolean);
  return `방금 답에서 고칠 곳이 있어요.
${lines.join("\n")}
같은 JSON 형식과 내용, 구성은 그대로 두고 이 부분만 고쳐서 다시 써 주세요.`;
};

/**
 * 재생성 요청에 붙일 피드백 문구. 위반 표현만 짚고 내용은 유지하도록 요청한다.
 */
export const buildViolationFeedback = (
  violations: OutputViolation[],
  language: Locale = "en"
): string => {
  if (language === "ko") return buildKoViolationFeedback(violations);
  const terms = Array.from(new Set(violations.map((v) => v.match)));
  return `The previous answer contained forbidden expressions: ${quote(terms)}.
Rewrite the same JSON in the same language without these expressions. Replace technical terms with plain descriptions of what they mean, and remove meta phrases entirely. Keep the meaning and structure.`;
};
