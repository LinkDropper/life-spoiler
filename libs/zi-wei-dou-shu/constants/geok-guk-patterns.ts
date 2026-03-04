/**
 * 격국(格局) 패턴 정의
 *
 * 격국은 특정 별들이 특정 궁에서 만날 때 형성되는 특별한 조합 패턴.
 * AI가 해석할 때 참고할 수 있도록 이름, 의미, 등급을 포함.
 */

export interface GeokGukPattern {
  /** 격국 이름 */
  name: string;
  /** 격국 유형: "동궁" = 같은 궁에 있어야 함, "삼방" = 삼방사정에 있으면 됨 */
  type: "동궁" | "삼방";
  /** 필요한 주성 목록 (모두 포함해야 함) */
  requiredMainStars: string[];
  /** 필요한 보조성 목록 (모두 포함해야 함, 하나라도 있으면 매칭) */
  requiredMinorStars?: string[];
  /** 밝기 조건: 지정된 별이 특정 밝기 이상이어야 함 */
  brightnessCondition?: {
    star: string;
    minBrightness: "묘" | "왕" | "득" | "리";
  };
  /** 격국 의미 (AI 해석용) */
  meaning: string;
  /** 격국 등급 */
  grade: "대격" | "중격" | "소격";
}

/**
 * 주요 격국 패턴 (~15개)
 */
export const GEOK_GUK_PATTERNS: GeokGukPattern[] = [
  // ============================================================
  // 동궁 기반 격국
  // ============================================================
  {
    name: "자부동궁",
    type: "동궁",
    requiredMainStars: ["자미", "천부"],
    meaning:
      "리더십과 안정의 기운이 합쳐져 자연스러운 존재감과 관리 능력을 갖춤. 조직에서 높은 자리에 오르기 쉬움",
    grade: "대격",
  },
  {
    name: "자탐동궁",
    type: "동궁",
    requiredMainStars: ["자미", "탐랑"],
    meaning:
      "높은 이상과 강한 욕구가 공존. 화려하고 매력적이지만, 목표와 욕구 사이에서 갈등할 수 있음",
    grade: "중격",
  },
  {
    name: "기월동궁",
    type: "동궁",
    requiredMainStars: ["천기", "태음"],
    meaning:
      "섬세한 분석력과 풍부한 감성이 결합. 계획적이면서도 감정이 풍부하여 예술/학문 분야에서 뛰어남",
    grade: "대격",
  },
  {
    name: "기량동궁",
    type: "동궁",
    requiredMainStars: ["천기", "천량"],
    meaning:
      "분석력과 지혜가 합쳐져 뛰어난 판단력을 가짐. 어른스럽고 해결력이 뛰어나지만 걱정이 많을 수 있음",
    grade: "중격",
  },
  {
    name: "일월동궁",
    type: "동궁",
    requiredMainStars: ["태양", "태음"],
    meaning:
      "적극성과 섬세함이 함께 있어 표현력과 감수성이 모두 뛰어남. 공과 사를 균형 있게 처리",
    grade: "대격",
  },
  {
    name: "무탐동궁",
    type: "동궁",
    requiredMainStars: ["무곡", "탐랑"],
    meaning:
      "실행력과 욕구가 결합. 목표를 향해 강하게 밀어붙이는 힘이 있으나, 방향을 잘 잡아야 함",
    grade: "중격",
  },
  {
    name: "염탐동궁",
    type: "동궁",
    requiredMainStars: ["염정", "탐랑"],
    meaning:
      "열정과 욕구가 폭발적으로 결합. 매력이 넘치고 다재다능하나 충동적 선택을 주의해야 함",
    grade: "중격",
  },
  {
    name: "무부동궁",
    type: "동궁",
    requiredMainStars: ["무곡", "천부"],
    meaning:
      "현실감각과 안정감이 합쳐져 재물을 다루는 능력이 탁월. 안정적이면서도 실행력이 뛰어남",
    grade: "대격",
  },
  {
    name: "무상동궁",
    type: "동궁",
    requiredMainStars: ["무곡", "천상"],
    meaning:
      "실행력과 협력의 기운이 결합. 조직 내에서 실무적 성과를 내는 데 뛰어남",
    grade: "소격",
  },
  {
    name: "염파동궁",
    type: "동궁",
    requiredMainStars: ["염정", "파군"],
    meaning:
      "열정과 변화의 기운이 폭발적으로 결합. 파괴와 재건의 에너지가 강하며, 기복이 큼",
    grade: "중격",
  },
  {
    name: "자살동궁",
    type: "동궁",
    requiredMainStars: ["자미", "칠살"],
    meaning:
      "리더십과 결단력이 합쳐져 강력한 추진력을 가짐. 개척정신이 강하나 독단적일 수 있음",
    grade: "대격",
  },
  {
    name: "무살동궁",
    type: "동궁",
    requiredMainStars: ["무곡", "칠살"],
    meaning:
      "실행력과 결단력이 결합. 목표를 위해 과감하게 행동하며 재물과 권력을 동시에 추구",
    grade: "중격",
  },
  {
    name: "일거동궁",
    type: "동궁",
    requiredMainStars: ["태양", "거문"],
    meaning:
      "표현력과 분석력이 결합. 말과 글로 사람을 설득하는 능력이 뛰어남. 교육/방송/법률 분야에 적합",
    grade: "중격",
  },

  // ============================================================
  // 보조성 조건 동궁 격국
  // ============================================================
  {
    name: "자미재상격",
    type: "동궁",
    requiredMainStars: ["자미"],
    requiredMinorStars: ["좌보", "우필"],
    meaning:
      "자미에 좌보·우필이 함께하여 보좌를 받는 격. 리더십이 빛을 발하며 조직에서 높은 직위에 오를 상",
    grade: "대격",
  },
  {
    name: "부성조원격",
    type: "동궁",
    requiredMainStars: ["천부"],
    requiredMinorStars: ["좌보", "우필"],
    meaning:
      "천부에 좌보·우필이 보좌하여 재물과 관리 능력이 극대화되는 격. 안정적 부와 높은 사회적 지위를 얻음",
    grade: "대격",
  },
  {
    name: "화탐격",
    type: "동궁",
    requiredMainStars: ["탐랑"],
    requiredMinorStars: ["화성"],
    meaning:
      "탐랑과 화성이 동궁하여 폭발적 행동력과 야망이 결합. 기복이 크지만 대성할 수 있는 격",
    grade: "중격",
  },
  {
    name: "영탐격",
    type: "동궁",
    requiredMainStars: ["탐랑"],
    requiredMinorStars: ["영성"],
    meaning:
      "탐랑과 영성이 동궁하여 재빠른 판단력과 강한 욕구가 결합. 돌발적 기회를 잡는 능력이 뛰어남",
    grade: "중격",
  },
  {
    name: "쌍록격",
    type: "동궁",
    requiredMainStars: [],
    requiredMinorStars: ["록존"],
    brightnessCondition: { star: "록존", minBrightness: "묘" },
    meaning:
      "록존과 화록이 같은 궁에서 만나 재물운이 극대화되는 격. 안정적이면서도 큰 재물을 축적할 수 있음",
    grade: "대격",
  },

  // ============================================================
  // 삼방 기반 격국
  // ============================================================
  {
    name: "살파탐",
    type: "삼방",
    requiredMainStars: ["칠살", "파군", "탐랑"],
    meaning:
      "결단, 변화, 욕구의 기운이 삼방에서 만남. 인생의 굴곡이 크지만 성공하면 크게 성취하는 구조",
    grade: "대격",
  },
  {
    name: "기일동량",
    type: "삼방",
    requiredMainStars: ["천기", "태양", "천동", "천량"],
    meaning:
      "지성, 표현, 편안함, 지혜가 삼방에서 연결. 학문과 조력의 재능이 뛰어남",
    grade: "중격",
  },
];
