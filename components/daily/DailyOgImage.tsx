export interface DailyOgKeyword {
  label: string;
  value: string;
  /** 색 키워드의 견본 hex. 색 이름(value)은 항상 함께 그린다 */
  swatch?: string;
}

export interface DailyOgImageProps {
  /** 이미 포맷된 날짜 문구 (예: "10월 14일 수요일의 운세") */
  date: string;
  eyebrow: string;
  headline: string;
  keywords: DailyOgKeyword[];
  /** 브랜드 워터마크 문구 */
  brand: string;
}

/**
 * 공유 OG 이미지(1200x630) 마크업. `next/og` ImageResponse 안에서만 쓴다.
 * Satori 제약상 인라인 style + flex만 사용하며 훅·CSS 모듈을 쓰지 않는다.
 * 이름·생년월일시·별 이름·최저 등급 라벨은 props에 존재하지 않는다.
 */
export const DailyOgImage = ({
  date,
  eyebrow,
  headline,
  keywords,
  brand,
}: DailyOgImageProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      padding: 64,
      background:
        "linear-gradient(145deg, #2b1b57 0%, #3f2170 55%, #2e1431 100%)",
      color: "#ffffff",
      fontFamily: "SB",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 28,
      }}
    >
      <div style={{ display: "flex", color: "#ffe27a" }}>{eyebrow}</div>
      <div style={{ display: "flex", color: "rgba(255,255,255,0.85)" }}>
        {date}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        fontSize: 62,
        lineHeight: 1.35,
        wordBreak: "keep-all",
      }}
    >
      {headline}
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", gap: 16 }}>
        {keywords.map(({ label, value, swatch }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 6,
              padding: "16px 20px",
              borderRadius: 16,
              background: "rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "rgba(255,255,255,0.8)",
              }}
            >
              {label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 32,
              }}
            >
              {swatch && (
                <div
                  style={{
                    display: "flex",
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: swatch,
                    border: "2px solid rgba(255,255,255,0.7)",
                  }}
                />
              )}
              <div style={{ display: "flex" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 26,
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 14,
            height: 14,
            background: "#ffe27a",
            transform: "rotate(45deg)",
          }}
        />
        <div style={{ display: "flex" }}>{brand}</div>
      </div>
    </div>
  </div>
);
