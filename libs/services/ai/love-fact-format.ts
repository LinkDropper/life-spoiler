import type {
  LoveAxis,
  LoveFactSheet,
} from "@/libs/zi-wei-dou-shu/calculators/love-fortune-facts";
import { SOME_TURN } from "@/libs/zi-wei-dou-shu/constants/lifetime-facts/love-deep-facts";
import type { LovePersonCue } from "@/libs/zi-wei-dou-shu/constants/lifetime-facts/love-section-cues";

// ============================================================
// 연애 운세 KO 데이터 블록. 별·궁 이름 없이 쉬운 말 재료만 넘긴다.
// 섹션마다 그 섹션 재료만 넘긴다. 공통 블록을 모든 섹션에 넣었더니 같은 장면이
// 8섹션 내내 되풀이됐다(1회차 실측).
// ============================================================

export type LoveRelationshipStatus =
  | "solo"
  | "dating"
  | "married"
  | "divorced"
  | "custom";

export interface LoveGuest {
  gender: "male" | "female";
  age: number;
  relationshipStatus: LoveRelationshipStatus;
  relationshipStatusCustom?: string;
  currentYear: number;
}

const STATUS_LABEL: Record<LoveRelationshipStatus, string> = {
  solo: "솔로",
  dating: "연애 중",
  married: "기혼",
  divorced: "이혼 후 지금은 혼자",
  custom: "직접 입력",
};

/**
 * 연애 상태별 장면 틀. 1회차에서 솔로에게 "선물을 못 알아볼 때", "늘 가던 집 데이트"가
 * 나와 상태마다 장면이 일어나는 때를 못 박는다.
 */
const STATUS_FRAME: Record<
  Exclude<LoveRelationshipStatus, "custom">,
  string
> = {
  solo: "지금 사귀는 사람이 없어요. 장면은 누군가를 처음 만나 가까워지는 과정, 아직 사귀기 전의 일이에요.",
  dating: "지금 만나는 사람이 있어요. 장면은 지금 연인과 생기는 일로 써요.",
  married:
    "배우자가 있어요. 장면은 배우자와 지내는 생활에서 생기는 일로 쓰고, 새 인연 대신 지금 관계를 새롭게 하는 쪽으로 써요.",
  divorced:
    "이혼 후 지금은 혼자예요. 장면은 다시 누군가와 가까워질 때 생기는 일로 쓰고, 지금부터의 이야기에 집중해요.",
};

const GENDER_LABEL = { male: "남성", female: "여성" } as const;

/**
 * 나이는 나이대로 넘긴다. "만 23세"를 넘기면 모델이 "만 24세", "24세가"처럼 문장에 옮겨
 * 거의 매 회차 첫 시도에서 검사에 걸렸다(7~13회차).
 */
const ageBand = (age: number): string => {
  const decade = Math.floor(age / 10) * 10;
  const rest = age % 10;
  const part = rest <= 3 ? "초반" : rest <= 6 ? "중반" : "후반";
  return `${decade}대 ${part}`;
};

export const formatGuestKo = (guest: LoveGuest): string => {
  const status =
    guest.relationshipStatus === "custom"
      ? (guest.relationshipStatusCustom ?? "솔로")
      : STATUS_LABEL[guest.relationshipStatus];
  const frame =
    guest.relationshipStatus === "custom"
      ? `연애 상태를 직접 "${status}"라고 적었어요. 장면을 이 상태에 맞추세요.`
      : STATUS_FRAME[guest.relationshipStatus];
  return [
    "## 명반 주인 정보 (장면을 고르는 배경으로 쓰세요)",
    `- ${GENDER_LABEL[guest.gender]}, ${ageBand(guest.age)}`,
    `- 연애 상태: ${status}`,
    `- 장면 틀: ${frame}`,
  ].join("\n");
};

const axisLine = (name: string, axis: LoveAxis): string =>
  `- ${name}: ${axis.score}/100, ${axis.text}이에요 (이 말 그대로 써요)`;

const reasonsLine = (axis: LoveAxis): string =>
  `  왜 그런지: ${axis.reasons.join(" / ")}`;

/** 예고편: 캐릭터 이름 + 좋을 때/어긋날 때 + 좌표 */
export const formatPreviewKo = (sheet: LoveFactSheet): string =>
  [
    "## 연애 캐릭터 (엔진이 정한 이름, 그대로 써요)",
    `- ${sheet.label}`,
    ...(sheet.selfCues
      ? [
          `- 좋게 보일 때 장면 단서: ${sheet.selfCues.preview.good}`,
          `- 어긋날 때 장면 단서: ${sheet.selfCues.preview.bad}`,
        ]
      : []),
    "",
    "## 연애 좌표 (엔진 계산)",
    axisLine("다가가는 속도", sheet.speed),
    reasonsLine(sheet.speed),
    axisLine("마음 표현", sheet.expression),
    reasonsLine(sheet.expression),
    `- 앉은 칸: "${sheet.quadrant.name}"`,
  ].join("\n");

export const formatSomeKo = (sheet: LoveFactSheet): string =>
  [
    "## 썸 단계 재료",
    axisLine("다가가는 속도", sheet.speed),
    ...(sheet.selfCues
      ? [
          `- 첫 연락 단서: ${sheet.selfCues.some.contact}`,
          `- 답장 기다릴 때 단서: ${sheet.selfCues.some.waiting}`,
          `- 세 번째 만남 단서: ${sheet.selfCues.some.third}`,
        ]
      : []),
    `- 마무리 한 줄 방향 (평소와 반대로 해 볼 것): ${sheet.speed.score >= 50 ? SOME_TURN.fast : SOME_TURN.slow}`,
  ].join("\n");

export const formatSkinshipKo = (sheet: LoveFactSheet): string =>
  [
    "## 스킨십 진도 재료",
    axisLine("진도 속도", sheet.skinship),
    reasonsLine(sheet.skinship),
    "- 비교 기준: 첫 키스까지 '세 번째 만남 이내'가 가장 많아요(국내 조사 36.6%). 첫 만남도 13.2%예요.",
    ...(sheet.selfCues
      ? [
          `- 먼저 다가가는 방식 단서: ${sheet.selfCues.skinship.move}`,
          `- 마음을 표현하는 방식 단서: ${sheet.selfCues.skinship.express}`,
        ]
      : []),
    axisLine("마음 표현", sheet.expression),
  ].join("\n");

export const formatConflictKo = (sheet: LoveFactSheet): string =>
  [
    "## 싸울 때 꺼내는 카드 (엔진이 정함)",
    `- 카드: ${sheet.conflict.label}`,
    ...(sheet.conflict.trigger
      ? [`- 틀어지는 순간 단서: ${sheet.conflict.trigger}`]
      : []),
    `- 왜 그 카드인지: ${sheet.conflict.reasons.join(" / ")}`,
    `- 해독제 재료: ${sheet.conflict.antidote}`,
  ].join("\n");

const personLines = (label: string, person: LovePersonCue): string[] => [
  `### ${label}: "${person.title}" (이름은 엔진이 정함, 그대로 써요)`,
  `- 처음 끌리는 순간 단서: ${person.spark}`,
  `- 같이 지내며 편한 이유 단서: ${person.comfort}`,
  `- 그 사람 말투 참고(반말, 분위기만 가져와 장면에 맞게 새로 써요): ${person.voice}`,
];

export const formatPartnerKo = (sheet: LoveFactSheet): string =>
  [
    "## 끌리는 사람과 오래 가는 사람",
    ...(sheet.attract ? personLines("처음 끌리는 사람", sheet.attract) : []),
    ...(sheet.lasting ? personLines("오래 편한 사람", sheet.lasting) : []),
  ].join("\n");

export const formatPeachKo = (sheet: LoveFactSheet): string => {
  const lasting = sheet.peach.filter((p) => p.kind === "lasting");
  const short = sheet.peach.filter((p) => p.kind === "short");
  const line = (p: LoveFactSheet["peach"][number]) =>
    `- 자리: ${p.place} / 어떤 설렘: ${p.reading}`;
  return [
    "## 설렘이 들어오는 방식",
    "### 오래 가는 설렘",
    ...(lasting.length ? lasting.map(line) : ["- 눈에 띄는 자리 없음"]),
    "### 짧게 타오르는 설렘",
    ...(short.length ? short.map(line) : ["- 눈에 띄는 자리 없음"]),
    `- 친구·지인이 연인이 되는 신호: ${sheet.friendToLover ? "있음" : "뚜렷하지 않음"}`,
  ].join("\n");
};

export const formatSeasonsKo = (sheet: LoveFactSheet): string =>
  [
    "## 앞으로 3년 연애 시즌 (엔진 계산, 연도는 그대로 써요)",
    ...(sheet.seasons.length
      ? sheet.seasons.map(
          (s) =>
            `- 인연 시즌 ${s.year}년 (그해 ${ageBand(s.age)}): ${s.reasons.join(" / ")}`
        )
      : ["- 앞으로 3년 안에 두드러진 인연 시즌 없음"]),
    ...(sheet.restSeason
      ? [
          `- 내 생활 챙기는 시즌 ${sheet.restSeason.year}년 (그해 ${ageBand(sheet.restSeason.age)}): ${sheet.restSeason.reasons.join(" / ")}`,
        ]
      : []),
  ].join("\n");

/**
 * 처방 재료. 행동 뜻까지 엔진이 정한다. 2회차에서 "상대에게 바라는 것"을 넘겼더니
 * 모델이 손님 본인의 행동("판단 미루기")으로 바꿔 썼다.
 */
export const formatPrescriptionKo = (
  sheet: LoveFactSheet,
  guest: LoveGuest
): string => {
  const together =
    guest.relationshipStatus === "dating" ||
    guest.relationshipStatus === "married";
  const { habit, place, need } = sheet.prescription;
  return [
    "## 처방 재료 (세 행동에 하나씩, 행동의 뜻은 그대로 살려요)",
    `- 첫째 행동: ${habit}`,
    together
      ? `- 둘째 행동: ${place}에서 둘이 처음 해 보는 일 하나 하기`
      : `- 둘째 행동: 이번 주에 ${place}에 한 번 가 보기`,
    ...(need
      ? [
          together
            ? `- 셋째 행동: 상대에게 '${need}'이 필요하다고 말로 부탁하기 (내가 바라는 걸 상대에게 말하는 행동이에요)`
            : `- 셋째 행동: 다음에 누군가를 만나면 '${need}'을 주는 사람인지 처음 몇 번 만날 때 눈여겨보기 (내가 바라는 걸 상대에게서 찾는 행동이에요)`,
        ]
      : []),
    ...(sheet.seasons[0]
      ? [`- 가까운 인연 시즌: ${sheet.seasons[0].year}년`]
      : []),
  ].join("\n");
};
