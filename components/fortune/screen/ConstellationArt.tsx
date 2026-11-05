import { toGridPoint } from "@/libs/fortune/lifetime-screen";
import type { ConstellationStar } from "@/libs/fortune/lifetime-screen";

interface ConstellationArtProps {
  stars: ConstellationStar[];
  /** 별 아래에 붙일 이름 (stars와 같은 순서) */
  labels: string[];
  className?: string;
}

const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 340;
const PADDING_X = 40;
const PADDING_Y = 28;

const toViewPoint = (star: ConstellationStar): { x: number; y: number } => {
  const point = toGridPoint(star);
  return {
    x: PADDING_X + point.x * (VIEW_WIDTH - PADDING_X * 2),
    y: PADDING_Y + point.y * (VIEW_HEIGHT - PADDING_Y * 2),
  };
};

/**
 * 포스터 배경의 "내 별자리": 명궁·삼합 두 궁은 삼각형, 대궁은 점선.
 * 명반과 같은 자리에 찍으므로 사람마다 모양이 다르다. 장식이라 스크린리더에서는 숨긴다.
 */
export const ConstellationArt = ({
  stars,
  labels,
  className,
}: ConstellationArtProps) => {
  if (stars.length < 4) {
    return null;
  }
  const [self, triangle1, triangle2, opposite] = stars.map(toViewPoint);
  const trianglePath = `M${self.x} ${self.y} L${triangle1.x} ${triangle1.y} L${triangle2.x} ${triangle2.y} Z`;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fs-star-glow">
          <stop offset="0%" stopColor="#ffe7a3" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffe7a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d={trianglePath}
        fill="rgba(255, 143, 177, 0.06)"
        stroke="#ff8fb1"
        strokeOpacity="0.7"
        strokeWidth="1.2"
      />
      <line
        x1={self.x}
        y1={self.y}
        x2={opposite.x}
        y2={opposite.y}
        stroke="#ffe7a3"
        strokeOpacity="0.55"
        strokeWidth="1"
        strokeDasharray="4 5"
      />
      {[self, triangle1, triangle2, opposite].map((point, index) => {
        const isSelf = index === 0;
        return (
          <g key={stars[index].role}>
            <circle
              cx={point.x}
              cy={point.y}
              r={isSelf ? 26 : 16}
              fill="url(#fs-star-glow)"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={isSelf ? 4.5 : 3}
              fill={isSelf ? "#ffe7a3" : "#ffffff"}
            />
            {labels[index] && (
              <text
                x={point.x}
                y={point.y + (isSelf ? 24 : 18)}
                textAnchor="middle"
                fill="#ffffff"
                fillOpacity={isSelf ? 0.9 : 0.6}
                fontSize={isSelf ? 12 : 10}
                fontWeight={700}
              >
                {labels[index]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
