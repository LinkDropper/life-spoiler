// 상영관 3D 장면(three.js, 약 150KB gzip)은 첫 화면이 뜬 뒤 미리 받아 둔다(ScreeningProvider).
// 같은 기기에서는 늘 같은 상영관이 뜨도록, 아직 못 받았으면 같은 어두운 객석에서 잠깐 기다렸다가 3D로 띄운다.

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

/** 받기 시작한다(이미 받는 중이면 그 약속을 돌려준다). WebGL이 없으면 null */
export const loadTheater = (): Promise<TheaterModule | null> => {
  if (typeof window === "undefined" || !supportsWebGL()) {
    return Promise.resolve(null);
  }
  loading ??= import("./theater-scene")
    .then((module) => {
      loaded = module;
      return module;
    })
    .catch(() => null);
  return loading;
};

/** 첫 화면이 뜬 뒤 한가할 때, 관람권을 누른 순간(찢김 동안)에 부른다 */
export const preloadTheater = (): void => {
  void loadTheater();
};

/** 지금 바로 쓸 수 있는 3D 장면 모듈 (아직 못 받았으면 null) */
export const getLoadedTheater = (): TheaterModule | null => loaded;
