import type { MainStarName } from "../stars";

/**
 * 연애 운세 섹션별 장면 단서 (LLM 전용, KO). 설계: specs/love-fortune.md
 *
 * 인생 운세 인연 표(LOVE_SELF_FACTS)를 모든 섹션에 같이 넘겼더니 같은 장면이
 * 8섹션 내내 되풀이됐다(1회차 실측). 그래서 섹션마다 그 섹션에서만 쓰는 단서를 따로 둔다.
 * - 단서는 완성 문장이 아니라 명사구다. 모델이 문장을 그대로 옮기지 않게 한다.
 * - 연애 상태와 상관없이 쓸 수 있는 행동만 둔다(데이트 습관·기념일·선물처럼
 *   이미 사귀는 사이를 전제한 단서는 두지 않는다).
 *
 * ⚠️ 초안. ziwei-expert 검증 전이다. 주성 기본 성향(STAR_TRAITS·PARTNER_RULES)을
 * 연애 장면으로 옮긴 첫 안이다.
 */

/** 예고편: 연애 캐릭터가 좋게 보일 때와 어긋날 때 (명궁 주성) */
export interface LovePreviewCue {
  good: string;
  bad: string;
}

/** 썸: 첫 연락 / 답장 기다릴 때 / 세 번째 만남 (명궁 주성) */
export interface LoveSomeCue {
  contact: string;
  waiting: string;
  third: string;
}

/** 스킨십: 먼저 다가가는 방식 / 마음을 표현하는 방식 (명궁 주성) */
export interface LoveSkinshipCue {
  move: string;
  express: string;
}

export interface LoveSelfCues {
  preview: LovePreviewCue;
  some: LoveSomeCue;
  skinship: LoveSkinshipCue;
  /** 싸울 때: 틀어지는 순간 */
  conflictTrigger: string;
}

export const LOVE_SELF_CUES: Record<MainStarName, LoveSelfCues> = {
  자미: {
    preview: {
      good: "만날 장소와 메뉴를 미리 다 정해 두고 데리러 감",
      bad: "서운해도 먼저 연락하지 않고 상대 사과를 기다림",
    },
    some: {
      contact: "인사보다 언제 시간 되는지부터 묻는 첫 메시지",
      waiting: "한 번 더 보내면 자존심 상할까 봐 썼다 지운 메시지",
      third: "다음 약속 장소를 혼자 정해서 제안함",
    },
    skinship: {
      move: "확신이 선 뒤에야 먼저 손을 내밂",
      express: "말보다 챙겨 둔 자리와 일정으로 마음을 보여 줌",
    },
    conflictTrigger: "내가 세운 계획을 상대가 가볍게 바꿀 때",
  },
  천기: {
    preview: {
      good: "상대가 지나가듯 한 말을 기억해 뒀다가 챙김",
      bad: "답장 한 줄을 여러 번 해석하다 혼자 지침",
    },
    some: {
      contact: "질문이 많은 첫 메시지, 대화를 길게 이어 감",
      waiting: "읽음 표시가 뜬 시간을 세며 답이 늦는 이유를 추측함",
      third: "다음 만남 동선을 두세 가지로 짜 옴",
    },
    skinship: {
      move: "손잡을 타이밍을 재다 놓치고 집에 와서 아쉬워함",
      express: "메시지와 말로는 잘 표현하는데 몸은 늦게 따라감",
    },
    conflictTrigger: "상대 말이 앞뒤가 안 맞을 때 하나하나 따져 물음",
  },
  태양: {
    preview: {
      good: "좋아하는 사람을 친구들 앞에서 숨기지 않고 자랑함",
      bad: "챙긴 만큼 반응이 없으면 웃으면서 속으로 서운해함",
    },
    some: {
      contact: "먼저 말을 걸고 밥 한번 사겠다고 함",
      waiting: "답을 기다리면서 다음에 뭘 해 줄지부터 궁리함",
      third: "내 친구들 모이는 자리에 같이 가자고 먼저 제안함",
    },
    skinship: {
      move: "같이 걷다가 자연스럽게 먼저 손을 잡음",
      express: "좋다는 말을 그 자리에서 바로 함",
    },
    conflictTrigger: "챙겨 준 걸 상대가 당연하게 여길 때",
  },
  무곡: {
    preview: {
      good: "말 대신 필요한 걸 사 두거나 고장 난 걸 고쳐 줌",
      bad: "표현이 부족하다는 말을 들으면 말문이 막힘",
    },
    some: {
      contact: "용건만 담은 짧은 메시지, 이모티콘 거의 없음",
      waiting: "기다리는 티 안 내고 할 일을 하다가 몰래 확인함",
      third: "계산을 먼저 해 두고 집 앞까지 바래다줌",
    },
    skinship: {
      move: "확신이 들기 전엔 가만있다가 한 번에 다가감",
      express: "시간을 내고 필요한 걸 해 주는 걸로 마음을 증명함",
    },
    conflictTrigger: "약속 시간이나 돈 문제가 흐트러질 때",
  },
  천동: {
    preview: {
      good: "같이 영화 보고 야식 먹는 편한 시간을 제일 좋아함",
      bad: "불편한 얘기를 피하다가 서운함을 쌓아 둠",
    },
    some: {
      contact: "가벼운 농담이나 웃긴 사진으로 대화를 엶",
      waiting: "답이 늦으면 서운하지만 티 안 내고 그냥 기다림",
      third: "맛집을 찾아 두고 오래 수다 떨며 시간 가는 줄 모름",
    },
    skinship: {
      move: "편해지면 자연스럽게 어깨에 기대거나 팔짱을 낌",
      express: "다정한 말투와 애교로 표현함",
    },
    conflictTrigger: "상대가 몰아붙이며 당장 결론을 내라고 할 때",
  },
  염정: {
    preview: {
      good: "좋아하는 사람 앞에서 표정과 말투가 확 달라짐",
      bad: "질투가 얼굴에 바로 드러나 자리가 어색해짐",
    },
    some: {
      contact: "첫 메시지부터 관심이 있다는 게 티가 남",
      waiting: "답을 기다리며 상대 프로필 사진을 다시 열어 봄",
      third: "마음을 거의 고백하듯 다 털어놓음",
    },
    skinship: {
      move: "끌리면 망설이지 않고 먼저 다가감",
      express: "눈빛과 손길로 먼저 표현함",
    },
    conflictTrigger: "상대가 다른 사람과 유난히 친하게 지낼 때",
  },
  천부: {
    preview: {
      good: "상대 취향과 중요한 날짜를 꼼꼼히 기억해 챙김",
      bad: "마음을 열기 전까지 거리를 둬서 상대가 헷갈려함",
    },
    some: {
      contact: "예의 바르고 단정한 첫 메시지",
      waiting: "답을 기다리는 동안 상대가 괜찮은 사람인지 한 번 더 따져 봄",
      third: "실패 없는 단골 식당으로 데려감",
    },
    skinship: {
      move: "충분히 믿음이 생긴 뒤에 천천히 다가감",
      express: "말은 적고 꾸준히 챙기는 걸로 보여 줌",
    },
    conflictTrigger: "상대가 계획 없이 돈과 시간을 쓸 때",
  },
  태음: {
    preview: {
      good: "상대 기분이 달라진 걸 먼저 알아채고 챙김",
      bad: "서운한 걸 말하지 못하고 밤새 혼자 곱씹음",
    },
    some: {
      contact: "몇 번 고쳐 쓰고 보내는 조심스러운 첫 메시지",
      waiting: "보낸 메시지를 다시 읽으며 말투가 이상했나 걱정함",
      third: "조용한 카페에서 속 깊은 얘기를 꺼냄",
    },
    skinship: {
      move: "상대가 먼저 다가와 주길 기다림",
      express: "긴 메시지나 손편지로 마음을 말함",
    },
    conflictTrigger: "상대 말투가 차갑게 느껴질 때",
  },
  탐랑: {
    preview: {
      good: "만날 때마다 새로운 장소와 할 거리를 들고 옴",
      bad: "익숙해지면 새로운 재미를 밖에서 찾음",
    },
    some: {
      contact: "재치 있는 드립으로 시작하는 첫 메시지",
      waiting: "답을 기다리는 동안 다른 대화방에서도 바쁨",
      third: "밀고 당기며 상대 반응을 살핌",
    },
    skinship: {
      move: "상대 반응을 읽고 타이밍을 맞춰 먼저 다가감",
      express: "작은 이벤트와 눈빛으로 표현함",
    },
    conflictTrigger: "상대가 내 자유 시간이나 친구 약속을 막을 때",
  },
  거문: {
    preview: {
      good: "상대 고민을 끝까지 듣고 해결책까지 말해 줌",
      bad: "맞는 말을 해서 상대 마음을 다치게 함",
    },
    some: {
      contact: "질문으로 상대를 알아 가는 첫 메시지",
      waiting: "답이 늦으면 왜 늦었는지 직접 묻고 싶어짐",
      third: "우리 무슨 사이냐고 솔직하게 물어봄",
    },
    skinship: {
      move: "말로 확인하고 나서 움직임",
      express: "좋은 것도 아쉬운 것도 다 말로 함",
    },
    conflictTrigger: "상대가 말을 돌리거나 얼버무릴 때",
  },
  천상: {
    preview: {
      good: "상대 일정과 기분에 맞춰 약속을 조정해 줌",
      bad: "다 맞춰 주다가 내가 뭘 원하는지 잊어버림",
    },
    some: {
      contact: "상대 말투에 맞춰 답장을 보냄",
      waiting: "상대가 바쁠까 봐 먼저 연락하는 걸 미룸",
      third: "상대가 고른 곳으로 가고 의견도 맞춰 줌",
    },
    skinship: {
      move: "상대 반응을 확인하며 조심스럽게 다가감",
      express: "배려하는 행동으로 보여 주고 감정 말은 아낌",
    },
    conflictTrigger: "둘 사이에서 누구 편인지 고르라고 할 때",
  },
  천량: {
    preview: {
      good: "상대가 아프면 약을 사 들고 찾아감",
      bad: "챙겨 주는 말이 잔소리로 들림",
    },
    some: {
      contact: "안부와 작은 조언이 섞인 첫 메시지",
      waiting: "답이 늦으면 무슨 일 있나 걱정부터 함",
      third: "상대 고민을 들어 주다가 가까워짐",
    },
    skinship: {
      move: "관계가 확실해질 때까지 천천히 감",
      express: "보살피는 걸로 표현하고 스킨십은 늦게 나옴",
    },
    conflictTrigger: "상대가 내 조언을 듣지 않을 때",
  },
  칠살: {
    preview: {
      good: "마음먹으면 미루지 않고 바로 고백함",
      bad: "답답하면 혼자 결론을 내리고 정리해 버림",
    },
    some: {
      contact: "바로 만나자고 하는 짧고 분명한 첫 메시지",
      waiting: "답이 없으면 오래 기다리지 않고 다른 일을 함",
      third: "세 번째 만남에 사귀자고 직접 말함",
    },
    skinship: {
      move: "결심이 서면 한 번에 다가감",
      express: "표현은 짧고 굵게, 말보다 행동이 먼저",
    },
    conflictTrigger: "상대가 결정을 계속 미룰 때",
  },
  파군: {
    preview: {
      good: "만나자마자 새로운 곳, 처음 해 보는 일로 끌고 감",
      bad: "지루하다 느끼면 관계를 한 번에 확 바꾸려 함",
    },
    some: {
      contact: "갑작스럽고 솔직한 첫 메시지",
      waiting: "답을 기다리다 못 참고 바로 전화함",
      third: "즉흥 여행이나 새벽 드라이브를 제안함",
    },
    skinship: {
      move: "끌리면 계획 없이 빠르게 다가감",
      express: "거침없고 솔직하게 표현함",
    },
    conflictTrigger: "상대가 늘 같은 것만 하자고 할 때",
  },
};

/**
 * 끌리는 사람·오래 가는 사람 (부처궁·관록궁 주성).
 * title은 엔진이 정한 이름이라 화면에 그대로 쓴다. 1회차에서 모델이 지은
 * "온화한 일상형", "말 많은 점검형"은 누구인지 떠오르지 않았다.
 */
export interface LovePersonCue {
  title: string;
  /** 처음 끌리는 순간 */
  spark: string;
  /** 같이 지내며 편한 이유 */
  comfort: string;
  /** 그 사람이 할 법한 말 (반말) */
  voice: string;
}

export const LOVE_PERSON_CUES: Record<MainStarName, LovePersonCue> = {
  자미: {
    title: "중심이 분명하고 든든한 사람",
    spark: "큰일 앞에서 침착하게 정리해 주는 모습",
    comfort: "중요한 결정을 같이 책임져 줌",
    voice: "그건 내가 알아볼게.",
  },
  천기: {
    title: "말이 잘 통하는 재치 있는 사람",
    spark: "대화가 끊기지 않고 새 얘기가 계속 나옴",
    comfort: "계획이 틀어져도 금방 다른 방법을 찾아 줌",
    voice: "그럼 이렇게 해 보는 건 어때?",
  },
  태양: {
    title: "어디서든 먼저 웃어 주는 사람",
    spark: "처음 만난 자리를 혼자 밝게 만드는 모습",
    comfort: "숨기는 것 없이 다 말해 줌",
    voice: "오늘 있었던 일 다 말해 봐.",
  },
  무곡: {
    title: "말보다 행동이 먼저인 사람",
    spark: "도움이 필요할 때 말없이 와서 해결해 줌",
    comfort: "한 약속은 꼭 지킴",
    voice: "걱정 마, 내가 할게.",
  },
  천동: {
    title: "같이 있으면 긴장이 풀리는 사람",
    spark: "어색한 나를 먼저 웃게 해 줌",
    comfort: "아무것도 안 하고 같이 있어도 편함",
    voice: "오늘은 그냥 쉬자.",
  },
  염정: {
    title: "자기 매력을 잘 아는 사람",
    spark: "눈이 마주친 순간 확 끌림",
    comfort: "감정을 숨기지 않아서 헷갈릴 일이 없음",
    voice: "나 지금 너 보고 싶어.",
  },
  천부: {
    title: "생활이 안정된 믿음직한 사람",
    spark: "작은 것까지 정리돼 있는 모습",
    comfort: "다음 주가 예측돼서 불안할 일이 없음",
    voice: "다음 달 계획 같이 세우자.",
  },
  태음: {
    title: "말 안 해도 마음을 알아주는 사람",
    spark: "내가 말하지 않은 기분을 먼저 알아봄",
    comfort: "힘들 때 조용히 곁에 있어 줌",
    voice: "괜찮아? 표정이 좀 안 좋아 보여.",
  },
  탐랑: {
    title: "같이 있으면 재밌는 일이 생기는 사람",
    spark: "처음부터 대화 주고받는 박자가 잘 맞음",
    comfort: "늘 새로운 걸 같이 해 봄",
    voice: "이번 주말에 거기 가 볼래?",
  },
  거문: {
    title: "할 말은 하고 그날 푸는 사람",
    spark: "애매한 걸 똑 부러지게 정리해 줌",
    comfort: "서운한 게 있으면 그날 말하고 그날 풂",
    voice: "서운한 거 있으면 지금 말해.",
  },
  천상: {
    title: "누구에게나 공정하고 예의 바른 사람",
    spark: "누구에게나 똑같이 친절한 모습",
    comfort: "다툼이 생겨도 차분하게 중간을 잡아 줌",
    voice: "네 생각은 어때?",
  },
  천량: {
    title: "어른스럽고 기댈 수 있는 사람",
    spark: "힘들 때 먼저 알아채고 조언해 줌",
    comfort: "실수해도 탓하지 않고 감싸 줌",
    voice: "밥은 먹었어?",
  },
  칠살: {
    title: "자기 길이 분명한 사람",
    spark: "목표 얘기를 할 때 눈빛이 달라지는 모습",
    comfort: "서로 일에 간섭하지 않고 응원함",
    voice: "넌 네 거 해, 나도 내 거 할게.",
  },
  파군: {
    title: "틀을 깨는 자유로운 사람",
    spark: "예상 못 한 제안을 툭 던짐",
    comfort: "내가 바뀌어도 같이 바뀌어 줌",
    voice: "지금 바로 갈래?",
  },
};

/** 연애에서 속으로 바라는 것 (복덕궁 주성). 감정 결점 대신 필요로 옮긴 말 */
export const LOVE_INNER_NEED: Record<MainStarName, string> = {
  자미: "내 노력을 알아봐 주는 말 한마디",
  천기: "생각이 정리될 때까지 기다려 주는 여유",
  태양: "고맙다는 말을 자주 듣는 것",
  무곡: "설명하지 않아도 믿어 주는 것",
  천동: "다그치지 않고 편하게 받아 주는 것",
  염정: "감정이 크다고 탓하지 않는 것",
  천부: "급하게 밀어붙이지 않는 것",
  태음: "속마음을 천천히 꺼낼 시간",
  탐랑: "내 취미와 친구를 존중해 주는 것",
  거문: "말로 확인해 주는 안심",
  천상: "내 의견도 먼저 물어봐 주는 것",
  천량: "나도 챙김을 받는 쪽이 되어 보는 것",
  칠살: "혼자 있는 시간을 인정해 주는 것",
  파군: "새로 시작해도 붙잡아 주는 것",
};
