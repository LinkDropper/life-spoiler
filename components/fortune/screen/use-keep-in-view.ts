import { useCallback, useRef } from "react";

/** 높이 전환이 끝나지 않을 때(동작 줄이기 등) 기다리는 최대 시간 */
const SCROLL_FALLBACK_MS = 700;
/** 헤더 + 상영 컨트롤 바 높이 (screen.module.css의 scroll-margin-top과 같은 값) */
export const STICKY_OFFSET_PX = 128;

/**
 * 가까울수록 크게 목록(나이대별·월별)에서 위쪽 항목이 접히면 누른 항목이 화면 밖으로 밀려난다.
 * 접히는 항목과 펼치는 항목의 높이 전환이 모두 끝난 뒤(도중에 스크롤을 걸면 끊긴다) 제자리로 데려온다.
 */
export const useKeepInView = (panelSelector: string) => {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const keepInView = useCallback(
    (index: number, closingIndex: number) => {
      const item = itemRefs.current[index];
      if (!item) {
        return;
      }
      const panels = [index, closingIndex]
        .map((target) => itemRefs.current[target]?.querySelector(panelSelector))
        .filter((panel): panel is Element => Boolean(panel));
      const pending = new Set(panels);
      let timer = 0;

      const settle = () => {
        window.clearTimeout(timer);
        panels.forEach((panel) =>
          panel.removeEventListener("transitionend", handleEnd)
        );
        const { top } = item.getBoundingClientRect();
        if (top < STICKY_OFFSET_PX || top > window.innerHeight * 0.7) {
          item.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      };
      const handleEnd = (event: Event) => {
        pending.delete(event.currentTarget as Element);
        if (pending.size === 0) {
          settle();
        }
      };

      timer = window.setTimeout(settle, SCROLL_FALLBACK_MS);
      panels.forEach((panel) =>
        panel.addEventListener("transitionend", handleEnd)
      );
    },
    [panelSelector]
  );

  return { itemRefs, keepInView };
};
