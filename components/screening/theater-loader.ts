// 상영관 3D 장면(three.js, 약 150KB gzip)은 홈에서 미리 받아 둔다.
// 전환이 시작될 때 이미 받아져 있으면 3D, 아니면 처음부터 CSS 장면으로 간다.
// 도중에 바꿔 끼우지 않는다 — 깜박임이 가장 싸 보인다(designer).

type TheaterModule = typeof import("./theater-scene");

let loaded: TheaterModule | null = null;
let loading: Promise<TheaterModule | null> | null = null;
let webglSupport: boolean | null = null;

const supportsWebGL = (): boolean => {
  if (webglSupport !== null) {
    return webglSupport;
  }
  try {
    const canvas = document.createElement("canvas");
    webglSupport = !!(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    );
  } catch {
    webglSupport = false;
  }
  return webglSupport;
};

/** 홈이 뜬 뒤 한가할 때, 관람권을 누른 순간(찢김 1초 동안)에 부른다 */
export const preloadTheater = (): void => {
  if (loading || typeof window === "undefined" || !supportsWebGL()) {
    return;
  }
  loading = import("./theater-scene")
    .then((module) => {
      loaded = module;
      return module;
    })
    .catch(() => null);
};

/** 지금 바로 쓸 수 있는 3D 장면 모듈 (아직 못 받았으면 null) */
export const getLoadedTheater = (): TheaterModule | null => loaded;
