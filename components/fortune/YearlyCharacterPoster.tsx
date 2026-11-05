"use client";

import { useTranslations } from "next-intl";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type CategoryKey = "wealth" | "career" | "relationship" | "health";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

export interface YearlyCharacterPosterProps {
  name: string;
  year: number;
  /** 연도 간지 (병오년) */
  ganji: string;
  headline: string;
  tags?: string[];
  scores: Record<CategoryKey, number>;
  /** 분야 이름 (재물운 …) */
  categoryLabels: Record<CategoryKey, string>;
  /** true = 저장 이미지(375×667 고정), false = 본편 안(폭에 맞춰 줄임) */
  isImage?: boolean;
  shouldShowShareButton?: boolean;
  onShareClick?: () => void;
}

const POSTER_WIDTH = 375;
const POSTER_HEIGHT = 667;

const DISPLAY_FONT = "'SB AggroOTF', var(--font-pretendard), sans-serif";
const MONO_FONT = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const STAR = "#ffe7a3";

const STARFIELD = [
  "radial-gradient(1px 1px at 12% 20%, #fff, transparent)",
  "radial-gradient(1px 1px at 34% 62%, #fff, transparent)",
  "radial-gradient(1.4px 1.4px at 58% 18%, #fff, transparent)",
  "radial-gradient(1px 1px at 78% 44%, #fff, transparent)",
  "radial-gradient(1.2px 1.2px at 90% 76%, #fff, transparent)",
  "radial-gradient(1px 1px at 22% 84%, #fff, transparent)",
].join(", ");

/** 이모지 제거 (이미지 렌더링 호환성) */
const stripEmoji = (text: string): string =>
  text.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
    ""
  );

const pickLead = (scores: Record<CategoryKey, number>): CategoryKey =>
  CATEGORY_KEYS.reduce((lead, key) =>
    scores[key] > scores[lead] ? key : lead
  );

const toStars = (score: number): string => {
  const count = Math.round(Math.min(Math.max(score, 0), 100) / 20);
  return "★".repeat(count) + "☆".repeat(5 - count);
};

const absolute = (style: CSSProperties): CSSProperties => ({
  position: "absolute",
  ...style,
});

/**
 * 올해 캐릭터 포스터 (확정 A안, 기획서 §10).
 * 영화가 배우마다 따로 내는 캐릭터 포스터처럼: 연도 숫자를 배경 타이포로, 최고 점수 분야 그림이 주인공,
 * 아래에 네 갈래 평점 4칸과 포스터 하단 빌링 블록.
 * html-to-image로 저장하므로 인라인 스타일과 <img>만 쓴다(YealryProfileCard와 같은 이유).
 */
export const YearlyCharacterPoster = forwardRef<
  HTMLDivElement,
  YearlyCharacterPosterProps
>(
  (
    {
      name,
      year,
      ganji,
      headline,
      tags = [],
      scores,
      categoryLabels,
      isImage = true,
      shouldShowShareButton = true,
      onShareClick,
    },
    ref
  ) => {
    const t = useTranslations("fortune.screen.yearly.poster");
    const lead = pickLead(scores);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // 본편 안에서는 375×667 원본을 폭에 맞춰 그대로 줄인다(저장 이미지와 같은 모습)
    useEffect(() => {
      if (isImage || !wrapRef.current) {
        return;
      }
      const node = wrapRef.current;
      const update = () => setScale(node.clientWidth / POSTER_WIDTH);
      update();
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }, [isImage]);

    const poster = (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: POSTER_WIDTH,
          height: POSTER_HEIGHT,
          overflow: "hidden",
          color: "#ffffff",
          fontFamily: "var(--font-pretendard), Pretendard, sans-serif",
          wordBreak: "keep-all",
          background:
            "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(216,166,255,0.32), transparent 70%), radial-gradient(ellipse 70% 40% at 80% 85%, rgba(36,64,122,0.6), transparent 70%), #05070f",
          ...(isImage
            ? {}
            : {
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }),
        }}
      >
        <span
          aria-hidden="true"
          style={absolute({
            inset: 0,
            backgroundImage: STARFIELD,
            opacity: 0.8,
          })}
        />
        <div
          style={absolute({
            left: 18,
            right: 18,
            top: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          })}
        >
          <span
            style={{ fontFamily: DISPLAY_FONT, fontSize: 18, color: "#ffccd9" }}
          >
            {t("brand")}
          </span>
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            CHARACTER POSTER
          </span>
        </div>
        <span
          aria-hidden="true"
          style={absolute({
            left: 0,
            right: 0,
            top: 70,
            textAlign: "center",
            fontFamily: DISPLAY_FONT,
            fontSize: 120,
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,204,217,0.55)",
          })}
        >
          {year}
        </span>
        <span
          aria-hidden="true"
          style={absolute({
            left: "50%",
            top: 150,
            width: 300,
            height: 170,
            marginLeft: -150,
            background:
              "radial-gradient(ellipse at center, rgba(255,231,163,0.35), transparent 65%)",
          })}
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image 호환 */}
        <img
          src={`/images/category/${lead}.png`}
          alt={categoryLabels[lead]}
          width={240}
          height={131}
          style={absolute({
            left: "50%",
            top: 168,
            marginLeft: -120,
            objectFit: "contain",
          })}
        />
        <div
          style={absolute({
            left: 22,
            right: 22,
            top: 318,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            textAlign: "center",
          })}
        >
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 10,
              letterSpacing: "0.28em",
              color: STAR,
            }}
          >
            {t("leadGenre", { category: categoryLabels[lead] })}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {t("castLine", { name, year, ganji })}
          </span>
          <b
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              fontSize: 29,
              lineHeight: 1.2,
              textShadow: "0 0 30px rgba(255,204,217,0.4)",
            }}
          >
            {stripEmoji(headline)}
          </b>
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div
          style={absolute({
            left: 22,
            right: 22,
            top: 520,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 6,
          })}
        >
          {CATEGORY_KEYS.map((key) => {
            const isLead = key === lead;
            return (
              <span
                key={key}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "8px 0",
                  borderRadius: 6,
                  ...(isLead
                    ? {
                        background: "rgba(255,231,163,0.1)",
                        boxShadow: "inset 0 0 0 1px rgba(255,231,163,0.5)",
                      }
                    : {}),
                }}
              >
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  {categoryLabels[key]}
                </span>
                <b
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontWeight: 400,
                    fontSize: 22,
                    lineHeight: 1,
                    color: isLead ? STAR : "#ffffff",
                  }}
                >
                  {(Math.min(Math.max(scores[key], 0), 100) / 10).toFixed(1)}
                </b>
                <span style={{ fontSize: 9, letterSpacing: 1, color: STAR }}>
                  {toStars(scores[key])}
                </span>
              </span>
            );
          })}
        </div>
        <p
          style={absolute({
            left: 22,
            right: 22,
            bottom: 16,
            margin: 0,
            textAlign: "center",
            fontFamily: MONO_FONT,
            fontSize: 7.5,
            lineHeight: 1.6,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.45)",
          })}
        >
          LIFE SPOILER PRESENTS A {year} PICTURE · RUNTIME 12 MONTHS
          <br />
          BASED ON THE ORIGINAL ZI WEI CHART · LIFE-SPOILER.COM
        </p>
      </div>
    );

    if (isImage) {
      return poster;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          ref={wrapRef}
          style={{
            position: "relative",
            width: "100%",
            height: POSTER_HEIGHT * scale,
            overflow: "hidden",
            borderRadius: 12,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.14)",
          }}
        >
          {poster}
        </div>
        {shouldShowShareButton && (
          <button
            type="button"
            onClick={onShareClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 48,
              border: "none",
              borderRadius: 12,
              background: "transparent",
              boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.28)",
              color: "#ffffff",
              font: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 3v11M9 6l3-3 3 3M8 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1"
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("share")}
          </button>
        )}
      </div>
    );
  }
);

YearlyCharacterPoster.displayName = "YearlyCharacterPoster";
