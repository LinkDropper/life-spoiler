import type { MinorStarTable } from "./types";

/**
 * 보조성(보좌성·살성 등).
 * group: helper(길성·받쳐줌) / challenger(살성·거칢) / mobile(이동·변화)
 * keyword: 통합 해석 문장에 끼워 쓰는 짧은 명사구
 * note: 참고용 단독 설명 (패널 본문에는 직접 노출하지 않음)
 */
export const MINOR_STAR_INFO: MinorStarTable = {
  좌보: {
    group: "helper",
    keyword: {
      ko: "곁에서 돕는 귀인",
      en: "a helpful benefactor",
      ja: "そばで助ける貴人",
    },
    note: {
      ko: "곁에서 받쳐주는 귀인의 기운이 더해져요. 사람 덕을 보기 좋아요.",
      en: "A helpful benefactor energy backs you up here, making support from others easier to receive.",
      ja: "そばで支えてくれる貴人の気運が加わります。人の助けを得やすいです。",
    },
  },
  우필: {
    group: "helper",
    keyword: {
      ko: "받쳐주는 조력",
      en: "steady support",
      ja: "支えとなる助け",
    },
    note: {
      ko: "보이지 않게 도와주는 조력의 기운이 함께해요. 결정적일 때 손을 내밀어 줘요.",
      en: "A quiet, behind-the-scenes helping energy is with you, lending a hand at crucial moments.",
      ja: "見えないところで助けてくれる力が共にあります。肝心なときに手を差し伸べてくれます。",
    },
  },
  문창: {
    group: "helper",
    keyword: {
      ko: "학문·문서운",
      en: "a gift for study and writing",
      ja: "学問・文書運",
    },
    note: {
      ko: "글·공부·문서 운의 기운이 더해져요. 배우고 정리해 표현하는 데 강해요.",
      en: "An energy for writing, study, and documents is added — strong for learning and articulate output.",
      ja: "文章・勉強・書類運の気運が加わります。学び、整理して表現するのが得意です。",
    },
  },
  문곡: {
    group: "helper",
    keyword: {
      ko: "예술·재주",
      en: "art and talent",
      ja: "芸術・才能",
    },
    note: {
      ko: "예술·말솜씨·재주의 기운이 더해져요. 감각적으로 풀어내는 힘이 있어요.",
      en: "An energy for art, eloquence, and talent is added, with a knack for expressing things with flair.",
      ja: "芸術・話術・才能の気運が加わります。感覚的に表現する力があります。",
    },
  },
  천괴: {
    group: "helper",
    keyword: {
      ko: "윗사람의 도움",
      en: "help from elders",
      ja: "目上の助け",
    },
    note: {
      ko: "낮의 귀인, 윗사람의 도움이 오는 기운이에요. 든든한 손길을 만나기 좋아요.",
      en: "A daytime benefactor energy — help from elders or seniors tends to come your way.",
      ja: "昼の貴人、目上の人の助けが来る気運です。頼もしい支えに出会いやすいです。",
    },
  },
  천월: {
    group: "helper",
    keyword: {
      ko: "귀인의 손길",
      en: "a benefactor's hand",
      ja: "貴人の手助け",
    },
    note: {
      ko: "밤의 귀인, 결정적 순간에 손 내밀어 주는 기운이에요. 위기에 도움이 닿아요.",
      en: "A nighttime benefactor energy that reaches out at the decisive moment, with help arriving in a pinch.",
      ja: "夜の貴人、肝心な瞬間に手を差し伸べる気運です。ピンチに助けが届きます。",
    },
  },
  록존: {
    group: "helper",
    keyword: {
      ko: "꾸준한 재물운",
      en: "steady income",
      ja: "堅実な財運",
    },
    note: {
      ko: "꾸준한 수입과 안정의 기운이 더해져요. 알뜰하게 지키는 힘이 있어요.",
      en: "An energy of steady income and stability is added, with a thrifty knack for holding on to what you have.",
      ja: "安定した収入と堅実さの気運が加わります。こつこつ守る力があります。",
    },
  },
  화성: {
    group: "challenger",
    keyword: {
      ko: "급한 충동",
      en: "hasty impulse",
      ja: "せっかちな衝動",
    },
    note: {
      ko: "급하고 폭발적인 기운이 끼어요. 추진력은 세지만 욱하지 않게 신경 쓰면 좋아요.",
      en: "A sudden, explosive energy mixes in — strong drive, but it helps to watch for flashes of temper.",
      ja: "急で爆発的な気運が混じります。推進力は強いですが、カッとなりすぎないよう気を配ると良いです。",
    },
  },
  영성: {
    group: "challenger",
    keyword: {
      ko: "속 타는 조급함",
      en: "smoldering impatience",
      ja: "内に燃える焦り",
    },
    note: {
      ko: "속으로 타오르는 조급함의 기운이에요. 예민해질 수 있으니 한 박자 쉬어가면 좋아요.",
      en: "A smoldering, impatient energy — you can grow edgy, so it helps to pause for a beat.",
      ja: "内で燃えるような焦りの気運です。神経質になりやすいので、一拍置くと良いです。",
    },
  },
  양인: {
    group: "challenger",
    keyword: {
      ko: "날선 마찰",
      en: "sharp friction",
      ja: "鋭い摩擦",
    },
    note: {
      ko: "날카로운 추진력이자 마찰의 기운이에요. 과하면 부딪힘이 생기니 힘 조절이 필요해요.",
      en: "A sharp, driving energy that can also rub — overdone, it brings friction, so pacing your force matters.",
      ja: "鋭い推進力であり摩擦の気運です。過ぎるとぶつかりが生じるので、力加減が必要です。",
    },
  },
  타라: {
    group: "challenger",
    keyword: {
      ko: "자꾸 늘어지는 지연",
      en: "nagging delay",
      ja: "ずるずる続く遅れ",
    },
    note: {
      ko: "일이 더디게 꼬이는 지연의 기운이에요. 조급해 말고 끈기로 풀면 넘어가요.",
      en: "An energy of slow tangles and delay — rather than rushing, steady persistence sees it through.",
      ja: "物事が遅れてもつれる停滞の気運です。焦らず根気で解けば乗り越えられます。",
    },
  },
  지겁: {
    group: "challenger",
    keyword: {
      ko: "예상 밖 손실",
      en: "unexpected loss",
      ja: "予想外の損失",
    },
    note: {
      ko: "예상 밖 손실·변동의 기운이에요. 욕심을 내면 새기 쉬우니 한 발 물러서면 좋아요.",
      en: "An energy of unexpected loss and swings — greed tends to leak it away, so a step back helps.",
      ja: "予想外の損失・変動の気運です。欲を出すと漏れやすいので、一歩引くと良いです。",
    },
  },
  지공: {
    group: "challenger",
    keyword: {
      ko: "헛수고·공허",
      en: "wasted effort",
      ja: "無駄・空回り",
    },
    note: {
      ko: "비우고 흩어지는 공허의 기운이에요. 헛수고는 줄이되, 비움의 지혜로 바꿀 수 있어요.",
      en: "An energy of emptying and scattering — cut down on wasted effort, and it can turn into the wisdom of letting go.",
      ja: "空にして散らす虚しさの気運です。無駄を減らしつつ、手放す知恵に変えられます。",
    },
  },
  천마: {
    group: "mobile",
    keyword: {
      ko: "이동·변화",
      en: "movement and change",
      ja: "移動と変化",
    },
    note: {
      ko: "이동과 변화의 기운이 더해져요. 가만히 있기보다 움직일수록 기회가 생겨요.",
      en: "An energy of movement and change is added — opportunities come from moving rather than staying put.",
      ja: "移動と変化の気運が加わります。じっとするより動くほどチャンスが生まれます。",
    },
  },
  홍란: {
    group: "helper",
    keyword: {
      ko: "설레는 인연",
      en: "a romantic connection",
      ja: "ときめく縁",
    },
    note: {
      ko: "인연과 설렘의 기운이 더해져요. 마음이 두근거리는 일이 찾아오기 좋아요.",
      en: "An energy of romance and flutter is added, making heart-stirring encounters more likely.",
      ja: "縁とときめきの気運が加わります。胸が高鳴る出来事が訪れやすいです。",
    },
  },
  천희: {
    group: "helper",
    keyword: {
      ko: "기쁜 소식",
      en: "happy news",
      ja: "嬉しい知らせ",
    },
    note: {
      ko: "기쁨과 경사의 기운이 더해져요. 반가운 소식이나 새 인연이 따라오기 좋아요.",
      en: "An energy of joy and happy occasions is added, drawing welcome news or new connections.",
      ja: "喜びと慶事の気運が加わります。嬉しい知らせや新しい縁が付いてきやすいです。",
    },
  },
};
