import type { BrightnessTable } from "./types";

/**
 * 밝기(亮度)별 뉘앙스.
 * 같은 기운이라도 밝을수록 강하고 긍정적으로, 어두울수록 약하거나
 * 불안정하게 발현된다. 주성에 붙는 밝기를 일반어로 풀어 설명한다.
 */
export const BRIGHTNESS_INFO: BrightnessTable = {
  묘: {
    phrase: {
      ko: "이 기운이 가장 환하게 빛나는 자리예요. 좋은 면이 또렷하게 드러나요.",
      en: "This energy shines at its brightest here, so its best side stands out clearly.",
      ja: "この気運が最も明るく輝く位置です。良い面がはっきりと表れます。",
    },
  },
  왕: {
    phrase: {
      ko: "기운이 힘차게 살아 있어요. 장점이 시원하게 발휘되는 편이에요.",
      en: "The energy is vigorously alive, so its strengths come through with ease.",
      ja: "気運が力強く生きています。長所がのびのびと発揮されやすいです。",
    },
  },
  득: {
    phrase: {
      ko: "기운이 안정적으로 자리 잡았어요. 무리 없이 제 역할을 해줘요.",
      en: "The energy is settled and stable, doing its job without strain.",
      ja: "気運が安定して根づいています。無理なく役割を果たしてくれます。",
    },
  },
  리: {
    phrase: {
      ko: "기운이 보통 수준이에요. 분명히 있지만 강하게 밀어붙이진 않아요.",
      en: "The energy is moderate — clearly present, but it doesn't push hard.",
      ja: "気運は普通の水準です。確かにありますが、強く押し出しはしません。",
    },
  },
  평: {
    phrase: {
      ko: "기운이 다소 약하게 작용해요. 컨디션에 따라 들쭉날쭉할 수 있어요.",
      en: "The energy works somewhat weakly here and can be uneven depending on the day.",
      ja: "気運がやや弱く働きます。コンディション次第でムラが出ることがあります。",
    },
  },
  함: {
    phrase: {
      ko: "기운이 가장 약해지는 자리예요. 자칫 단점 쪽으로 기울 수 있어 신경 쓰면 좋아요.",
      en: "The energy is at its weakest here and can tilt toward its downside, so it's worth tending to.",
      ja: "気運が最も弱まる位置です。短所の方に傾きやすいので、気を配ると良いです。",
    },
  },
};
