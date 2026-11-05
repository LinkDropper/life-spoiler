"use client";

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export interface CharacterPosterProps {
  /** 배경 외곽선 타이포 (올해: 연도, 인생: 명궁 주성 이름) */
  backdropText: string;
  /** 주인공 그림 (분야 그림 / 주성 그림) */
  heroSrc: string;
  heroAlt: string;
  /** 금색 한 줄 (LEAD GENRE · 직업운 / LEAD STAR · 명궁 천부) */
  kicker: string;
  /** 출연진 줄 */
  castLine: string;
  headline: string;
  tags?: string[];
  /**
   * emblem = 배경 타이포 + 가운데 그림(올해·인생)
   * keyart = 위쪽을 그림으로 가득 채우고 아래로 녹임(전생 AI 키 아트). 배경 타이포는 쓰지 않는다
   */
  heroLayout?: "emblem" | "keyart";
  /** 제목 아래 한 줄 인용 (전생: 묘비명) */
  quote?: string;
  /** 오른쪽 위 작은 라벨 (기본 CHARACTER POSTER) */
  cornerLabel?: string;
  /** 하단 블록 (PosterRatings · PosterTraitsIntro). 인라인 스타일만 쓴다 */
  bottom: ReactNode;
  /** 빌링 블록 두 줄 */
  billing: [string, string];
  brandLabel: string;
  shareLabel: string;
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

export const POSTER_DISPLAY_FONT = DISPLAY_FONT;
export const POSTER_MONO_FONT = MONO_FONT;
export const POSTER_STAR = STAR;

const absolute = (style: CSSProperties): CSSProperties => ({
  position: "absolute",
  ...style,
});

/**
 * 캐릭터 포스터 틀 (올해 A안 → 인생 운세에도 같은 틀, 기획서 §10·§11).
 * 영화가 배우마다 따로 내는 캐릭터 포스터처럼: 외곽선 배경 타이포 + 주인공 그림 + 제목 + 하단 블록 + 빌링 블록.
 * html-to-image로 저장하므로 인라인 스타일과 <img>만 쓴다.
 */
export const CharacterPoster = forwardRef<HTMLDivElement, CharacterPosterProps>(
  (
    {
      backdropText,
      heroSrc,
      heroAlt,
      kicker,
      castLine,
      headline,
      tags = [],
      heroLayout = "emblem",
      quote,
      cornerLabel = "CHARACTER POSTER",
      bottom,
      billing,
      brandLabel,
      shareLabel,
      isImage = true,
      shouldShowShareButton = true,
      onShareClick,
    },
    ref
  ) => {
    /** 배경 타이포가 길면(영문 주성 이름) 줄여서 폭 안에 */
    const backdropSize = Math.min(
      120,
      Math.floor(340 / Math.max(backdropText.length * 0.62, 1))
    );
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
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          })}
        >
          <span
            style={{ fontFamily: DISPLAY_FONT, fontSize: 18, color: "#ffccd9" }}
          >
            {brandLabel}
          </span>
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {cornerLabel}
          </span>
        </div>
        {heroLayout === "keyart" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- html-to-image 호환 */}
            <img
              src={heroSrc}
              alt={heroAlt}
              width={POSTER_WIDTH}
              height={360}
              style={absolute({
                left: 0,
                top: 0,
                width: POSTER_WIDTH,
                height: 360,
                objectFit: "cover",
                filter: "sepia(0.2) saturate(1.05)",
              })}
            />
            <span
              aria-hidden="true"
              style={absolute({
                left: 0,
                right: 0,
                top: 200,
                height: 170,
                background:
                  "linear-gradient(180deg, rgba(5,7,15,0) 0%, #05070f 100%)",
              })}
            />
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              style={absolute({
                left: 0,
                right: 0,
                top: 70,
                textAlign: "center",
                fontFamily: DISPLAY_FONT,
                fontSize: backdropSize,
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "1.5px rgba(255,204,217,0.55)",
              })}
            >
              {backdropText}
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
              src={heroSrc}
              alt={heroAlt}
              width={240}
              height={131}
              style={absolute({
                left: "50%",
                top: 168,
                marginLeft: -120,
                objectFit: "contain",
              })}
            />
          </>
        )}
        <div
          style={absolute({
            left: 22,
            right: 22,
            top: heroLayout === "keyart" ? 296 : 318,
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
            {kicker}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            {castLine}
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
          {quote && (
            <span
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.8)",
              }}
            >
              “{stripEmoji(quote)}”
            </span>
          )}
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
        {bottom}
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
          {billing[0]}
          <br />
          {billing[1]}
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
            {shareLabel}
          </button>
        )}
      </div>
    );
  }
);

CharacterPoster.displayName = "CharacterPoster";

// ============================================================
// 하단 블록
// ============================================================

export interface PosterRating {
  key: string;
  label: string;
  /** 0~100 */
  score: number;
}

const toStars = (score: number): string => {
  const count = Math.round(Math.min(Math.max(score, 0), 100) / 20);
  return "★".repeat(count) + "☆".repeat(5 - count);
};

/** 네 갈래 평점 4칸 (최고 점수 칸을 금색으로) */
export const PosterRatings = ({ items }: { items: PosterRating[] }) => {
  const leadKey = items.reduce(
    (lead, item) => (item.score > lead.score ? item : lead),
    items[0]
  )?.key;
  return (
    <div
      style={absolute({
        left: 22,
        right: 22,
        top: 520,
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        gap: 6,
      })}
    >
      {items.map((item) => {
        const isLead = item.key === leadKey;
        return (
          <span
            key={item.key}
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
              {item.label}
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
              {(Math.min(Math.max(item.score, 0), 100) / 10).toFixed(1)}
            </b>
            <span style={{ fontSize: 9, letterSpacing: 1, color: STAR }}>
              {toStars(item.score)}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export interface PosterTrait {
  key: string;
  /** ACTIVITY · WORK … */
  code: string;
  /** 기운 쪽 단어 (내향) */
  word: string;
  /** 기운 쪽 비율 50~100 */
  percent: number;
}

/**
 * 캐릭터 소개 타이틀 (인생 캐릭터 포스터 3안, 2026-11-05 확정):
 * 기운 쪽 단어 넷으로 만든 배역 소개 한 줄 + 아래에 크레딧처럼 비율.
 */
export const PosterTraitsIntro = ({
  lead,
  items,
}: {
  /** introducing a character who is */
  lead: string;
  items: PosterTrait[];
}) => (
  <div
    style={absolute({
      left: 22,
      right: 22,
      top: 506,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      textAlign: "center",
    })}
  >
    <span
      style={{
        fontSize: 11,
        fontStyle: "italic",
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.6)",
      }}
    >
      {lead}
    </span>
    <b
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 400,
        fontSize: 22,
        lineHeight: 1.2,
      }}
    >
      {items.map((item, index) => (
        <span key={item.key}>
          {index > 0 && " · "}
          <span style={{ color: STAR }}>{item.word}</span>
        </span>
      ))}
    </b>
    <div
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        paddingTop: 8,
        borderTop: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      {items.map((item) => (
        <span
          key={item.key}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <span
            style={{
              fontFamily: MONO_FONT,
              fontSize: 7,
              letterSpacing: "0.18em",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {item.code}
          </span>
          <b
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            {item.percent}
          </b>
        </span>
      ))}
    </div>
  </div>
);
