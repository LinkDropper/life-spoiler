import type * as ThreeModule from "three";

import { BRANCH_GRID_POSITIONS } from "./palace-layout";

// ============================================================
// 밤하늘 → 명반
// ------------------------------------------------------------
// 스크롤 진행도(0~1) 하나로 두 장면을 잇는다.
//   0.00~0.45  카메라가 별 무리를 뚫고 앞으로 나아간다 (3D 비행)
//   0.20~0.55  별의 일부가 12궁 명반 칸으로 모여든다
// 명반 칸 위치는 DOM 격자(PalaceGrid)의 실제 화면 좌표에 맞춘다. 카메라가 도착하면
// z=0 평면의 1 단위가 정확히 1 CSS 픽셀이 되도록 거리를 잡아, 글자는 DOM이 선명하게
// 그리고 별만 WebGL이 그린다.
// ============================================================

const FOV = 50;
const FLY_DISTANCE = 2400;
const FLY_END = 0.45;
const MIX_START = 0.2;
const MIX_END = 0.55;
/** 칸으로 모이는 별 비율 (나머지는 배경 하늘로 남는다) */
const CONVERGE_RATIO = 0.55;

export interface GridRect {
  left: number;
  top: number;
  size: number;
}

export interface StarFieldOptions {
  /** branch 인덱스별 주성 개수. 주성 자리엔 큰 별을 놓는다 */
  mainStarCounts: number[];
  reducedMotion: boolean;
}

export interface StarField {
  setProgress: (progress: number) => void;
  setHighlight: (branch: number | null) => void;
  setGridRect: (rect: GridRect) => void;
  resize: (width: number, height: number) => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uMix;
  uniform float uTime;
  uniform float uHighlight;
  uniform float uPixelRatio;
  uniform float uScale;
  attribute vec3 aTarget;
  attribute float aCell;
  attribute float aSize;
  attribute float aSeed;
  varying float vHighlight;
  varying float vTwinkle;
  varying float vAlpha;

  void main() {
    float delay = aSeed * 0.35;
    float m = aCell < 0.0 ? 0.0 : clamp((uMix - delay) / 0.65, 0.0, 1.0);
    m = m * m * (3.0 - 2.0 * m);

    vec3 p = mix(position, aTarget, m);
    p.xy += vec2(sin(aSeed * 6.2831 + uTime * 0.3), cos(aSeed * 4.1 + uTime * 0.25)) * 8.0 * (1.0 - m);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float h = (aCell >= 0.0 && abs(aCell - uHighlight) < 0.5) ? 1.0 : 0.0;
    vHighlight = h * m;
    vTwinkle = 0.62 + 0.38 * sin(uTime * 1.7 + aSeed * 40.0);
    vAlpha = aCell < 0.0 ? mix(1.0, 0.4, uMix) : 1.0;
    float pointSize = aSize * (1.0 + vHighlight * 0.9) * (uScale / max(-mv.z, 1.0));
    gl_PointSize = clamp(pointSize, 1.4, 36.0) * uPixelRatio;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHighlightColor;
  varying float vHighlight;
  varying float vTwinkle;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);
    vec3 color = mix(uColor, uHighlightColor, vHighlight);
    gl_FragColor = vec4(color, a * vTwinkle * vAlpha);
  }
`;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

export const createStarField = async (
  canvas: HTMLCanvasElement,
  { mainStarCounts, reducedMotion }: StarFieldOptions
): Promise<StarField> => {
  const THREE: typeof ThreeModule = await import("three");

  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  const isCompact = width < 768;
  const count = isCompact ? 1600 : 3200;
  const pixelRatio = Math.min(window.devicePixelRatio, isCompact ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, width / height, 1, 8000);

  /** z=0 평면에서 1 단위 = 1 CSS 픽셀이 되는 카메라 거리 */
  const restDistance = () => height / (2 * Math.tan((FOV * Math.PI) / 360));

  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const cells = new Float32Array(count);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);

  // 칸마다 배정할 별: 주성 자리엔 큰 별, 나머지는 작은 별
  const convergeCount = Math.floor(count * CONVERGE_RATIO);
  const offsets = new Float32Array(count * 2);

  const scatter = () => {
    const spreadX = width * 1.6;
    const spreadY = height * 1.6;
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * spreadX * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY * 2;
      // 카메라 출발점(restDistance + FLY_DISTANCE) 바로 앞까지 깔아 비행 중 별이 스쳐 지나가게 한다
      positions[i * 3 + 2] =
        -1800 + Math.random() * (restDistance() + FLY_DISTANCE + 1500);
    }
  };

  for (let i = 0; i < count; i += 1) {
    seeds[i] = Math.random();
    if (i < convergeCount) {
      const branch = i % 12;
      const isMainStar = Math.floor(i / 12) < (mainStarCounts[branch] ?? 0);
      cells[i] = branch;
      sizes[i] = isMainStar ? 9 + Math.random() * 3 : 1.6 + Math.random() * 2.4;
      // 주성은 칸 가운데 가까이, 잔별은 칸 전체에 흩뿌린다
      const radius = isMainStar ? 0.12 : 0.4;
      offsets[i * 2] = (Math.random() - 0.5) * 2 * radius;
      offsets[i * 2 + 1] = (Math.random() - 0.5) * 2 * radius;
    } else {
      cells[i] = -1;
      sizes[i] = 1.6 + Math.random() * 2.6;
    }
  }
  scatter();

  const applyGridRect = ({ left, top, size }: GridRect) => {
    const cellSize = size / 4;
    for (let i = 0; i < count; i += 1) {
      const branch = cells[i];
      if (branch < 0) {
        targets[i * 3] = positions[i * 3];
        targets[i * 3 + 1] = positions[i * 3 + 1];
        targets[i * 3 + 2] = positions[i * 3 + 2];
        continue;
      }
      const { row, col } = BRANCH_GRID_POSITIONS[branch];
      const cx = left + (col - 0.5 + offsets[i * 2]) * cellSize;
      const cy = top + (row - 0.5 + offsets[i * 2 + 1]) * cellSize;
      targets[i * 3] = cx - width / 2;
      targets[i * 3 + 1] = -(cy - height / 2);
      targets[i * 3 + 2] = 0;
    }
  };

  const geometry = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(positions, 3);
  const targetAttr = new THREE.BufferAttribute(targets, 3);
  geometry.setAttribute("position", positionAttr);
  geometry.setAttribute("aTarget", targetAttr);
  geometry.setAttribute("aCell", new THREE.BufferAttribute(cells, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uHighlight: { value: -1 },
    uPixelRatio: { value: pixelRatio },
    uScale: { value: restDistance() },
    uColor: { value: new THREE.Color("#fff6e8") },
    uHighlightColor: { value: new THREE.Color("#ffccd9") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  let targetProgress = 0;
  let progress = 0;
  let active = true;
  let frameId = 0;
  const clock = new THREE.Clock();

  // 움직임 줄이기: 카메라 비행·반짝임 없이 별이 칸으로 모이는 것만 스크롤에 맞춘다
  const renderFrame = () => {
    progress += (targetProgress - progress) * (reducedMotion ? 1 : 0.08);
    const fly = reducedMotion ? 1 : easeOutCubic(clamp01(progress / FLY_END));
    camera.position.z = restDistance() + (1 - fly) * FLY_DISTANCE;
    camera.rotation.z = (1 - fly) * 0.35;
    uniforms.uMix.value = clamp01(
      (progress - MIX_START) / (MIX_END - MIX_START)
    );
    uniforms.uTime.value = reducedMotion ? 0 : clock.getElapsedTime();
    renderer.render(scene, camera);
  };

  const loop = () => {
    renderFrame();
    frameId = active ? requestAnimationFrame(loop) : 0;
  };

  const handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (active && !frameId) {
      frameId = requestAnimationFrame(loop);
    }
  };
  document.addEventListener("visibilitychange", handleVisibility);

  camera.position.z = restDistance();
  frameId = requestAnimationFrame(loop);

  return {
    setProgress: (value) => {
      targetProgress = clamp01(value);
    },
    setHighlight: (branch) => {
      uniforms.uHighlight.value = branch ?? -1;
    },
    setGridRect: (rect) => {
      applyGridRect(rect);
      targetAttr.needsUpdate = true;
    },
    resize: (nextWidth, nextHeight) => {
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      uniforms.uScale.value = restDistance();
      scatter();
      positionAttr.needsUpdate = true;
    },
    setActive: (next) => {
      active = next;
      if (active && !frameId && !document.hidden) {
        frameId = requestAnimationFrame(loop);
      }
    },
    dispose: () => {
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", handleVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
};
