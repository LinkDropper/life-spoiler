import type { SihuaPalaceTable } from "./types";

import { fact, lt } from "./builders";

/**
 * 사화 4종 x 12궁 = 48셀 해석 표.
 *
 * 전제 (삼합파)
 * - 생년 사화(연간 기준): 사화가 놓인 궁 = 그 영역의 해석 중심축 (strength 3~5).
 * - 궁간 비화·대운 사화도 같은 표를 "그 사화가 떨어진 궁"의 의미로 재사용한다.
 *   다만 비화는 flying-sihua.ts의 별도 규칙이 우선하고, 이 표는 보조로 쓴다.
 * - 록=풍요·인연·기회, 권=주도·장악(고집 동반), 과=평판·정돈·귀인,
 *   기=집착·막힘·걱정. 같은 궁이라도 사화에 따라 direction이 갈린다.
 * - 금지: topic·material(cues·voice·avoid)·evidence에 별·궁·사화 이름 사용, 의료·투자·법률 단정.
 */
export const SIHUA_PALACE_RULES: SihuaPalaceTable = {
  화록: {
    명궁: fact(
      "타고나길 사람과 기회가 먼저 붙어 오는 편",
      "positive",
      5,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "처음 간 모임",
          "다음 약속 잡히는 순간",
          "새 팀 첫 주 점심",
          "가볍게 던진 한마디",
        ],
        voice: "너랑 얘기하면 자꾸 뭔가 이어져",
        avoid: "인기",
      },
      lt(
        "타고난 성격에 사람과 기회를 끄는 기운이 있어요",
        "Your nature naturally draws people and chances to you.",
        "生まれつき、人やチャンスを引き寄せる気質があります。"
      )
    ),
    형제궁: fact(
      "가까운 형제나 동료에게 챙김을 받는 편",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "명절 먹을거리 택배",
          "같은 팀 동료",
          "퇴근길 귀띔",
          "형제 단톡방",
        ],
        voice: "이거 너 생각나서 챙겼어",
        avoid: "의존",
      },
      lt(
        "곁의 형제나 동료에게 챙김을 받는 기운이 있어요",
        "Siblings and close peers tend to look out for you.",
        "兄弟や身近な仲間に気にかけてもらえる運です。"
      )
    ),
    부처궁: fact(
      "연애에서 정이 넉넉하게 오가는 편",
      "positive",
      5,
      {
        lens: "마음이 열리는 계기",
        cues: [
          "연애 초반 선물",
          "기억해 준 취향",
          "다툰 날 안부 문자",
          "저녁 챙기는 메시지",
        ],
        voice: "밥은 먹었어? 그게 먼저 궁금했어",
        avoid: "헤픔",
      },
      lt(
        "연애 자리에 정이 넉넉하게 오가는 기운이 있어요",
        "Warmth and affection flow freely in your love life.",
        "恋愛の場に情が豊かに行き交う運があります。"
      )
    ),
    자녀궁: fact(
      "아이나 후배를 살갑게 챙기는 모습에 상대의 호감이 커지는 편",
      "positive",
      3,
      {
        lens: "상대가 보는 나",
        cues: [
          "연인 조카 만난 날",
          "후배 챙기는 모습",
          "아이 있는 가족 모임",
          "다정하다는 말",
        ],
        voice: "애들 대하는 거 보니 더 좋아졌어",
        avoid: "의무감",
      },
      lt(
        "후배나 아이와 정을 주고받는 기운이 있어요",
        "You exchange real warmth with juniors and children.",
        "後輩や子どもと情を交わし合う運があります。"
      )
    ),
    재백궁: fact(
      "돈이 들어오는 통로가 여러 갈래로 열려 있는 편",
      "positive",
      5,
      {
        lens: "버는 방식",
        cues: [
          "부업 첫 주문",
          "지인의 먼저 온 주문",
          "연말정산 환급",
          "예상 못 한 보너스",
        ],
        voice: "너한테 사는 게 제일 마음 편해",
        avoid: "횡재",
      },
      lt(
        "돈을 보는 자리에 들어오는 기운이 붙어 있어요",
        "Money tends to find its way in through several routes.",
        "お金の面に、入ってくる運が付いています。"
      )
    ),
    질액궁: fact(
      "몸은 잘 버티지만 먹고 마시는 데 쓰임이 큰 편",
      "mixed",
      3,
      {
        lens: "튼튼한 곳",
        cues: [
          "회식 다음 날 출근",
          "금방 털고 일어난 아침",
          "맛집 약속 몰린 주말",
          "옷이 끼는 월요일",
        ],
        voice: "어제 그렇게 먹고도 멀쩡하네",
        avoid: "방심",
      },
      lt(
        "몸은 잘 버티지만 먹고 마시는 쓰임이 큰 기운이에요",
        "Your body holds up well, but eating and drinking take a toll.",
        "体は粘り強い反面、飲食に費やす力が大きい運です。"
      )
    ),
    천이궁: fact(
      "밖으로 나갈수록 인연과 기회가 붙는 편",
      "positive",
      4,
      {
        lens: "가장 센 무기",
        cues: [
          "출장지 첫 만남",
          "몇 달 뒤 온 소개",
          "이사한 동네 단골집",
          "늘어나는 아는 얼굴",
        ],
        voice: "그때 얘기 기억나서 연락했어",
        avoid: "떠돌이",
      },
      lt(
        "밖으로 나갈수록 인연과 기회가 붙는 기운이에요",
        "The more you go out into the world, the more chances find you.",
        "外に出るほど縁とチャンスがつく運です。"
      )
    ),
    교우궁: fact(
      "친구나 지인 소개로 일감과 이직 기회가 생기는 편",
      "positive",
      4,
      {
        lens: "인정받는 순간",
        cues: [
          "오랜만의 친구 연락",
          "이직할 회사 소식",
          "지인 소개 제안",
          "퇴근 후 메신저",
        ],
        voice: "너 생각나서 먼저 연락했어",
        avoid: "인맥빨",
      },
      lt(
        "친구와 인맥에서 도움이 오는 기운이 있어요",
        "Real help tends to come through friends and your network.",
        "友人や人脈から助けが届く運があります。"
      )
    ),
    관록궁: fact(
      "일하는 자리에 기회가 따라붙는 편",
      "positive",
      5,
      {
        lens: "인정받는 순간",
        cues: [
          "면접이나 미팅",
          "먼저 나온 다음 일정",
          "프로젝트 마무리 직후",
          "다른 팀의 영입 제안",
        ],
        voice: "다음에도 같이 해 보죠",
        avoid: "운빨",
      },
      lt(
        "일하는 자리에 기회가 따라붙는 기운이 있어요",
        "Opportunities tend to follow you at work.",
        "仕事の場にチャンスがついてくる運があります。"
      )
    ),
    전택궁: fact(
      "집을 구하거나 옮길 때 돈 들어올 길이 함께 생기는 편",
      "positive",
      4,
      {
        lens: "모으는 힘",
        cues: [
          "집 보러 간 첫날",
          "예산에 맞는 집",
          "보증금 보태 주는 가족",
          "빠르게 잡힌 계약",
        ],
        voice: "예산이랑 딱 맞는 집이 나왔어",
        avoid: "불로소득",
      },
      lt(
        "집과 머무는 곳에 복이 모이는 기운이 있어요",
        "Good fortune gathers around your home and where you live.",
        "家や暮らす場所に福が集まる運があります。"
      )
    ),
    복덕궁: fact(
      "마음을 채우는 즐거움이 넉넉한 편",
      "positive",
      4,
      {
        lens: "가장 센 무기",
        cues: [
          "주말 오후 카페",
          "책 한 권",
          "여행 일정 짜는 밤",
          "가벼워진 한 주",
        ],
        voice: "이것만 있어도 주말이 충분해",
        avoid: "게으름",
      },
      lt(
        "마음을 채우는 즐거움이 넉넉한 기운이 있어요",
        "You have an abundance of simple pleasures that fill the heart.",
        "心を満たす楽しみに恵まれた運があります。"
      )
    ),
    부모궁: fact(
      "윗사람과 배움의 자리에서 도움을 받는 편",
      "positive",
      4,
      {
        lens: "가장 센 무기",
        cues: [
          "면담 자리",
          "상사의 추천",
          "시험 준비 기간",
          "선배의 정리 노트",
        ],
        voice: "이거 보고 하면 훨씬 빨라",
        avoid: "낙하산",
      },
      lt(
        "윗사람과 배움의 자리에서 도움을 받는 기운이에요",
        "Elders and teachers tend to give you a helping hand.",
        "目上の人や学びの場で助けを受ける運です。"
      )
    ),
  },
  화권: {
    명궁: fact(
      "앞에 서서 이끄는 힘이 강하지만 고집도 함께 있는 편",
      "mixed",
      5,
      {
        lens: "가장 센 무기",
        cues: [
          "임자 없는 모임 총무",
          "의견 갈린 회의",
          "일정 잡는 단톡방",
          "마지막 정리 순간",
        ],
        voice: "일단 네가 정해 주면 따를게",
        avoid: "독재",
      },
      lt(
        "타고난 성격에 앞에서 이끄는 힘이 실려 있어요",
        "Your nature carries a strong drive to take the lead.",
        "生まれつき、前に立って導く力が備わっています。"
      )
    ),
    형제궁: fact(
      "형제나 동료 사이에서 주도권을 쥐려는 편",
      "mixed",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "가족 행사 날짜 정하기",
          "동료와 의견 충돌",
          "먼저 안 물러나는 순간",
          "형제 단톡방",
        ],
        voice: "내가 정하는 게 제일 빠르잖아",
        avoid: "횡포",
      },
      lt(
        "형제나 동료 사이에서 주도권을 쥐는 기운이에요",
        "You tend to take charge among siblings and peers.",
        "兄弟や仲間の間で主導権を握る運です。"
      )
    ),
    부처궁: fact(
      "연애에서 한쪽이 강하게 이끄는 편",
      "mixed",
      5,
      {
        lens: "상대가 보는 나",
        cues: [
          "데이트 코스 정하기",
          "메뉴 고르는 순간",
          "양가 조율 담당",
          "결혼 준비 회의",
        ],
        voice: "네가 정하면 편한데 가끔 숨 막혀",
        avoid: "지배",
      },
      lt(
        "연애 자리에 한쪽이 이끄는 힘이 강하게 실려 있어요",
        "One side tends to lead strongly in your relationships.",
        "恋愛の場で一方が強く引っ張る力が働いています。"
      )
    ),
    자녀궁: fact(
      "아이나 후배를 대하는 방식으로 연인과 의견이 갈리기 쉬운 편",
      "mixed",
      3,
      {
        lens: "싸우거나 서운할 때",
        cues: [
          "훗날 교육 방식 얘기",
          "연인의 후배 대하는 태도",
          "옆에서 거드는 한마디",
          "의견 갈린 대화",
        ],
        voice: "그건 이렇게 하는 게 맞지 않아?",
        avoid: "참견",
      },
      lt(
        "후배나 아이를 직접 이끌려는 기운이 있어요",
        "You tend to guide juniors and children hands-on.",
        "後輩や子どもを自ら導こうとする運があります。"
      )
    ),
    재백궁: fact(
      "돈을 직접 쥐고 굴려야 마음이 놓이는 편",
      "positive",
      5,
      {
        lens: "모으는 힘",
        cues: ["공동 자금 관리", "동업 이야기", "지분 따지기", "최종 결정권"],
        voice: "돈은 내가 쥐고 있어야 편해",
        avoid: "독점",
      },
      lt(
        "돈을 보는 자리에 직접 쥐고 굴리려는 힘이 실려 있어요",
        "You want to hold and steer your money yourself.",
        "お金の面に、自分で握って動かそうとする力があります。"
      )
    ),
    질액궁: fact(
      "몸에 힘이 몰려 긴장이 쌓이기 쉬운 편",
      "mixed",
      3,
      {
        lens: "먼저 오는 신호",
        cues: [
          "마감 주간",
          "어깨와 목 뻐근함",
          "운동 강도 올리기",
          "쉬는 날 없는 한 주",
        ],
        voice: "어깨가 돌처럼 굳었어",
        avoid: "과로",
      },
      lt(
        "몸에 힘이 몰려 긴장이 쌓이기 쉬운 기운이에요",
        "Tension tends to build up as your body holds strain.",
        "体に力が入り、緊張がたまりやすい運です。"
      )
    ),
    천이궁: fact(
      "낯선 곳이나 바깥 일에서 판단을 맡는 사람이 되는 편",
      "positive",
      4,
      {
        lens: "가장 센 무기",
        cues: [
          "낯선 모임",
          "현장 판단 요청",
          "분위기 잡는 순간",
          "출장지 결정",
        ],
        voice: "여기선 네 판단대로 가자",
        avoid: "오지랖",
      },
      lt(
        "밖에서 존재감이 커지는 기운이 실려 있어요",
        "Your presence grows stronger once you step outside.",
        "外で存在感が大きくなる運があります。"
      )
    ),
    교우궁: fact(
      "지인과 함께하는 일에서 주도권을 두고 부딪히기 쉬운 편",
      "mixed",
      3,
      {
        lens: "부딪히는 사람이나 상황",
        cues: [
          "지인과 하는 프로젝트",
          "역할 확정",
          "일정 정하기",
          "끼어드는 한마디",
        ],
        voice: "그건 내가 하던 방식대로 하자",
        avoid: "갑질",
      },
      lt(
        "친구 사이에서 이끌거나 센 사람을 만나는 기운이에요",
        "You either lead among friends or meet strong-willed ones.",
        "友人の間で引っ張るか、気の強い人と出会う運です。"
      )
    ),
    관록궁: fact(
      "일에서 권한과 책임이 함께 실리는 편",
      "positive",
      5,
      {
        lens: "일하는 방식",
        cues: [
          "작은 팀 책임",
          "방향 갈리는 회의",
          "최종 선택",
          "결재 올라오는 순간",
        ],
        voice: "이건 네가 정해 줘야 돌아가",
        avoid: "독단",
      },
      lt(
        "일하는 자리에 권한과 책임이 실리는 기운이에요",
        "Authority and responsibility gather around your work.",
        "仕事の場に権限と責任が乗る運です。"
      )
    ),
    전택궁: fact(
      "집 문제에서 돈 쓰는 결정을 내가 직접 내려야 마음이 놓이는 편",
      "mixed",
      3,
      {
        lens: "쓰는 습관",
        cues: [
          "이사 비용 계획",
          "인테리어 예산",
          "전세 월세 비교표",
          "가족 의견 조율",
        ],
        voice: "비교표 만들어 놨으니 이걸로 가자",
        avoid: "고집",
      },
      lt(
        "집안 일을 내가 쥐고 정하려는 기운이 있어요",
        "You tend to take charge of household matters.",
        "家のことを自分が握って決めようとする運です。"
      )
    ),
    복덕궁: fact(
      "쉬는 마음에도 승부욕이 실려 있는 편",
      "mixed",
      4,
      {
        lens: "되풀이되는 장면",
        cues: [
          "쉬는 날 취미 모임",
          "순위 따지기",
          "여행 중 빈 시간",
          "일정 채우기",
        ],
        voice: "쉬는 날에도 안 하면 불안해",
        avoid: "승부욕",
      },
      lt(
        "쉬는 마음에도 승부욕이 실려 있는 기운이에요",
        "Even your leisure carries a competitive streak.",
        "休む心にも負けん気が乗っている運です。"
      )
    ),
    부모궁: fact(
      "부모나 윗사람의 영향력이 큰 편",
      "mixed",
      4,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "진로 정하는 시기",
          "부모님 의견",
          "구체적인 상사 지시",
          "내 방식 넣을 틈",
        ],
        voice: "그냥 시키는 대로 하는 게 편해",
        avoid: "순종",
      },
      lt(
        "부모나 윗사람의 영향력이 큰 기운이에요",
        "Parents and superiors have a strong influence on you.",
        "親や目上の人の影響が大きい運です。"
      )
    ),
  },
  화과: {
    명궁: fact(
      "단정하고 믿음 가는 인상을 남기는 편",
      "positive",
      4,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "처음 만난 자리",
          "말투와 옷차림",
          "소개받은 사람",
          "먼저 도는 소문",
        ],
        voice: "말 안 해도 믿음이 가는 사람이야",
        avoid: "깐깐함",
      },
      lt(
        "단정하고 좋은 인상을 남기는 기운이 있어요",
        "You leave a neat, trustworthy first impression.",
        "端正で好印象を残す運があります。"
      )
    ),
    형제궁: fact(
      "형제나 동료와 예의 있게 지내는 편",
      "positive",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "명절 안부 인사",
          "형제와의 적당한 거리",
          "동료의 업무 위임",
          "예의 바른 말투",
        ],
        voice: "너한테 맡기면 마음이 놓여",
        avoid: "형식적",
      },
      lt(
        "형제나 동료와 예의 있게 지내는 기운이에요",
        "You get along courteously with siblings and peers.",
        "兄弟や仲間と礼儀正しく付き合える運です。"
      )
    ),
    부처궁: fact(
      "점잖고 단정한 인연이 닿는 편",
      "positive",
      4,
      {
        lens: "끌리는 사람",
        cues: [
          "지인 소개",
          "천천히 가까워지는 과정",
          "상대 부모님 첫 인사",
          "점잖은 말투",
        ],
        voice: "처음부터 믿음이 갔어",
        avoid: "무미건조",
      },
      lt(
        "점잖고 단정한 인연이 닿는 기운이 있어요",
        "A gentle, well-mannered partner is likely to come your way.",
        "穏やかで端正な縁が結ばれる運があります。"
      )
    ),
    자녀궁: fact(
      "아이나 후배를 반듯하게 대하는 모습이 상대에게 좋은 인상을 주는 편",
      "positive",
      3,
      {
        lens: "상대가 보는 나",
        cues: [
          "후배에게 차분한 설명",
          "상대 가족 모임",
          "먼저 다가온 조카",
          "믿음직하다는 말",
        ],
        voice: "차분히 알려 주는 모습이 좋더라",
        avoid: "계산적",
      },
      lt(
        "후배나 아이에게 칭찬받을 일이 생기는 기운이에요",
        "Juniors or children bring you something to be proud of.",
        "後輩や子どものことで誇らしい出来事がある運です。"
      )
    ),
    재백궁: fact(
      "돈이 신용과 평판으로 이어지는 편",
      "positive",
      4,
      {
        lens: "버는 방식",
        cues: [
          "거래처의 먼저 온 의뢰",
          "대금 믿고 맡기기",
          "강의 요청",
          "자문 문의",
        ],
        voice: "이 건은 믿고 맡길게요",
        avoid: "명예욕",
      },
      lt(
        "돈이 신용과 평판으로 이어지는 기운이 있어요",
        "Your money is tied to trust and reputation.",
        "お金が信用と評判につながる運があります。"
      )
    ),
    질액궁: fact(
      "몸을 미리 챙기면 큰 탈을 덜어내는 편",
      "positive",
      3,
      {
        lens: "회복하는 방식",
        cues: [
          "검진 날짜 예약",
          "결과지 꼼꼼히 보기",
          "병원 소개",
          "미리 챙기는 습관",
        ],
        voice: "미리 가 보길 잘했어",
        avoid: "염려",
      },
      lt(
        "몸을 미리 챙기면 큰 탈을 덜어내는 기운이에요",
        "Looking after your body early spares you bigger trouble.",
        "早めに体をケアすれば大事を避けやすい運です。"
      )
    ),
    천이궁: fact(
      "밖에서 평판이 먼저 알려지는 편",
      "positive",
      4,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "다른 도시 거래처",
          "이미 알려진 이름",
          "업계 행사",
          "알아보는 얼굴",
        ],
        voice: "말씀 많이 들었어요",
        avoid: "허세",
      },
      lt(
        "밖에서 평판이 먼저 알려지는 기운이 있어요",
        "Your reputation tends to travel ahead of you.",
        "外で評判が先に知られる運があります。"
      )
    ),
    교우궁: fact(
      "믿을 만한 지인이나 선배의 추천으로 일 평판이 오르는 편",
      "positive",
      4,
      {
        lens: "잘 맞는 판",
        cues: [
          "친구가 소개한 선배",
          "이직 방향 조언",
          "곤란한 회의",
          "거들어 주는 지인",
        ],
        voice: "그쪽으로 가면 잘 맞을 거야",
        avoid: "의존",
      },
      lt(
        "좋은 친구와 귀한 조언자가 곁에 오는 기운이에요",
        "Good friends and trusted advisors come into your circle.",
        "良い友人や貴重な助言者が身近に現れる運です。"
      )
    ),
    관록궁: fact(
      "일에서 실력을 공식적으로 인정받는 편",
      "positive",
      5,
      {
        lens: "인정받는 순간",
        cues: ["자격 시험", "심사 결과", "발표 끝난 뒤", "다른 부서의 연락"],
        voice: "발표 잘 들었어요 같이 해요",
        avoid: "스펙",
      },
      lt(
        "일에서 실력을 인정받는 기운이 실려 있어요",
        "Your skills tend to be formally recognized at work.",
        "仕事で実力を認められる運があります。"
      )
    ),
    전택궁: fact(
      "집 문제가 안정되면 지출 계획도 차분히 정리되는 편",
      "positive",
      3,
      {
        lens: "모으는 힘",
        cues: [
          "새 동네 이사 후",
          "월 고정비 정리",
          "계약서 꼼꼼히 읽기",
          "불필요한 비용 빼기",
        ],
        voice: "고정비가 한눈에 보이니 편해",
        avoid: "인색",
      },
      lt(
        "정돈된 집과 안정된 환경에 닿는 기운이에요",
        "You tend to land in a tidy, settled living environment.",
        "整った家と安定した環境に恵まれる運です。"
      )
    ),
    복덕궁: fact(
      "교양과 취미로 마음이 차분해지는 편",
      "positive",
      4,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "혼자 있는 주말",
          "좋아하는 작가 신간",
          "차분한 취미",
          "책 읽는 오후",
        ],
        voice: "혼자 조용히 있어야 충전돼",
        avoid: "고독",
      },
      lt(
        "교양과 취미로 마음이 차분해지는 기운이에요",
        "Cultured hobbies bring you a calm, settled mind.",
        "教養や趣味で心が落ち着く運です。"
      )
    ),
    부모궁: fact(
      "학업과 서류에서 인정받는 편",
      "positive",
      4,
      {
        lens: "가장 센 무기",
        cues: ["서류 심사", "장학 선발", "추천서 부탁", "선생님의 한마디"],
        voice: "서류만 봐도 믿음이 가요",
        avoid: "학벌",
      },
      lt(
        "학업과 서류에서 인정받는 기운이 있어요",
        "Your studies and paperwork tend to earn recognition.",
        "学業や書類で認められる運があります。"
      )
    ),
  },
  화기: {
    명궁: fact(
      "마음속 걱정과 곱씹음이 많은 편",
      "negative",
      5,
      {
        lens: "되풀이되는 장면",
        cues: [
          "끝난 대화 복기",
          "잠들기 전 밤",
          "서운한 말 한마디",
          "며칠 이어진 곱씹음",
        ],
        voice: "그 말이 왜 아직도 걸리지",
        avoid: "예민함",
      },
      lt(
        "마음에 걱정이 자꾸 맴도는 기운이 실려 있어요",
        "Your mind tends to circle back to worries.",
        "心に心配事が何度も巡りやすい運です。"
      )
    ),
    형제궁: fact(
      "형제나 동료와 서운함이 쌓이기 쉬운 편",
      "negative",
      4,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "부모님 부양 비용 얘기",
          "업무 분담 회의",
          "옆자리 동료",
          "어긋난 형제 대화",
        ],
        voice: "말은 안 했지만 좀 서운했어",
        avoid: "불화",
      },
      lt(
        "형제나 동료와 서운함이 쌓이기 쉬운 기운이에요",
        "Resentment can build up with siblings or peers.",
        "兄弟や仲間とわだかまりがたまりやすい運です。"
      )
    ),
    부처궁: fact(
      "연애에서 어긋남과 집착이 걸리는 편",
      "negative",
      5,
      {
        lens: "연락과 표현",
        cues: [
          "답장 늦어진 저녁",
          "쏟아내는 질문",
          "말투로 번진 다툼",
          "사과 놓친 타이밍",
        ],
        voice: "왜 답이 없는지 계속 신경 쓰여",
        avoid: "집착",
      },
      lt(
        "연애 자리에 어긋남과 집착이 걸려 있어요",
        "Mismatch and clinging tend to snag your love life.",
        "恋愛の場にすれ違いと執着が絡みやすい運です。"
      )
    ),
    자녀궁: fact(
      "아이나 후배 일 때문에 연인과 마음이 어긋나기 쉬운 편",
      "negative",
      4,
      {
        lens: "싸우거나 서운할 때",
        cues: ["아이 계획 얘기", "끊긴 대화", "후배 일 수습", "약속에 늦은 날"],
        voice: "후배 일이 또 먼저야?",
        avoid: "회피",
      },
      lt(
        "후배나 아이 일로 마음이 쓰이는 기운이에요",
        "Juniors or children can weigh on your mind.",
        "後輩や子どものことで気を揉みやすい運です。"
      )
    ),
    재백궁: fact(
      "돈에 막힘과 걱정이 걸리는 편",
      "negative",
      5,
      {
        lens: "돈이 새는 순간",
        cues: [
          "월말 카드 알림",
          "쓴 곳 복기",
          "빌려준 돈 얘기",
          "말 꺼내기 망설임",
        ],
        voice: "이 돈 다 어디 갔지",
        avoid: "낭비",
      },
      lt(
        "돈을 보는 자리에 막힘과 걱정이 걸려 있어요",
        "Blockages and worry tend to attach to money matters.",
        "お金の面に滞りと心配が絡んでいます。"
      )
    ),
    질액궁: fact(
      "몸의 신호에 신경이 자주 쏠리는 편",
      "negative",
      4,
      {
        lens: "신호가 오는 상황",
        cues: ["야근 이어진 주", "소화 불편", "두통", "검진 수치 하나"],
        voice: "수치 하나가 자꾸 눈에 밟혀",
        avoid: "병",
      },
      lt(
        "몸의 신호에 신경이 자주 쏠리는 기운이에요",
        "Your attention keeps snagging on signals from your body.",
        "体のサインに意識が向きやすい運です。"
      )
    ),
    천이궁: fact(
      "밖에서 변수와 불편이 생기기 쉬운 편",
      "negative",
      4,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "출장길 일정 변경",
          "급히 바꾼 숙소",
          "낯선 모임",
          "겉도는 대화",
        ],
        voice: "오늘은 일찍 들어가야겠다",
        avoid: "불운",
      },
      lt(
        "밖에서 변수와 불편이 생기기 쉬운 기운이에요",
        "Unexpected snags are more likely when you are out and about.",
        "外で予想外の支障が出やすい運です。"
      )
    ),
    교우궁: fact(
      "친구나 지인과 일로 엮이면 오해가 생기기 쉬운 편",
      "negative",
      4,
      {
        lens: "부딪히는 사람이나 상황",
        cues: [
          "친구와 하던 일",
          "엇갈린 역할 분담",
          "지인의 부탁",
          "서운하다는 소리",
        ],
        voice: "도와줬는데 왜 서운하대",
        avoid: "배신",
      },
      lt(
        "친구 사이에 오해가 생기기 쉬운 기운이에요",
        "Misunderstandings come easily among friends.",
        "友人との間に誤解が生じやすい運です。"
      )
    ),
    관록궁: fact(
      "일하는 자리에 막힘이 걸리는 편",
      "negative",
      5,
      {
        lens: "부딪히는 사람이나 상황",
        cues: [
          "평가 시즌",
          "기대와 다른 결과",
          "중간에 바뀐 방향",
          "처음부터 다시",
        ],
        voice: "그동안 한 건 어떡해",
        avoid: "무능",
      },
      lt(
        "일하는 자리에 막힘이 걸려 있는 기운이에요",
        "Obstacles tend to catch you in your work life.",
        "仕事の場に滞りが絡んでいる運です。"
      )
    ),
    전택궁: fact(
      "집 계약이나 이사 비용 때문에 돈 계획이 자주 바뀌는 편",
      "negative",
      4,
      {
        lens: "돈이 새는 순간",
        cues: [
          "이사 직전 조건 변경",
          "보증금 추가",
          "수리 견적 초과",
          "저축 덜어 쓰기",
        ],
        voice: "견적이랑 왜 이렇게 달라",
        avoid: "손해",
      },
      lt(
        "집과 계약 일에 변수가 걸려 있는 기운이에요",
        "Surprises tend to arise around housing and contracts.",
        "家や契約ごとに変数が絡みやすい運です。"
      )
    ),
    복덕궁: fact(
      "쉬어도 마음이 편치 않은 편",
      "negative",
      5,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "쉬는 날 소파",
          "떠오르는 할 일 목록",
          "여행 중 회사 메시지",
          "마음 편치 않은 휴가",
        ],
        voice: "쉬는데 왜 이렇게 불안하지",
        avoid: "조급함",
      },
      lt(
        "쉬어도 마음이 편치 않은 기운이 걸려 있어요",
        "Even when resting, your mind finds it hard to settle.",
        "休んでも心が落ち着かない運が絡んでいます。"
      )
    ),
    부모궁: fact(
      "윗사람이나 서류 일에 마찰이 걸리는 편",
      "negative",
      4,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "상사의 잦은 지적",
          "보고 직전",
          "신청 서류 오류",
          "재제출 요청",
        ],
        voice: "또 고쳐서 내라네",
        avoid: "반항",
      },
      lt(
        "윗사람이나 서류 일에 마찰이 걸려 있는 기운이에요",
        "Friction tends to arise with superiors and paperwork.",
        "目上の人や書類ごとに摩擦が生じやすい運です。"
      )
    ),
  },
};
