import type { PartnerTable } from "./types";

import { lt } from "./builders";

/**
 * 부처궁 주성 기준 상대(인연) 묘사 (14행).
 *
 * 전제 (삼합파)
 * - 부처궁의 주성(없으면 대궁 차성)이 "상대 성향·관계 역할"을 보여 준다.
 * - 외모·직업·나이·학력 단정 금지: traits는 성향, role은 관계 안의 역할,
 *   meetingPaths는 "만나는 자리"의 경향만 담는다.
 * - 사화·살성·밝기에 따라 길흉이 크게 달라지므로 이 표는 주성 단독의
 *   기본 경향이다. 유파 이견: 천동(온화함 vs 소극), 탐랑(매력 vs 애정 복잡)은
 *   양면이 있어 traits에 같이 적었다.
 */
export const PARTNER_RULES: PartnerTable = {
  자미: {
    traits: ["책임감이 강한", "자존심이 있고 품위를 중시하는", "방향을 이끄는"],
    role: "관계의 중심을 잡고 큰 결정을 이끄는 사람",
    meetingPaths: [
      "윗사람이나 선배의 소개",
      "일이나 공적인 자리",
      "격식 있는 모임",
    ],
    evidence: lt(
      "책임감 있고 중심을 잡는 상대와 인연이 닿는 기운이에요",
      "You tend to be matched with a responsible, grounded partner.",
      "責任感があり軸の定まった相手と縁がある運です。"
    ),
  },
  천기: {
    traits: ["머리 회전이 빠른", "대화가 풍부한", "변화를 좋아하는"],
    role: "새로운 아이디어와 정보를 가져와 관계를 신선하게 하는 사람",
    meetingPaths: ["공부·강의·모임", "친구의 소개", "온라인 커뮤니티"],
    evidence: lt(
      "영리하고 말이 잘 통하는 상대와 인연이 닿는 기운이에요",
      "You tend to meet a quick-witted, talkative partner.",
      "頭の回転が速く話の合う相手と縁がある運です。"
    ),
  },
  태양: {
    traits: ["밝고 적극적인", "베푸는 걸 좋아하는", "주목받는 자리가 어울리는"],
    role: "관계에 활력을 주고 앞에서 챙겨 주는 사람",
    meetingPaths: [
      "사람이 많은 행사나 모임",
      "직장·단체 활동",
      "낮 시간대 활동",
    ],
    evidence: lt(
      "밝고 베푸는 상대와 인연이 닿는 기운이에요",
      "You tend to be matched with a bright, giving partner.",
      "明るく与えることを好む相手と縁がある運です。"
    ),
  },
  무곡: {
    traits: ["성실하고 현실적인", "표현은 투박한", "약속을 지키는"],
    role: "말보다 행동으로 살림과 생활을 책임지는 사람",
    meetingPaths: [
      "직장 동료나 일 관계",
      "가족·지인의 소개",
      "예전부터 알던 사이에서",
    ],
    evidence: lt(
      "성실하고 현실적인 상대와 인연이 닿는 기운이에요",
      "You tend to meet a diligent, practical partner.",
      "誠実で現実的な相手と縁がある運です。"
    ),
  },
  천동: {
    traits: ["온화하고 편안한", "느긋하고 낙천적인", "때로 소극적인"],
    role: "관계의 분위기를 부드럽게 풀어 주는 사람",
    meetingPaths: ["친구 모임", "취미나 여가 활동", "자연스러운 일상 속"],
    evidence: lt(
      "온화하고 편안한 상대와 인연이 닿는 기운이에요",
      "You tend to meet a gentle, easy-going partner.",
      "穏やかで安らげる相手と縁がある運です。"
    ),
  },
  염정: {
    traits: ["감정이 진하고 열정적인", "원칙과 자존심이 뚜렷한", "매력이 강한"],
    role: "관계에 강한 몰입과 긴장을 가져오는 사람",
    meetingPaths: [
      "일이나 조직 안에서",
      "우연한 강한 첫인상의 만남",
      "예술·문화 활동",
    ],
    evidence: lt(
      "감정이 진하고 열정적인 상대와 인연이 닿는 기운이에요",
      "You tend to meet an intense, passionate partner.",
      "感情が濃く情熱的な相手と縁がある運です。"
    ),
  },
  천부: {
    traits: ["안정을 중시하는", "너그럽고 듬직한", "살림을 잘 챙기는"],
    role: "생활의 바탕을 단단히 지켜 주는 사람",
    meetingPaths: ["집안이나 지인 소개", "직장·공적 영역", "안정적인 소모임"],
    evidence: lt(
      "듬직하고 안정감 있는 상대와 인연이 닿는 기운이에요",
      "You tend to meet a dependable, stable partner.",
      "頼もしく安定感のある相手と縁がある運です。"
    ),
  },
  태음: {
    traits: ["섬세하고 다정한", "감성이 풍부한", "내면이 깊은"],
    role: "정서적으로 곁을 지키며 마음을 돌봐 주는 사람",
    meetingPaths: ["저녁이나 밤 시간의 자리", "예술·문화 모임", "조용한 소개"],
    evidence: lt(
      "섬세하고 다정한 상대와 인연이 닿는 기운이에요",
      "You tend to meet a sensitive, tender partner.",
      "繊細で優しい相手と縁がある運です。"
    ),
  },
  탐랑: {
    traits: [
      "매력적이고 사교적인",
      "다재다능하고 호기심 많은",
      "애정 표현이 풍부한",
    ],
    role: "관계에 재미와 설렘을 불어넣는 사람",
    meetingPaths: ["모임이나 파티·행사", "취미·유흥 활동", "친구의 친구"],
    evidence: lt(
      "매력적이고 사교적인 상대와 인연이 닿는 기운이에요",
      "You tend to meet a charming, sociable partner.",
      "魅力的で社交的な相手と縁がある運です。"
    ),
  },
  거문: {
    traits: ["말이 많고 예리한", "따지길 좋아하는", "속마음은 신중한"],
    role: "대화로 관계를 풀고 때로는 따끔한 말을 해 주는 사람",
    meetingPaths: [
      "말하는 일과 관련된 자리",
      "토론·학습 모임",
      "다툼 뒤 깊어지는 사이",
    ],
    evidence: lt(
      "말이 많고 예리한 상대와 인연이 닿는 기운이에요",
      "You tend to meet a talkative, sharp-minded partner.",
      "口数が多く鋭い相手と縁がある運です。"
    ),
  },
  천상: {
    traits: ["배려심이 깊은", "예의 바르고 단정한", "균형을 중시하는"],
    role: "곁에서 조율하며 살뜰하게 챙기는 사람",
    meetingPaths: [
      "지인이나 어른의 소개",
      "일터에서 가까워진 사이",
      "공식적인 만남",
    ],
    evidence: lt(
      "배려 깊고 단정한 상대와 인연이 닿는 기운이에요",
      "You tend to meet a considerate, well-mannered partner.",
      "思いやり深く端正な相手と縁がある運です。"
    ),
  },
  천량: {
    traits: ["어른스럽고 믿음직한", "원칙이 분명한", "보호하려는"],
    role: "조언하고 보살피며 든든한 기댈 곳이 되어 주는 사람",
    meetingPaths: [
      "나이 차나 경험 차가 있는 사이",
      "어른의 소개",
      "도움을 주고받다 가까워지는 만남",
    ],
    evidence: lt(
      "어른스럽고 믿음직한 상대와 인연이 닿는 기운이에요",
      "You tend to meet a mature, reliable partner.",
      "大人びて頼れる相手と縁がある運です。"
    ),
  },
  칠살: {
    traits: ["강단 있고 직선적인", "독립심이 강한", "승부욕이 있는"],
    role: "함께 도전하며 관계를 앞으로 밀고 나가는 사람",
    meetingPaths: [
      "운동·도전 활동",
      "일터의 치열한 현장",
      "강한 인상으로 시작된 만남",
    ],
    evidence: lt(
      "강단 있고 직선적인 상대와 인연이 닿는 기운이에요",
      "You tend to meet a strong-willed, straightforward partner.",
      "芯が強く率直な相手と縁がある運です。"
    ),
  },
  파군: {
    traits: [
      "개성이 강하고 변화를 즐기는",
      "솔직하고 추진력 있는",
      "틀에 얽매이지 않는",
    ],
    role: "관계에 변화를 일으키고 새 방향을 열어 주는 사람",
    meetingPaths: [
      "새로운 환경이나 이동 중",
      "예상 밖의 계기",
      "일이나 모임의 전환점",
    ],
    evidence: lt(
      "개성 강하고 변화를 즐기는 상대와 인연이 닿는 기운이에요",
      "You tend to meet a free-spirited, change-loving partner.",
      "個性が強く変化を楽しむ相手と縁がある運です。"
    ),
  },
};
