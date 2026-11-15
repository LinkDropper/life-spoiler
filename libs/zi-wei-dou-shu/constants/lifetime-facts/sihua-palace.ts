import type { SihuaPalaceTable } from "./types";

import { lt, rule } from "./builders";

/**
 * 사화 4종 x 12궁 = 48셀 해석 표.
 *
 * 전제 (삼합파)
 * - 생년 사화(연간 기준): 사화가 놓인 궁 = 그 영역의 해석 중심축 (strength 3~5).
 * - 궁간 비화·대운 사화도 같은 표를 "그 사화가 떨어진 궁"의 의미로 재사용한다.
 *   다만 비화는 flying-sihua.ts의 별도 규칙이 우선하고, 이 표는 보조로 쓴다.
 * - 록=풍요·인연·기회, 권=주도·장악(고집 동반), 과=평판·정돈·귀인,
 *   기=집착·막힘·걱정. 같은 궁이라도 사화에 따라 direction이 갈린다.
 * - 금지: topic·sceneSeeds·evidence에 별·궁·사화 이름 사용, 의료·투자·법률 단정.
 */
export const SIHUA_PALACE_RULES: SihuaPalaceTable = {
  화록: {
    명궁: rule(
      "타고나길 사람과 기회가 먼저 붙어 오는 편",
      "positive",
      5,
      [
        "처음 간 모임에서 가볍게 한 말 때문에 다음 약속이 바로 잡혀요",
        "새 팀에 들어가면 첫 주부터 점심 같이 먹자는 사람이 먼저 나타나요",
      ],
      lt(
        "타고난 성격에 사람과 기회를 끄는 기운이 있어요",
        "Your nature naturally draws people and chances to you.",
        "生まれつき、人やチャンスを引き寄せる気質があります。"
      )
    ),
    형제궁: rule(
      "가까운 형제나 동료에게 챙김을 받는 편",
      "positive",
      3,
      [
        "명절에 형제자매가 먼저 먹을거리를 챙겨 보내요",
        "같은 팀 동료가 퇴근길에 일거리 하나를 슬쩍 소개해 줘요",
      ],
      lt(
        "곁의 형제나 동료에게 챙김을 받는 기운이 있어요",
        "Siblings and close peers tend to look out for you.",
        "兄弟や身近な仲間に気にかけてもらえる運です。"
      )
    ),
    부처궁: rule(
      "연애에서 정이 넉넉하게 오가는 편",
      "positive",
      5,
      [
        "연애 초반에 상대가 사소한 취향까지 기억해 선물을 건네요",
        "다툰 날에도 상대가 먼저 밥은 먹었냐고 문자를 보내와요",
      ],
      lt(
        "연애 자리에 정이 넉넉하게 오가는 기운이 있어요",
        "Warmth and affection flow freely in your love life.",
        "恋愛の場に情が豊かに行き交う運があります。"
      )
    ),
    자녀궁: rule(
      "후배나 아이와 정을 주고받는 편",
      "positive",
      3,
      [
        "후배가 먼저 다가와 진로 고민을 털어놓아요",
        "취미로 만든 작업물에 뜻밖의 사람들이 반응을 달아 줘요",
      ],
      lt(
        "후배나 아이와 정을 주고받는 기운이 있어요",
        "You exchange real warmth with juniors and children.",
        "後輩や子どもと情を交わし合う運があります。"
      )
    ),
    재백궁: rule(
      "돈이 들어오는 통로가 여러 갈래로 열려 있는 편",
      "positive",
      5,
      [
        "부업 삼아 시작한 일에 지인이 먼저 주문을 넣어요",
        "연말 정리 때 예상 못 한 보너스나 환급이 들어와요",
      ],
      lt(
        "돈을 보는 자리에 들어오는 기운이 붙어 있어요",
        "Money tends to find its way in through several routes.",
        "お金の面に、入ってくる運が付いています。"
      )
    ),
    질액궁: rule(
      "몸은 잘 버티지만 먹고 마시는 데 쓰임이 큰 편",
      "mixed",
      3,
      [
        "회식 다음 날에도 금방 털고 일어나 출근해요",
        "맛집 약속이 몰린 주말이 지나면 옷이 조금 끼어요",
      ],
      lt(
        "몸은 잘 버티지만 먹고 마시는 쓰임이 큰 기운이에요",
        "Your body holds up well, but eating and drinking take a toll.",
        "体は粘り強い反面、飲食に費やす力が大きい運です。"
      )
    ),
    천이궁: rule(
      "밖으로 나갈수록 인연과 기회가 붙는 편",
      "positive",
      4,
      [
        "출장지에서 만난 사람이 몇 달 뒤 일을 소개해 줘요",
        "이사한 동네에서 단골 가게가 생기며 아는 얼굴이 빠르게 늘어요",
      ],
      lt(
        "밖으로 나갈수록 인연과 기회가 붙는 기운이에요",
        "The more you go out into the world, the more chances find you.",
        "外に出るほど縁とチャンスがつく運です。"
      )
    ),
    교우궁: rule(
      "친구와 인맥에서 실질적인 도움이 오는 편",
      "positive",
      4,
      [
        "오랜만에 연락한 친구가 이직 자리를 먼저 알려 줘요",
        "모임에서 부탁을 꺼내기도 전에 누군가 먼저 거들어 줘요",
      ],
      lt(
        "친구와 인맥에서 도움이 오는 기운이 있어요",
        "Real help tends to come through friends and your network.",
        "友人や人脈から助けが届く運があります。"
      )
    ),
    관록궁: rule(
      "일하는 자리에 기회가 따라붙는 편",
      "positive",
      5,
      [
        "면접이나 미팅에서 상대가 먼저 다음 일정을 제안해요",
        "맡은 프로젝트를 끝내면 다른 팀이 데려가려고 해요",
      ],
      lt(
        "일하는 자리에 기회가 따라붙는 기운이 있어요",
        "Opportunities tend to follow you at work.",
        "仕事の場にチャンスがついてくる運があります。"
      )
    ),
    전택궁: rule(
      "집과 머무는 곳에 복이 모이는 편",
      "positive",
      4,
      [
        "집을 보러 간 첫날 마음에 드는 곳을 바로 만나요",
        "부모님이나 친척에게 집 문제로 도움을 받을 일이 생겨요",
      ],
      lt(
        "집과 머무는 곳에 복이 모이는 기운이 있어요",
        "Good fortune gathers around your home and where you live.",
        "家や暮らす場所に福が集まる運があります。"
      )
    ),
    복덕궁: rule(
      "마음을 채우는 즐거움이 넉넉한 편",
      "positive",
      4,
      [
        "주말 오후 카페에서 책 한 권으로 하루가 충분히 채워져요",
        "여행 일정을 짜는 시간만으로도 한 주가 가벼워져요",
      ],
      lt(
        "마음을 채우는 즐거움이 넉넉한 기운이 있어요",
        "You have an abundance of simple pleasures that fill the heart.",
        "心を満たす楽しみに恵まれた運があります。"
      )
    ),
    부모궁: rule(
      "윗사람과 배움의 자리에서 도움을 받는 편",
      "positive",
      4,
      [
        "상사가 면담 때 알아서 좋은 프로젝트를 밀어줘요",
        "시험 준비 중에 선배가 정리 노트를 먼저 건네요",
      ],
      lt(
        "윗사람과 배움의 자리에서 도움을 받는 기운이에요",
        "Elders and teachers tend to give you a helping hand.",
        "目上の人や学びの場で助けを受ける運です。"
      )
    ),
  },
  화권: {
    명궁: rule(
      "앞에 서서 이끄는 힘이 강하지만 고집도 함께 있는 편",
      "mixed",
      5,
      [
        "아무도 총무를 정하지 않은 모임에서 어느새 내가 일정을 잡고 있어요",
        "회의에서 의견이 갈리면 내 안 쪽으로 정리가 돼요",
      ],
      lt(
        "타고난 성격에 앞에서 이끄는 힘이 실려 있어요",
        "Your nature carries a strong drive to take the lead.",
        "生まれつき、前に立って導く力が備わっています。"
      )
    ),
    형제궁: rule(
      "형제나 동료 사이에서 주도권을 쥐려는 편",
      "mixed",
      3,
      [
        "가족 행사의 날짜와 장소는 늘 내가 정해요",
        "동료와 의견이 부딪히면 둘 다 먼저 물러나지 않아요",
      ],
      lt(
        "형제나 동료 사이에서 주도권을 쥐는 기운이에요",
        "You tend to take charge among siblings and peers.",
        "兄弟や仲間の間で主導権を握る運です。"
      )
    ),
    부처궁: rule(
      "연애에서 한쪽이 강하게 이끄는 편",
      "mixed",
      5,
      [
        "데이트 코스와 메뉴를 한 사람이 거의 도맡아 정해요",
        "결혼을 준비하며 양가 조율을 누가 맡을지로 말이 오가요",
      ],
      lt(
        "연애 자리에 한쪽이 이끄는 힘이 강하게 실려 있어요",
        "One side tends to lead strongly in your relationships.",
        "恋愛の場で一方が強く引っ張る力が働いています。"
      )
    ),
    자녀궁: rule(
      "후배나 아이를 직접 이끌고 가르치려는 편",
      "mixed",
      3,
      [
        "후배에게 일을 알려 주다가 방식을 하나하나 고쳐 주게 돼요",
        "아이의 학원이나 학교를 내가 직접 비교해서 골라요",
      ],
      lt(
        "후배나 아이를 직접 이끌려는 기운이 있어요",
        "You tend to guide juniors and children hands-on.",
        "後輩や子どもを自ら導こうとする運があります。"
      )
    ),
    재백궁: rule(
      "돈을 직접 쥐고 굴려야 마음이 놓이는 편",
      "positive",
      5,
      [
        "공동으로 쓰는 돈은 내가 맡아야 마음이 놓여요",
        "동업 이야기가 나오면 지분과 최종 결정권부터 따져 봐요",
      ],
      lt(
        "돈을 보는 자리에 직접 쥐고 굴리려는 힘이 실려 있어요",
        "You want to hold and steer your money yourself.",
        "お金の面に、自分で握って動かそうとする力があります。"
      )
    ),
    질액궁: rule(
      "몸에 힘이 몰려 긴장이 쌓이기 쉬운 편",
      "mixed",
      3,
      [
        "마감 주간이면 어깨와 목이 먼저 뻐근해져요",
        "운동을 시작하면 강도를 계속 올려서 쉬는 날이 없어져요",
      ],
      lt(
        "몸에 힘이 몰려 긴장이 쌓이기 쉬운 기운이에요",
        "Tension tends to build up as your body holds strain.",
        "体に力が入り、緊張がたまりやすい運です。"
      )
    ),
    천이궁: rule(
      "밖에서 존재감이 커지는 편",
      "positive",
      4,
      [
        "낯선 모임에서도 어느새 분위기를 이끄는 사람이 돼요",
        "출장지에서 현장 판단을 내게 맡기는 일이 생겨요",
      ],
      lt(
        "밖에서 존재감이 커지는 기운이 실려 있어요",
        "Your presence grows stronger once you step outside.",
        "外で存在感が大きくなる運があります。"
      )
    ),
    교우궁: rule(
      "친구 사이에서 이끌거나 기 센 사람을 만나는 편",
      "mixed",
      3,
      [
        "친구 단톡방에서 약속 날짜는 늘 내가 확정해요",
        "기가 센 지인이 조언이라며 내 일에 자주 끼어들어요",
      ],
      lt(
        "친구 사이에서 이끌거나 센 사람을 만나는 기운이에요",
        "You either lead among friends or meet strong-willed ones.",
        "友人の間で引っ張るか、気の強い人と出会う運です。"
      )
    ),
    관록궁: rule(
      "일에서 권한과 책임이 함께 실리는 편",
      "positive",
      5,
      [
        "입사 몇 년 차에 작은 팀의 책임을 맡게 돼요",
        "프로젝트 방향이 갈릴 때 최종 선택이 내게 넘어와요",
      ],
      lt(
        "일하는 자리에 권한과 책임이 실리는 기운이에요",
        "Authority and responsibility gather around your work.",
        "仕事の場に権限と責任が乗る運です。"
      )
    ),
    전택궁: rule(
      "집안의 일을 내가 쥐고 정하려는 편",
      "mixed",
      3,
      [
        "이사나 인테리어를 가족 의견보다 내 취향으로 밀어붙여요",
        "집안 대소사의 일정을 내가 정리해야 직성이 풀려요",
      ],
      lt(
        "집안 일을 내가 쥐고 정하려는 기운이 있어요",
        "You tend to take charge of household matters.",
        "家のことを自分が握って決めようとする運です。"
      )
    ),
    복덕궁: rule(
      "쉬는 마음에도 승부욕이 실려 있는 편",
      "mixed",
      4,
      [
        "쉬는 날에도 취미 모임에서 순위를 따지고 있어요",
        "여행 일정에 빈 시간이 있으면 불안해서 일정을 채워 넣어요",
      ],
      lt(
        "쉬는 마음에도 승부욕이 실려 있는 기운이에요",
        "Even your leisure carries a competitive streak.",
        "休む心にも負けん気が乗っている運です。"
      )
    ),
    부모궁: rule(
      "부모나 윗사람의 영향력이 큰 편",
      "mixed",
      4,
      [
        "진로를 정할 때 부모님 의견이 크게 작용해요",
        "상사의 지시가 구체적이라 내 방식을 넣을 틈이 적어요",
      ],
      lt(
        "부모나 윗사람의 영향력이 큰 기운이에요",
        "Parents and superiors have a strong influence on you.",
        "親や目上の人の影響が大きい運です。"
      )
    ),
  },
  화과: {
    명궁: rule(
      "단정하고 믿음 가는 인상을 남기는 편",
      "positive",
      4,
      [
        "처음 만난 자리에서 말투와 옷차림이 깔끔하다는 인상을 받아요",
        "소개받은 사람이 이미 좋은 소문을 들었다고 말해요",
      ],
      lt(
        "단정하고 좋은 인상을 남기는 기운이 있어요",
        "You leave a neat, trustworthy first impression.",
        "端正で好印象を残す運があります。"
      )
    ),
    형제궁: rule(
      "형제나 동료와 예의 있게 지내는 편",
      "positive",
      3,
      [
        "형제자매와 큰 다툼 없이 명절마다 안부를 챙겨요",
        "동료가 내 일 처리를 믿고 맡겨요",
      ],
      lt(
        "형제나 동료와 예의 있게 지내는 기운이에요",
        "You get along courteously with siblings and peers.",
        "兄弟や仲間と礼儀正しく付き合える運です。"
      )
    ),
    부처궁: rule(
      "점잖고 단정한 인연이 닿는 편",
      "positive",
      4,
      [
        "지인 소개로 단정한 사람을 만나 천천히 가까워져요",
        "상대 부모님과의 첫 인사에서 좋은 인상을 남겨요",
      ],
      lt(
        "점잖고 단정한 인연이 닿는 기운이 있어요",
        "A gentle, well-mannered partner is likely to come your way.",
        "穏やかで端正な縁が結ばれる運があります。"
      )
    ),
    자녀궁: rule(
      "후배나 아이 덕에 칭찬받을 일이 생기는 편",
      "positive",
      3,
      [
        "후배가 내 조언을 메모하며 따라와요",
        "아이가 학교에서 칭찬받은 이야기를 신나게 들려줘요",
      ],
      lt(
        "후배나 아이에게 칭찬받을 일이 생기는 기운이에요",
        "Juniors or children bring you something to be proud of.",
        "後輩や子どものことで誇らしい出来事がある運です。"
      )
    ),
    재백궁: rule(
      "돈이 신용과 평판으로 이어지는 편",
      "positive",
      4,
      [
        "거래처가 대금 문제에서 나를 믿고 먼저 일을 맡겨요",
        "전문성을 인정받아 강의나 자문 요청이 들어와요",
      ],
      lt(
        "돈이 신용과 평판으로 이어지는 기운이 있어요",
        "Your money is tied to trust and reputation.",
        "お金が信用と評判につながる運があります。"
      )
    ),
    질액궁: rule(
      "몸을 미리 챙기면 큰 탈을 덜어내는 편",
      "positive",
      3,
      [
        "건강검진 날짜를 미리 잡고 결과지를 꼼꼼히 챙겨 봐요",
        "몸이 안 좋을 때 좋은 병원을 소개해 주는 사람이 곁에 있어요",
      ],
      lt(
        "몸을 미리 챙기면 큰 탈을 덜어내는 기운이에요",
        "Looking after your body early spares you bigger trouble.",
        "早めに体をケアすれば大事を避けやすい運です。"
      )
    ),
    천이궁: rule(
      "밖에서 평판이 먼저 알려지는 편",
      "positive",
      4,
      [
        "다른 도시 거래처에 가면 내 이름이 이미 알려져 있어요",
        "업계 행사에서 처음 보는 사람이 내 이름을 알아봐요",
      ],
      lt(
        "밖에서 평판이 먼저 알려지는 기운이 있어요",
        "Your reputation tends to travel ahead of you.",
        "外で評判が先に知られる運があります。"
      )
    ),
    교우궁: rule(
      "좋은 친구와 귀한 조언자가 곁에 오는 편",
      "positive",
      4,
      [
        "친구가 소개해 준 선배가 진로를 짚어 줘요",
        "곤란한 자리에서 점잖은 지인이 내 편을 들어줘요",
      ],
      lt(
        "좋은 친구와 귀한 조언자가 곁에 오는 기운이에요",
        "Good friends and trusted advisors come into your circle.",
        "良い友人や貴重な助言者が身近に現れる運です。"
      )
    ),
    관록궁: rule(
      "일에서 실력을 공식적으로 인정받는 편",
      "positive",
      5,
      [
        "자격 시험이나 심사를 좋은 점수로 통과해요",
        "발표가 끝나고 다른 부서에서 같이 해 보자는 연락이 와요",
      ],
      lt(
        "일에서 실력을 인정받는 기운이 실려 있어요",
        "Your skills tend to be formally recognized at work.",
        "仕事で実力を認められる運があります。"
      )
    ),
    전택궁: rule(
      "정돈된 집과 안정된 환경에 닿는 편",
      "positive",
      3,
      [
        "이사할 동네를 조용하고 깔끔한 곳으로 고르게 돼요",
        "집들이에서 집이 정돈돼 있다는 말을 들어요",
      ],
      lt(
        "정돈된 집과 안정된 환경에 닿는 기운이에요",
        "You tend to land in a tidy, settled living environment.",
        "整った家と安定した環境に恵まれる運です。"
      )
    ),
    복덕궁: rule(
      "교양과 취미로 마음이 차분해지는 편",
      "positive",
      4,
      [
        "전시나 공연을 본 뒤 혼자 감상을 정리하는 시간이 좋아요",
        "좋아하는 작가의 신간을 사 두고 주말에 읽어요",
      ],
      lt(
        "교양과 취미로 마음이 차분해지는 기운이에요",
        "Cultured hobbies bring you a calm, settled mind.",
        "教養や趣味で心が落ち着く運です。"
      )
    ),
    부모궁: rule(
      "학업과 서류에서 인정받는 편",
      "positive",
      4,
      [
        "서류 심사나 장학 선발에서 내 이름이 올라가요",
        "선생님이나 상사가 추천서를 흔쾌히 써 줘요",
      ],
      lt(
        "학업과 서류에서 인정받는 기운이 있어요",
        "Your studies and paperwork tend to earn recognition.",
        "学業や書類で認められる運があります。"
      )
    ),
  },
  화기: {
    명궁: rule(
      "마음속 걱정과 곱씹음이 많은 편",
      "negative",
      5,
      [
        "이미 끝난 대화를 밤에 다시 떠올리다 잠이 늦어져요",
        "조금 서운한 말 한마디가 며칠째 머릿속에 남아요",
      ],
      lt(
        "마음에 걱정이 자꾸 맴도는 기운이 실려 있어요",
        "Your mind tends to circle back to worries.",
        "心に心配事が何度も巡りやすい運です。"
      )
    ),
    형제궁: rule(
      "형제나 동료와 서운함이 쌓이기 쉬운 편",
      "negative",
      4,
      [
        "형제자매와 돈이나 부모님 부양 문제로 말이 어긋나요",
        "옆자리 동료와 업무 분담을 두고 서로 서운해해요",
      ],
      lt(
        "형제나 동료와 서운함이 쌓이기 쉬운 기운이에요",
        "Resentment can build up with siblings or peers.",
        "兄弟や仲間とわだかまりがたまりやすい運です。"
      )
    ),
    부처궁: rule(
      "연애에서 어긋남과 집착이 걸리는 편",
      "negative",
      5,
      [
        "연락 답이 늦어지면 마음이 앞서 질문을 쏟아내요",
        "사소한 말투로 다툰 뒤 서로 사과할 때를 놓쳐요",
      ],
      lt(
        "연애 자리에 어긋남과 집착이 걸려 있어요",
        "Mismatch and clinging tend to snag your love life.",
        "恋愛の場にすれ違いと執着が絡みやすい運です。"
      )
    ),
    자녀궁: rule(
      "후배나 아이 일로 마음이 쓰이는 편",
      "negative",
      4,
      [
        "후배에게 맡긴 일이 어긋나 내가 대신 수습해요",
        "아이의 학교나 진로 문제로 마음이 무거워요",
      ],
      lt(
        "후배나 아이 일로 마음이 쓰이는 기운이에요",
        "Juniors or children can weigh on your mind.",
        "後輩や子どものことで気を揉みやすい運です。"
      )
    ),
    재백궁: rule(
      "돈에 막힘과 걱정이 걸리는 편",
      "negative",
      5,
      [
        "월말 카드 알림을 보고 어디에 썼는지 다시 떠올려 봐요",
        "지인에게 빌려준 돈 이야기를 꺼내기가 어려워요",
      ],
      lt(
        "돈을 보는 자리에 막힘과 걱정이 걸려 있어요",
        "Blockages and worry tend to attach to money matters.",
        "お金の面に滞りと心配が絡んでいます。"
      )
    ),
    질액궁: rule(
      "몸의 신호에 신경이 자주 쏠리는 편",
      "negative",
      4,
      [
        "야근이 이어진 주에 소화나 두통 신호가 먼저 와요",
        "검진 결과지의 수치 하나가 계속 마음에 남아요",
      ],
      lt(
        "몸의 신호에 신경이 자주 쏠리는 기운이에요",
        "Your attention keeps snagging on signals from your body.",
        "体のサインに意識が向きやすい運です。"
      )
    ),
    천이궁: rule(
      "밖에서 변수와 불편이 생기기 쉬운 편",
      "negative",
      4,
      [
        "출장길에 일정이 틀어져 숙소를 급히 바꿔요",
        "낯선 모임에서 말이 겉돌아 일찍 자리를 떠요",
      ],
      lt(
        "밖에서 변수와 불편이 생기기 쉬운 기운이에요",
        "Unexpected snags are more likely when you are out and about.",
        "外で予想外の支障が出やすい運です。"
      )
    ),
    교우궁: rule(
      "친구 사이에 오해가 생기기 쉬운 편",
      "negative",
      4,
      [
        "친구 부탁을 도와주고도 서운하다는 소리를 들어요",
        "단톡방 말 한마디가 오해로 번져 모임이 어색해져요",
      ],
      lt(
        "친구 사이에 오해가 생기기 쉬운 기운이에요",
        "Misunderstandings come easily among friends.",
        "友人との間に誤解が生じやすい運です。"
      )
    ),
    관록궁: rule(
      "일하는 자리에 막힘이 걸리는 편",
      "negative",
      5,
      [
        "평가 시즌에 기대와 다른 결과를 받아 들어요",
        "맡은 프로젝트 방향이 중간에 바뀌어 처음부터 다시 해요",
      ],
      lt(
        "일하는 자리에 막힘이 걸려 있는 기운이에요",
        "Obstacles tend to catch you in your work life.",
        "仕事の場に滞りが絡んでいる運です。"
      )
    ),
    전택궁: rule(
      "집과 계약 일에 변수가 걸리는 편",
      "negative",
      4,
      [
        "이사 직전에 계약 조건이 바뀌어 일정이 꼬여요",
        "집 수리 비용이 견적보다 더 들어요",
      ],
      lt(
        "집과 계약 일에 변수가 걸려 있는 기운이에요",
        "Surprises tend to arise around housing and contracts.",
        "家や契約ごとに変数が絡みやすい運です。"
      )
    ),
    복덕궁: rule(
      "쉬어도 마음이 편치 않은 편",
      "negative",
      5,
      [
        "쉬는 날 소파에 누워서도 해야 할 일 목록이 떠올라요",
        "여행 중에도 회사 메시지를 확인하느라 마음이 편치 않아요",
      ],
      lt(
        "쉬어도 마음이 편치 않은 기운이 걸려 있어요",
        "Even when resting, your mind finds it hard to settle.",
        "休んでも心が落ち着かない運が絡んでいます。"
      )
    ),
    부모궁: rule(
      "윗사람이나 서류 일에 마찰이 걸리는 편",
      "negative",
      4,
      [
        "상사의 지적이 잦아 보고할 때마다 몸이 긴장돼요",
        "신청 서류의 사소한 오류로 한 번 더 제출해요",
      ],
      lt(
        "윗사람이나 서류 일에 마찰이 걸려 있는 기운이에요",
        "Friction tends to arise with superiors and paperwork.",
        "目上の人や書類ごとに摩擦が生じやすい運です。"
      )
    ),
  },
};
