import { useId, useMemo } from "react";

import {
  SKY_HEIGHT,
  SKY_WIDTH,
  createNightSky,
} from "@/libs/landing/night-sky";

import styles from "./NightSkyArt.module.css";

interface NightSkyArtProps {
  seedKey: string;
  tint: string;
  starNames: string[];
  /** 스크린리더용 설명 (예: "복덕궁의 밤하늘, 별 천부") */
  label: string;
  /** 주성 아래 이름을 붙이지 않을 때(썸네일 등) */
  hideNames?: boolean;
}

/**
 * 대운 한 장면의 밤하늘 그림. 좌표는 libs/landing/night-sky.ts가 시드로 만든다.
 * 이미지 파일 없이 SVG로 그려 같은 명반이면 늘 같은 하늘이 나온다.
 */
export const NightSkyArt = ({
  seedKey,
  tint,
  starNames,
  label,
  hideNames = false,
}: NightSkyArtProps) => {
  const id = useId().replace(/:/g, "");
  const sky = useMemo(
    () => createNightSky(seedKey, tint, starNames),
    [seedKey, tint, starNames]
  );
  const ids = {
    blur: `${id}-blur`,
    glow: `${id}-glow`,
    halo: `${id}-halo`,
    spikeX: `${id}-sx`,
    spikeY: `${id}-sy`,
  };

  return (
    <svg
      className={styles.sky}
      viewBox={`0 0 ${SKY_WIDTH} ${SKY_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <defs>
        <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={ids.glow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <radialGradient id={ids.halo}>
          <stop offset="0" stopColor={tint} stopOpacity="0.9" />
          <stop offset="0.35" stopColor={tint} stopOpacity="0.28" />
          <stop offset="1" stopColor={tint} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={ids.spikeX} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ids.spikeY} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={SKY_WIDTH} height={SKY_HEIGHT} fill="#05040a" />

      <g filter={`url(#${ids.blur})`}>
        {sky.clouds.map((cloud, index) => (
          <ellipse
            key={index}
            cx={cloud.cx}
            cy={cloud.cy}
            rx={cloud.rx}
            ry={cloud.ry}
            fill={cloud.color}
            opacity={cloud.opacity}
            transform={`rotate(${cloud.rotate} ${SKY_WIDTH / 2} ${SKY_HEIGHT / 2})`}
          />
        ))}
      </g>
      <ellipse
        cx={SKY_WIDTH / 2}
        cy={SKY_HEIGHT / 2}
        rx={SKY_WIDTH * 0.7}
        ry={18}
        fill="#fff"
        opacity={0.05}
        filter={`url(#${ids.blur})`}
        transform={`rotate(${sky.milkyWayRotate} ${SKY_WIDTH / 2} ${SKY_HEIGHT / 2})`}
      />

      {sky.fieldStars.map((star, index) => (
        <circle
          key={index}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill={star.isWarm ? "#ffe7c4" : "#fff"}
          opacity={star.opacity}
        />
      ))}
      {sky.midStars.map((star, index) => (
        <g key={index}>
          <circle
            cx={star.x}
            cy={star.y}
            r={2.4}
            fill="#fff"
            opacity={0.22}
            filter={`url(#${ids.glow})`}
          />
          <circle cx={star.x} cy={star.y} r={0.9} fill="#fff" />
        </g>
      ))}

      <polyline
        points={sky.constellation.map(({ x, y }) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="#fff"
        strokeOpacity={0.32}
        strokeWidth={0.6}
      />

      {sky.mainStars.map((star) => (
        <g key={star.name}>
          <g className={styles.mainStar}>
            <circle cx={star.x} cy={star.y} r={26} fill={`url(#${ids.halo})`} />
            <rect
              x={star.x - 22}
              y={star.y - 0.35}
              width={44}
              height={0.7}
              fill={`url(#${ids.spikeX})`}
            />
            <rect
              x={star.x - 0.35}
              y={star.y - 18}
              width={0.7}
              height={36}
              fill={`url(#${ids.spikeY})`}
            />
            <circle cx={star.x} cy={star.y} r={2.6} fill="#fffaf0" />
          </g>
          {!hideNames && (
            <>
              <line
                x1={star.x + 5}
                y1={star.y - 5}
                x2={star.x + 14}
                y2={star.y - 14}
                stroke="#fff"
                strokeOpacity={0.5}
                strokeWidth={0.5}
              />
              <text x={star.x + 16} y={star.y - 15} className={styles.starName}>
                {star.name}
              </text>
            </>
          )}
        </g>
      ))}

      {/* 오른쪽 위 빛샘 — 영사기 필름 느낌 */}
      <ellipse
        cx={SKY_WIDTH + 10}
        cy={-10}
        rx={70}
        ry={40}
        fill="#ff9e6b"
        opacity={0.12}
        filter={`url(#${ids.blur})`}
      />
    </svg>
  );
};
