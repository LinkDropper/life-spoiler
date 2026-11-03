import * as THREE from "three";

// ============================================================
// 산통 에셋 (승인된 키프레임 렌더와 같은 재질·비율)
// ------------------------------------------------------------
// 실물 비율: 막대 폭 ≈ 길이의 1/18 (약 13mm × 240mm 대나무 판),
//           통 높이 ≈ 지름의 2.3배 (약 19cm × 8.3cm). 1 단위 ≈ 10cm.
// ============================================================

export const STICK_W = 0.13;
export const STICK_L = 2.3;
export const STICK_T = 0.022;

export const TUBE_R = 0.4;
export const TUBE_H = 1.85;
export const TUBE_WALL = 0.035;
export const TUBE_FLOOR_Y = 0.12;

const BAMBOO_LIGHT = "#d9ae62";
const NODE_Y = 0.65;
const EMBLEM_Y = 1.08;
const CORD_YS = [1.5, 1.562];

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스 컨텍스트를 만들 수 없습니다.");
  return { canvas, ctx };
};

const toTexture = (canvas: HTMLCanvasElement, flipY = true) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.flipY = flipY;
  return texture;
};

/** 대나무 통 겉면: 세로 섬유 + 마디 띠 + 앞면 붉은 "運" 문장 */
const createTubeTexture = (random: () => number, fontFamily: string) => {
  const w = 1536;
  const h = 1152;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = BAMBOO_LIGHT;
  ctx.fillRect(0, 0, w, h);
  // 오래 쓴 대나무: 아래로 갈수록 짙다
  const age = ctx.createLinearGradient(0, 0, 0, h);
  age.addColorStop(0, "rgba(120,80,30,0.05)");
  age.addColorStop(1, "rgba(90,55,20,0.4)");
  ctx.fillStyle = age;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 18; i += 1) {
    ctx.fillStyle = `rgba(${random() < 0.5 ? "110,70,25" : "245,215,150"},${0.05 + random() * 0.08})`;
    ctx.fillRect(random() * w, 0, 8 + random() * 40, h);
  }
  for (let i = 0; i < w * 1.5; i += 1) {
    const x = random() * w;
    ctx.strokeStyle = `rgba(${random() < 0.5 ? "120,85,35" : "255,240,205"},${0.05 + random() * 0.12})`;
    ctx.lineWidth = 0.5 + random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (random() - 0.5) * 6, h);
    ctx.stroke();
  }
  // CylinderGeometry는 v=0이 아래 → 캔버스 위쪽이 통 위쪽
  const nodeY = (1 - NODE_Y / TUBE_H) * h;
  const band = ctx.createLinearGradient(0, nodeY - 18, 0, nodeY + 18);
  band.addColorStop(0, "rgba(110,75,30,0)");
  band.addColorStop(0.45, "rgba(110,75,30,0.55)");
  band.addColorStop(0.5, "rgba(250,230,190,0.6)");
  band.addColorStop(0.58, "rgba(110,75,30,0.45)");
  band.addColorStop(1, "rgba(110,75,30,0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, nodeY - 18, w, 36);
  for (let i = 0; i < 260; i += 1) {
    ctx.fillStyle = `rgba(90,60,25,${random() * 0.18})`;
    ctx.fillRect(
      random() * w,
      random() * h,
      1 + random() * 2,
      1 + random() * 3
    );
  }
  // 문장: u=0.5에 그리고 통을 반 바퀴 돌려 카메라 쪽에 오게 한다
  const cx = w * 0.5;
  const cy = (1 - EMBLEM_Y / TUBE_H) * h;
  const r = h * 0.085;
  ctx.fillStyle = "#9e1b2c";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d8b25a";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#e6c36f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.round(r * 1.15)}px ${fontFamily}`;
  ctx.fillText("運", cx, cy + 4);
  return toTexture(canvas);
};

export interface StickLabel {
  /** 등급 이름 (예: "환한 날") */
  grade: string;
  /** 1~5 */
  level: number;
}

/**
 * 산가지: 대나무 결 + 붉은 칠 끝 (+ 뽑힌 막대에는 등급과 별).
 * UV는 위 끝 = v 0으로 펼쳤으므로 flipY를 끈다.
 */
const createStickTexture = (
  random: () => number,
  fontFamily: string,
  label: StickLabel | null
) => {
  const w = 192;
  const h = 3392;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = "#dcbd83";
  ctx.fillRect(0, 0, w, h);
  const age = ctx.createLinearGradient(0, 0, 0, h);
  age.addColorStop(0, "rgba(0,0,0,0)");
  age.addColorStop(1, "rgba(110,75,30,0.25)");
  ctx.fillStyle = age;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i += 1) {
    const x = random() * w;
    ctx.strokeStyle = `rgba(${random() < 0.5 ? "140,100,45" : "255,245,215"},${0.06 + random() * 0.14})`;
    ctx.lineWidth = 0.6 + random();
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (random() - 0.5) * 3, h);
    ctx.stroke();
  }
  const red = ctx.createLinearGradient(0, 0, 0, h * 0.14);
  red.addColorStop(0, "#b3202f");
  red.addColorStop(0.9, "#c4303d");
  red.addColorStop(1, "rgba(196,48,61,0)");
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, w, h * 0.14);
  ctx.fillStyle = "#d8b25a";
  ctx.fillRect(0, h * 0.145, w, 9);

  if (label) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#140a05";
    const top = h * 0.24;
    let cursor = top;
    if (/[A-Za-z]/.test(label.grade)) {
      // 라틴 문자는 세로로 쌓지 않고 막대 방향으로 눕혀 쓴다
      ctx.save();
      ctx.translate(w / 2, top + 420);
      ctx.rotate(Math.PI / 2);
      ctx.font = `900 92px ${fontFamily}`;
      ctx.fillText(label.grade, 0, 0, 800);
      ctx.restore();
      cursor = top + 880;
    } else {
      ctx.font = `900 160px ${fontFamily}`;
      label.grade
        .replace(/\s+/g, "")
        .split("")
        .forEach((ch) => {
          ctx.fillText(ch, w / 2, cursor);
          cursor += 184;
        });
    }
    ctx.fillStyle = "#a3162b";
    ctx.font = `900 96px ${fontFamily}`;
    for (let i = 0; i < 5; i += 1) {
      ctx.globalAlpha = i < label.level ? 1 : 0.3;
      ctx.fillText("★", w / 2, cursor + 40 + i * 108);
    }
    ctx.globalAlpha = 1;
  }
  return toTexture(canvas, false);
};

/** 납작한 산가지: 모서리 둥근 판, UV는 막대 길이 기준 (위 끝 = v 0) */
export const createStickGeometry = () => {
  const shape = new THREE.Shape();
  const r = STICK_W / 2;
  shape.moveTo(-r, -STICK_L / 2 + r);
  shape.lineTo(-r, STICK_L / 2 - r);
  shape.absarc(0, STICK_L / 2 - r, r, Math.PI, 0, true);
  shape.lineTo(r, -STICK_L / 2 + r);
  shape.absarc(0, -STICK_L / 2 + r, r, 0, Math.PI, true);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: STICK_T,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 10,
  });
  geometry.translate(0, 0, -STICK_T / 2);
  const pos = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(
      i,
      (pos.getX(i) + r) / STICK_W,
      1 - (pos.getY(i) + STICK_L / 2) / STICK_L
    );
  }
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

export const createStickMaterial = (
  random: () => number,
  fontFamily: string,
  label: StickLabel | null = null
) =>
  new THREE.MeshPhysicalMaterial({
    map: createStickTexture(random, fontFamily, label),
    roughness: 0.48,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
  });

/**
 * 대나무 통 (바깥 벽·안쪽 벽·입술·바닥·마디·붉은 매듭끈·매듭·술).
 * 원점은 통 바닥 중심.
 */
export const createTube = (random: () => number, fontFamily: string) => {
  const group = new THREE.Group();
  const tubeMap = createTubeTexture(random, fontFamily);
  const tubeMaterial = new THREE.MeshPhysicalMaterial({
    map: tubeMap,
    bumpMap: tubeMap,
    bumpScale: 1.6,
    roughness: 0.5,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    sheen: 0.4,
    sheenColor: new THREE.Color("#fff1d6"),
  });
  // 바깥 벽: 원통 UV(u=둘레, v=높이)라 텍스처 비율이 유지된다
  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(TUBE_R, TUBE_R, TUBE_H, 128, 1, true),
    tubeMaterial
  );
  outer.position.y = TUBE_H / 2;
  outer.rotation.y = Math.PI;
  outer.castShadow = true;
  outer.receiveShadow = true;
  group.add(outer);

  const inner = new THREE.Mesh(
    new THREE.CylinderGeometry(
      TUBE_R - TUBE_WALL,
      TUBE_R - TUBE_WALL,
      TUBE_H - 0.1,
      96,
      1,
      true
    ),
    new THREE.MeshStandardMaterial({
      color: "#6e4a22",
      roughness: 0.8,
      side: THREE.BackSide,
    })
  );
  inner.position.y = TUBE_H / 2 + 0.05;
  group.add(inner);

  const lip = new THREE.Mesh(
    new THREE.RingGeometry(TUBE_R - TUBE_WALL, TUBE_R, 128),
    new THREE.MeshPhysicalMaterial({
      color: "#c79a55",
      roughness: 0.5,
      clearcoat: 0.4,
    })
  );
  lip.rotation.x = -Math.PI / 2;
  lip.position.y = TUBE_H;
  group.add(lip);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(TUBE_R - TUBE_WALL, 64),
    new THREE.MeshStandardMaterial({ color: "#3d2812", roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = TUBE_FLOOR_Y;
  group.add(floor);

  const nodeRing = new THREE.Mesh(
    new THREE.TorusGeometry(TUBE_R + 0.003, 0.016, 20, 128),
    new THREE.MeshPhysicalMaterial({
      color: "#a77d3e",
      roughness: 0.5,
      clearcoat: 0.4,
    })
  );
  nodeRing.rotation.x = Math.PI / 2;
  nodeRing.position.y = NODE_Y;
  group.add(nodeRing);

  const cordMaterial = new THREE.MeshPhysicalMaterial({
    color: "#a3162b",
    roughness: 0.55,
    sheen: 1,
    sheenColor: new THREE.Color("#ff8fa3"),
    sheenRoughness: 0.4,
  });
  CORD_YS.forEach((y) => {
    const cord = new THREE.Mesh(
      new THREE.TorusGeometry(TUBE_R + 0.011, 0.022, 20, 128),
      cordMaterial
    );
    cord.rotation.x = Math.PI / 2;
    cord.position.y = y;
    cord.castShadow = true;
    group.add(cord);
  });

  // 매듭 + 금빛 마개 + 가는 실 여러 가닥으로 된 술
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.034, 0.012, 64, 12, 2, 3),
    cordMaterial
  );
  knot.position.set(0.15, 1.531, 0.38);
  knot.castShadow = true;
  group.add(knot);
  const tasselCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.026, 0.06, 24),
    new THREE.MeshPhysicalMaterial({
      color: "#d8b25a",
      metalness: 0.8,
      roughness: 0.3,
    })
  );
  tasselCap.position.set(0.16, 1.463, 0.384);
  group.add(tasselCap);
  const strandGeometry = new THREE.CylinderGeometry(0.0035, 0.0028, 0.34, 6);
  for (let k = 0; k < 36; k += 1) {
    const strand = new THREE.Mesh(strandGeometry, cordMaterial);
    const a = random() * Math.PI * 2;
    const rr = random() * 0.018;
    strand.position.set(
      0.16 + Math.cos(a) * rr,
      1.273 - random() * 0.03,
      0.384 + Math.sin(a) * rr
    );
    strand.rotation.set(Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08);
    strand.castShadow = true;
    group.add(strand);
  }
  return group;
};
