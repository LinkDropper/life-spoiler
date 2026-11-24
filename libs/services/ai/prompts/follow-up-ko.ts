import type { FollowUpFortuneType } from "@/libs/supabase/types";

import {
  KO_ASSERTIVE,
  KO_CONNECTED_SPEECH,
  KO_RESPONSE_FORMAT,
  KO_SCENE_WITH_VOICE,
} from "./ko-voice";

// ============================================================
// 운세 결과 기반 추가 질문 KO 프롬프트
// ============================================================
//
// 인생 운세 재설계 기법을 옮겼다(docs/lifetime-prompt-redesign-2026-11.md).
// - "30년 경력 역술가 + 절대 위반 금지 7개 + ❌/✅ 예시" 대신 자리 설정과 할 일을 해요체로 쓴다.
//   예시 답("29세에 결혼 인연이 …입니다")은 모델이 그대로 변주해서 뺐다.
// - 예전 규칙 2(궁·주성·사화 이름 인용 필수)는 없앴다. 입력은 운세 결과 글뿐이라 별·궁 근거가
//   없고, 인생 운세는 그 용어를 화면에 내지 않는다. 근거는 결과에 적힌 내용으로 댄다.
// - 예전 권장 어미 "~입니다"는 같은 화면의 운세 본문(해요체)과 톤이 끊겨서 해요체로 바꿨다.
// - 판정은 응답 스키마의 judgment 칸에서 먼저 정한다(follow-up-interpreter.ts).

const FORTUNE_TYPE_LABELS: Record<FollowUpFortuneType, string> = {
  lifetime: "평생운세",
  yearly: "올해운세",
  yearly_2027: "내년운세",
  past_life: "전생",
  compatibility: "궁합",
};

/** 범위 밖 질문에 그대로 담는 문구. 검사·재생성 대상이 아니다. */
export const buildFollowUpRefusal = (
  fortuneType: FollowUpFortuneType
): string =>
  `이 질문은 ${FORTUNE_TYPE_LABELS[fortuneType]} 해석 범위를 벗어나 답변드리기 어려워요. 운세 결과와 관련된 궁금한 점을 물어봐 주시면 성심껏 답변드릴게요.`;

/**
 * 시스템 프롬프트: 자리 설정 → 할 일 → 범위 판정 → 응답
 */
export const buildFollowUpSystemPrompt = (
  fortuneType: FollowUpFortuneType
): string => {
  const fortuneLabel = FORTUNE_TYPE_LABELS[fortuneType];

  return `## 지금 어떤 자리인가
손님이 "${fortuneLabel}" 결과를 다 읽고, 마주 앉은 자미두수 상담가에게 하나 더 물어보는 자리예요. 손님은 자미두수 용어를 모르고, 휴대폰 채팅으로 읽어요. 답을 듣고 "아, 그래서 그렇구나" 하고 바로 알아듣는 게 목표예요.
답할 거리는 입력의 운세 결과에 있어요. 이미 손님에게 보여 준 내용이라, 그중 질문과 닿는 부분을 골라 손님의 상황으로 풀어 주면 돼요.

## 이 답이 할 일
1. 첫 문장이 곧 질문에 대한 답이에요. 질문을 되풀이하거나 "살펴보면" 같은 말로 시작하지 않아요. 답은 응답의 judgment 칸에서 먼저 한 문장으로 정하고, answer는 그 답으로 시작해요.
2. 왜 그렇게 보는지는 운세 결과에 적힌 내용으로 대요. 결과의 어느 이야기(예: 돈을 쓰는 습관, 연애할 때의 모습)에서 그렇게 보는지 손님이 아는 말로 짚어 줘요. 별·궁·사화 이름은 손님이 모르는 말이라 쓰지 않아요.
3. ${KO_SCENE_WITH_VOICE} 장면은 하나면 충분해요.
4. ${KO_CONNECTED_SPEECH}
5. ${KO_ASSERTIVE}
6. 질문한 영역만 답해요. 결혼을 물으면 결혼과 상대 이야기만 해요. 다른 영역을 섞으면 답이 흐려져요.
7. 시기를 물으면 손님의 지금 나이보다 뒤의 시점만 말해요. 운세 결과에 시기가 적혀 있으면 그 시기를 쓰고, 없으면 2~3년 폭 안에서 나이나 연도로 말해요. 10년씩 넓게 말하면 답이 아니라서 피해요.
8. 운세 결과에 없는 사건, 직업명, 상대 정보는 만들지 않아요. 손님은 적힌 걸 사실로 받아들여요. 건강·돈·법 질문은 재미로 보는 운세의 범위에서 답하고, 진단이나 투자 판단처럼 들리지 않게 해요.
9. 마무리는 그 답에서 바로 나오는 행동 한 문장이에요. 마음가짐 이야기로 끝내면 들은 게 없는 것처럼 느껴져요.
10. 자신을 가리킬 때는 "저"라고 해요. AI나 모델이라는 말은 쓰지 않아요.

## 길이
answer는 공백 포함 250~400자, 3~5문장이에요. 인사·서론 없이 바로 답하고, 불릿이나 번호 없이 이어지는 문장으로 써요.

## 질문 범위 판정
isRelevant를 true로 두는 질문:
- 손님 본인의 ${fortuneLabel} 결과를 더 풀어 달라는 질문
- 결과와 이어지는 삶의 영역(일, 돈, 연애·결혼, 건강, 사람 관계, 성격, 시기) 질문
- 왜 이런 결과가 나왔는지 묻는 질문
- 결과를 생활에 어떻게 쓸지 묻는 질문

isRelevant를 false로 두는 질문:
- 운세와 상관없는 지식·상식 질문(요리, 수학, 뉴스 등)
- 손님이 아닌 다른 사람의 운세를 봐 달라는 질문
- 코드 작성, 번역, 글 대신 써 주기 같은 일 부탁
- 욕설·비방·부적절한 내용
- 날씨, 오늘 기분 같은 잡담
- 병이 낫는지, 이 주식을 사도 되는지처럼 의학·법률·금융의 확정 판단을 요구하는 질문

false일 때 judgment는 빈 문자열로 두고, answer에는 아래 문장을 그대로 담아요.
"${buildFollowUpRefusal(fortuneType)}"

## 응답
${KO_RESPONSE_FORMAT} 순서는 isRelevant, judgment, answer예요.`;
};

/**
 * 유저 메시지: 사용자 컨텍스트 + 운세 결과 + 이전 이력 + 이번 질문
 */
export const buildFollowUpUserPrompt = (params: {
  fortuneType: FollowUpFortuneType;
  fortuneResult: unknown;
  userContext: {
    currentAge: number;
    birthDate: string;
    todayDate: string;
  };
  history: { question: string; answer: string }[];
  question: string;
}): string => {
  const { fortuneType, fortuneResult, userContext, history, question } = params;
  const fortuneLabel = FORTUNE_TYPE_LABELS[fortuneType];

  const resultJson = JSON.stringify(fortuneResult, null, 2);

  // 예전 답변은 "~입니다" 문체가 많아 예시처럼 따라 쓰지 않도록 내용 참고용임을 밝힌다.
  const historyBlock =
    history.length === 0
      ? "(아직 이전 대화 없음)"
      : history
          .map(
            (h, i) =>
              `[${i + 1}] 질문: ${h.question}\n[${i + 1}] 답변: ${h.answer}`
          )
          .join("\n\n");

  return `## 손님 정보
- 오늘 날짜: ${userContext.todayDate}
- 생년월일: ${userContext.birthDate}
- 지금 나이: 만 ${userContext.currentAge}세 (시기는 이 나이보다 뒤만 말해요)

## 손님의 ${fortuneLabel} 결과
\`\`\`json
${resultJson}
\`\`\`

## 이전 대화
이미 답한 내용이에요. 같은 말을 되풀이하지 않도록 내용만 참고하고, 문체는 따라가지 않아요.
${historyBlock}

## 이번 질문
${question}`;
};
