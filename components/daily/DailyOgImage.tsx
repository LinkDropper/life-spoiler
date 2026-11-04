export interface DailyOgCell {
  label: string;
  value: string;
  /** 값 아래 둘째 줄 (총운 등급명) */
  subValue?: string;
}

export interface DailyOgImageProps {
  /** 금색 회차 문구 (예: "11월 5일 회차") */
  episode: string;
  /** 큰 제목 두 줄 */
  headingLines: [string, string];
  /** 브랜드 로고 문구 */
  brand: string;
  /** 콜시트 머리 */
  mark: string;
  /** 콜시트 머리 날짜 (예: "2026.11.05") */
  sheetDate: string;
  headline: string;
  cells: DailyOgCell[];
}

const INK = "#23142d";
const INK_FAINT = "rgba(35,20,45,0.6)";

/**
 * 공유 OG 이미지(1200x630) — 결과 화면과 같은 "오늘의 콜시트" 분홍 종이.
 * `next/og` ImageResponse 안에서만 쓴다. Satori 제약상 인라인 style + flex만 사용하며 훅·CSS 모듈을 쓰지 않는다.
 * 이름·생년월일시·오늘의 제목은 props에 존재하지 않는다(공유 토큰에 없는 값).
 */
export const DailyOgImage = ({
  episode,
  headingLines,
  brand,
  mark,
  sheetDate,
  headline,
  cells,
}: DailyOgImageProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "100%",
      padding: "0 80px",
      gap: 48,
      backgroundColor: "#0c1220",
      backgroundImage:
        "radial-gradient(ellipse 45% 70% at 76% 50%, rgba(216,166,255,0.26), rgba(12,18,32,0) 72%)",
      color: "#ffffff",
      fontFamily: "SB",
      wordBreak: "keep-all",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 28,
          color: "#ffe7a3",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 6,
            background: "#ffe7a3",
          }}
        />
        {episode}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 66,
          lineHeight: 1.2,
        }}
      >
        <div style={{ display: "flex" }}>{headingLines[0]}</div>
        <div style={{ display: "flex" }}>{headingLines[1]}</div>
      </div>
      <div style={{ display: "flex", fontSize: 34, color: "#ffccd9" }}>
        {brand}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 480,
        padding: "30px 28px 26px",
        borderRadius: 6,
        background: "#f9ecf0",
        color: INK,
        boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        transform: "rotate(-1.2deg)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingBottom: 12,
          borderBottom: `3px solid ${INK}`,
          fontSize: 20,
        }}
      >
        <div style={{ display: "flex", letterSpacing: 5 }}>{mark}</div>
        <div style={{ display: "flex" }}>{sheetDate}</div>
      </div>
      <div
        style={{
          display: "flex",
          padding: "20px 0",
          borderBottom: "1.5px solid rgba(35,20,45,0.22)",
          fontSize: 32,
          lineHeight: 1.35,
        }}
      >
        {headline}
      </div>
      <div style={{ display: "flex", gap: 30, paddingTop: 16 }}>
        {cells.map(({ label, value, subValue }) => (
          <div
            key={label}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div style={{ display: "flex", fontSize: 16, color: INK_FAINT }}>
              {label}
            </div>
            <div style={{ display: "flex", fontSize: 24 }}>{value}</div>
            {subValue && (
              <div style={{ display: "flex", fontSize: 20 }}>{subValue}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
