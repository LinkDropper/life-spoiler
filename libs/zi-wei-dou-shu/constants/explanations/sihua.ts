import type { SihuaTable } from "./types";

/**
 * 사화(四化) 마커별 뉘앙스.
 * 특정 별에 추가로 실리는 기운으로, 그 영역이 어떻게 물드는지를 말한다.
 * 사화 용어 자체는 화면에 마커로만 노출되고, 본문은 일반어로 푼다.
 */
export const SIHUA_INFO: SihuaTable = {
  화록: {
    phrase: {
      ko: "여기에 풍요와 기회의 힘이 더해져 있어요. 이 영역이 잘 풀릴 가능성이 커요.",
      en: "An extra touch of abundance and opportunity is added here, so this area has good odds of flowing well.",
      ja: "ここに豊かさとチャンスの力が加わっています。この領域がうまく運ぶ可能性が高いです。",
    },
  },
  화권: {
    phrase: {
      ko: "여기에 주도권과 추진력이 실려 있어요. 직접 끌고 나갈 힘이 생겨요.",
      en: "Initiative and driving force are loaded here, giving you the power to lead it yourself.",
      ja: "ここに主導権と推進力が乗っています。自ら引っ張っていく力が生まれます。",
    },
  },
  화과: {
    phrase: {
      ko: "여기에 인정과 평판의 기운이 더해져요. 드러나고 알려지기 좋은 자리예요.",
      en: "An air of recognition and reputation is added here — a good spot to be seen and known.",
      ja: "ここに評価と評判の気運が加わります。表に出て知られやすい位置です。",
    },
  },
  화기: {
    phrase: {
      ko: "여기엔 긴장과 집착의 기운이 끼어 있어요. 이 영역에선 한 박자 신중하면 좋아요.",
      en: "A note of tension and attachment is mixed in here, so it helps to take this area a beat more carefully.",
      ja: "ここには緊張と執着の気運が混じっています。この領域では一拍慎重になると良いです。",
    },
  },
};
