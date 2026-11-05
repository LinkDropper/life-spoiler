export type ScreeningOgSeat = "empty" | "guest" | "overflow";

export interface ScreeningOgImageProps {
  /** 금색 머리 문구 (예: "초대장") */
  kicker: string;
  /** 큰 제목 (예: "지수님이 시사회에 초대했어요") */
  title: string;
  /** 관객 수 또는 빈 시사회 안내 */
  audience: string;
  /** 하단 행동 유도 문구 */
  cta: string;
  brand: string;
  /** 티켓 머리 문구 (예: "입장") */
  admit: string;
  screen: string;
  /** A열부터 6열 × 9석. 이름 이니셜은 넘기지 않는다 */
  seatRows: { label: string; seats: ScreeningOgSeat[] }[];
}

const NIGHT = "#0c1220";
const PAPER = "#f9ecf0";
const INK = "#23142d";
const INK_FAINT = "rgba(35,20,45,0.45)";
const SPOILER = "#ffccd9";
const ACCENT = "#ff8fb1";
const GOLD = "#ffe7a3";

const SEAT_SIZE = 26;
const SEAT_GAP = 8;

const SEAT_STYLE: Record<ScreeningOgSeat, React.CSSProperties> = {
  empty: { border: `2px solid ${INK_FAINT}`, background: "transparent" },
  guest: { border: `2px solid ${ACCENT}`, background: ACCENT },
  overflow: { border: `2px solid ${INK}`, background: INK },
};

/**
 * 친구 시사회 공유 미리보기(1200x630) — 상영관 초대장.
 * 왼쪽은 초대 문구, 오른쪽은 스크린과 좌석 배치도가 그려진 종이 티켓이다.
 * `next/og` ImageResponse 안에서만 쓴다. Satori 제약상 인라인 style + flex만 쓴다.
 * 개인정보 B안에 따라 주최자 이름만 받고, 관객은 이름 없이 좌석 점유 여부만 받는다.
 */
export const ScreeningOgImage = ({
  kicker,
  title,
  audience,
  cta,
  brand,
  admit,
  screen,
  seatRows,
}: ScreeningOgImageProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "100%",
      padding: "0 72px",
      gap: 56,
      backgroundColor: NIGHT,
      backgroundImage:
        "radial-gradient(ellipse 50% 75% at 78% 50%, rgba(255,143,177,0.22), rgba(12,18,32,0) 72%)",
      color: "#ffffff",
      fontFamily: "SB",
      wordBreak: "keep-all",
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 26 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 28,
          color: GOLD,
          letterSpacing: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 12,
            height: 12,
            borderRadius: 6,
            background: GOLD,
          }}
        />
        {kicker}
      </div>
      <div style={{ display: "flex", fontSize: 62, lineHeight: 1.22 }}>
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 30,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {audience}
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "flex-start",
          marginTop: 8,
          padding: "16px 30px",
          borderRadius: 999,
          background: SPOILER,
          color: INK,
          fontSize: 28,
        }}
      >
        {cta}
      </div>
      <div style={{ display: "flex", fontSize: 26, color: SPOILER }}>
        {brand}
      </div>
    </div>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 420,
        padding: "26px 30px 30px",
        borderRadius: 10,
        background: PAPER,
        color: INK,
        boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        transform: "rotate(1.5deg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignSelf: "stretch",
          justifyContent: "center",
          paddingBottom: 14,
          marginBottom: 22,
          borderBottom: `2px dashed ${INK_FAINT}`,
          fontSize: 22,
          letterSpacing: 6,
        }}
      >
        {admit}
      </div>
      <div
        style={{
          display: "flex",
          width: 330,
          height: 8,
          marginBottom: 10,
          borderRadius: 4,
          background: INK,
          boxShadow: `0 10px 24px ${ACCENT}`,
        }}
      />
      <div
        style={{
          display: "flex",
          marginBottom: 18,
          fontSize: 16,
          letterSpacing: 6,
          color: INK_FAINT,
        }}
      >
        {screen}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: SEAT_GAP }}>
        {seatRows.map((row) => (
          <div
            key={row.label}
            style={{ display: "flex", alignItems: "center", gap: SEAT_GAP }}
          >
            <div
              style={{
                display: "flex",
                width: 20,
                fontSize: 16,
                color: INK_FAINT,
              }}
            >
              {row.label}
            </div>
            {row.seats.map((seat, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  width: SEAT_SIZE,
                  height: SEAT_SIZE,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px 8px 4px 4px",
                  fontSize: 18,
                  color: PAPER,
                  ...SEAT_STYLE[seat],
                }}
              >
                {/* 열이 넘친 인원 — 페이지의 "+N" 좌석과 같은 자리 */}
                {seat === "overflow" ? "+" : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
