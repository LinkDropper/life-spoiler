interface YearFlowChartProps {
  /** 1~12월 점수 */
  scores: number[];
  /** 빛나게 표시할 달 (이번 달). 없으면 null */
  nowMonth: number | null;
  bestMonths?: number[];
  cautionMonths?: number[];
  /** 예고편: 조심할 달을 ?로 가린다 */
  lockCaution?: boolean;
  /** ★·▲ 표시 */
  showMarks?: boolean;
  /** 포스터용: 이번 달 막대에 빛 번짐 */
  glow?: boolean;
  height?: number;
  className?: string;
}

const VIEW_WIDTH = 336;
const GAP = 6;
const LABEL_SPACE = 18;
const MARK_SPACE = 16;
/** 막대 높이는 그해 가장 낮은 달 ~ 가장 높은 달 사이로 맞춘다(달끼리의 차이가 보이게). 가장 낮은 달도 이만큼은 보인다 */
const MIN_RATIO = 0.18;

/**
 * 올해의 흐름 12막대: 높이 = 달별 점수, 이번 달은 금색, 지난 달은 흐리게.
 * 장식이 아니라 실제 계산 값이므로 수치는 요약 칸과 월별 시나리오에서 글로도 보여 준다.
 */
export const YearFlowChart = ({
  scores,
  nowMonth,
  bestMonths = [],
  cautionMonths = [],
  lockCaution = false,
  showMarks = true,
  glow = false,
  height = 120,
  className,
}: YearFlowChartProps) => {
  const barWidth = (VIEW_WIDTH - GAP * 11) / 12;
  const usable = height - LABEL_SPACE - MARK_SPACE;
  const low = Math.min(...scores);
  const high = Math.max(...scores);
  const span = Math.max(high - low, 1);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      width="100%"
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
      {glow && (
        <defs>
          <radialGradient id="fs-month-glow">
            <stop offset="0%" stopColor="#ffe7a3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffe7a3" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      {scores.map((score, index) => {
        const month = index + 1;
        const ratio = MIN_RATIO + ((score - low) / span) * (1 - MIN_RATIO);
        const barHeight = ratio * usable;
        const x = index * (barWidth + GAP);
        const y = height - LABEL_SPACE - barHeight;
        const isNow = month === nowMonth;
        const isPast = nowMonth !== null && month < nowMonth;
        const fill = isNow
          ? "#ffe7a3"
          : isPast
            ? "rgba(255,255,255,0.28)"
            : "rgba(255,143,177,0.55)";
        const isBest = bestMonths.includes(month);
        const isCaution = cautionMonths.includes(month);
        const centerX = x + barWidth / 2;
        return (
          <g key={month}>
            {glow && isNow && (
              <circle cx={centerX} cy={y} r={26} fill="url(#fs-month-glow)" />
            )}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              fill={fill}
            />
            {showMarks && isBest && (
              <text
                x={centerX}
                y={y - 5}
                textAnchor="middle"
                fontSize={10}
                fill="#ffe7a3"
              >
                ★
              </text>
            )}
            {showMarks && isCaution && (
              <text
                x={centerX}
                y={y - 5}
                textAnchor="middle"
                fontSize={9}
                fill={lockCaution ? "rgba(255,255,255,0.45)" : "#ff8fb1"}
              >
                {lockCaution ? "?" : "▲"}
              </text>
            )}
            <text
              x={centerX}
              y={height - 3}
              textAnchor="middle"
              fontSize={10}
              fontFamily="ui-monospace, Menlo, monospace"
              fill={
                isNow
                  ? "#ffe7a3"
                  : isPast
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(255,255,255,0.7)"
              }
            >
              {month}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
