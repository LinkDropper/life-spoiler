import type { FlyingSihuaRule } from "./types";

import { lt, rule } from "./builders";

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
    rule: rule(
      "스스로 나서서 돈을 만들어 내는 편",
      "positive",
      4,
      [
        "월급 외 수입이 필요하다고 느끼면 바로 일거리를 알아보기 시작해요",
        "취미로 배운 기술을 지인에게 유료로 알려 주기 시작해요",
      ],
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
    rule: rule(
      "내가 상대에게 마음을 먼저 많이 쏟는 편",
      "mixed",
      3,
      [
        "마음에 들면 상대 일정에 맞춰 내 약속을 먼저 비워 둬요",
        "상대 생일을 몇 주 전부터 고민하며 선물을 고르고 있어요",
      ],
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
    rule: rule(
      "일에 대한 집착이 커서 스스로 부담을 지는 편",
      "mixed",
      3,
      [
        "퇴근 후에도 낮에 끝내지 못한 일이 머릿속에서 떠나지 않아요",
        "맡은 일이 내 기대에 못 미치면 밤새 다시 손봐요",
      ],
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
    rule: rule(
      "돈 문제가 내 마음을 눌러 오는 편",
      "negative",
      4,
      [
        "잔고가 줄어드는 달에는 사람 만나는 일 자체가 부담스러워져요",
        "생활비 걱정이 머리에 박혀 하고 싶은 도전을 접어 둬요",
      ],
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
    rule: rule(
      "돈 문제로 몸이 먼저 신호를 보내는 편",
      "negative",
      3,
      [
        "내야 할 비용이 쌓인 시즌에 잠이 얕아지고 속이 불편해져요",
        "돈 되는 일에 무리해서 뛰다가 주말에 몸져누워요",
      ],
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
    rule: rule(
      "번 돈이 다시 일과 사업 쪽으로 들어가는 편",
      "mixed",
      3,
      [
        "생긴 여윳돈으로 장비나 강의를 먼저 사서 일에 투입해요",
        "저축보다 내 일을 키우는 쪽에 돈을 쓰고 싶어져요",
      ],
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
    rule: rule(
      "일이 곧바로 돈으로 이어지는 편",
      "positive",
      4,
      [
        "프로젝트가 끝나면 성과급이나 추가 의뢰로 바로 보상이 와요",
        "내 전문 분야로 받는 외주가 본업 수입을 받쳐 줘요",
      ],
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
    rule: rule(
      "일이 나를 짓누르듯 부담으로 돌아오는 편",
      "negative",
      4,
      [
        "책임진 일이 많아 일요일 저녁부터 월요일 걱정이 시작돼요",
        "일 잘한다는 소리를 들을수록 더 많은 일이 내게 몰려요",
      ],
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
    rule: rule(
      "일이 집과 가정을 침범하는 편",
      "negative",
      3,
      [
        "집에 와서도 업무 메신저를 끄지 못하고 가족과 대화가 줄어요",
        "주말 가족 약속이 급한 업무 때문에 자주 취소돼요",
      ],
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
    rule: rule(
      "상대가 나에게 정을 쏟아 주는 편",
      "positive",
      4,
      [
        "상대가 내가 말한 사소한 취향을 기억했다가 챙겨 줘요",
        "힘든 일이 있을 때 상대가 먼저 알아채고 곁에 와 줘요",
      ],
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
    rule: rule(
      "상대가 나를 붙들거나 내가 상대에게 눌리는 편",
      "negative",
      4,
      [
        "내 일정과 연락을 상대가 자세히 알고 싶어 해서 숨이 막혀요",
        "작은 결정에도 상대 눈치를 보다 하고 싶은 말을 삼켜요",
      ],
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
    rule: rule(
      "마음의 불안이 표정과 태도에 드러나는 편",
      "negative",
      4,
      [
        "별일 없는 날에도 괜히 초조해져 손톱이나 입술을 만지작거려요",
        "주변에서 요즘 무슨 일 있냐고 물으면 그제야 지쳐 있었다는 걸 알아요",
      ],
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
    rule: rule(
      "밖에서 오는 기회가 나에게 닿는 편",
      "positive",
      3,
      [
        "여행지나 출장 중에 만난 사람이 새 제안을 건네요",
        "새로운 환경으로 옮긴 뒤 오히려 일이 순조롭게 풀려요",
      ],
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
    rule: rule(
      "밖에서 생긴 변수가 나에게 돌아오는 편",
      "negative",
      3,
      [
        "낯선 곳에서 잃어버린 물건이나 일정 착오로 하루가 어긋나요",
        "새로 옮긴 곳에서 적응하는 첫 몇 달 동안 마음이 불편해요",
      ],
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
    rule: rule(
      "집과 터전이 재물과 이어지는 편",
      "positive",
      3,
      [
        "집을 정리하다 팔 수 있는 물건이 생겨 용돈이 되기도 해요",
        "가족에게 받은 집이나 땅 이야기가 재산 계획에 영향을 줘요",
      ],
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
    rule: rule(
      "관계가 이어졌다 끊기기를 되풀이하기 쉬운 편",
      "negative",
      4,
      [
        "헤어졌다 다시 연락해 만났다가 같은 문제로 또 멀어지는 일이 생겨요",
        "가까워질 만하면 사소한 오해로 상대가 한 발 물러서요",
      ],
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
    rule: rule(
      "들어온 돈이 머물지 않고 나가는 편",
      "mixed",
      4,
      [
        "월급이 들어온 날 정기 결제와 모임 회비로 금세 잔고가 줄어요",
        "목돈이 생기면 지인에게 한턱 내거나 선물을 사서 쓰고 말아요",
      ],
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
    rule: rule(
      "시작은 하지만 스스로 지쳐 멈추기 쉬운 편",
      "negative",
      3,
      [
        "새 계획을 세운 지 몇 주 만에 열의가 식어 서랍에 넣어 둬요",
        "잘 해 보려던 마음이 앞서다 정작 중간에 힘이 빠져요",
      ],
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
    rule: rule(
      "일을 끌고 가다 중도에 멈추기 쉬운 편",
      "negative",
      3,
      [
        "기획이 한창일 때 방향이 갑자기 바뀌어 프로젝트가 중단돼요",
        "일이 한창 재밌어질 무렵 갑자기 진로를 다시 생각하게 돼요",
      ],
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
    rule: rule(
      "즐거움이 쉽게 사라지고 다음 즐거움을 찾는 편",
      "mixed",
      3,
      [
        "새 취미에 열을 올리다 두세 달 만에 다른 취미로 옮겨 가요",
        "여행에서 돌아온 뒤 곧바로 다음 여행지를 검색해요",
      ],
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
    rule: rule(
      "집이나 터전에서 돈이 새어 나가는 편",
      "mixed",
      3,
      [
        "집을 꾸미려다 가구와 소품 지출이 예산을 넘겨요",
        "이사와 수리가 이어져 보증금이 묶이는 시기가 길어져요",
      ],
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
    rule: rule(
      "몸의 신호가 반복되어 마음이 쓰이는 편",
      "negative",
      3,
      [
        "한 번 지나간 불편함이 환절기마다 다시 올라와요",
        "검진을 받아도 개운하지 않아 다른 병원을 또 알아봐요",
      ],
      lt(
        "몸의 신호가 되풀이되어 마음이 쓰이는 기운이에요",
        "Recurring body signals tend to keep you on edge.",
        "体のサインが繰り返され、気になりやすい運です。"
      )
    ),
  },
];
