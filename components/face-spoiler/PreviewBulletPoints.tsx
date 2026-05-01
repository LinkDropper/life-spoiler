import Image from "next/image";

import styles from "./PreviewBulletPoints.module.css";

interface PreviewBulletPointsProps {
  /** 표시할 핵심 포인트 (최대 3개까지만 노출). */
  points: string[];
}

const ICONS = [
  "/images/face-spoiler/preview/icon-square-1.svg",
  "/images/face-spoiler/preview/icon-square-2.svg",
  "/images/face-spoiler/preview/icon-square-3.svg",
];

const MAX_POINTS = 3;

export const PreviewBulletPoints = ({ points }: PreviewBulletPointsProps) => {
  const limited = points.slice(0, MAX_POINTS);
  if (limited.length === 0) return null;

  return (
    <ul className={styles.list}>
      {limited.map((text, idx) => (
        <li key={idx} className={styles.item}>
          <Image
            className={styles.icon}
            src={ICONS[idx]}
            alt=""
            width={20}
            height={20}
            aria-hidden
          />
          <span className={styles.text}>{text}</span>
        </li>
      ))}
    </ul>
  );
};
