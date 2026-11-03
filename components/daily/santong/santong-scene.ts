import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import {
  STICK_L,
  STICK_T,
  STICK_W,
  TUBE_FLOOR_Y,
  TUBE_H,
  TUBE_R,
  TUBE_WALL,
  createStickGeometry,
  createStickMaterial,
  createTube,
} from "./santong-assets";
import type { StickLabel } from "./santong-assets";

// ============================================================
// 오늘의 산통
// ------------------------------------------------------------
// 키프레임(승인 렌더) 기준:
//   1 대기  — 통이 가운데, 막대 끝의 붉은 칠이 보인다
//   2 흔들기 — 통(키네마틱)이 흔들리고 막대(동적 강체)가 실제로 부딪히며 달그락거린다
//   3 공개  — 맨 앞 막대 하나가 정해진 궤적으로 솟아올라 카메라 앞, 키프레임 3의 자리에 선다
// 물리는 달그락거림에만 쓴다. 뽑힌 막대의 궤적과 최종 자리는 고정이다 (어디로 튈지 모르는 연출 금지).
// ============================================================

const FIXED_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 3;
const MAX_FRAME_DELTA = 0.1;
/** 실제 중력(1단위≈10cm면 98)보다 느리게 — 달그락거림이 눈에 보이도록 */
const GRAVITY = -25;

const STICK_COUNT = 28;
const WALL_SEGMENTS = 20;
/**
 * 입구 위의 보이지 않는 울타리: 실물 산통은 막대가 길어서 아무리 흔들어도 빠져나오지 않는다.
 * 통보다 조금 넓게 둘러 막대가 자연스럽게 기대되 밖으로 튕겨 나가지는 못하게 한다.
 */
const FENCE_RADIUS = TUBE_R + 0.28;
const FENCE_HEIGHT = 1.6;
/** 한 막대의 최대 속도 — 흔들림이 막대를 날려 보내지 않도록 */
const MAX_STICK_SPEED = 6;
/** 한 스텝 속도 변화(m/s)가 이 이상이면 부딪힌 것으로 본다 (자유낙하 한 스텝은 약 0.42) */
const CLACK_DV_MIN = 0.9;
const CLACK_DV_FULL = 4;
/** 스텝당 소리 수 상한 — 28개가 동시에 부딪혀도 소리가 뭉개지지 않게 */
const MAX_CLACKS_PER_STEP = 2;

// ---------- 흔들기 ----------
const SHAKE_HZ = 4.5;
const SHAKE_DECAY = 2.2;
/** 이 이상 흔들린 상태가 누적되면 막대가 나온다 */
const SHAKE_ACTIVE_LEVEL = 0.4;
const SHAKE_TO_DRAW_SEC = 0.9;
const AUTO_DRAW_SEC = 1.0;
const AUTO_DRAW_ENERGY = 0.85;
const PULL_DEPTH = 0.55;
const MIN_RELEASE_PULL = 0.25;

// ---------- 공개 ----------
const LIFT_SEC = 0.75;
const PRESENT_SEC = 1.0;
const REVEAL_DONE_SEC = LIFT_SEC + PRESENT_SEC + 0.15;
const LIFT_HEIGHT = 1.25;

// ---------- 카메라 (키프레임 1·3과 같은 구도) ----------
const CAMERA_FOV = 28;
const IDLE_CAMERA = new THREE.Vector3(0, 2.5, 9.8);
const IDLE_LOOK = new THREE.Vector3(0, 1.45, 0);
const REVEAL_CAMERA = new THREE.Vector3(0, 3.05, 6.8);
const REVEAL_LOOK = new THREE.Vector3(0, 3.0, 0.6);
/** 뽑힌 막대의 최종 자세 (키프레임 3) */
const REVEAL_POSITION = new THREE.Vector3(0.02, 2.62, 1.2);
const REVEAL_ROTATION = new THREE.Euler(0.02, 0.06, -0.05);

type Phase = "idle" | "revealing" | "revealed";

export interface SantongSceneOptions {
  container: HTMLElement;
  label: StickLabel;
  /** 캔버스에 글자를 쓸 폰트 (next/font의 fontFamily) */
  fontFamily: string;
  seed: number;
  /** 흔들어 막대가 올라오기까지의 진행률 0~1 */
  onShakeProgress?: (progress: number) => void;
  /** 막대끼리·통과 부딪힐 때 (세기 0~1) */
  onCollision?: (strength: number) => void;
  onRevealStart?: () => void;
  onRevealed?: () => void;
}

export interface SantongScene {
  /** 0~1. 화면을 아래로 당긴 정도 */
  setPull: (amount: number) => void;
  /** 놓기. 충분히 당겼으면 세게 흔들리며 막대가 나온다 */
  release: () => boolean;
  /** 기기 흔들림 (0~1) */
  addShake: (intensity: number) => void;
  /** 제스처 없이 흔들어 뽑기 (버튼·키보드) */
  drawAuto: () => void;
  destroy: () => void;
}

const createRandom = (seed: number) => {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 프레임레이트 독립 지수 응답 */
const approach = (value: number, target: number, lambda: number, dt: number) =>
  value + (target - value) * (1 - Math.exp(-lambda * dt));

const isCoarsePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;

export const createSantongScene = async ({
  container,
  label,
  fontFamily,
  seed,
  onShakeProgress,
  onCollision,
  onRevealStart,
  onRevealed,
}: SantongSceneOptions): Promise<SantongScene> => {
  await RAPIER.init();
  // 막대에 쓸 글자의 글리프를 미리 받아 둔다 (unicode-range 분할 폰트)
  await document.fonts.load(`900 160px ${fontFamily}`, `運★${label.grade}`);

  const random = createRandom(seed);
  const isMobile = isCoarsePointer();

  // ---------- 렌더러 ----------
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2)
  );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.setAttribute("aria-hidden", "true");
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);

  // 조명: 따뜻한 키, 브랜드 핑크 림, 라벤더 보조 림, 남색 채움
  const key = new THREE.DirectionalLight("#ffe3c2", 3.2);
  key.position.set(-2.5, 4.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -2;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight("#ff9ec0", 3.4);
  rim.position.set(3, 2.5, -3.5);
  scene.add(rim);
  const rim2 = new THREE.DirectionalLight("#9d8cff", 1.6);
  rim2.position.set(-3.5, 1.5, -2.5);
  scene.add(rim2);
  scene.add(new THREE.HemisphereLight("#3a3a6e", "#2e1431", 0.6));
  // 공개 순간 막대를 비추는 부드러운 빛 (처음엔 꺼 둔다)
  const revealLight = new THREE.PointLight("#ffd9e4", 0, 4, 2);
  revealLight.position.set(0.5, 3.3, 2.4);
  scene.add(revealLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.45 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- 통 ----------
  const tubeGroup = createTube(random, fontFamily);
  scene.add(tubeGroup);

  // ---------- 물리 ----------
  const world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
  world.timestep = FIXED_DT;
  world.integrationParameters.numSolverIterations = 8;

  // 통: 키네마틱 바디 하나에 바닥 + 벽 판 20장 (얇은 판끼리는 트라이메시보다 박스가 안정적)
  const tubeBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(TUBE_R, 0.06, TUBE_R)
      .setTranslation(0, TUBE_FLOOR_Y - 0.06, 0)
      .setFriction(0.5),
    tubeBody
  );
  // 충돌 벽은 보이는 벽보다 바깥으로 두껍게 — 얇고 빠른 막대가 벽을 뚫지 못하게 (안쪽 면 위치는 그대로)
  const COLLIDER_WALL = 0.16;
  const wallRadius = TUBE_R - TUBE_WALL + COLLIDER_WALL / 2;
  const panelHalfWidth = ((Math.PI * wallRadius) / WALL_SEGMENTS) * 1.15;
  const panelRotation = new THREE.Quaternion();
  for (let i = 0; i < WALL_SEGMENTS; i += 1) {
    const angle = (i / WALL_SEGMENTS) * Math.PI * 2;
    // y축으로 angle만큼 돌리면 판의 두께 방향(+z)이 반지름 방향 (sin, 0, cos)을 향한다
    panelRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(panelHalfWidth, TUBE_H / 2, COLLIDER_WALL / 2)
        .setTranslation(
          Math.sin(angle) * wallRadius,
          TUBE_H / 2,
          Math.cos(angle) * wallRadius
        )
        .setRotation(panelRotation)
        .setFriction(0.3),
      tubeBody
    );
  }

  const fenceHalfWidth = ((Math.PI * FENCE_RADIUS) / WALL_SEGMENTS) * 1.15;
  for (let i = 0; i < WALL_SEGMENTS; i += 1) {
    const angle = (i / WALL_SEGMENTS) * Math.PI * 2;
    panelRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        fenceHalfWidth,
        FENCE_HEIGHT / 2,
        COLLIDER_WALL / 2
      )
        .setTranslation(
          Math.sin(angle) * FENCE_RADIUS,
          TUBE_H + FENCE_HEIGHT / 2,
          Math.cos(angle) * FENCE_RADIUS
        )
        .setRotation(panelRotation)
        .setFriction(0.1),
      tubeBody
    );
  }

  // ---------- 막대 ----------
  const stickGeometry = createStickGeometry();
  const plainMaterial = createStickMaterial(random, fontFamily);
  const labeledMaterial = createStickMaterial(random, fontFamily, label);
  interface Stick {
    mesh: THREE.Mesh;
    body: RAPIER.RigidBody;
  }
  const sticks: Stick[] = [];
  const startQuaternion = new THREE.Quaternion();
  const startEuler = new THREE.Euler();
  for (let i = 0; i < STICK_COUNT; i += 1) {
    const a = (i / STICK_COUNT) * Math.PI * 2 + random() * 0.4;
    const rr = 0.04 + Math.sqrt(random()) * 0.24;
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    // 통 안에서 바깥쪽으로 살짝 기대고, 결이 제각각 보이도록 돌린다
    startEuler.set(Math.sin(a) * 0.08, random() * Math.PI, -Math.cos(a) * 0.08);
    startQuaternion.setFromEuler(startEuler);
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          x,
          TUBE_FLOOR_Y + STICK_L / 2 + 0.02 + random() * 0.12,
          z
        )
        .setRotation(startQuaternion)
        .setLinearDamping(0.4)
        .setAngularDamping(0.6)
        .setCcdEnabled(true)
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(STICK_W / 2, STICK_L / 2, STICK_T / 2 + 0.002)
        .setDensity(0.6)
        .setFriction(0.35)
        .setRestitution(0.2),
      body
    );
    const mesh = new THREE.Mesh(stickGeometry, plainMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    sticks.push({ mesh, body });
  }
  // 첫 화면 전에 막대가 통 안에서 자리 잡도록 미리 굴린다
  for (let i = 0; i < 90; i += 1) world.step();

  // ---------- 상태 ----------
  let phase: Phase = "idle";
  let elapsed = 0;
  let accumulator = 0;
  let isDestroyed = false;
  let energy = 0;
  let shakeAccum = 0;
  let autoUntil = 0;
  let pullTarget = 0;
  let pull = 0;
  let revealStartedAt = 0;
  let hasReportedRevealed = false;
  let lastProgress = -1;
  let hero: Stick | null = null;
  // 직전 스텝 속도 — 부딪힘 소리 감지용 (프레임마다 새로 만들지 않는다)
  const lastVelocities = new Float32Array(STICK_COUNT * 3);
  const clackStrengths = [0, 0];
  const heroFrom = new THREE.Vector3();
  const heroFromQuaternion = new THREE.Quaternion();
  const heroRise = new THREE.Vector3();
  const heroFinalQuaternion = new THREE.Quaternion().setFromEuler(
    REVEAL_ROTATION
  );
  const viewport = { width: 1, height: 1 };

  // 루프에서 재사용 (프레임당 할당 없음)
  const tubePosition = { x: 0, y: 0, z: 0 };
  const tubeEuler = new THREE.Euler();
  const tubeQuaternion = new THREE.Quaternion();
  const scratch = new THREE.Vector3();
  const scratchQuaternion = new THREE.Quaternion();
  const lookTarget = new THREE.Vector3();

  /** 가장 앞쪽(카메라 쪽) 가운데 막대를 고른다 — 뽑히는 막대가 화면에서 잘 보이도록 */
  const pickHero = (): Stick => {
    let [best] = sticks;
    let bestScore = -Infinity;
    sticks.forEach((stick) => {
      const p = stick.body.translation();
      const score = p.z - Math.abs(p.x) * 0.6;
      if (score > bestScore) {
        bestScore = score;
        best = stick;
      }
    });
    return best;
  };

  const startReveal = () => {
    if (phase !== "idle") return;
    phase = "revealing";
    revealStartedAt = elapsed;
    hero = pickHero();
    // 뽑히는 순간에만 글자가 적힌 막대로 바꾼다 (통 안에서 미리 보이지 않게)
    hero.mesh.material = labeledMaterial;
    const p = hero.body.translation();
    const q = hero.body.rotation();
    heroFrom.set(p.x, p.y, p.z);
    heroFromQuaternion.set(q.x, q.y, q.z, q.w);
    heroRise.set(p.x * 0.4, TUBE_FLOOR_Y + STICK_L / 2 + LIFT_HEIGHT, p.z);
    hero.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    onRevealStart?.();
  };

  /** 통의 자세: 흔들림(사인) + 당김(아래로·앞으로 기울기) */
  const stepTube = () => {
    const isAuto = phase === "idle" && elapsed < autoUntil;
    if (isAuto) {
      energy = approach(energy, AUTO_DRAW_ENERGY, 12, FIXED_DT);
    } else {
      // 막대가 나오기 시작하면 통은 빠르게 멈춘다
      energy = approach(
        energy,
        0,
        phase === "idle" ? SHAKE_DECAY : 6,
        FIXED_DT
      );
    }
    pull = approach(pull, phase === "idle" ? pullTarget : 0, 14, FIXED_DT);

    const w = Math.PI * 2 * SHAKE_HZ * elapsed;
    tubePosition.x = energy * 0.08 * Math.sin(w);
    tubePosition.y =
      energy * 0.04 * Math.abs(Math.sin(2 * w)) - pull * PULL_DEPTH;
    tubeEuler.set(
      energy * 0.06 * Math.sin(w * 1.3) + pull * 0.18,
      0,
      energy * 0.12 * Math.sin(w + 0.6)
    );
    tubeQuaternion.setFromEuler(tubeEuler);
    tubeBody.setNextKinematicTranslation(tubePosition);
    tubeBody.setNextKinematicRotation(tubeQuaternion);

    if (phase === "idle") {
      if (energy > SHAKE_ACTIVE_LEVEL) shakeAccum += FIXED_DT;
      const progress = clamp01(shakeAccum / SHAKE_TO_DRAW_SEC);
      if (Math.abs(progress - lastProgress) > 0.02) {
        lastProgress = progress;
        onShakeProgress?.(progress);
      }
      if (shakeAccum >= SHAKE_TO_DRAW_SEC) startReveal();
    }
  };

  /** 뽑힌 막대: 통에서 곧게 솟은 뒤(LIFT) 카메라 앞 최종 자리로(PRESENT) — 정해진 궤적 */
  const stepHero = () => {
    if (!hero) return;
    const t = elapsed - revealStartedAt;
    if (t <= LIFT_SEC) {
      const k = easeOutCubic(t / LIFT_SEC);
      scratch.lerpVectors(heroFrom, heroRise, k);
      scratchQuaternion.slerpQuaternions(
        heroFromQuaternion,
        heroFinalQuaternion,
        k * 0.6
      );
    } else {
      const k = easeInOutCubic(clamp01((t - LIFT_SEC) / PRESENT_SEC));
      scratch.lerpVectors(heroRise, REVEAL_POSITION, k);
      // 가운데가 살짝 부푸는 호 — 직선 이동보다 "뽑아 올리는" 느낌
      scratch.y += Math.sin(Math.PI * k) * 0.25;
      scratchQuaternion
        .copy(heroFromQuaternion)
        .slerp(heroFinalQuaternion, 0.6 + 0.4 * k);
      if (k >= 1) {
        scratch.copy(REVEAL_POSITION);
        scratchQuaternion.copy(heroFinalQuaternion);
      }
    }
    hero.body.setNextKinematicTranslation(scratch);
    hero.body.setNextKinematicRotation(scratchQuaternion);
    if (t >= REVEAL_DONE_SEC && phase === "revealing") {
      phase = "revealed";
    }
  };

  const limitStickSpeed = () => {
    sticks.forEach(({ body }) => {
      if (body.isKinematic()) return;
      const v = body.linvel();
      const speed = Math.hypot(v.x, v.y, v.z);
      if (speed <= MAX_STICK_SPEED) return;
      const k = MAX_STICK_SPEED / speed;
      body.setLinvel({ x: v.x * k, y: v.y * k, z: v.z * k }, true);
    });
  };

  /** 속도가 확 꺾인 막대 = 부딪힌 막대. 가장 센 것 몇 개만 소리로 낸다 */
  const detectClacks = () => {
    clackStrengths[0] = 0;
    clackStrengths[1] = 0;
    sticks.forEach(({ body }, i) => {
      const v = body.linvel();
      const o = i * 3;
      const dv = Math.hypot(
        v.x - lastVelocities[o],
        v.y - lastVelocities[o + 1],
        v.z - lastVelocities[o + 2]
      );
      lastVelocities[o] = v.x;
      lastVelocities[o + 1] = v.y;
      lastVelocities[o + 2] = v.z;
      if (body.isKinematic() || dv < CLACK_DV_MIN) return;
      const strength = clamp01(
        (dv - CLACK_DV_MIN) / (CLACK_DV_FULL - CLACK_DV_MIN)
      );
      if (strength > clackStrengths[0]) {
        [clackStrengths[1], clackStrengths[0]] = [clackStrengths[0], strength];
      } else if (strength > clackStrengths[1]) {
        clackStrengths[1] = strength;
      }
    });
    for (let i = 0; i < MAX_CLACKS_PER_STEP; i += 1) {
      if (clackStrengths[i] > 0) onCollision?.(clackStrengths[i]);
    }
  };

  const stepPhysics = () => {
    stepTube();
    if (phase !== "idle") stepHero();
    world.step();
    limitStickSpeed();
    if (onCollision) detectClacks();
    elapsed += FIXED_DT;
  };

  const updateCamera = () => {
    const t = phase === "idle" ? 0 : elapsed - revealStartedAt;
    const k = easeInOutCubic(clamp01((t - 0.45) / 1.3));
    camera.position.lerpVectors(IDLE_CAMERA, REVEAL_CAMERA, k);
    lookTarget.lerpVectors(IDLE_LOOK, REVEAL_LOOK, k);
    camera.lookAt(lookTarget);
    revealLight.intensity = 5 * k;
  };

  const syncMeshes = () => {
    tubeGroup.position.set(tubePosition.x, tubePosition.y, tubePosition.z);
    tubeGroup.quaternion.copy(tubeQuaternion);
    sticks.forEach(({ mesh, body }) => {
      const p = body.translation();
      const q = body.rotation();
      mesh.position.set(p.x, p.y, p.z);
      mesh.quaternion.set(q.x, q.y, q.z, q.w);
    });
  };

  // ---------- 리사이즈 ----------
  const resize = () => {
    viewport.width = Math.max(1, container.clientWidth);
    viewport.height = Math.max(1, container.clientHeight);
    renderer.setSize(viewport.width, viewport.height, false);
    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // ---------- 루프 ----------
  const timer = new THREE.Timer();
  timer.connect(document);
  const frame = (timestamp?: number) => {
    if (isDestroyed) return;
    timer.update(timestamp);
    accumulator += Math.min(timer.getDelta(), MAX_FRAME_DELTA);
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS_PER_FRAME) {
      stepPhysics();
      accumulator -= FIXED_DT;
      steps += 1;
    }
    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    updateCamera();
    syncMeshes();
    renderer.render(scene, camera);
    if (phase === "revealed" && !hasReportedRevealed) {
      hasReportedRevealed = true;
      onRevealed?.();
    }
  };

  syncMeshes();
  updateCamera();
  await renderer.compileAsync(scene, camera);
  renderer.setAnimationLoop(frame);

  return {
    setPull: (amount) => {
      if (phase !== "idle") return;
      pullTarget = clamp01(amount);
    },
    release: () => {
      if (phase !== "idle") return false;
      const released = pull;
      pullTarget = 0;
      if (released < MIN_RELEASE_PULL) return false;
      // 당겼다 놓으면 통이 튀어 오르며 세게 흔들린다
      autoUntil = elapsed + AUTO_DRAW_SEC;
      energy = Math.max(energy, 0.6 + released * 0.4);
      return true;
    },
    addShake: (intensity) => {
      if (phase !== "idle") return;
      energy = Math.max(energy, clamp01(intensity));
    },
    drawAuto: () => {
      if (phase !== "idle") return;
      autoUntil = elapsed + AUTO_DRAW_SEC;
    },
    destroy: () => {
      isDestroyed = true;
      renderer.setAnimationLoop(null);
      timer.dispose();
      resizeObserver.disconnect();
      world.free();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[];
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material?.dispose();
      });
      [plainMaterial, labeledMaterial].forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
};
