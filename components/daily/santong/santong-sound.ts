/**
 * 산통 소리 (Web Audio).
 *
 * - 달그락: 젓가락끼리 부딪힌 실제 녹음 10개(CC0, public/sounds/santong/LICENSE.txt)를 돌려 쓴다
 * - 뽑기: 막대가 통 벽을 긁으며 빠져나오는 "스르륵" (노이즈 합성)
 *
 * 브라우저 자동 재생 정책 때문에 사용자 동작(탭·당기기·버튼) 안에서 `unlock()`을
 * 불러야 소리가 난다. 그 전의 재생 요청은 조용히 무시한다.
 */

const MASTER_GAIN = 0.55;
/** 달그락 사이 최소 간격(초) — 너무 촘촘하면 "치익" 하는 잡음이 된다 */
const MIN_CLACK_GAP = 0.018;
const NOISE_SEC = 1;
const CLICK_SAMPLE_URLS = Array.from(
  { length: 10 },
  (_, i) => `/sounds/santong/click-${i + 1}.wav`
);
/** 녹음마다 피크를 0.8로 맞춰 두었다 */
const CLICK_SAMPLE_GAIN = 1;
/** 같은 녹음이 반복돼 들리지 않도록 재생 속도(=음높이)를 이 범위에서 흔든다 */
const PLAYBACK_RATE_MIN = 0.9;
const PLAYBACK_RATE_MAX = 1.15;

export interface SantongSound {
  /** 사용자 동작 핸들러 안에서 호출 */
  unlock: () => void;
  /** 세기 0~1 */
  playClack: (strength: number) => void;
  playDraw: () => void;
  dispose: () => void;
}

const createNoiseBuffer = (context: AudioContext): AudioBuffer => {
  const length = Math.floor(context.sampleRate * NOISE_SEC);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
};

export const createSantongSound = (): SantongSound => {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let lastClackAt = 0;
  let clickBuffers: AudioBuffer[] = [];
  // 연출 로딩 중에 미리 받아 둔다 (디코딩은 AudioContext가 생긴 뒤)
  const clickFiles = Promise.all(
    CLICK_SAMPLE_URLS.map((url) =>
      fetch(url).then((response) => response.arrayBuffer())
    )
  ).catch((error: unknown) => {
    console.error("[santong-sound] 효과음 로드 실패:", error);
    return [] as ArrayBuffer[];
  });

  const isPlayable = () => context !== null && context.state === "running";

  const unlock = () => {
    if (typeof window === "undefined" || !("AudioContext" in window)) return;
    if (!context) {
      context = new AudioContext();
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.ratio.value = 4;
      master = context.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(compressor).connect(context.destination);
      noise = createNoiseBuffer(context);
      const audio = context;
      void clickFiles
        .then((files) =>
          Promise.all(files.map((file) => audio.decodeAudioData(file)))
        )
        .then((buffers) => {
          clickBuffers = buffers;
        })
        .catch((error: unknown) => {
          console.error("[santong-sound] 효과음 디코딩 실패:", error);
        });
    }
    if (context.state === "suspended") void context.resume();
  };

  const playClack = (strength: number) => {
    if (!isPlayable() || !context || !master || !clickBuffers.length) return;
    const now = context.currentTime;
    if (now - lastClackAt < MIN_CLACK_GAP) return;
    lastClackAt = now;

    const source = context.createBufferSource();
    source.buffer =
      clickBuffers[Math.floor(Math.random() * clickBuffers.length)];
    source.playbackRate.value =
      PLAYBACK_RATE_MIN +
      Math.random() * (PLAYBACK_RATE_MAX - PLAYBACK_RATE_MIN);
    // 충돌음 크기는 충돌 세기에 비례
    const gain = context.createGain();
    gain.gain.value = CLICK_SAMPLE_GAIN * (0.15 + 0.85 * strength);
    source.connect(gain).connect(master);
    source.start(now);
  };

  const playDraw = () => {
    if (!isPlayable() || !context || !master || !noise) return;
    const now = context.currentTime;
    const duration = 0.7;

    const source = context.createBufferSource();
    source.buffer = noise;
    const band = context.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 1.6;
    band.frequency.setValueAtTime(450, now);
    band.frequency.exponentialRampToValueAtTime(1500, now + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.32, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(band).connect(gain).connect(master);
    source.start(now, 0, duration);
  };

  const dispose = () => {
    void context?.close();
    context = null;
    master = null;
    noise = null;
  };

  return { unlock, playClack, playDraw, dispose };
};
