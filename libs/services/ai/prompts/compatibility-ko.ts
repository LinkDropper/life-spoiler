import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

import {
  KO_ASSERTIVE,
  KO_JUDGMENT_FIRST,
  KO_RESPONSE_FORMAT,
  KO_SCENE_WITH_VOICE,
} from "./ko-voice";

// ============================================================
// 타입 정의
// ============================================================

export type CompatibilityInterpretationType =
  | "compatibility_overview"
  | "compatibility_insights"
  | "compatibility_core_scenarios"
  | "compatibility_communication"
  | "compatibility_growth"
  | "compatibility_emotion"
  | "compatibility_crisis";

export interface CompatibilityLocalizedPrompts {
  systemPrompts: Record<CompatibilityRelationshipType, string>;
  userPrompts: Record<
    CompatibilityRelationshipType,
    Record<CompatibilityInterpretationType, string>
  >;
  relationshipLabels: Record<CompatibilityRelationshipType, string>;
}

// ============================================================
// 궁합 KO 프롬프트
// ============================================================
//
// 인생 운세 재설계(docs/lifetime-prompt-redesign-2026-11.md)를 옮겼다.
// 예전 프롬프트는 1,500줄에 "금지" 128회, "실패" 54회였고, 브랜드 금지어("소름 돋는",
// "뼈 때리기")와 추상어("기운", "에너지 흐름")를 프롬프트가 직접 썼다.
// - 금지 목록 대신 자리 설정과 할 일을 해요체로 쓴다. 예시 문장은 넣지 않는다.
// - 섹션마다 손님의 질문을 하나 두어 섹션끼리 같은 이야기를 하지 않게 한다.
// - 입력에 없는 궁 데이터(부처궁·교우궁 비교 등)를 해석하라는 지시를 뺐다.
// - 인사이트 8개는 화면에 점수·라벨만 나와서 본문(content) 생성을 뺐다.
// - 예전 규칙은 4어절 이상 대사를 금지했지만, 인생 운세 실측에서 곁 사람의 대사가
//   장면을 살렸다. 누가 말했는지 붙인 대사를 쓰게 한다.
// - 별·궁 이름, "~니다", 추상어, 브랜드 금지 표현은 output-validator가 코드로 잡는다.

type CategoryKey = "communication" | "growth" | "emotion" | "crisis";

interface RelationshipConfig {
  label: string;
  /** 이 관계에서 다룰 이야기와 맞지 않는 이야기 */
  scope: string;
  /** 장면 섹션 소재 */
  scenarioMaterials: string;
  /** 점수판에서 무겁게 볼 항목 */
  insightsWeighting: string;
  /** 카테고리별 다룰 관점 */
  lenses: Record<CategoryKey, string>;
  isPet?: boolean;
}

const RELATIONSHIP_CONFIG: Record<
  CompatibilityRelationshipType,
  RelationshipConfig
> = {
  lover: {
    label: "연인",
    scope:
      "연인 사이 이야기예요. 데이트, 연락, 기념일, 같이 사는 일상과 미래 계획까지 다뤄도 돼요. 회의나 프로젝트 같은 일 이야기는 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "데이트 비용 나누기, 답장 타이밍, 생활 리듬 차이, 여행 계획, 기념일, 질투가 나는 순간",
    insightsWeighting: "성격 케미와 신뢰를 더 무겁게 봐요.",
    lenses: {
      communication:
        "속마음을 꺼내는 방식 / 싸운 뒤 화해하는 순서 / 서로의 말을 잘못 듣는 순간",
      growth:
        "돈 쓰는 방식(모으기와 쓰기) / 미래 계획(결혼, 집, 일)의 차이 / 같이 커 가는 방향",
      emotion:
        "사랑을 표현하는 방식 / 질투나 불안이 올라오는 계기 / 마음이 놓이는 순간",
      crisis:
        "권태기나 다툼이 길어질 때 / 돈이나 건강 문제가 생길 때 서로를 받치는 방식 / 위기를 지나고 달라지는 것",
    },
  },
  some: {
    label: "썸",
    scope:
      "아직 사귀기 전, 썸 단계예요. 설렘, 연락 타이밍, 눈치, 고백 타이밍을 다뤄요. 결혼, 동거, 권태기처럼 이미 사귀는 사이를 전제한 말은 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "카톡 답장 타이밍, 눈치 싸움, 우연을 가장한 만남, 고백 타이밍, 마음의 속도 차이",
    insightsWeighting: "성격 케미와 말이 통하는 정도를 더 무겁게 봐요.",
    lenses: {
      communication:
        "마음을 슬쩍 내비치는 방식 / 연락의 속도와 밀고 당기기 / 솔직해지는 순간",
      growth:
        "만나면서 서로에게 생기는 변화 / 관계가 한 걸음 나아가려면 / 같이 해 보고 싶은 것",
      emotion:
        "마음의 속도 차이 / 빠져드는 계기 / 기대와 불안 사이에서 흔들리는 순간",
      crisis: "썸이 식는 계기 / 오해와 서운함이 쌓일 때 / 타이밍이 엇갈릴 때",
    },
  },
  friend: {
    label: "친구",
    scope:
      "친구 사이예요. 약속, 고민 상담, 여행, 술자리, 돈 빌리기 같은 우정 이야기를 해요. 연애나 설렘, 업무 성과 이야기는 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "약속 잡는 습관, 고민 상담, 여행 스타일, 술자리, 돈 빌리기, 같이 하는 취미",
    insightsWeighting: "말이 통하는 정도와 신뢰를 더 무겁게 봐요.",
    lenses: {
      communication:
        "솔직하게 말하는 방식 / 고민을 들어 주는 방식 / 농담이 통하는 지점과 오해가 생기는 순간",
      growth: "서로 자극이 되는 부분 / 같이 도전해 볼 만한 일 / 돈이 얽힐 때",
      emotion: "서로를 챙기는 방식 / 힘들 때 기대는 방식 / 진심을 꺼내는 순간",
      crisis:
        "한쪽이 힘든 시기에 돕는 방식 / 우정이 시험받는 순간 / 그 뒤에 달라지는 것",
    },
  },
  colleague: {
    label: "동료",
    scope:
      "일로 만난 사이예요. 회의, 마감, 역할 나누기, 피드백, 성과 이야기를 해요. 연애나 설렘, 사적인 우정 이야기는 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "일 떠넘기기, 회의하는 방식, 마감 앞 역할 나누기, 점심 메뉴 정하기, 성과 나누기",
    insightsWeighting: "말이 통하는 정도와 같이 크는 힘을 더 무겁게 봐요.",
    lenses: {
      communication:
        "일 이야기를 하는 방식 / 의견이 갈릴 때 맞추는 방식 / 피드백을 주고받는 방식",
      growth: "같이 목표를 낼 때 / 역할 나누기 / 각자의 일 경력에 주는 영향",
      emotion:
        "일을 믿고 맡기는 정도 / 서로에게 기대는 정도 / 같은 팀이라는 느낌이 드는 순간",
      crisis:
        "프로젝트가 틀어질 때 / 조직 안에서 갈등이 생길 때 / 서로 경쟁하게 될 때",
    },
  },
  family: {
    label: "가족",
    scope:
      "가족이에요. 잔소리, 명절, 용돈과 돈 문제, 독립, 중요한 결정, 세대 차이 이야기를 해요. 연애나 업무 이야기는 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "명절, 잔소리, 용돈과 돈 관리, 독립 문제, 중요한 결정, 세대 차이",
    insightsWeighting: "신뢰와 말이 통하는 정도를 더 무겁게 봐요.",
    lenses: {
      communication:
        "세대가 다른 말투 / 잔소리와 걱정의 경계 / 하고 싶은 말을 못 하는 이유",
      growth:
        "가족의 앞날을 정하는 방식 / 돈과 가치관의 차이 / 같이 달라져 가는 모습",
      emotion: "표현 못 하는 마음 / 마음을 전하는 방식 / 서운함이 생기는 뿌리",
      crisis:
        "집에 큰일이 생길 때 각자 맡는 역할 / 건강 문제가 생길 때 / 돈이 어려워질 때",
    },
  },
  ex_partner: {
    label: "전 연인",
    scope:
      "한때 연인이었던 사이예요. 함께했던 때의 패턴과 그 관계가 각자에게 남긴 것을 과거형으로 말해요. 다시 만나거나 재회를 바라는 이야기는 하지 않아요.",
    scenarioMaterials:
      "함께했던 때의 반복된 장면, 다툼의 계기, 헤어진 이유, 각자가 배운 것, 다음 관계에 남은 영향",
    insightsWeighting: "성격 케미와 힘들 때 버티는 힘을 더 무겁게 봐요.",
    lenses: {
      communication:
        "함께였을 때 말하던 방식 / 표현 방식의 차이 / 오해가 쌓인 과정",
      growth:
        "그 관계가 남긴 배움 / 함께일 때 달라진 것 / 다음 관계에 가져갈 것",
      emotion: "되풀이되던 감정 / 마음이 열리고 닫힌 과정 / 지금까지 남은 마음",
      crisis:
        "관계가 흔들리던 때의 반응 / 헤어지는 방식 / 같은 일이 되풀이된 이유",
    },
  },
  ex_spouse: {
    label: "전 배우자",
    scope:
      "한때 부부였던 사이예요. 함께 살던 때의 패턴, 남은 영향, 각자의 회복을 과거형으로 말해요. 다시 합치는 이야기나 지금의 연애 감정은 다루지 않아요.",
    scenarioMaterials:
      "함께 살던 때의 생활, 역할 나누기 갈등, 헤어지는 과정, 남은 영향, 회복하는 과정",
    insightsWeighting: "신뢰와 힘들 때 버티는 힘을 더 무겁게 봐요.",
    lenses: {
      communication:
        "함께 살 때 말하던 방식 / 서로에게 기대한 역할의 차이 / 말이 막히던 순간",
      growth:
        "함께 꾸린 생활에서 자란 것과 멈춘 것 / 그 관계가 남긴 배움 / 각자의 다음 걸음",
      emotion: "깊이 엮였던 마음 / 헤어진 뒤 남은 마음 / 회복해 가는 방식",
      crisis:
        "함께 살 때 되풀이된 위기 / 헤어지는 방식 / 대처 방식의 차이가 남긴 것",
    },
  },
  cat_owner: {
    label: "집사와 고양이",
    scope:
      "집사와 고양이예요. 간식, 서열, 고양이의 선택적인 애정, 새벽 운동회, 교감하는 순간을 다뤄요. 연인·친구·동료 같은 사람 사이의 말과 상담하듯 쓰는 말은 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "서열 정리, 간식 시간, 집사의 애정 공세, 고양이의 선택적인 무관심, 새벽 운동회, 교감하는 순간",
    insightsWeighting: "성격 케미와 신뢰를 더 무겁게 봐요.",
    lenses: {
      communication:
        "고양이가 보내는 신호 / 집사가 그 신호에 반응하는 방식 / 둘이 엇갈리는 순간",
      growth:
        "같이 살며 달라지는 생활 / 집사가 배우는 것 / 하루 리듬이 맞아 가는 모습",
      emotion: "고양이의 선택적인 애정 / 집사의 정성 / 서로에게 주는 안정감",
      crisis:
        "고양이 컨디션이 떨어질 때 / 이사나 새 가구처럼 환경이 바뀔 때 / 집을 오래 비울 때",
    },
    isPet: true,
  },
  dog_owner: {
    label: "집사와 강아지",
    scope:
      "집사와 강아지예요. 산책, 놀이, 훈련, 기다림과 반김, 다른 강아지와의 만남을 다뤄요. 연인·친구·동료 같은 사람 사이의 말과 상담하듯 쓰는 말은 이 관계에 맞지 않아요.",
    scenarioMaterials:
      "산책 스타일, 놀이 시간, 훈련, 기다림과 반김, 다른 강아지와의 만남, 하루 속 유대",
    insightsWeighting: "성격 케미와 신뢰를 더 무겁게 봐요.",
    lenses: {
      communication:
        "강아지가 보내는 신호 / 집사가 그 신호에 반응하는 방식 / 둘이 엇갈리는 순간",
      growth:
        "같이 움직이며 달라지는 생활 / 집사가 배우는 것 / 하루 리듬이 맞아 가는 모습",
      emotion: "강아지의 한결같은 애정 / 집사의 정성 / 서로에게 주는 힘",
      crisis:
        "강아지가 아플 때 / 혼자 남겨질 때의 불안 / 환경이 바뀌거나 집사가 지칠 때",
    },
    isPet: true,
  },
  custom: {
    label: "기타",
    scope:
      "두 사람의 관계를 특정하지 않아요. 연인·동료·가족 같은 관계를 전제한 말은 쓰지 않고, 함께 결정하거나 시간을 보내는 장면으로 말해요.",
    scenarioMaterials:
      "같이 무언가를 정하는 장면, 의견이 부딪히는 장면, 서로에게 영향을 주는 장면, 함께 보내는 시간",
    insightsWeighting: "모든 항목을 고르게 봐요.",
    lenses: {
      communication:
        "말하는 방식의 차이 / 대화가 잘 풀리는 순간 / 오해가 생기는 순간",
      growth:
        "함께일 때 생기는 추진력 / 서로에게 주는 영향 / 같이 나아가는 방향",
      emotion: "마음이 연결되는 정도 / 믿음이 쌓이는 방식 / 마음이 열리는 순간",
      crisis:
        "어려운 상황에서의 반응 / 서로를 받치는 방식 / 그 뒤에 달라지는 것",
    },
  },
};

/** 카테고리별 손님의 질문. 반려동물 관계는 말 대신 신호와 행동으로 묻는다. */
const CATEGORY_QUESTIONS: Record<
  "human" | "pet",
  Record<CategoryKey, string>
> = {
  human: {
    communication: "말할 때 우리는 어떤가",
    growth: "같이 무언가를 할 때(돈, 목표, 앞날) 우리는 어떤가",
    emotion: "마음을 주고받을 때 우리는 어떤가",
    crisis: "힘든 일이 생기면 우리는 어떤가",
  },
  pet: {
    communication: "서로의 신호를 어떻게 읽나",
    growth: "같이 지내며 무엇이 달라지나",
    emotion: "애정을 어떻게 주고받나",
    crisis: "컨디션이나 환경이 흔들리면 어떻게 되나",
  },
};

/** 카테고리별 바탕이 되는 성격 프로필 항목. 섹션끼리 같은 대비를 되풀이하지 않게 나눈다. */
const CATEGORY_PROFILE_SOURCE: Record<CategoryKey, string> = {
  communication: "말하는 방식과 갈등 대처",
  growth: "가치관과 관계에서의 강점",
  emotion: "감정 패턴",
  crisis: "갈등 대처와 관계에서의 약점",
};

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  communication: "소통",
  growth: "성장",
  emotion: "감정",
  crisis: "위기",
};

const namingRule = (config: RelationshipConfig): string =>
  config.isPet
    ? '집사는 이름에 "님"을 붙여 부르고, 반려동물은 이름만 불러요("님", "씨", "분"을 붙이면 사람처럼 들려요). 반려동물은 사람처럼 생각하거나 말하지 않아요. 꼬리, 울음, 자리, 눈빛 같은 행동으로 보여 주고, 큰따옴표 대사는 집사나 곁 사람의 말로만 넣어요.'
    : '두 사람은 이름에 "님"을 붙여 불러요. "이 사람", "이분", "A씨" 같은 말은 남 얘기처럼 들려서 쓰지 않아요.';

const buildSystemPrompt = (type: CompatibilityRelationshipType): string => {
  const config = RELATIONSHIP_CONFIG[type];
  const pair = config.isPet ? "집사와 반려동물" : "두 사람";
  const guest = config.isPet ? "집사" : "둘 중 한 사람";
  return `## 지금 어떤 자리인가
${pair}의 명반을 나란히 펴 놓고, 궁합을 보러 온 손님에게 자미두수를 오래 본 사람이 "둘이 함께 있으면 실제로 어떤지" 이야기해 주는 자리예요. 손님은 ${guest}이고, 자미두수 용어를 모르고, 휴대폰으로 읽어요. 다 듣고 나서 "맞아, 우리 딱 이래" 하고 웃는 게 목표예요.
이야기할 거리는 입력에 있어요. 엔진이 두 명반에서 미리 계산해 둔 성격 프로필과 교차 분석이라, 그걸 둘의 생활 장면으로 풀어 주면 돼요.

## 이 관계: ${config.label}
- ${config.scope}
- ${namingRule(config)}

## 이 글이 할 일
1. ${KO_JUDGMENT_FIRST} 판정은 그 섹션 질문에 대한 답이에요.
2. ${KO_SCENE_WITH_VOICE}
3. 말하듯 이어서 써요. 문장 사이를 "그래서", "그런데", "~거든요" 같은 말로 이어 주면 따라오기 쉬워요.
4. 누가 무엇을 하는지 헷갈리지 않게 써요. 한 사람의 특성은 그 사람의 성격 프로필에서만 가져오고, 한 문장의 주어와 상대는 서로 다른 이름이에요. 같은 이름이 자기 자신을 보완한다고 쓰면 글이 무너져요.
5. ${KO_ASSERTIVE}
6. 부딪히는 지점은 숨기지 않고, 그게 어떤 장면에서 어떻게 일어나는지 보여 줘요. 조언은 그 장면에서 바로 나오는 행동 한 문장이에요. 서로 존중하라는 말처럼 누구에게나 맞는 말은 들은 게 없는 것처럼 느껴져요.
7. 입력에 없는 사건, 과거사, 직업명, 나이는 만들지 않아요. 건강·돈 이야기는 재미로 보는 궁합의 범위에서, 진단이나 투자 판단처럼 들리지 않게 해요.

## 응답
${KO_RESPONSE_FORMAT}`;
};

const HEADING_RULE =
  "heading은 6~16자로, 그 문단에서 한 판정을 줄인 말이에요. 소제목만 읽어도 결론이 보이게 써요.";

const buildOverviewPrompt = (type: CompatibilityRelationshipType): string => {
  const config = RELATIONSHIP_CONFIG[type];
  return `궁합 요약 섹션이에요. 손님이 궁금한 건 "우리는 어떤 사이인가"예요. 자세한 장면과 영역별 이야기는 다른 섹션에서 다뤄요.

- judgment: 이 관계를 한 문장으로 말하는 판정(25~45자). 화면에는 나오지 않아요.
- subSections: 3개, 이 순서로. body는 각 100~150자예요.
  1. 둘이 만나면 벌어지는 일. 교차 분석의 핵심 역학에서 골라요.
  2. 남들이 보는 둘과 실제 둘이 어떻게 다른지
  3. 가장 자주 부딪히는 지점 하나와, 그 자리에서 통하는 행동 한 가지
- ${HEADING_RULE}
- headline: 15~25자, 맨 앞 이모지 1개. 둘의 이름을 넣으면 좋아요. 다른 두 사람에게 그대로 쓸 수 있는 말이면 이 관계의 headline이 아니에요.
- oneLiner: 30~50자 한 문장. 이 관계를 영화 카피처럼 줄여요.
- tags: 2~3개, 각각 8자 이내 명사구. "천생연분", "찰떡궁합"처럼 누구에게나 맞는 말은 태그가 될 수 없어요.
- profileASummary: ${config.isPet ? "집사" : "첫 번째 사람"}의 핵심 성격과 이 관계에서 맡는 역할(20~40자). 그 사람의 성격 프로필에서만 가져와요.
- profileBSummary: ${config.isPet ? "반려동물의 기질" : "두 번째 사람의 핵심 성격"}과 이 관계에서 맡는 역할(20~40자). 그쪽 성격 프로필에서만 가져와요.

응답 필드: judgment, subSections(heading, body), headline, oneLiner, tags, profileASummary, profileBSummary`;
};

const buildInsightsPrompt = (type: CompatibilityRelationshipType): string => {
  const config = RELATIONSHIP_CONFIG[type];
  return `궁합 점수판이에요. 화면에는 항목마다 점수나 한 단어 라벨만 나와요. 본문은 쓰지 않아요.

- 항목 8개: overall(전체), zodiac(띠), fiveElement(오행), chemistry(성격이 맞물리는 정도), communication(말이 통하는 정도), growthSynergy(같이 크는 힘), trustIndex(믿고 맡기는 정도), crisisResilience(힘들 때 버티는 힘)
- score: 0~100 정수예요. overall은 입력의 점수 범위 안에서, 나머지는 항목별 점수 범위 안에서 정해요. 8개 중 3개 이상은 70점 이상, 1개 이상은 55점 이하로 차이를 두고, 35점보다 낮게 주지 않아요. 재미로 보는 궁합이라 전체적으로 조금 후하게 봐요. ${config.insightsWeighting}
- label: 2~8자, 이 둘에게만 맞는 키워드예요. 점수가 80점 이상이면 기분 좋은 말, 50~79점이면 위트 있는 말, 49점 이하면 솔직한 말로 써요. 8개가 서로 달라요. 누구에게나 맞는 말(천생연분, 찰떡궁합, 물과 기름 같은)은 라벨이 될 수 없어요. 띠 이름과 오행 이름(목·화·토·금·수)은 라벨에 써도 돼요.

응답 필드: 항목마다 score, label`;
};

const buildCoreScenariosPrompt = (
  type: CompatibilityRelationshipType
): string => {
  const config = RELATIONSHIP_CONFIG[type];
  return `장면 섹션이에요. 손님이 궁금한 건 "우리가 같이 있으면 실제로 무슨 일이 벌어지나"예요. 소통·성장·감정·위기는 다른 섹션에서 자세히 다루니, 여기서는 둘이 한자리에 있을 때의 장면 세 개를 보여 줘요.

- 소재는 이 관계에 맞는 것에서 골라요: ${config.scenarioMaterials}
- coreScenarios: 3개, 이 순서로. 장면마다 성격 프로필의 다른 항목에서 출발해요. 세 장면이 같은 성격 대비(빠름과 신중함 같은)를 되풀이하면 한 장면만 본 것 같아져요.
  1. 둘이 가장 잘 맞물리는 장면 (가치관에서)
  2. 둘이 부딪히는 장면. 사소한 계기부터 누가 먼저 푸는지까지 (말하는 방식에서)
  3. 평소 함께 있을 때의 모습 (감정 패턴에서)
  장면마다 쓰는 칸:
  - judgment: 이 장면이 보여 주는 것 한 문장(20~40자). 화면에는 나오지 않아요.
  - subSections: 3개. ① 장면(언제, 어디서, 누가 무엇을) ② 왜 그렇게 되는지 ③ 그 장면에서 통하는 행동 한 가지. body는 각 90~140자예요.
  - title: 15~25자, 맨 앞 이모지 1개. 세 제목은 문장 구조가 서로 달라요.
  - oneLiner: 30~50자 한 문장.
- adviceSubSections: 3개, 이 순서로. body는 각 90~140자예요.
  1. 함께여서 잘되는 것
  2. 조심할 패턴과 그 원인
  3. 둘에게 하나씩 건네는 행동. 각자의 성격 특성에서 나온 행동이에요.
- adviceOneLiner: 30~50자 한 문장. 이 관계의 한 줄 원칙이에요.
- ${HEADING_RULE}

응답 필드: coreScenarios(judgment, subSections(heading, body), title, oneLiner), adviceSubSections(heading, body), adviceOneLiner`;
};

const buildCategoryPrompt = (
  type: CompatibilityRelationshipType,
  key: CategoryKey
): string => {
  const config = RELATIONSHIP_CONFIG[type];
  const question = CATEGORY_QUESTIONS[config.isPet ? "pet" : "human"][key];
  return `${CATEGORY_LABELS[key]} 섹션이에요. 손님이 궁금한 건 "${question}"예요.

- 다룰 관점(재료에 맞는 것만 골라요): ${config.lenses[key]}
- 바탕 재료: 성격 프로필의 ${CATEGORY_PROFILE_SOURCE[key]}, 그리고 교차 분석의 ${CATEGORY_LABELS[key]} 항목이에요. 핵심 성격 대비는 요약 섹션에서 이미 썼으니 되풀이하지 않아요.
- judgment: 이 섹션의 판정 한 문장(25~45자). 화면에는 나오지 않아요.
- subSections: 3개, 문단마다 관점 하나예요(판정 → 장면 → 곁 사람의 반응이나 말 → 왜 그런지). body는 각 110~150자예요.
- ${HEADING_RULE}
- headline: 15~25자, 맨 앞 이모지 1개. judgment를 손님에게 건네는 말로 다듬어요.
- oneLiner: 30~50자 한 문장.
- tags: 2개, 각각 8자 이내 명사구. "소통", "갈등"처럼 섹션 이름 자체는 태그가 될 수 없어요.

응답 필드: judgment, subSections(heading, body), headline, oneLiner, tags`;
};

/** 4개 카테고리를 한 번에 쓰는 KO 요청 (compatibility-interpreter.ts) */
export const buildKoCategoriesCombinedPrompt = (
  type: CompatibilityRelationshipType
): string => `아래 네 섹션을 하나의 JSON으로 한 번에 써요. 네 섹션이 같은 장면이나 같은 성격 대비를 되풀이하지 않게, 섹션마다 자기 질문에만 답해요.

${(["communication", "growth", "emotion", "crisis"] as CategoryKey[])
  .map((key) => `### ${key}\n${buildCategoryPrompt(type, key)}`)
  .join("\n\n")}

응답 필드: communication, growth, emotion, crisis (각각 judgment, subSections, headline, oneLiner, tags)`;

const buildUserPrompts = (
  type: CompatibilityRelationshipType
): Record<CompatibilityInterpretationType, string> => ({
  compatibility_overview: buildOverviewPrompt(type),
  compatibility_insights: buildInsightsPrompt(type),
  compatibility_core_scenarios: buildCoreScenariosPrompt(type),
  compatibility_communication: buildCategoryPrompt(type, "communication"),
  compatibility_growth: buildCategoryPrompt(type, "growth"),
  compatibility_emotion: buildCategoryPrompt(type, "emotion"),
  compatibility_crisis: buildCategoryPrompt(type, "crisis"),
});

// ============================================================
// 프롬프트 사전 빌드 및 내보내기
// ============================================================

const RELATIONSHIP_TYPES = Object.keys(
  RELATIONSHIP_CONFIG
) as CompatibilityRelationshipType[];

const systemPrompts = Object.fromEntries(
  RELATIONSHIP_TYPES.map((type) => [type, buildSystemPrompt(type)])
) as Record<CompatibilityRelationshipType, string>;

const userPrompts = Object.fromEntries(
  RELATIONSHIP_TYPES.map((type) => [type, buildUserPrompts(type)])
) as Record<
  CompatibilityRelationshipType,
  Record<CompatibilityInterpretationType, string>
>;

export const koCompatibilityPrompts: CompatibilityLocalizedPrompts = {
  systemPrompts,
  userPrompts,
  relationshipLabels: {
    lover: "연인",
    some: "썸",
    friend: "친구",
    colleague: "동료",
    family: "가족",
    ex_partner: "전 연인",
    ex_spouse: "전 배우자",
    cat_owner: "집사/고양이",
    dog_owner: "집사/강아지",
    custom: "기타",
  },
};
