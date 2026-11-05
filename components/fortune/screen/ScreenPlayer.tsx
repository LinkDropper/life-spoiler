"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type { FortuneSceneId } from "@/libs/analytics/fortune";

import { RUNTIME_YEARS, RuntimeTrack } from "./RuntimeTrack";
import styles from "./screen.module.css";

export interface PlayerScene {
  id: FortuneSceneId;
  label: string;
}

interface ScreenPlayerProps {
  scenes: PlayerScene[];
  age: number;
  /** "지금 n세" 칩이 데려갈 요소 id. 없으면 칩을 숨긴다 */
  nowTargetId?: string;
  /** 칩 없이 도달만 기록할 장면 */
  extraSceneIds?: FortuneSceneId[];
}

/**
 * 본편 위에 붙어 따라오는 러닝타임 플레이어.
 * 장면 칩으로 이동하고, 화면에 들어온 장면을 표시하며 장면별 도달을 한 번씩 기록한다.
 */
export const ScreenPlayer = ({
  scenes,
  age,
  nowTargetId,
  extraSceneIds,
}: ScreenPlayerProps) => {
  const t = useTranslations("fortune.screen.player");
  const [activeId, setActiveId] = useState<FortuneSceneId | null>(null);
  const reachedRef = useRef(new Set<FortuneSceneId>());

  useEffect(() => {
    const targets = [
      ...scenes.map((scene) => scene.id),
      ...(extraSceneIds ?? []),
    ]
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const id = entry.target.id as FortuneSceneId;
          setActiveId(id);
          if (!reachedRef.current.has(id)) {
            reachedRef.current.add(id);
            trackFortuneEvent("fortune_result_scene_reach", {
              fortune_type: "lifetime",
              scene: id,
            });
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [scenes, extraSceneIds]);

  const handleJump = (target: FortuneSceneId | "now", elementId: string) => {
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackFortuneEvent("fortune_result_jump", {
      fortune_type: "lifetime",
      target,
    });
  };

  return (
    <nav className={styles.player} aria-label={t("label")}>
      <div className={styles.playerRow}>
        <span className={styles.runtimeLabel}>RUNTIME</span>
        <RuntimeTrack age={age} />
        <span className={styles.runtimeAge}>
          {t.rich("age", {
            age,
            max: RUNTIME_YEARS,
            b: (chunks) => <b>{chunks}</b>,
          })}
        </span>
      </div>
      <div className={styles.playerChips}>
        {nowTargetId && (
          <button
            type="button"
            className={`${styles.chip} ${styles.chipNow}`}
            onClick={() => handleJump("now", nowTargetId)}
          >
            {t("now", { age })}
          </button>
        )}
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            className={styles.chip}
            aria-current={activeId === scene.id ? "true" : undefined}
            onClick={() => handleJump(scene.id, scene.id)}
          >
            {scene.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
