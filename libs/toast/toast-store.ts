/**
 * 앱 안 알림(alert() 대체) 스토어. React 밖(훅·이벤트 핸들러)에서도 부를 수 있도록
 * 모듈 수준 상태로 두고, ToastViewport가 useSyncExternalStore로 구독한다.
 * 종류(오류·안내)마다 한 칸이라 새 알림은 같은 종류의 이전 알림을 대체한다.
 */

export type ToastKind = "error" | "notice";

export interface ToastItem {
  /** 같은 문구를 다시 띄워도 새 알림으로 읽히도록 매번 바뀌는 번호 */
  id: number;
  kind: ToastKind;
  message: string;
}

export type ToastState = Record<ToastKind, ToastItem | null>;

/** 오류는 직접 닫을 수 있어 길게, 안내는 짧게 */
export const TOAST_DURATION_MS: Record<ToastKind, number> = {
  error: 6000,
  notice: 3000,
};

const EMPTY_STATE: ToastState = { error: null, notice: null };

let state: ToastState = EMPTY_STATE;
let nextId = 1;
const listeners = new Set<() => void>();
const timers: Partial<Record<ToastKind, ReturnType<typeof setTimeout>>> = {};

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const clearTimer = (kind: ToastKind): void => {
  const timer = timers[kind];
  if (timer !== undefined) {
    clearTimeout(timer);
    delete timers[kind];
  }
};

export const dismissToast = (kind: ToastKind): void => {
  clearTimer(kind);
  if (state[kind] === null) {
    return;
  }
  state = { ...state, [kind]: null };
  emit();
};

export const showToast = (input: {
  kind: ToastKind;
  message: string;
}): void => {
  const { kind, message } = input;
  clearTimer(kind);
  state = { ...state, [kind]: { id: nextId, kind, message } };
  nextId += 1;
  timers[kind] = setTimeout(() => dismissToast(kind), TOAST_DURATION_MS[kind]);
  emit();
};

export const subscribeToasts = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getToastState = (): ToastState => state;

export const getServerToastState = (): ToastState => EMPTY_STATE;

/** 테스트용: 상태와 타이머를 처음으로 되돌린다 */
export const resetToasts = (): void => {
  (Object.keys(timers) as ToastKind[]).forEach(clearTimer);
  state = EMPTY_STATE;
  nextId = 1;
  listeners.clear();
};
