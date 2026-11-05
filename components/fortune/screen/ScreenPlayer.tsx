"use client";

import { ListVideo, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { trackFortuneEvent } from "@/libs/analytics/fortune";
import type {
  FortuneSceneId,
  FortuneScreenType,
  FortuneSurface,
} from "@/libs/analytics/fortune";

import styles from "./screen.module.css";

export interface PlayerScene {
  id: FortuneSceneId;
  /** "ACT 1" */
  act: string;
  title: string;
  sub?: string;
}

interface ScreenPlayerProps {
  /** 진행 막대의 마디가 되는 막 */
  scenes: PlayerScene[];
  age: number;
  /** "지금 n세" 버튼이 데려갈 요소 id. 없으면 버튼을 숨긴다 */
  nowTargetId?: string;
  /** 마디 없이 도달만 기록할 장면 (다음 상영작·엔딩) */
  extraSceneIds?: FortuneSceneId[];
  surface: FortuneSurface;
  fortuneType?: FortuneScreenType;
  /** "지금 n세" 대신 쓸 버튼 문구 (올해 운세: "지금 n월") */
  nowLabel?: string;
}

/**
 * 헤더(60) + 플레이어(약 60) 바로 아래. 이 줄을 지난 장면을 "지금 보는 장면"으로 친다.
 * 장면으로 이동할 때 멈추는 자리(scroll-margin-top 128)보다 조금 아래여야 이동 직후 이름이 맞는다.
 */
const READING_LINE_PX = 140;

type ActiveScene = FortuneSceneId | "opening";

interface PlayerState {
  activeId: ActiveScene;
  /** 막마다 읽은 비율 0~1 (scenes와 같은 순서) */
  fills: number[];
  /** 막마다 전체에서 차지하는 길이 비율 (마디 너비) */
  weights: number[];
}

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

const readTop = (id: string): number | null => {
  const node = document.getElementById(id);
  return node ? node.getBoundingClientRect().top + window.scrollY : null;
};

/**
 * 본편 위에 붙는 상영 컨트롤 바.
 * 지금 보는 막의 이름, 막 길이대로 나눈 진행 막대, "지금 n세"로 가기, 장면 목록.
 * 장면에 처음 들어올 때 한 번씩 도달을 기록한다.
 */
export const ScreenPlayer = ({
  scenes,
  age,
  nowTargetId,
  extraSceneIds,
  surface,
  fortuneType = "lifetime",
  nowLabel,
}: ScreenPlayerProps) => {
  const t = useTranslations("fortune.screen.player");
  const panelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const reachedRef = useRef(new Set<FortuneSceneId>());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [state, setState] = useState<PlayerState>({
    activeId: "opening",
    fills: scenes.map(() => 0),
    weights: scenes.map(() => 1),
  });

  const measure = useCallback(() => {
    const sceneTops = scenes.map((scene) => readTop(scene.id));
    const extraTops = (extraSceneIds ?? []).map((id) => readTop(id));
    const pageEnd = document.documentElement.scrollHeight;
    const lastEnd =
      extraTops.find((top): top is number => top !== null) ?? pageEnd;
    const line = window.scrollY + READING_LINE_PX;

    const spans = sceneTops.map((top, index) => {
      const start = top ?? lastEnd;
      const end =
        sceneTops
          .slice(index + 1)
          .find((next): next is number => next !== null) ?? lastEnd;
      return { start, end: Math.max(end, start + 1) };
    });
    const total = spans.reduce((sum, span) => sum + (span.end - span.start), 0);

    const marks: { id: FortuneSceneId; top: number }[] = [
      ...scenes.map((scene, index) => ({
        id: scene.id,
        top: sceneTops[index],
      })),
      ...(extraSceneIds ?? []).map((id, index) => ({
        id,
        top: extraTops[index],
      })),
    ].filter(
      (mark): mark is { id: FortuneSceneId; top: number } => mark.top !== null
    );
    const passed = marks.filter((mark) => mark.top <= line);
    const activeId: ActiveScene = passed.length
      ? passed.reduce((last, mark) => (mark.top > last.top ? mark : last)).id
      : "opening";

    passed.forEach((mark) => {
      if (reachedRef.current.has(mark.id)) {
        return;
      }
      reachedRef.current.add(mark.id);
      trackFortuneEvent("fortune_result_scene_reach", {
        fortune_type: fortuneType,
        surface,
        scene: mark.id,
      });
    });

    setState({
      activeId,
      fills: spans.map((span) =>
        clamp01((line - span.start) / (span.end - span.start))
      ),
      weights: spans.map((span) => (span.end - span.start) / (total || 1)),
    });
  }, [scenes, extraSceneIds, surface, fortuneType]);

  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [measure]);

  // 목록 밖을 누르거나 Esc로 닫기
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

  const handleJump = (target: FortuneSceneId | "now", elementId: string) => {
    setIsMenuOpen(false);
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackFortuneEvent("fortune_result_jump", {
      fortune_type: fortuneType,
      surface,
      target,
    });
  };

  const activeScene = scenes.find((scene) => scene.id === state.activeId);
  const activeAct = activeScene
    ? activeScene.act
    : t(`kicker.${state.activeId}`);
  const activeTitle = activeScene
    ? activeScene.title
    : t(`scene.${state.activeId}`);

  return (
    <nav ref={rootRef} className={styles.player} aria-label={t("label")}>
      <div className={styles.playerBar}>
        <div className={styles.playerNow} aria-live="polite">
          <span className={styles.playerAct}>{activeAct}</span>
          <span className={styles.playerTitle}>{activeTitle}</span>
        </div>
        {nowTargetId && (
          <button
            type="button"
            className={styles.playerAge}
            onClick={() => handleJump("now", nowTargetId)}
          >
            <span className={styles.playerAgeDot} aria-hidden="true" />
            {nowLabel ?? t("now", { age })}
          </button>
        )}
        <button
          type="button"
          className={styles.playerMenu}
          aria-expanded={isMenuOpen}
          aria-controls={panelId}
          aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <ListVideo size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className={styles.playerProgress} aria-hidden="true">
        {scenes.map((scene, index) => (
          <span
            key={scene.id}
            className={styles.playerSegment}
            style={{ flexGrow: state.weights[index] }}
          >
            <span
              className={styles.playerSegmentFill}
              style={{ transform: `scaleX(${state.fills[index] ?? 0})` }}
            />
          </span>
        ))}
      </div>

      <div id={panelId} className={styles.playerPanel} hidden={!isMenuOpen}>
        <ol className={styles.chapterList}>
          {scenes.map((scene, index) => {
            const isCurrent = scene.id === state.activeId;
            const isDone = (state.fills[index] ?? 0) >= 1;
            return (
              <li key={scene.id}>
                <button
                  type="button"
                  className={`${styles.chapter} ${
                    isCurrent ? styles.chapterCurrent : ""
                  }`}
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => handleJump(scene.id, scene.id)}
                >
                  <span className={styles.chapterAct}>{scene.act}</span>
                  <span className={styles.chapterText}>
                    <b>{scene.title}</b>
                    {scene.sub && <span>{scene.sub}</span>}
                  </span>
                  <span className={styles.chapterState}>
                    {isCurrent
                      ? t("state.current")
                      : isDone
                        ? t("state.done")
                        : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};
