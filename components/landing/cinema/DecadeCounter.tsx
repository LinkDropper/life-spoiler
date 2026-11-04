"use client";

import { useEffect, useRef } from "react";

import styles from "./DecadeCounter.module.css";

import type { CSSProperties } from "react";

export interface DecadeCounterItem {
  key: string;
  tint: string;
  /** 예: "25~34" */
  label: string;
}

interface DecadeCounterProps {
  items: DecadeCounterItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
  className?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * 10년 구간 썸네일 줄 — 누르면 그 장면으로 간다.
 * 홈 첫 화면과 랜딩 인생 필름 장면이 함께 쓴다. 고른 칸이 바뀌면 줄 가운데로 따라온다.
 */
export const DecadeCounter = ({
  items,
  selectedIndex,
  onSelect,
  ariaLabel,
  className,
}: DecadeCounterProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const isFirstRef = useRef(true);

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[selectedIndex];
    if (!list || !(item instanceof HTMLElement)) {
      return;
    }
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.clientWidth) / 2,
      behavior:
        isFirstRef.current || prefersReducedMotion() ? "auto" : "smooth",
    });
    isFirstRef.current = false;
  }, [selectedIndex, items.length]);

  return (
    <div
      ref={listRef}
      className={[styles.counter, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          className={styles.item}
          style={{ "--tint": item.tint } as CSSProperties}
          aria-pressed={index === selectedIndex}
          onClick={() => onSelect(index)}
        >
          <span className={styles.thumb} aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </div>
  );
};
