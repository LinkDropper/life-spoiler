"use client";

import { useRef } from "react";

import { gsap, MOTION_QUERY, useGSAP } from "./cinema/gsap";

import type { ReactNode } from "react";

interface CrtScreenProps {
  className?: string;
  children: ReactNode;
}

/**
 * 브라운관 TV가 켜지는 연출로 감싸는 화면.
 * 처음 화면에 들어올 때 한 번만 재생한다: 가운데 가로 한 줄 빛 → 위아래로 펼쳐짐 →
 * 자식 중 `data-crt-badge`, `data-crt-line` 요소가 차례로 나타나고, 마지막 줄은 반 박자 늦게.
 * 페이지 끝 섹션이라 스크롤 위치에 묶으면 끝까지 재생되기 전에 스크롤이 끝나므로 묶지 않는다.
 */
export const CrtScreen = ({ className, children }: CrtScreenProps) => {
  const screenRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERY, () => {
        const screen = screenRef.current;
        if (!screen) return;
        const lines = Array.from(
          screen.querySelectorAll<HTMLElement>("[data-crt-line]")
        );
        const punchline = lines.at(-1);

        gsap
          .timeline({
            scrollTrigger: { trigger: screen, start: "top 80%", once: true },
          })
          .fromTo(
            screen,
            { scaleX: 0.04, scaleY: 0.006, filter: "brightness(4)" },
            { scaleX: 1, duration: 0.28, ease: "power2.out" }
          )
          .to(screen, {
            scaleY: 1,
            filter: "brightness(1)",
            duration: 0.38,
            ease: "power3.out",
          })
          .from(
            "[data-crt-badge]",
            { opacity: 0, duration: 0.15, ease: "steps(3)" },
            "-=0.05"
          )
          .from(lines.slice(0, -1), {
            opacity: 0,
            y: 6,
            duration: 0.3,
            stagger: 0.18,
          })
          // 펀치라인은 반 박자 쉬고 나온다
          .from(punchline ?? [], { opacity: 0, y: 6, duration: 0.3 }, "+=0.25");
      });
    },
    { scope: screenRef }
  );

  return (
    <div ref={screenRef} className={className}>
      {children}
    </div>
  );
};
