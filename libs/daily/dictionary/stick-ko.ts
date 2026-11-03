import type { OverallBodySlug } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";

/**
 * 산통 막대 문구 (KO) — 총운 본문 슬롯(등급 5 × 성향군 7 × 변형 2 = 70)과 같은 키를 쓴다.
 *
 * 막대에는 등급 이름(5가지)만 적으면 여럿이 뽑았을 때 같은 문구가 겹친다. 총운 본문과 같은
 * 키로 고르면 같은 등급이라도 명반 성향군·변형에 따라 달라지고, 본문과 톤이 어긋나지 않는다.
 *
 * 규칙 (`__tests__/stick-dictionary.test.ts`가 고정)
 * - "~날"로 끝나는 명사구 ("오늘의 막대는 ○○ 날이에요"로 읽힌다)
 * - 공백 제외 7자 이하 (막대에 세로로 쓴다)
 * - 70개 모두 서로 다른 문구, 금지 표현·전문 용어·"기운" 금지
 * - 등급 톤: l1 살펴 가기 · l2 숨 고르기 · l3 잔잔함 · l4 환함 · l5 빛남
 *   (l1~2에 낙관, l4~5에 브레이크 톤을 섞지 않는다)
 * - 성향군: lead 주도·품격, think 분석·기획, warm 온기·돌봄, drive 추진·결단,
 *   ease 여유·화합, charm 매력·표현, shift 변화·소통
 */
export const DAILY_STICK_KO: Record<OverallBodySlug, string> = {
  // l1 살펴 가는 날 — 조심스럽게, 범위를 줄이는 행동 제안
  "df-ob-l1-lead-v1": "한발 물러서는 날",
  "df-ob-l1-lead-v2": "자리 지키는 날",
  "df-ob-l1-think-v1": "다시 셈하는 날",
  "df-ob-l1-think-v2": "꼼꼼히 짚는 날",
  "df-ob-l1-warm-v1": "마음 아끼는 날",
  "df-ob-l1-warm-v2": "나를 챙기는 날",
  "df-ob-l1-drive-v1": "천천히 가는 날",
  "df-ob-l1-drive-v2": "멈춰 보는 날",
  "df-ob-l1-ease-v1": "무리 없는 날",
  "df-ob-l1-ease-v2": "조용히 지나는 날",
  "df-ob-l1-charm-v1": "말을 아끼는 날",
  "df-ob-l1-charm-v2": "듣기가 먼저인 날",
  "df-ob-l1-shift-v1": "그대로 두는 날",
  "df-ob-l1-shift-v2": "길을 묻는 날",

  // l2 숨 고르는 날 — 쉬어 가며 정리하고 준비하는 날
  "df-ob-l2-lead-v1": "힘을 모으는 날",
  "df-ob-l2-lead-v2": "뒤를 받치는 날",
  "df-ob-l2-think-v1": "메모가 돕는 날",
  "df-ob-l2-think-v2": "차근히 푸는 날",
  "df-ob-l2-warm-v1": "쉬어 가는 날",
  "df-ob-l2-warm-v2": "따뜻이 쉬는 날",
  "df-ob-l2-drive-v1": "발을 맞추는 날",
  "df-ob-l2-drive-v2": "준비만 하는 날",
  "df-ob-l2-ease-v1": "느긋이 걷는 날",
  "df-ob-l2-ease-v2": "여백을 두는 날",
  "df-ob-l2-charm-v1": "귀 기울이는 날",
  "df-ob-l2-charm-v2": "작게 말하는 날",
  "df-ob-l2-shift-v1": "잠시 멈추는 날",
  "df-ob-l2-shift-v2": "발판 다지는 날",

  // l3 잔잔한 날 — 평온하게 흘러가는 보통의 날
  "df-ob-l3-lead-v1": "중심 잡는 날",
  "df-ob-l3-lead-v2": "흐름을 잇는 날",
  "df-ob-l3-think-v1": "생각이 맑은 날",
  "df-ob-l3-think-v2": "계획이 맞는 날",
  "df-ob-l3-warm-v1": "온기 나누는 날",
  "df-ob-l3-warm-v2": "안부 묻는 날",
  "df-ob-l3-drive-v1": "꾸준히 가는 날",
  "df-ob-l3-drive-v2": "하나씩 하는 날",
  "df-ob-l3-ease-v1": "바람 잔잔한 날",
  "df-ob-l3-ease-v2": "차 한잔하는 날",
  "df-ob-l3-charm-v1": "말이 통하는 날",
  "df-ob-l3-charm-v2": "웃음이 나는 날",
  "df-ob-l3-shift-v1": "얘기 나누는 날",
  "df-ob-l3-shift-v2": "바람을 쐬는 날",

  // l4 환한 날 — 일이 잘 맞물리는 밝은 날
  "df-ob-l4-lead-v1": "앞에 서는 날",
  "df-ob-l4-lead-v2": "든든히 서는 날",
  "df-ob-l4-think-v1": "답이 보이는 날",
  "df-ob-l4-think-v2": "감이 좋은 날",
  "df-ob-l4-warm-v1": "마음이 닿는 날",
  "df-ob-l4-warm-v2": "정이 오가는 날",
  "df-ob-l4-drive-v1": "밀고 가는 날",
  "df-ob-l4-drive-v2": "속도가 붙는 날",
  "df-ob-l4-ease-v1": "손이 가벼운 날",
  "df-ob-l4-ease-v2": "마음 편한 날",
  "df-ob-l4-charm-v1": "말에 힘 있는 날",
  "df-ob-l4-charm-v2": "눈길 끄는 날",
  "df-ob-l4-shift-v1": "변화가 반가운 날",
  "df-ob-l4-shift-v2": "새것이 좋은 날",

  // l5 빛나는 날 — 가장 밝은 날
  "df-ob-l5-lead-v1": "주인공인 날",
  "df-ob-l5-lead-v2": "판을 이끄는 날",
  "df-ob-l5-think-v1": "번뜩이는 날",
  "df-ob-l5-think-v2": "계획이 서는 날",
  "df-ob-l5-warm-v1": "마음이 꽉 찬 날",
  "df-ob-l5-warm-v2": "환하게 웃는 날",
  "df-ob-l5-drive-v1": "거침없는 날",
  "df-ob-l5-drive-v2": "단번에 가는 날",
  "df-ob-l5-ease-v1": "품이 넓은 날",
  "df-ob-l5-ease-v2": "함께 웃는 날",
  "df-ob-l5-charm-v1": "반짝이는 날",
  "df-ob-l5-charm-v2": "말이 빛나는 날",
  "df-ob-l5-shift-v1": "새 문 두드리는 날",
  "df-ob-l5-shift-v2": "바람 타는 날",
};
