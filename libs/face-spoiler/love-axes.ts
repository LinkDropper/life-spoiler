import type { FaceMetrics } from "./face-shape-analyzer";

/**
 * 연애운 전용 결정적 축 산출기.
 *
 * 배경 (Phase 22 / 2026-04-27):
 *  Stage C 연애 섹션이 인물별 차별화에 실패하는 근본 원인은
 *  (1) 프롬프트에 문학적 예시문이 박혀 있고,
 *  (2) 부위별 hint가 일반 인상 어휘만 담아 LLM에게 연애 맥락 anchor가 0개,
 *  (3) "양극 축 중 1개를 명확히"라는 가이드가 LLM 판단에 위임돼 동질화.
 *
 *  이 모듈은 (2)·(3)을 데이터 측에서 해결한다. 같은 측정값 → 같은 라벨 →
 *  재시도 시에도 안정. 다른 얼굴 → 다른 라벨 조합 (3축 × 3값 = 27가지).
 *
 * 라벨은 본문에 그대로 노출돼도 무방한 일상 한국어. rationale은 LLM이
 * 본문 서사를 풀 때 참고하는 짧은 방향 지시문이며, 본문에 그대로 옮겨
 * 적지 않도록 프롬프트가 안내한다.
 */

export type ApproachLabel = "능동형" | "수동형" | "혼합형";
export type SignalLabel = "직진형" | "밀당형" | "즉흥형";
export type RhythmLabel = "단기 임팩트형" | "장기 신뢰형" | "계절 변동형";

export interface LoveAxisValue<T extends string> {
  label: T;
  /**
   * LLM 본문 서사를 풀 때 참고할 관찰 근거.
   * 단문 형태로, 어떤 부위 신호가 라벨로 이어졌는지 + 본문에서 어떤 결을
   * 그릴지 방향만 잡아준다. 본문에 그대로 복사하면 안 됨.
   */
  rationale: string;
  /**
   * Phase 22.1 (2026-04-27) — strengths/cautions 방향 지시.
   *
   * `strengths`·`cautions`가 Phase 22에서 anchor를 못 받아 두 인물이 같은
   * 한국 운세 기본 템플릿("배려·진솔·꾸준한 신뢰" / "무덤덤·답답") 으로 수렴하던
   * 문제 해결. 라벨별로 *어느 방향의 강점/주의점*인지 카테고리로만 지정해
   * LLM이 부위 관찰과 결합해 인물별 12~25자 문장으로 변주하게 한다.
   *
   * 카테고리 어휘는 추상적이라 그대로 옮겨도 본문이 같아지지 않으며, 라벨이
   * 사람마다 다르게 결정되므로 자연히 분화됨.
   */
  strengthDirection: string;
  cautionDirection: string;
  /** 코드 결정 점수 — 디버그/관측용. 프롬프트에는 들어가지 않음. */
  score: number;
}

export interface LoveAxes {
  /** 관계에서 먼저 다가가는 쪽인지, 다가오게 만드는 쪽인지. */
  approach: LoveAxisValue<ApproachLabel>;
  /** 호감 표시 방식 — 직선적인지, 흐트러뜨려 보내는지. */
  signal: LoveAxisValue<SignalLabel>;
  /** 관계가 펼쳐지는 시간 리듬 — 첫인상 임팩트형인지, 오래 봐야 진가가 드러나는지. */
  rhythm: LoveAxisValue<RhythmLabel>;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const APPROACH_THRESHOLD = 0.45;
const RESTRAINT_THRESHOLD_HIGH = 0.5;
const RESTRAINT_THRESHOLD_LOW = -0.4;
const RHYTHM_THRESHOLD_HIGH = 0.3;
const RHYTHM_THRESHOLD_LOW = -0.4;

export const deriveLoveAxes = (m: FaceMetrics): LoveAxes => {
  // ──────────────────────────────────────────────────────
  // 추진성 축 — 외향 표현 강도
  // ──────────────────────────────────────────────────────
  // 눈꼬리 들림 (양수 = 올라감), 턱 각도 (높을수록 각짐), 입 폭 (외향 표현)
  // 세 신호가 같은 방향이면 능동/수동 라벨이 또렷하게 갈림.
  const approachScore =
    m.eyeCornerAngle / 12 +
    (m.jawAngularity - 0.4) * 1.4 +
    (m.mouthWidthRatio - 0.4) * 6;

  const approach: LoveAxisValue<ApproachLabel> =
    approachScore > APPROACH_THRESHOLD
      ? {
          label: "능동형",
          rationale:
            "눈꼬리 들림·턱선 각도·입매 폭이 모두 바깥으로 향하는 결. 본문은 '관심을 먼저 표현하는 쪽'이 이 사람에게서 어떻게 드러나는지 그릴 것.",
          strengthDirection:
            "먼저 다가가는 추진력 / 호감 신호의 명료함 / 관계를 이끄는 주도성 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
          cautionDirection:
            "진도가 빠르게 느껴질 수 있음 / 적극성이 부담으로 비칠 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
          score: round2(approachScore),
        }
      : approachScore < -APPROACH_THRESHOLD
        ? {
            label: "수동형",
            rationale:
              "눈꼬리·턱선·입매가 안쪽으로 마무리되는 결. 본문은 '먼저 다가가기보다 곁에 있게 만드는 쪽'의 끌림을 풀 것.",
            strengthDirection:
              "다가오게 만드는 끌림 / 곁에 머물게 하는 안정감 / 무리 없는 거리감 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "마음을 먼저 드러내지 않아 의중이 흐릴 수 있음 / 시작이 늦어질 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(approachScore),
          }
        : {
            label: "혼합형",
            rationale:
              "외향 신호와 안쪽 마무리가 비등해 상황·상대에 따라 결이 바뀌는 쪽. 본문은 '어떤 순간엔 먼저, 어떤 순간엔 한 발 뒤'의 양면을 짧게 대비시킬 것.",
            strengthDirection:
              "상황에 따라 결을 바꾸는 유연성 / 상대 결에 맞추는 적응력 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "신호가 엇갈려 보일 수 있음 / 일관된 결을 잡기 전 시간이 필요함 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(approachScore),
          };

  // ──────────────────────────────────────────────────────
  // 신호 방식 축 — 표현 절제도
  // ──────────────────────────────────────────────────────
  // 인중 길이(감정 통제), 눈 가로세로비(절제된 표현), 코 길이(신중) 합산.
  // restraintScore가 높을수록 신호를 모아두는 밀당형, 낮을수록 즉시 내보내는 직진형.
  const philtrumDeviation = m.philtrumRatio - 0.34;
  const eyeNarrowness = m.eyeAspectRatio - 3.6;
  const noseLengthDeviation = m.noseLengthRatio - 0.28;
  const restraintScore =
    philtrumDeviation * 8 + eyeNarrowness * 0.6 + noseLengthDeviation * 5;

  const signal: LoveAxisValue<SignalLabel> =
    restraintScore > RESTRAINT_THRESHOLD_HIGH
      ? {
          label: "밀당형",
          rationale:
            "인중·코의 세로선이 길게 떨어지고 눈매도 길게 다듬어진 절제의 결. 본문은 '신호를 모았다가 한 박자 늦게 보내는 방식'을 풀 것.",
          strengthDirection:
            "여운으로 끌어당기는 결 / 신호를 모아두는 절제 / 호기심을 키우는 거리감 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
          cautionDirection:
            "의도가 흐려 오해를 살 수 있음 / 표현이 늦다고 오해받을 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
          score: round2(restraintScore),
        }
      : restraintScore < RESTRAINT_THRESHOLD_LOW
        ? {
            label: "직진형",
            rationale:
              "인중이 짧고 눈매가 열려 있어 감정이 즉각 표면으로 올라오는 결. 본문은 '느낀 대로 곧장 표현하는 방식'을 풀 것.",
            strengthDirection:
              "감정을 즉시 표현하는 솔직함 / 신호의 명료함 / 의도가 분명한 화법 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "표현이 너무 강하게 느껴질 수 있음 / 여백이 부족해 보일 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(restraintScore),
          }
        : {
            label: "즉흥형",
            rationale:
              "인중·눈·코 비율이 평균대에 가깝게 모여 있어 정해진 공식 없이 그때그때 신호가 달라지는 결. 본문은 '일관된 패턴이 없는, 그 순간의 결을 따르는 표현'을 풀 것.",
            strengthDirection:
              "그 순간의 진심을 살리는 자연스러움 / 정형 패턴에 매이지 않는 결 / 즉각 반응하는 친밀감 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "일관성이 부족해 보일 수 있음 / 신호의 결이 자주 바뀔 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(restraintScore),
          };

  // ──────────────────────────────────────────────────────
  // 리듬 축 — 첫인상 임팩트 vs 시간이 만드는 신뢰
  // ──────────────────────────────────────────────────────
  const impactScore =
    Math.abs(m.eyeCornerAngle) / 10 +
    m.jawAngularity * 0.8 +
    Math.max(0, m.samjeong.middle - 0.34) * 8;
  const balanceScore =
    1 -
    Math.abs(m.samjeong.upper - 0.33) * 6 +
    (1 - m.jawAngularity) * 0.9 +
    (1 - Math.abs(m.faceRatio - 1.05) * 1.5);
  const rhythmDelta = impactScore - balanceScore * 0.55;

  const rhythm: LoveAxisValue<RhythmLabel> =
    rhythmDelta > RHYTHM_THRESHOLD_HIGH
      ? {
          label: "단기 임팩트형",
          rationale:
            "윤곽 대비(눈꼬리 강도·턱 각·중안)가 또렷한 결. 본문은 '첫 만남에서 강하게 남는 인상이 관계 초반의 결을 끌고 가는 방식'을 풀 것.",
          strengthDirection:
            "첫 만남에서 강하게 남는 인상 / 관계 초반의 추진력 / 시선을 끄는 결 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
          cautionDirection:
            "시간이 지나며 처음의 임팩트가 익숙해질 수 있음 / 강한 첫인상이 부담될 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
          score: round2(rhythmDelta),
        }
      : rhythmDelta < RHYTHM_THRESHOLD_LOW
        ? {
            label: "장기 신뢰형",
            rationale:
              "삼정 비율과 윤곽 마무리가 고르게 잡힌 결. 본문은 '시간이 흘러도 결이 흐트러지지 않아 천천히 신뢰가 쌓이는 방식'을 풀 것.",
            strengthDirection:
              "오래 봐도 흐트러지지 않는 결 / 시간이 만드는 신뢰 / 안정된 무게감 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "첫 만남에서 임팩트가 약하게 비칠 수 있음 / 결이 빨리 드러나지 않을 수 있음 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(rhythmDelta),
          }
        : {
            label: "계절 변동형",
            rationale:
              "윤곽 강도와 균형감이 비등하게 섞인 결. 본문은 '시기·분위기에 따라 끌리는 포인트가 달라지는, 한 가지 인상으로 묶이지 않는 방식'을 풀 것.",
            strengthDirection:
              "시기마다 새로운 매력이 발견되는 결 / 한 인상에 갇히지 않는 입체감 — 이 카테고리에서 부위 관찰과 결합한 12~25자 강점 1개.",
            cautionDirection:
              "결이 자주 바뀌어 정착감이 약해 보일 수 있음 / 정해진 인상으로 묶기 어려움 — 이 방향에서 부위 관찰과 결합한 12~25자 주의점 1개.",
            score: round2(rhythmDelta),
          };

  return { approach, signal, rhythm };
};

/**
 * 3축 라벨 조합을 짧은 해시 문자열로 변환.
 * MZ 톤 레인 결정적 선택 등 부수 결정에 사용.
 */
export const loveAxesFingerprint = (axes: LoveAxes): string =>
  `${axes.approach.label}/${axes.signal.label}/${axes.rhythm.label}`;
