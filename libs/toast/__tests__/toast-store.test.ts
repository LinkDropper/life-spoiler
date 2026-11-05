import {
  TOAST_DURATION_MS,
  dismissToast,
  getToastState,
  resetToasts,
  showToast,
  subscribeToasts,
} from "../toast-store";

describe("toast-store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetToasts();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("오류와 안내는 각자 칸에 쌓인다", () => {
    showToast({ kind: "error", message: "실패" });
    showToast({ kind: "notice", message: "안내" });

    expect(getToastState().error?.message).toBe("실패");
    expect(getToastState().notice?.message).toBe("안내");
  });

  it("같은 종류의 새 알림은 이전 알림을 대체한다", () => {
    showToast({ kind: "notice", message: "첫 번째" });
    showToast({ kind: "notice", message: "두 번째" });

    expect(getToastState().notice?.message).toBe("두 번째");
  });

  it("같은 문구를 다시 띄우면 번호가 바뀐다", () => {
    showToast({ kind: "error", message: "실패" });
    const firstId = getToastState().error?.id;
    showToast({ kind: "error", message: "실패" });

    expect(getToastState().error?.id).not.toBe(firstId);
  });

  it("오류는 6초, 안내는 3초 뒤에 사라진다", () => {
    showToast({ kind: "error", message: "실패" });
    showToast({ kind: "notice", message: "안내" });

    jest.advanceTimersByTime(TOAST_DURATION_MS.notice - 1);
    expect(getToastState().notice).not.toBeNull();
    jest.advanceTimersByTime(1);
    expect(getToastState().notice).toBeNull();
    expect(getToastState().error).not.toBeNull();

    jest.advanceTimersByTime(
      TOAST_DURATION_MS.error - TOAST_DURATION_MS.notice
    );
    expect(getToastState().error).toBeNull();
  });

  it("새 알림이 뜨면 이전 알림의 타이머가 새 알림을 닫지 않는다", () => {
    showToast({ kind: "notice", message: "첫 번째" });
    jest.advanceTimersByTime(2000);
    showToast({ kind: "notice", message: "두 번째" });
    jest.advanceTimersByTime(2000);

    expect(getToastState().notice?.message).toBe("두 번째");
    jest.advanceTimersByTime(1000);
    expect(getToastState().notice).toBeNull();
  });

  it("dismissToast로 바로 닫을 수 있다", () => {
    showToast({ kind: "error", message: "실패" });
    dismissToast("error");

    expect(getToastState().error).toBeNull();
  });

  it("바뀔 때만 구독자에게 알리고, 구독을 풀면 알리지 않는다", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToasts(listener);

    dismissToast("error");
    expect(listener).not.toHaveBeenCalled();

    showToast({ kind: "error", message: "실패" });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    dismissToast("error");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("상태 객체는 바뀌지 않으면 같은 참조를 돌려준다", () => {
    showToast({ kind: "error", message: "실패" });
    expect(getToastState()).toBe(getToastState());
  });
});
