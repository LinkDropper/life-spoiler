import {
  SKY_HEIGHT,
  SKY_WIDTH,
  createNightSky,
} from "@/libs/landing/night-sky";

// ============================================================
// 상영관 스크린에 비치는 화면 (2D 캔버스 → three.js CanvasTexture)
// ------------------------------------------------------------
// 홈·랜딩 인생 필름과 같은 밤하늘(libs/landing/night-sky) 위에
// 금색 작품명·안내·필름 감김 표시를 그리고, 개막 때 명반의 별 하나를 밝힌다.
// 밤하늘은 한 번만 그려 두고, 매 프레임에는 글자·움직이는 것만 덧그린다.
// ============================================================

/** 그리는 좌표계(논리 크기). 실제 캔버스는 RESOLUTION_SCALE배로 만든다 */
export const SCREEN_CANVAS_WIDTH = 1024;
export const SCREEN_CANVAS_HEIGHT = 672; // 16:10.5
/**
 * 폰에서 스크린은 화면 폭의 약 80%(390px × 1.5배 ≈ 470px)로 보이므로 768px이면 충분하다.
 * 1024 → 768로 캔버스 두 장의 메모리가 약 5.5MB → 3.1MB로 준다.
 */
const RESOLUTION_SCALE = 0.75;

const createScaledCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(SCREEN_CANVAS_WIDTH * RESOLUTION_SCALE);
  canvas.height = Math.round(SCREEN_CANVAS_HEIGHT * RESOLUTION_SCALE);
  const ctx = canvas.getContext("2d");
  ctx?.setTransform(RESOLUTION_SCALE, 0, 0, RESOLUTION_SCALE, 0, 0);
  return { canvas, ctx };
};

/** iOS Safari는 캔버스 메모리 총량에 상한이 있어, 다 쓴 캔버스는 크기를 0으로 만들어 바로 돌려준다 */
const releaseCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

const GOLD = "#ffe7a3";
const SKY_TINT = "#c4b5ff";

export interface ScreenFrameState {
  title: string;
  caption: string;
  /** 0~1: 타이틀 카드가 나타난 정도 */
  titleOpacity: number;
  /** 0~1: 명반의 주성 하나가 점등되는 정도(개막 때) — "내 인생이 상영된다"(designer) */
  starGlow: number;
  /** 초 단위 시간 — 하늘이 천천히 다가오고 스프로킷이 흐른다 */
  time: number;
}

const paintSky = (
  seedKey: string
): { canvas: HTMLCanvasElement; mainStar: { x: number; y: number } } => {
  const { canvas, ctx } = createScaledCanvas();
  const sky = createNightSky(seedKey, SKY_TINT, ["main", "sub"]);
  const sx = SCREEN_CANVAS_WIDTH / SKY_WIDTH;
  const sy = SCREEN_CANVAS_HEIGHT / SKY_HEIGHT;
  const [first] = sky.mainStars;
  const mainStar = first
    ? { x: first.x * sx, y: first.y * sy }
    : { x: SCREEN_CANVAS_WIDTH * 0.3, y: SCREEN_CANVAS_HEIGHT * 0.3 };
  if (!ctx) {
    return { canvas, mainStar };
  }

  const base = ctx.createLinearGradient(0, 0, 0, SCREEN_CANVAS_HEIGHT);
  base.addColorStop(0, "#0a1024");
  base.addColorStop(1, "#060a18");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SCREEN_CANVAS_WIDTH, SCREEN_CANVAS_HEIGHT);

  // 성운: 회전한 타원 방사 그라디언트
  ctx.globalCompositeOperation = "lighter";
  for (const cloud of sky.clouds) {
    ctx.save();
    ctx.translate(cloud.cx * sx, cloud.cy * sy);
    ctx.rotate((cloud.rotate * Math.PI) / 180);
    ctx.scale((cloud.rx * sx) / 100, (cloud.ry * sy) / 100);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
    gradient.addColorStop(0, hexToRgba(cloud.color, cloud.opacity * 0.55));
    gradient.addColorStop(0.55, hexToRgba(cloud.color, cloud.opacity * 0.18));
    gradient.addColorStop(1, hexToRgba(cloud.color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(-100, -100, 200, 200);
    ctx.restore();
  }

  // 은하수 띠
  ctx.save();
  ctx.translate(SCREEN_CANVAS_WIDTH / 2, SCREEN_CANVAS_HEIGHT / 2);
  ctx.rotate((sky.milkyWayRotate * Math.PI) / 180);
  ctx.scale(1, 0.16);
  const band = ctx.createRadialGradient(0, 0, 0, 0, 0, SCREEN_CANVAS_WIDTH);
  band.addColorStop(0, "rgba(220, 210, 255, 0.16)");
  band.addColorStop(0.5, "rgba(160, 150, 230, 0.05)");
  band.addColorStop(1, "rgba(160, 150, 230, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(
    -SCREEN_CANVAS_WIDTH,
    -SCREEN_CANVAS_WIDTH,
    SCREEN_CANVAS_WIDTH * 2,
    SCREEN_CANVAS_WIDTH * 2
  );
  ctx.restore();

  // 잔별
  for (const star of sky.fieldStars) {
    ctx.fillStyle = star.isWarm
      ? `rgba(255, 236, 200, ${star.opacity})`
      : `rgba(230, 235, 255, ${star.opacity})`;
    ctx.beginPath();
    ctx.arc(star.x * sx, star.y * sy, star.r * sx * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 별자리 선
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(220, 215, 255, 0.28)";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  sky.constellation.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x * sx, point.y * sy);
    } else {
      ctx.lineTo(point.x * sx, point.y * sy);
    }
  });
  ctx.stroke();

  // 중간 별·주성: 빛 번짐 + 십자 광채
  ctx.globalCompositeOperation = "lighter";
  const drawGlowStar = (x: number, y: number, size: number) => {
    const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
    halo.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    halo.addColorStop(0.15, "rgba(220, 210, 255, 0.5)");
    halo.addColorStop(1, "rgba(200, 190, 255, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - size * 6, y - size * 6, size * 12, size * 12);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - size * 7, y);
    ctx.lineTo(x + size * 7, y);
    ctx.moveTo(x, y - size * 7);
    ctx.lineTo(x, y + size * 7);
    ctx.stroke();
  };
  sky.midStars.forEach((star) => drawGlowStar(star.x * sx, star.y * sy, 2));
  sky.mainStars.forEach((star) => drawGlowStar(star.x * sx, star.y * sy, 4));
  ctx.globalCompositeOperation = "source-over";
  return { canvas, mainStar };
};

const hexToRgba = (hex: string, alpha: number): string => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

export interface ScreenPainter {
  canvas: HTMLCanvasElement;
  paint: (state: ScreenFrameState) => void;
  dispose: () => void;
}

export const createScreenPainter = (
  seedKey: string,
  fontFamily: string
): ScreenPainter => {
  const { canvas, ctx } = createScaledCanvas();
  const { canvas: sky, mainStar } = paintSky(seedKey);
  const w = SCREEN_CANVAS_WIDTH;
  const h = SCREEN_CANVAS_HEIGHT;

  const fitFont = (text: string, maxWidth: number, start: number) => {
    if (!ctx) {
      return start;
    }
    let size = start;
    ctx.font = `${size}px ${fontFamily}`;
    while (ctx.measureText(text).width > maxWidth && size > 28) {
      size -= 2;
      ctx.font = `${size}px ${fontFamily}`;
    }
    return size;
  };

  const paint = (state: ScreenFrameState) => {
    if (!ctx) {
      return;
    }
    // 하늘이 8초에 걸쳐 천천히 다가온다
    const zoom = 1.06 - Math.min(state.time / 8, 1) * 0.06;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#060a18";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(
      sky,
      (w - w * zoom) / 2,
      (h - h * zoom) / 2,
      w * zoom,
      h * zoom
    );

    // 글자가 읽히도록 가운데를 어둡게
    const shade = ctx.createRadialGradient(
      w / 2,
      h * 0.46,
      0,
      w / 2,
      h * 0.46,
      w * 0.55
    );
    const shadeAlpha = 0.55 * state.titleOpacity;
    shade.addColorStop(0, `rgba(6, 10, 24, ${shadeAlpha})`);
    shade.addColorStop(1, `rgba(6, 10, 24, ${shadeAlpha * 0.25})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);

    // 명반의 주성이 점등된다 (스크린 속으로 들어갈 때)
    if (state.starGlow > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      const radius = 30 + state.starGlow * 70;
      const glow = ctx.createRadialGradient(
        mainStar.x,
        mainStar.y,
        0,
        mainStar.x,
        mainStar.y,
        radius
      );
      glow.addColorStop(0, `rgba(255, 244, 214, ${0.9 * state.starGlow})`);
      glow.addColorStop(0.25, `rgba(255, 210, 230, ${0.4 * state.starGlow})`);
      glow.addColorStop(1, "rgba(255, 180, 210, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(
        mainStar.x - radius,
        mainStar.y - radius,
        radius * 2,
        radius * 2
      );
      ctx.globalCompositeOperation = "source-over";
    }

    // 타이틀 카드
    if (state.titleOpacity > 0.01) {
      ctx.globalAlpha = state.titleOpacity;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const size = fitFont(state.title, w * 0.8, 84);
      ctx.font = `${size}px ${fontFamily}`;
      ctx.shadowColor = "rgba(255, 231, 163, 0.45)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = GOLD;
      ctx.fillText(
        state.title,
        w / 2,
        h * 0.42 + (1 - state.titleOpacity) * 10
      );
      ctx.shadowBlur = 0;
      ctx.font = `600 30px ${fontFamily.includes("Pretendard") ? fontFamily : "Pretendard, sans-serif"}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.fillText(state.caption, w / 2, h * 0.58);

      // 필름 감김: 스크린 아래 가장자리 스프로킷이 흐른다
      const pitch = 54;
      const offset = (state.time * 90) % pitch;
      ctx.fillStyle = "rgba(255, 231, 163, 0.2)";
      for (let x = -pitch + offset; x < w + pitch; x += pitch) {
        ctx.fillRect(w - x, h - 46, 20, 14);
      }
    }

    ctx.globalAlpha = 1;
  };

  return {
    canvas,
    paint,
    dispose: () => {
      releaseCanvas(sky);
      releaseCanvas(canvas);
    },
  };
};
