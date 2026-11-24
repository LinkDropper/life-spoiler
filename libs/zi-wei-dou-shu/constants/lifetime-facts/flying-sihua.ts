import type { FlyingSihuaRule } from "./types";

import { fact, lt } from "./builders";

/**
 * 비행사화(궁간 사화) 해석 규칙 22개.
 *
 * 전제 (삼합파)
 * - 생년 사화(연간)와 궁간 비화는 다르다. 생년 사화는 sihua-palace.ts가 담당하고,
 *   이 파일은 "from 궁의 천간이 만든 사화가 to 궁의 별에 떨어질 때"만 다룬다.
 *   (from = 사화를 일으키는 궁, to = 사화 별이 앉은 궁. 엔진이 to를 계산해 매칭)
 * - to === "self" 는 자화: 그 궁 자신의 천간 사화가 같은 궁 별에 떨어진 경우.
 *   삼합파는 자화를 "들어와도 머물지 못함/이어졌다 끊김"으로 읽는다
 *   (록 자화 = 얻은 만큼 새나감, 기 자화 = 끌고 가지 못하고 중도에 멈춤).
 *
 * 유파 이견 (메모)
 * - 비성파(飛星派)·흠천문은 비화를 해석의 중심에 두고 모든 궁 조합을 본다.
 *   삼합파는 생년 사화+삼방사정이 중심이고 비화는 "보조 증거"이므로
 *   strength를 3~4로 제한하고 5는 쓰지 않았다.
 * - 화기 자화의 길흉: 일부 유파는 "흉이 풀린다"로 읽으나 삼합파·비성파 다수는
 *   "허탈·단절"로 읽는다. 여기서는 후자를 따랐다.
 * - 명궁 화록→부처궁은 "내가 상대에게 마음을 쏟는다"(비성파 다수) vs
 *   "연애운이 좋다"(대중 해석)로 갈린다. 전자(능동, mixed)로 두었다.
 * - 대운·유년 사화의 비화는 다루지 않음(sihua-palace.ts 재사용).
 */
export const FLYING_SIHUA_RULES: FlyingSihuaRule[] = [
  {
    from: "명궁",
    sihua: "화록",
    to: "재백궁",
    section: "wealth",
    rule: fact(
      "스스로 나서서 돈을 만들어 내는 편",
      "positive",
      4,
      {
        lens: "버는 방식",
        cues: [
          "월급 외 수입 고민",
          "취미 기술의 유료화",
          "지인에게 받은 첫 의뢰",
          "퇴근 후 부업 검색",
        ],
        voice: "너 또 뭔가 하나 시작했네",
        avoid: "투기",
      },
      lt(
        "내가 직접 움직여 돈을 만드는 기운이 있어요",
        "You tend to take the initiative to create income.",
        "自ら動いてお金を生み出す運があります。"
      )
    ),
  },
  {
    from: "명궁",
    sihua: "화록",
    to: "부처궁",
    section: "relationship",
    rule: fact(
      "내가 상대에게 마음을 먼저 많이 쏟는 편",
      "mixed",
      3,
      {
        lens: "연락과 표현",
        cues: [
          "상대 일정 먼저 확인",
          "비워 둔 주말 약속",
          "몇 주 전부터 고른 선물",
          "먼저 건넨 안부 카톡",
        ],
        voice: "너는 나보다 나를 더 챙겨",
        avoid: "집착",
      },
      lt(
        "내가 상대에게 정을 먼저 쏟는 기운이 있어요",
        "You tend to pour your affection into a partner first.",
        "自分から相手へ先に情を注ぐ運があります。"
      )
    ),
  },
  {
    from: "명궁",
    sihua: "화기",
    to: "관록궁",
    section: "career",
    rule: fact(
      "일에 대한 집착이 커서 스스로 부담을 지는 편",
      "mixed",
      3,
      {
        lens: "일하는 방식",
        cues: [
          "퇴근 후 머릿속 업무",
          "밤새 다시 손본 자료",
          "기대에 못 미친 결과물",
          "일요일 밤 메일함",
        ],
        voice: "그만하면 됐어, 이제 좀 쉬어",
        avoid: "야망",
      },
      lt(
        "일에 대한 집착이 커서 스스로 짐을 지는 기운이에요",
        "A strong fixation on work that weighs on you.",
        "仕事への執着が強く、自ら重荷を背負う運です。"
      )
    ),
  },
  {
    from: "재백궁",
    sihua: "화기",
    to: "명궁",
    section: "wealth",
    rule: fact(
      "돈 문제가 내 마음을 눌러 오는 편",
      "negative",
      4,
      {
        lens: "돈이 새는 순간",
        cues: [
          "잔고 줄어든 월말",
          "카드값 나가는 날",
          "생활비 계산하는 밤",
          "접어 둔 도전 계획",
        ],
        voice: "이번 달은 모임 말고 쉬자",
        avoid: "낭비",
      },
      lt(
        "돈 걱정이 내 마음을 누르는 기운이 있어요",
        "Money worries tend to weigh on your mind.",
        "お金の心配が心に重くのしかかる運があります。"
      )
    ),
  },
  {
    from: "재백궁",
    sihua: "화기",
    to: "질액궁",
    section: "health",
    rule: fact(
      "돈 문제로 몸이 먼저 신호를 보내는 편",
      "negative",
      3,
      {
        lens: "먼저 오는 신호",
        cues: [
          "비용이 쌓인 시즌",
          "얕아진 잠",
          "속이 불편한 아침",
          "무리한 부업 뒤 주말",
        ],
        voice: "요즘 밥도 제대로 못 먹더라",
        avoid: "꾀병",
      },
      lt(
        "돈 일로 몸이 먼저 신호를 보내는 기운이에요",
        "Money stress tends to show up first in your body.",
        "お金の悩みで体が先にサインを出す運です。"
      )
    ),
  },
  {
    from: "재백궁",
    sihua: "화록",
    to: "관록궁",
    section: "wealth",
    rule: fact(
      "번 돈이 다시 일과 사업 쪽으로 들어가는 편",
      "mixed",
      3,
      {
        lens: "쓰는 습관",
        cues: [
          "생긴 여윳돈",
          "먼저 산 장비",
          "결제한 온라인 강의",
          "미뤄 둔 저축",
        ],
        voice: "일단 이걸 사야 일이 돌아가",
        avoid: "충동",
      },
      lt(
        "번 돈이 다시 일로 돌아가는 기운이 있어요",
        "Money you earn tends to flow back into your work.",
        "稼いだお金が再び仕事へ戻っていく運があります。"
      )
    ),
  },
  {
    from: "관록궁",
    sihua: "화록",
    to: "재백궁",
    section: "career",
    rule: fact(
      "일이 곧바로 돈으로 이어지는 편",
      "positive",
      4,
      {
        lens: "인정받는 순간",
        cues: [
          "프로젝트 끝난 뒤 정산",
          "성과급 나온 날",
          "추가 의뢰 연락",
          "본업 옆 외주",
        ],
        voice: "이 건은 또 맡기고 싶네요",
        avoid: "요행",
      },
      lt(
        "하는 일이 돈으로 이어지는 기운이 있어요",
        "Your work tends to turn directly into income.",
        "仕事がそのままお金につながる運があります。"
      )
    ),
  },
  {
    from: "관록궁",
    sihua: "화기",
    to: "명궁",
    section: "career",
    rule: fact(
      "일이 나를 짓누르듯 부담으로 돌아오는 편",
      "negative",
      4,
      {
        lens: "부딪히는 사람이나 상황",
        cues: [
          "일요일 저녁 월요일 걱정",
          "몰려오는 추가 업무",
          "어깨에 얹힌 책임 목록",
          "칭찬 뒤에 붙는 부탁",
        ],
        voice: "잘한다고 다 맡기면 어떡해",
        avoid: "무능",
      },
      lt(
        "일이 부담으로 돌아와 나를 누르는 기운이에요",
        "Work tends to rebound as a burden on you personally.",
        "仕事が負担となって自分にのしかかる運です。"
      )
    ),
  },
  {
    from: "관록궁",
    sihua: "화기",
    to: "전택궁",
    section: "career",
    rule: fact(
      "일이 집과 가정을 침범하는 편",
      "negative",
      3,
      {
        lens: "부딪히는 사람이나 상황",
        cues: [
          "집에서 켜 둔 업무 메신저",
          "취소된 주말 가족 약속",
          "줄어든 저녁 식탁 대화",
          "퇴근 후 울린 알림",
        ],
        voice: "집에서까지 일 얘기야",
        avoid: "무관심",
      },
      lt(
        "일이 집안까지 끼어드는 기운이 있어요",
        "Work tends to intrude into home life.",
        "仕事が家庭にまで入り込む運があります。"
      )
    ),
  },
  {
    from: "부처궁",
    sihua: "화록",
    to: "명궁",
    section: "relationship",
    rule: fact(
      "상대가 나에게 정을 쏟아 주는 편",
      "positive",
      4,
      {
        lens: "마음이 열리는 계기",
        cues: [
          "말해 둔 취향을 기억한 선물",
          "힘든 날 먼저 온 연락",
          "곁에 와 준 퇴근길",
          "메모해 둔 사소한 말",
        ],
        voice: "지난번에 좋다던 거 사 왔어",
        avoid: "의존",
      },
      lt(
        "상대가 나에게 정을 쏟아 주는 기운이 있어요",
        "A partner tends to give you warm, generous attention.",
        "相手が自分に情を注いでくれる運があります。"
      )
    ),
  },
  {
    from: "부처궁",
    sihua: "화기",
    to: "명궁",
    section: "relationship",
    rule: fact(
      "상대가 나를 붙들거나 내가 상대에게 눌리는 편",
      "negative",
      4,
      {
        lens: "싸우거나 서운할 때",
        cues: [
          "일정을 캐묻는 연락",
          "눈치 본 작은 결정",
          "삼킨 하고 싶은 말",
          "답이 늦은 카톡 뒤",
        ],
        voice: "오늘 누구 만났는지 말해 줘",
        avoid: "사랑",
      },
      lt(
        "상대와의 관계가 나를 무겁게 누를 수 있는 기운이에요",
        "The relationship itself can weigh heavily on you.",
        "相手との関係が自分を重く縛りやすい運です。"
      )
    ),
  },
  {
    from: "복덕궁",
    sihua: "화기",
    to: "명궁",
    section: "core",
    rule: fact(
      "마음의 불안이 표정과 태도에 드러나는 편",
      "negative",
      4,
      {
        lens: "첫인상과 실제 속",
        cues: [
          "별일 없는 날의 초조함",
          "만지작거린 손톱",
          "무슨 일 있냐는 물음",
          "지쳐 보이는 표정",
        ],
        voice: "너 요즘 얼굴이 좀 굳어 있어",
        avoid: "예민",
      },
      lt(
        "마음의 불안이 겉으로 드러나는 기운이에요",
        "Inner unease tends to show up in your demeanor.",
        "心の不安が表に出やすい運です。"
      )
    ),
  },
  {
    from: "천이궁",
    sihua: "화록",
    to: "명궁",
    section: "core",
    rule: fact(
      "밖에서 오는 기회가 나에게 닿는 편",
      "positive",
      3,
      {
        lens: "가장 센 무기",
        cues: [
          "출장지에서 만난 사람",
          "여행 중 받은 제안",
          "환경을 옮긴 첫 달",
          "낯선 모임의 소개",
        ],
        voice: "네가 오고 나서 일이 풀렸어",
        avoid: "행운",
      },
      lt(
        "밖의 기회가 나에게 닿는 기운이 있어요",
        "Opportunities from outside tend to land with you.",
        "外のチャンスが自分に届く運があります。"
      )
    ),
  },
  {
    from: "천이궁",
    sihua: "화기",
    to: "명궁",
    section: "core",
    rule: fact(
      "밖에서 생긴 변수가 나에게 돌아오는 편",
      "negative",
      3,
      {
        lens: "자꾸 걸려 넘어지는 지점",
        cues: [
          "낯선 곳의 분실물",
          "일정 착오",
          "이사 후 첫 몇 달",
          "새 동네 적응기",
        ],
        voice: "새 데는 원래 좀 걸리더라",
        avoid: "불운",
      },
      lt(
        "밖의 변수가 나에게 돌아오는 기운이 있어요",
        "Problems from outside tend to circle back to you.",
        "外の変数が自分に返ってくる運があります。"
      )
    ),
  },
  {
    from: "전택궁",
    sihua: "화록",
    to: "재백궁",
    section: "wealth",
    rule: fact(
      "집과 터전이 재물과 이어지는 편",
      "positive",
      3,
      {
        lens: "모으는 힘",
        cues: [
          "정리하다 판 물건",
          "중고 거래 용돈",
          "가족에게 받은 집 이야기",
          "보증금 계획",
        ],
        voice: "집 정리하다 용돈 벌었어",
        avoid: "부동산",
      },
      lt(
        "집과 터전이 재물과 이어지는 기운이에요",
        "Your home and property tend to connect with your wealth.",
        "家や拠点が財につながる運です。"
      )
    ),
  },
  {
    from: "부처궁",
    sihua: "화기",
    to: "self",
    section: "relationship",
    rule: fact(
      "관계가 이어졌다 끊기기를 되풀이하기 쉬운 편",
      "negative",
      4,
      {
        lens: "싸우거나 서운할 때",
        cues: [
          "헤어진 뒤 온 연락",
          "재회 후 같은 다툼",
          "가까워질 즈음의 오해",
          "한 발 물러선 상대",
        ],
        voice: "우리 또 같은 데서 막히네",
        avoid: "인연",
      },
      lt(
        "관계가 이어졌다 끊기기를 되풀이하기 쉬운 기운이에요",
        "Relationships tend to connect and break off in repeating cycles.",
        "関係が続いては途切れることを繰り返しやすい運です。"
      )
    ),
  },
  {
    from: "재백궁",
    sihua: "화록",
    to: "self",
    section: "wealth",
    rule: fact(
      "들어온 돈이 머물지 않고 나가는 편",
      "mixed",
      4,
      {
        lens: "돈이 새는 순간",
        cues: [
          "월급날 정기 결제",
          "모임 회비",
          "목돈 생긴 뒤 한턱",
          "지인 생일 선물",
        ],
        voice: "월급 들어온 지 사흘 됐는데",
        avoid: "낭비",
      },
      lt(
        "들어온 돈이 머물지 않고 나가는 기운이에요",
        "Money comes in, but it doesn't stay put.",
        "入ったお金が留まらずに出ていく運です。"
      )
    ),
  },
  {
    from: "명궁",
    sihua: "화기",
    to: "self",
    section: "core",
    rule: fact(
      "시작은 하지만 스스로 지쳐 멈추기 쉬운 편",
      "negative",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "세운 지 몇 주 된 계획",
          "서랍에 넣어 둔 준비물",
          "중간에 식은 열의",
          "다시 시작한 월요일",
        ],
        voice: "이번엔 진짜 끝까지 가자",
        avoid: "게으름",
      },
      lt(
        "시작하고 스스로 지쳐 멈추기 쉬운 기운이에요",
        "You may start strong but tire yourself out and stop.",
        "始めても自分で疲れて止まりやすい運です。"
      )
    ),
  },
  {
    from: "관록궁",
    sihua: "화기",
    to: "self",
    section: "career",
    rule: fact(
      "일을 끌고 가다 중도에 멈추기 쉬운 편",
      "negative",
      3,
      {
        lens: "일하는 방식",
        cues: [
          "한창 진행 중인 기획",
          "갑자기 바뀐 방향",
          "중단된 프로젝트",
          "재미 붙을 즈음의 진로 고민",
        ],
        voice: "이거 계속 가는 게 맞나 싶어",
        avoid: "무책임",
      },
      lt(
        "일을 끌고 가다 중도에 멈추기 쉬운 기운이에요",
        "Work tends to stall partway through.",
        "仕事が途中で止まりやすい運です。"
      )
    ),
  },
  {
    from: "복덕궁",
    sihua: "화록",
    to: "self",
    section: "core",
    rule: fact(
      "즐거움이 쉽게 사라지고 다음 즐거움을 찾는 편",
      "mixed",
      3,
      {
        lens: "되풀이되는 장면",
        cues: [
          "두세 달 된 새 취미",
          "여행 뒤 다음 여행지 검색",
          "사 두고 쓰지 않은 장비",
          "옮겨 간 관심사",
        ],
        voice: "그건 시들해, 다음 거 찾아",
        avoid: "변덕",
      },
      lt(
        "즐거움이 오래 머물지 못하고 옮겨 가는 기운이에요",
        "Pleasures don't linger; you keep moving to the next one.",
        "楽しみが長く留まらず次へ移っていく運です。"
      )
    ),
  },
  {
    from: "전택궁",
    sihua: "화록",
    to: "self",
    section: "wealth",
    rule: fact(
      "집이나 터전에서 돈이 새어 나가는 편",
      "mixed",
      3,
      {
        lens: "돈이 새는 순간",
        cues: [
          "집 꾸미기 소품 결제",
          "예산 넘긴 가구",
          "이어진 이사와 수리",
          "묶인 보증금",
        ],
        voice: "이것만 사면 집이 완성돼",
        avoid: "사치",
      },
      lt(
        "집이나 터전에서 돈이 새어 나가는 기운이에요",
        "Money tends to leak out through home and property.",
        "家や拠点からお金が流れ出やすい運です。"
      )
    ),
  },
  {
    from: "질액궁",
    sihua: "화기",
    to: "self",
    section: "health",
    rule: fact(
      "몸의 신호가 반복되어 마음이 쓰이는 편",
      "negative",
      3,
      {
        lens: "신호가 오는 상황",
        cues: [
          "환절기 되살아난 불편",
          "검진 뒤 남은 찜찜함",
          "다른 병원 검색",
          "지나간 증상의 재발",
        ],
        voice: "분명 다 나은 줄 알았는데",
        avoid: "엄살",
      },
      lt(
        "몸의 신호가 되풀이되어 마음이 쓰이는 기운이에요",
        "Recurring body signals tend to keep you on edge.",
        "体のサインが繰り返され、気になりやすい運です。"
      )
    ),
  },
];
