import type { StarPairRule } from "./types";

import { fact, lt } from "./builders";

/**
 * 같은 궁에 함께 앉는 주성 쌍 (24쌍 = 구조상 가능한 전부).
 *
 * 전제 (삼합파)
 * - 자미계(자미·천기·태양·무곡·천동·염정)와 천부계(천부·태음·탐랑·거문·천상·
 *   천량·칠살·파군)의 오프셋을 전수 계산하면 동궁 가능한 쌍은 정확히 24쌍이다.
 *   (같은 계열끼리는 오프셋이 달라 동궁이 불가능.) 약 30쌍은 불가능한 조합을
 *   섞어야 채워지므로 24쌍으로 확정.
 * - 쌍마다 동궁 지지가 2곳(대칭)이다. 이 표는 지지와 무관한 "성향" 규칙이고,
 *   밝기는 엔진이 별도로 반영한다. 궁위별 구체 해석은 star-in-palace 표 담당.
 * - strength 2~3: 동궁은 사화 위치보다 해석 비중이 낮다.
 * - 유파 이견: 무곡+탐랑(무탐)의 "대기만성" 판정, 자미+파군의 길흉 비중은
 *   문헌마다 다르다. 여기서는 기운의 양면을 mixed로 둔다.
 */
export const STAR_PAIR_RULES: StarPairRule[] = [
  {
    stars: ["자미", "천부"],
    rule: fact(
      "무리 없이 리더 자리에 앉아 안정을 지키는 편",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "회식 마무리 인사",
          "위기 닥친 날 업무 순서",
          "팀 분위기 정리",
          "모임 총무 자리",
        ],
        voice: "네가 정해 주면 다들 따라가",
        avoid: "독선",
      },
      lt(
        "품위와 안정감을 함께 가진 기운이에요",
        "A blend of dignity and steadiness.",
        "品格と安定感を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["자미", "천상"],
    rule: fact(
      "체면과 격식을 중시하며 보좌받는 리더형",
      "positive",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "격식 있는 자리의 옷차림",
          "첫 만남 말투 점검",
          "일정 챙겨 준 조력자",
          "믿을 만한 곁사람",
        ],
        voice: "오늘 자리는 예의 있게 가자",
        avoid: "허세",
      },
      lt(
        "체면을 지키며 곁의 도움을 받는 기운이에요",
        "Keeps appearances and is supported by trusted helpers.",
        "体面を保ちつつ周囲の助けを受ける気質です。"
      )
    ),
  },
  {
    stars: ["자미", "칠살"],
    rule: fact(
      "권위와 돌파력이 함께 있어 강하게 밀어붙이는 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "길어진 회의 끝 결론",
          "반대 의견 앞의 현장 투입",
          "먼저 움직인 프로젝트",
          "앞서가 남은 팀원",
        ],
        voice: "일단 해 보고 고치자",
        avoid: "독재",
      },
      lt(
        "권위와 돌파력이 함께 있는 기운이에요",
        "Authority and drive to break through come together.",
        "権威と突破力を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["자미", "탐랑"],
    rule: fact(
      "매력과 자존심이 함께 있어 사람을 끄는 편",
      "mixed",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "모임에서 말하는 순간",
          "귀 기울이는 주변",
          "새 취미 장비 구매",
          "늘어난 연락처",
        ],
        voice: "너 얘기하면 다들 듣게 돼",
        avoid: "허영",
      },
      lt(
        "매력과 자존심이 함께 있는 기운이에요",
        "Charm and pride sit side by side.",
        "魅力とプライドが共存する気質です。"
      )
    ),
  },
  {
    stars: ["자미", "파군"],
    rule: fact(
      "안정된 틀을 스스로 깨뜨려 새로 만드는 개혁형",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "잘 돌던 업무 방식",
          "갑작스러운 개편 제안",
          "자리 잡을 즈음의 이직 고민",
          "집을 알아보는 밤",
        ],
        voice: "이 방식 이제 바꿀 때 됐어",
        avoid: "불안정",
      },
      lt(
        "안정된 틀을 스스로 깨고 새로 세우는 기운이에요",
        "Tends to break a settled pattern and rebuild it.",
        "安定した枠を自ら壊して作り直す気質です。"
      )
    ),
  },
  {
    stars: ["천기", "거문"],
    rule: fact(
      "머리가 빠르고 따져 묻는 일이 많은 편",
      "mixed",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "계약서의 모호한 한 줄",
          "결정 전날의 같은 질문",
          "여러 사람에게 확인",
          "다시 물어본 메신저",
        ],
        voice: "근데 이 부분은 무슨 뜻이야",
        avoid: "트집",
      },
      lt(
        "빠른 머리와 따지는 말솜씨가 함께 있는 기운이에요",
        "Quick thinking meets a questioning, argumentative tongue.",
        "鋭い頭脳と問い詰める話術を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["천기", "천량"],
    rule: fact(
      "분석과 조언에 강한 참모형",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "진로 고민하는 친구",
          "장단점 정리 표",
          "회의 속 조용한 지적",
          "놓치기 쉬운 허점",
        ],
        voice: "네 말 듣고 정리가 됐어",
        avoid: "참견",
      },
      lt(
        "분석하고 조언하는 힘이 함께 있는 기운이에요",
        "Analysis and advice-giving strengths work together.",
        "分析力と助言力を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["천기", "태음"],
    rule: fact(
      "섬세한 머리로 밤에 생각이 깊어지는 편",
      "mixed",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "다들 잠든 밤의 아이디어",
          "마음 정하기까지의 긴 고민",
          "그 사이 바뀐 상황",
          "새벽까지 이어진 생각",
        ],
        voice: "너는 밤에 제일 말이 잘 통해",
        avoid: "우유부단",
      },
      lt(
        "섬세하고 생각 많은 기운이 함께 있어요",
        "Delicate sensitivity combined with a restless, thoughtful mind.",
        "繊細さと考え込む気質が同居しています。"
      )
    ),
  },
  {
    stars: ["태양", "거문"],
    rule: fact(
      "사람 앞에서 말하고 알리는 일이 많은 편",
      "mixed",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "발표를 맡은 날",
          "즉석 설명에 온 반응",
          "좋은 뜻으로 한 말",
          "오해 풀려고 보낸 메시지",
        ],
        voice: "네가 설명하면 쏙 이해돼",
        avoid: "수다",
      },
      lt(
        "사람 앞에서 말로 알리는 힘이 큰 기운이에요",
        "A strong pull toward speaking up and spreading the word.",
        "人前で言葉を通して伝える力が強い気質です。"
      )
    ),
  },
  {
    stars: ["태양", "태음"],
    rule: fact(
      "밝은 면과 조용한 면이 번갈아 나타나는 편",
      "mixed",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "낮 모임의 분위기",
          "귀가 후 조용한 방",
          "혼자 남은 밤",
          "다음 날 아침 기운",
        ],
        voice: "낮이랑 밤이랑 딴 사람 같아",
        avoid: "이중성",
      },
      lt(
        "밝은 면과 조용한 면이 함께 있는 기운이에요",
        "A bright outer side and a quiet inner side coexist.",
        "明るい面と静かな面が同居する気質です。"
      )
    ),
  },
  {
    stars: ["태양", "천량"],
    rule: fact(
      "공정하고 따뜻하게 남을 돌보는 편",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "실수한 후배 앞",
          "이유부터 묻는 질문",
          "단톡방의 억울한 사람",
          "나서서 낸 의견",
        ],
        voice: "일단 왜 그랬는지부터 들어 보자",
        avoid: "오지랖",
      },
      lt(
        "공정하고 남을 돌보는 기운이 함께 있어요",
        "Fairness and a caring nature go together.",
        "公正さと面倒見の良さを併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["무곡", "천부"],
    rule: fact(
      "돈과 살림을 단단히 지키는 편",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "월급날 고정 지출 정리",
          "남은 돈 나누는 통장",
          "큰 지출 앞 가격 비교",
          "결제 전 후기 확인",
        ],
        voice: "두 군데 더 비교하고 살게",
        avoid: "인색",
      },
      lt(
        "돈과 살림을 단단히 지키는 기운이에요",
        "A firm hand in protecting money and household resources.",
        "お金と暮らしを堅実に守る気質です。"
      )
    ),
  },
  {
    stars: ["무곡", "천상"],
    rule: fact(
      "원칙대로 일하며 돈 일을 돕는 편",
      "mixed",
      2,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "남의 회계 서류 정리",
          "규정 벗어난 부탁",
          "거절 문구 고민",
          "찾아낸 숫자 오류",
        ],
        voice: "그건 규정상 곤란해서요",
        avoid: "고지식",
      },
      lt(
        "원칙을 지키며 돈 일을 돕는 기운이에요",
        "Helps with money matters while sticking to the rules.",
        "原則を守りつつお金の面を支える気質です。"
      )
    ),
  },
  {
    stars: ["무곡", "칠살"],
    rule: fact(
      "강단 있게 밀고 나가지만 외로운 승부가 많은 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "혼자 떠맡은 어려운 프로젝트",
          "끝까지 밀어붙인 마감",
          "내밀지 않은 도움 요청",
          "늦은 밤 사무실",
        ],
        voice: "괜찮아, 내가 혼자 해 볼게",
        avoid: "독불장군",
      },
      lt(
        "강단과 돌파력이 함께 있는 기운이에요",
        "Firm resolve and push-through energy combine.",
        "芯の強さと突破力を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["무곡", "탐랑"],
    rule: fact(
      "처음엔 더디지만 시간이 지나 자리를 잡는 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "성과가 안 보이던 20대",
          "30대 중반 달라진 평가",
          "취미에서 시작된 기술",
          "몇 년 뒤 생긴 부수입",
        ],
        voice: "너는 늦게 터지는 스타일이야",
        avoid: "실패",
      },
      lt(
        "시간이 지나 자리를 잡는 기운이 있어요",
        "Tends to settle into success later rather than sooner.",
        "時間をかけて地位を固めていく気質です。"
      )
    ),
  },
  {
    stars: ["무곡", "파군"],
    rule: fact(
      "돈의 오르내림이 크고 승부수를 던지는 편",
      "negative",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "모은 돈으로 큰 구매",
          "새 사업 구상",
          "수입 많은 달 뒤의 큰 지출",
          "갑자기 날아온 청구서",
        ],
        voice: "이번에 한 번만 크게 질러 볼까",
        avoid: "도박",
      },
      lt(
        "돈의 오르내림이 큰 기운이에요",
        "Money tends to swing sharply up and down.",
        "お金の浮き沈みが大きい気質です。"
      )
    ),
  },
  {
    stars: ["천동", "거문"],
    rule: fact(
      "속으로는 불만이 쌓이고 말로 부딪히기 쉬운 편",
      "negative",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "가까운 사람의 한마디",
          "쌓아 둔 서운함",
          "농담이 번진 다툼",
          "밤에 보낸 사과 문자",
        ],
        voice: "아까 그 말 사실 좀 서운했어",
        avoid: "뒤끝",
      },
      lt(
        "편안함 속에 말다툼이 끼어들기 쉬운 기운이에요",
        "Easy-going on the surface, but words can cause friction.",
        "穏やかさの中に口論が入りやすい気質です。"
      )
    ),
  },
  {
    stars: ["천동", "천량"],
    rule: fact(
      "편안함 속에서도 어른스럽게 책임을 지는 편",
      "positive",
      2,
      {
        lens: "가장 센 무기",
        cues: [
          "친구들의 고민 상담",
          "가족 일 먼저 처리",
          "말없이 챙긴 뒷일",
          "단톡방 정리 담당",
        ],
        voice: "너한테 얘기하면 마음이 놓여",
        avoid: "희생",
      },
      lt(
        "온화함과 책임감이 함께 있는 기운이에요",
        "Gentleness and a sense of responsibility go together.",
        "穏やかさと責任感を併せ持つ気質です。"
      )
    ),
  },
  {
    stars: ["천동", "태음"],
    rule: fact(
      "감성이 풍부하고 온화하지만 안일해지기 쉬운 편",
      "positive",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "비 오는 날의 집",
          "틀어 놓은 음악",
          "차 한잔 쉬는 시간",
          "마감 직전의 시작",
        ],
        voice: "오늘은 아무 데도 안 가고 싶어",
        avoid: "나태",
      },
      lt(
        "감성이 풍부하고 온화한 기운이에요",
        "Rich in feeling and gentle in temperament.",
        "感性豊かで穏やかな気質です。"
      )
    ),
  },
  {
    stars: ["염정", "천부"],
    rule: fact(
      "단정하게 조직 안에서 자리를 지키는 편",
      "positive",
      3,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "규정에 맞춘 복장",
          "보고 형식",
          "쌓여 가는 신뢰",
          "감정 누른 회의실",
        ],
        voice: "그 사람은 늘 믿고 맡기게 돼",
        avoid: "냉정",
      },
      lt(
        "단정하게 안정을 지키는 기운이에요",
        "Composed and steady, keeping your place with dignity.",
        "端正に安定を守る気質です。"
      )
    ),
  },
  {
    stars: ["염정", "천상"],
    rule: fact(
      "체면과 규범 사이에서 마음을 다스리는 편",
      "mixed",
      2,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "삼킨 하고 싶은 말",
          "상대 체면 고려",
          "갈등 중인 두 사람 사이",
          "중재 맡은 점심시간",
        ],
        voice: "내가 한 번 얘기해 볼게",
        avoid: "눈치",
      },
      lt(
        "마음과 체면 사이를 조율하는 기운이에요",
        "Balances inner feelings against propriety.",
        "感情と体面の間を調整する気質です。"
      )
    ),
  },
  {
    stars: ["염정", "칠살"],
    rule: fact(
      "날 선 승부욕이 강해 충돌이 잦은 편",
      "negative",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "경쟁자와 비교된 순간",
          "굳은 표정",
          "날카로워진 말투",
          "서두르다 부딪힌 사고",
        ],
        voice: "나 지금 예민하니까 이따 얘기해",
        avoid: "공격성",
      },
      lt(
        "날 선 승부욕이 강한 기운이에요",
        "A sharp, intense competitive edge.",
        "鋭い負けん気の強い気質です。"
      )
    ),
  },
  {
    stars: ["염정", "탐랑"],
    rule: fact(
      "매력과 욕망이 강해 감정 이야기가 복잡해지기 쉬운 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "호감 가는 사람 여럿",
          "즉흥으로 잡은 약속",
          "분위기 좋은 술자리",
          "다음 날 아침 후회",
        ],
        voice: "어제 내가 왜 그랬지",
        avoid: "바람기",
      },
      lt(
        "매력과 욕망이 함께 강한 기운이에요",
        "Both charm and desire run strong.",
        "魅力と欲望が共に強い気質です。"
      )
    ),
  },
  {
    stars: ["염정", "파군"],
    rule: fact(
      "감정 기복이 크고 변화가 많은 삶을 사는 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "마음에 안 드는 관계 정리",
          "몇 년마다 바꾼 직장",
          "거주지 이동",
          "한꺼번에 비운 연락처",
        ],
        voice: "이번엔 다 정리하고 새로 할래",
        avoid: "무책임",
      },
      lt(
        "감정 기복이 크고 변화가 잦은 기운이에요",
        "Strong emotional swings and frequent life changes.",
        "感情の起伏が大きく変化が多い気質です。"
      )
    ),
  },
];
