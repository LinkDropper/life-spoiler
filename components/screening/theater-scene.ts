import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { createScreenPainter } from "./theater-screen";

import type {
  ScreeningPhase,
  ScreeningTimeline,
} from "@/libs/screening/screening-policy";

// ============================================================
// 상영관 입장 3D 장면 (docs/home-redesign-2026-11.md §8, designer 검토 2026-11-04)
// ------------------------------------------------------------
// 관객 시점: 계단식 객석 가운데 줄에서 앞을 본다. 스크린은 홈 필름 칸과 같은 16:10.5.
//   - 객석 조명은 꺼져 있고(다운라이트·벽등이 희미하게만 남음), 영사기가 켜지며 노출이 함께 오른다.
//     약식 한 가지만 쓴다(2026-11-04 사용자 결정: 조명 꺼짐·셔터·카운트다운이 있던 풀버전 삭제).
//   - 스크린 빛은 RectAreaLight로 객석에 실제로 비친다: 와인 벨벳 좌석 윗선에 핑크 광택, 관객 머리 윤곽.
//   - 영사기는 관객 뒤 위쪽. 빛줄기는 아주 옅게(가산 0.06~0.1), 먼지가 그 안에서만 떠다닌다.
//   - 개막: 카메라가 스크린 속으로 들어가고 결과 페이지 배경색으로 이어진다(흰 번쩍임 없음).
// 화면 밝기 상한 0.9, 블룸은 작은 하이라이트(별·타이틀·벽등)만 번지게 threshold 높게.
// ============================================================

const SCREEN_W = 8;
const SCREEN_H = SCREEN_W * (10.5 / 16);
const SCREEN_Z = -13;
const SCREEN_Y = 1.5; // 스크린 가운데 높이
const ROWS = 8;
const SEATS_PER_ROW = 11;
const SEAT_PITCH = 0.62;
const ROW_DEPTH = 1.0;
const ROW_RISE = 0.32;
const EYE = new THREE.Vector3(0, 1.5, 0.6);
const PROJECTOR = new THREE.Vector3(0, 4.4, 4.5);
const SCREEN_LIGHT_COLOR = new THREE.Color("#cfd0ff");
const SCREEN_MAX_BRIGHTNESS = 0.9;
const DUST_COUNT = 320;

const SEAT_COLOR = "#5a2850";
// 어두운 객석이지만 반사율이 거의 0이면 빛을 받아도 안 보인다 — 실제 상영관처럼 짙은 남색 정도로
const ROOM_COLOR = "#262d4a";

export interface TheaterSceneOptions {
  container: HTMLElement;
  title: string;
  /** 하늘 시드 (작품명마다 같은 하늘) */
  seedKey: string;
  fontFamily: string;
  timeline: ScreeningTimeline;
  isMobile: boolean;
  /** 첫 프레임을 그렸을 때 (캔버스를 그때 보이게 한다) */
  onFirstFrame?: () => void;
  onError?: (error: unknown) => void;
}

export interface TheaterScene {
  setPhase: (phase: ScreeningPhase) => void;
  setCaption: (caption: string) => void;
  destroy: () => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 고정 시드 난수 — 매번 같은 객석 */
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const rowFloorY = (row: number) => -ROW_RISE * (row + 1);
const rowZ = (row: number) => -1.1 - row * ROW_DEPTH;

/** 좌석 하나: 등받이 + 방석 + 팔걸이(한쪽) — 인스턴스로 찍는다 */
const createSeatGeometry = () => {
  const back = new RoundedBoxGeometry(0.54, 0.78, 0.14, 3, 0.06);
  back.translate(0, 0.86, 0.2);
  back.rotateX(-0.08);
  const cushion = new RoundedBoxGeometry(0.52, 0.13, 0.5, 3, 0.05);
  cushion.translate(0, 0.46, -0.05);
  const arm = new RoundedBoxGeometry(0.07, 0.07, 0.52, 2, 0.03);
  arm.translate(SEAT_PITCH / 2, 0.66, 0);
  const merged = mergeGeometries([back, cushion, arm]);
  [back, cushion, arm].forEach((geometry) => geometry.dispose());
  return merged;
};

/** 관객 뒷모습: 머리 + 목 + 어깨 */
const createViewerGeometry = () => {
  const head = new THREE.SphereGeometry(0.115, 24, 16);
  head.scale(1, 1.12, 1);
  head.translate(0, 1.6, 0.2);
  const neck = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 12);
  neck.translate(0, 1.44, 0.22);
  const shoulders = new THREE.CapsuleGeometry(0.11, 0.26, 6, 16);
  shoulders.rotateZ(Math.PI / 2);
  shoulders.scale(1, 1, 0.75);
  shoulders.translate(0, 1.33, 0.24);
  const merged = mergeGeometries([head, neck, shoulders]);
  [head, neck, shoulders].forEach((geometry) => geometry.dispose());
  return merged;
};

/** 빛줄기: 영사기 창(작은 사각형)에서 스크린 네 모서리로 가는 사각뿔대 */
const createBeamGeometry = () => {
  const near = [
    new THREE.Vector3(-0.18, 0.11, 0),
    new THREE.Vector3(0.18, 0.11, 0),
    new THREE.Vector3(0.18, -0.11, 0),
    new THREE.Vector3(-0.18, -0.11, 0),
  ].map((v) => v.add(PROJECTOR));
  const far = [
    new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z),
    new THREE.Vector3(SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z),
    new THREE.Vector3(SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z),
    new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z),
  ];
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let side = 0; side < 4; side += 1) {
    const next = (side + 1) % 4;
    const quad = [near[side], near[next], far[next], far[side]];
    const quadUv = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    [0, 1, 2, 0, 2, 3].forEach((index) => {
      positions.push(quad[index].x, quad[index].y, quad[index].z);
      uvs.push(quadUv[index][0], quadUv[index][1]);
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
};

const NOISE_GLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

const createBeamMaterial = () =>
  new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color("#eeeaff") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uIntensity;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vWorld;
      ${NOISE_GLSL}
      void main() {
        // 가장자리는 부드럽게, 광원 쪽이 밝고 스크린 쪽이 옅다
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        // 카메라 바로 위(광원 쪽)는 화면 위쪽을 뿌옇게 덮으므로 비우고, 객석 중간부터 보이게
        float along = smoothstep(0.42, 0.78, vUv.y) * mix(1.0, 0.6, vUv.y);
        // 천천히 흐르는 연기
        float haze = noise(vWorld * 0.55 + vec3(0.0, uTime * 0.12, uTime * 0.05));
        haze = 0.55 + 0.9 * haze * noise(vWorld * 1.7 - vec3(uTime * 0.08));
        float alpha = edge * along * haze * uIntensity;
        gl_FragColor = vec4(uColor * alpha, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

/** 빛줄기 안에서만 떠다니는 먼지 */
const createDust = (random: () => number) => {
  const positions = new Float32Array(DUST_COUNT * 3);
  const seeds = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i += 1) {
    // 빛줄기 길이 방향 t(광원 0 → 스크린 1)와 단면 안의 위치
    const t = 0.58 + random() * 0.38;
    const halfW = THREE.MathUtils.lerp(0.18, SCREEN_W / 2, t) * 0.8;
    const halfH = THREE.MathUtils.lerp(0.11, SCREEN_H / 2, t) * 0.8;
    const center = new THREE.Vector3().lerpVectors(
      PROJECTOR,
      new THREE.Vector3(0, SCREEN_Y, SCREEN_Z),
      t
    );
    positions[i * 3] = center.x + (random() * 2 - 1) * halfW;
    positions[i * 3 + 1] = center.y + (random() * 2 - 1) * halfH;
    positions[i * 3 + 2] = center.z;
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uPixelRatio: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vTwinkle;
      void main() {
        vec3 p = position;
        float t = uTime * (0.08 + aSeed * 0.1) + aSeed * 40.0;
        p += vec3(sin(t) * 0.25, sin(t * 0.7 + aSeed * 6.0) * 0.18, cos(t * 0.5) * 0.3);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(3.0, (0.8 + aSeed * 1.2) * (5.0 / -mv.z)) * uPixelRatio;
        vTwinkle = 0.4 + 0.6 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 12.0) * 0.5 + 0.3;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uIntensity;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vTwinkle * uIntensity;
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * a, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
};

/** 필름 그레인 + 비네트 + 마지막 결과 페이지 배경색으로의 디졸브 */
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Color("#0c1220") },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uFade;
    uniform vec3 uFadeColor;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = rand(vUv * 731.0 + fract(uTime * 7.0)) - 0.5;
      color.rgb += grain * 0.035;
      float v = smoothstep(0.95, 0.35, length((vUv - 0.5) * vec2(1.0, 1.15)));
      color.rgb *= mix(0.55, 1.0, v);
      color.rgb = mix(color.rgb, uFadeColor, uFade);
      gl_FragColor = color;
    }
  `,
};

export const createTheaterScene = ({
  container,
  title,
  seedKey,
  fontFamily,
  timeline,
  isMobile,
  onFirstFrame,
  onError,
}: TheaterSceneOptions): TheaterScene => {
  const random = createRandom(20261104);

  // ---------- 렌더러 ----------
  const renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    powerPreference: "high-performance",
  });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor("#04060c", 1);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
  });
  container.appendChild(canvas);

  RectAreaLightUniformsLib.init();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#04060c", 12, 26);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // ---------- 객석: 계단 바닥, 벽 슬랫, 천장 ----------
  const roomMaterial = track(
    new THREE.MeshStandardMaterial({ color: ROOM_COLOR, roughness: 0.92 })
  );
  const carpetMaterial = track(
    new THREE.MeshStandardMaterial({ color: "#1c2034", roughness: 1 })
  );
  for (let row = -1; row < ROWS + 1; row += 1) {
    const step = new THREE.Mesh(
      track(new THREE.BoxGeometry(12, 0.4, ROW_DEPTH)),
      carpetMaterial
    );
    step.position.set(0, rowFloorY(row) - 0.2, rowZ(row));
    scene.add(step);
  }
  const frontFloor = new THREE.Mesh(
    track(new THREE.PlaneGeometry(14, 6)),
    carpetMaterial
  );
  frontFloor.rotation.x = -Math.PI / 2;
  frontFloor.position.set(0, rowFloorY(ROWS), SCREEN_Z + 2.5);
  scene.add(frontFloor);

  const wallGeometry = track(new THREE.PlaneGeometry(22, 10));
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(wallGeometry, roomMaterial);
    wall.rotation.y = -side * (Math.PI / 2);
    wall.position.set(side * 6, 1.5, -6);
    scene.add(wall);
  });
  const ceiling = new THREE.Mesh(
    track(new THREE.PlaneGeometry(14, 24)),
    roomMaterial
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 6.2, -6);
  scene.add(ceiling);
  const backWall = new THREE.Mesh(
    track(new THREE.PlaneGeometry(14, 12)),
    roomMaterial
  );
  backWall.position.set(0, 1, SCREEN_Z - 0.15);
  scene.add(backWall);

  // 벽 흡음 슬랫(세로 띠) — 스크린 빛에 결이 드러난다
  const slatGeometry = track(new THREE.BoxGeometry(0.06, 7, 0.22));
  const slatMaterial = track(
    new THREE.MeshStandardMaterial({ color: "#323a5e", roughness: 0.7 })
  );
  const slatsPerWall = 26;
  const slats = new THREE.InstancedMesh(
    slatGeometry,
    slatMaterial,
    slatsPerWall * 2
  );
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < slatsPerWall * 2; i += 1) {
    const side = i < slatsPerWall ? -1 : 1;
    const z = 2 - (i % slatsPerWall) * 0.58;
    matrix.makeTranslation(side * 5.95, 2.2, z);
    slats.setMatrixAt(i, matrix);
  }
  scene.add(slats);

  // ---------- 스크린 ----------
  const masking = new THREE.Mesh(
    track(new THREE.PlaneGeometry(SCREEN_W + 0.9, SCREEN_H + 0.9)),
    track(new THREE.MeshBasicMaterial({ color: "#000" }))
  );
  masking.position.set(0, SCREEN_Y, SCREEN_Z - 0.02);
  scene.add(masking);

  const painter = createScreenPainter(seedKey, fontFamily);
  const screenTexture = track(new THREE.CanvasTexture(painter.canvas));
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  // 매번 다시 올리는 텍스처라 밉맵을 만들지 않는다(업로드마다 밉맵 재생성 + 메모리 1/3 추가를 피한다)
  screenTexture.generateMipmaps = false;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.magFilter = THREE.LinearFilter;
  const screenMaterial = track(
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false })
  );
  const screen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H)),
    screenMaterial
  );
  screen.position.set(0, SCREEN_Y, SCREEN_Z);
  scene.add(screen);
  // 스크린 빛이 객석에 실제로 비친다
  const screenLight = new THREE.RectAreaLight(
    SCREEN_LIGHT_COLOR,
    0,
    SCREEN_W,
    SCREEN_H
  );
  screenLight.position.set(0, SCREEN_Y, SCREEN_Z + 0.05);
  screenLight.lookAt(0, SCREEN_Y, 0);
  scene.add(screenLight);
  // 브랜드 림: 핑크·라벤더 (오늘의 운세와 같은 색)
  const rimPink = new THREE.DirectionalLight("#ff9ec0", 0);
  rimPink.position.set(3, 3, -12);
  scene.add(rimPink);
  const rimLavender = new THREE.DirectionalLight("#9d8cff", 0);
  rimLavender.position.set(-3, 2.5, -12);
  scene.add(rimLavender);
  const ambient = new THREE.HemisphereLight("#2a2f55", "#1a0d1a", 0.06);
  scene.add(ambient);

  // ---------- 꺼진 객석 조명: 천장 다운라이트·스크린 양옆 벽등이 희미하게만 남아 있다 ----------
  const sconceMaterial = track(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.7, 0.48).multiplyScalar(0.12),
      toneMapped: false,
    })
  );
  const downlightGeometry = track(new THREE.CircleGeometry(0.07, 20));
  const downlightColumns = [-3.2, -1.1, 1.1, 3.2];
  const downlightRows = 7;
  const downlights = new THREE.InstancedMesh(
    downlightGeometry,
    sconceMaterial,
    downlightColumns.length * downlightRows
  );
  const downQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(Math.PI / 2, 0, 0)
  );
  downlightColumns.forEach((x, column) => {
    for (let row = 0; row < downlightRows; row += 1) {
      matrix.compose(
        new THREE.Vector3(x, 6.18, -1.5 - row * 1.6),
        downQuaternion,
        new THREE.Vector3(1, 1, 1)
      );
      downlights.setMatrixAt(column * downlightRows + row, matrix);
    }
  });
  scene.add(downlights);

  const sconceGeometry = track(
    new THREE.CylinderGeometry(0.1, 0.16, 0.42, 20, 1, true)
  );
  [-1, 1].forEach((side) => {
    const mesh = new THREE.Mesh(sconceGeometry, sconceMaterial);
    mesh.position.set(
      side * (SCREEN_W / 2 + 0.85),
      SCREEN_Y + 0.9,
      SCREEN_Z + 0.12
    );
    scene.add(mesh);
  });

  // ---------- 좌석: 와인 벨벳, 화면 빛이 닿는 윗선에 핑크 광택 ----------
  const seatGeometry = track(createSeatGeometry());
  const seatMaterial = track(
    new THREE.MeshPhysicalMaterial({
      color: SEAT_COLOR,
      roughness: 0.78,
      sheen: 1,
      sheenColor: new THREE.Color("#ff9ec0"),
      sheenRoughness: 0.42,
    })
  );
  const seats = new THREE.InstancedMesh(
    seatGeometry,
    seatMaterial,
    ROWS * SEATS_PER_ROW
  );
  let seatIndex = 0;
  const seatX = (row: number, seat: number) =>
    (seat - (SEATS_PER_ROW - 1) / 2) * SEAT_PITCH +
    (row % 2 === 0 ? 0 : SEAT_PITCH / 2);
  for (let row = 0; row < ROWS; row += 1) {
    // 줄마다 반 칸씩 엇갈려 앞사람 머리 사이로 스크린이 보이게
    for (let i = 0; i < SEATS_PER_ROW; i += 1) {
      matrix.makeTranslation(seatX(row, i), rowFloorY(row), rowZ(row));
      seats.setMatrixAt(seatIndex, matrix);
      seatIndex += 1;
    }
  }
  scene.add(seats);

  // ---------- 관객: 가까운 두세 명은 크게, 먼 줄은 드문드문 ----------
  const viewerGeometry = track(createViewerGeometry());
  const viewerMaterial = track(
    new THREE.MeshStandardMaterial({
      color: "#1a1d2c",
      roughness: 0.62,
      metalness: 0,
    })
  );
  const viewerSpots: [number, number, number][] = [
    // [줄, 좌석 번호(0~10, 5가 가운데), 기울기] — 바로 앞줄의 두 사람이 가장 크게 보인다
    [0, 4, 0.05],
    [0, 7, -0.04],
    [1, 2, 0.02],
    [2, 6, -0.06],
    [3, 1, 0.04],
    [3, 8, 0],
    [4, 4, 0.03],
    [5, 9, -0.03],
    [6, 2, 0.05],
    [6, 6, 0],
  ];
  const viewers = new THREE.InstancedMesh(
    viewerGeometry,
    viewerMaterial,
    viewerSpots.length
  );
  const quaternion = new THREE.Quaternion();
  viewerSpots.forEach(([row, seat, lean], i) => {
    const x = seatX(row, seat);
    const scale = 0.96 + random() * 0.1;
    quaternion.setFromEuler(new THREE.Euler(0, (random() - 0.5) * 0.2, lean));
    matrix.compose(
      new THREE.Vector3(x, rowFloorY(row), rowZ(row)),
      quaternion,
      new THREE.Vector3(scale, scale, scale)
    );
    viewers.setMatrixAt(i, matrix);
  });
  scene.add(viewers);

  // ---------- 통로 계단등: 상영 중에도 켜져 있는 작은 호박색 점 ----------
  const stepLightGeometry = track(new THREE.BoxGeometry(0.16, 0.025, 0.025));
  const stepLightMaterial = track(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffb27a").multiplyScalar(1.6),
      toneMapped: false,
    })
  );
  const stepLights = new THREE.InstancedMesh(
    stepLightGeometry,
    stepLightMaterial,
    ROWS * 2
  );
  for (let row = 0; row < ROWS; row += 1) {
    [-1, 1].forEach((side, i) => {
      matrix.makeTranslation(
        side * (((SEATS_PER_ROW + 1) / 2) * SEAT_PITCH + 0.35),
        rowFloorY(row) + 0.03,
        rowZ(row) + ROW_DEPTH / 2 - 0.02
      );
      stepLights.setMatrixAt(row * 2 + i, matrix);
    });
  }
  scene.add(stepLights);

  // 뒤쪽 영사실에서 새는 아주 옅은 빛: 앞줄 등받이의 벨벳 결이 보이게
  const backFill = new THREE.DirectionalLight("#8a7cff", 0);
  backFill.position.set(0, 5, 6);
  scene.add(backFill);

  // ---------- 빛줄기·먼지 ----------
  const beamMaterial = track(createBeamMaterial());
  const beam = new THREE.Mesh(track(createBeamGeometry()), beamMaterial);
  beam.renderOrder = 2;
  scene.add(beam);
  const dust = createDust(random);
  track(dust.geometry);
  track(dust.material as THREE.ShaderMaterial);
  (dust.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value =
    pixelRatio;
  dust.renderOrder = 3;
  scene.add(dust);

  // ---------- 후처리: 블룸(작은 하이라이트만) + 그레인·비네트·디졸브 ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(256, 256),
    0.42,
    0.6,
    0.86
  );
  composer.addPass(bloom);
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);
  composer.addPass(new OutputPass());

  // ---------- 크기 ----------
  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;
    camera.aspect = aspect;
    // 스크린 가로가 화면 폭의 약 80%가 되도록 세로 화각을 정한다 (가로 화면은 40° 하한)
    const distance = EYE.z - SCREEN_Z;
    const halfWidth = SCREEN_W / 2 / 0.8;
    const vertical =
      2 * Math.atan(Math.tan(Math.atan(halfWidth / distance)) / aspect);
    camera.fov = Math.max(40, Math.min(72, THREE.MathUtils.radToDeg(vertical)));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    bloom.resolution.set(width / 2, height / 2);
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  // ---------- 단계 ----------
  const startedAt = performance.now();
  let phase: ScreeningPhase = "entering";
  let phaseAt = 0;
  let caption = "";

  const lookTarget = new THREE.Vector3();
  const baseLook = new THREE.Vector3(0, 0.55, SCREEN_Z);
  const screenCenter = new THREE.Vector3(0, SCREEN_Y, SCREEN_Z);
  let hasRendered = false;
  let isDestroyed = false;
  /** 120Hz 화면에서도 초당 60번까지만 그리고, 스크린 텍스처는 초당 30번만 다시 올린다 */
  const MIN_FRAME_MS = 1000 / 60 - 1;
  const MIN_SCREEN_PAINT_MS = 1000 / 30 - 1;
  let lastFrameAt = -Infinity;
  let lastPaintAt = -Infinity;

  const frame = () => {
    if (isDestroyed) {
      return;
    }
    const ms = performance.now() - startedAt;
    if (ms - lastFrameAt < MIN_FRAME_MS) {
      return;
    }
    lastFrameAt = ms;
    const seconds = ms / 1000;
    const phaseMs = ms - phaseAt;

    // 영사기가 한 번 깜박이며 켜지고 스크린이 밝아진다. 화면 밝기 상한 0.9
    const projector = clamp01((ms - timeline.projectorAt) / 420);
    const flicker =
      projector < 1 && projector > 0.3 && projector < 0.5 ? 0.55 : 1;
    const lit = easeOut(projector) * flicker;
    screenMaterial.color.setScalar(SCREEN_MAX_BRIGHTNESS * lit);
    screenLight.intensity = 7 * lit;
    rimPink.intensity = 0.5 * lit;
    rimLavender.intensity = 0.35 * lit;
    backFill.intensity = 0.12 + 0.28 * lit;
    beamMaterial.uniforms.uIntensity.value = 0.07 * projector * flicker;
    beamMaterial.uniforms.uTime.value = seconds;
    const dustMaterial = dust.material as THREE.ShaderMaterial;
    dustMaterial.uniforms.uIntensity.value = 0.55 * projector;
    dustMaterial.uniforms.uTime.value = seconds;
    // 노출: 어두운 객석에서 스크린이 켜지며 함께 오른다(designer)
    renderer.toneMappingExposure = 0.55 + 0.5 * lit;

    // 스크린 화면 (초당 30번만 다시 그린다)
    const titleOpacity = clamp01((ms - timeline.titleAt) / 320);
    const shouldPaint = ms - lastPaintAt >= MIN_SCREEN_PAINT_MS;
    if (shouldPaint) {
      lastPaintAt = ms;
      const revealT = phase === "revealing" ? phaseMs / timeline.revealMs : 0;
      painter.paint({
        title,
        caption,
        // 개막 땐 타이틀이 빠지고 밤하늘과 명반의 별만 남는다
        titleOpacity:
          phase === "revealing" ? 1 - clamp01(phaseMs / 220) : titleOpacity,
        starGlow: clamp01(revealT * 1.6),
        time: seconds,
      });
      screenTexture.needsUpdate = true;
    }

    // 카메라: 아주 작은 저주파 흔들림, 입장 때 살짝 자리 잡기, 개막 때 스크린 속으로
    const settle = easeOut(clamp01(ms / 1400));
    const drift = new THREE.Vector3(
      Math.sin(seconds * 0.35) * 0.025,
      Math.sin(seconds * 0.27 + 1.3) * 0.018,
      0
    );
    camera.position.copy(EYE).add(drift);
    camera.position.z += (1 - settle) * 0.5;
    lookTarget.copy(baseLook);
    let fade = 0;
    if (phase === "revealing") {
      const t = easeInOut(clamp01(phaseMs / timeline.revealMs));
      // 카메라가 빛줄기 안으로 들어가므로 빛줄기·먼지는 걷어 낸다
      beamMaterial.uniforms.uIntensity.value *= 1 - t;
      dustMaterial.uniforms.uIntensity.value *= 1 - t;
      camera.position.lerp(new THREE.Vector3(0, SCREEN_Y, SCREEN_Z + 1.6), t);
      lookTarget.lerp(screenCenter, t);
      fade = clamp01((phaseMs / timeline.revealMs - 0.55) / 0.45);
    }
    camera.lookAt(lookTarget);
    finish.uniforms.uTime.value = seconds;
    finish.uniforms.uFade.value = fade;

    composer.render();
    if (!hasRendered) {
      hasRendered = true;
      onFirstFrame?.();
    }
  };

  // 셰이더를 미리 컴파일해 첫 프레임 끊김을 줄인다
  try {
    renderer.compile(scene, camera);
  } catch (error) {
    onError?.(error);
  }
  renderer.setAnimationLoop(frame);

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    onError?.(new Error("WebGL 컨텍스트가 사라졌습니다."));
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  return {
    setPhase: (next) => {
      if (next === phase) {
        return;
      }
      phase = next;
      phaseAt = performance.now() - startedAt;
    },
    setCaption: (next) => {
      caption = next;
    },
    destroy: () => {
      isDestroyed = true;
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      disposables.forEach((item) => item.dispose());
      seats.dispose();
      downlights.dispose();
      stepLights.dispose();
      viewers.dispose();
      slats.dispose();
      composer.dispose();
      bloom.dispose();
      painter.dispose();
      renderer.dispose();
      // GC를 기다리지 않고 GPU 메모리를 바로 돌려준다(모바일은 WebGL 컨텍스트 수·메모리 상한이 낮다)
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
};
