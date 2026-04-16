// 환경 변수 — 모듈 로드 전에 설정 (route.ts가 모듈 스코프에서 검증)
process.env.TOSS_SECRET_KEY = "test_secret_key";
process.env.TOSS_PAYPAL_SECRET_KEY = "test_paypal_secret_key";

import { NextRequest } from "next/server";

import { POST } from "../route";

// --- mocks -----------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSendPaymentNotification = jest.fn();
jest.mock("@/libs/discord", () => ({
  sendPaymentNotification: (...args: unknown[]) =>
    mockSendPaymentNotification(...args),
}));

const mockUpdateFortunePaidAt = jest.fn();
const mockUpdateCompatibilityPaidAt = jest.fn();
jest.mock("@/libs/supabase", () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: () => Promise.resolve({ data: null }) }),
      }),
    }),
  }),
  updateCompatibilityPaidAt: (...args: unknown[]) =>
    mockUpdateCompatibilityPaidAt(...args),
  updateFortunePaidAt: (...args: unknown[]) => mockUpdateFortunePaidAt(...args),
}));

// --- helpers ---------------------------------------------------------

const PAYMENT_DATA = {
  paymentKey: "pk_test_123",
  orderId: "order_test_456",
  status: "DONE",
  totalAmount: 990,
  method: "카드",
  approvedAt: "2026-04-16T12:00:00+09:00",
};

const createRequest = (body: Record<string, unknown>): NextRequest =>
  new NextRequest("http://localhost/api/payment/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const createMockResponse = (
  data: unknown,
  options: { status?: number; ok?: boolean } = {}
): Response => {
  const { status = 200, ok = true } = options;
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
};

// --- tests -----------------------------------------------------------

describe("POST /api/payment/confirm", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockUpdateFortunePaidAt.mockResolvedValue(true);
    mockUpdateCompatibilityPaidAt.mockResolvedValue(true);
    mockSendPaymentNotification.mockResolvedValue(undefined);
  });

  it("ALREADY_PROCESSED_PAYMENT 시 결제 조회 후 성공 응답을 반환한다", async () => {
    // 1차: confirm → ALREADY_PROCESSED_PAYMENT
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        {
          code: "ALREADY_PROCESSED_PAYMENT",
          message: "이미 처리된 결제 입니다.",
        },
        { status: 400, ok: false }
      )
    );

    // 2차: GET /v1/payments/{paymentKey} → 결제 정보
    mockFetch.mockResolvedValueOnce(createMockResponse(PAYMENT_DATA));

    const request = createRequest({
      paymentKey: "pk_test_123",
      orderId: "order_test_456",
      amount: 990,
      profileId: "profile_1",
      fortuneType: "lifetime",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.orderId).toBe("order_test_456");

    // 결제 조회 API가 호출되었는지 확인
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][0]).toContain("/v1/payments/pk_test_123");
    expect(mockFetch.mock.calls[1][1].method).toBe("GET");
  });

  it("ALREADY_PROCESSED_PAYMENT 후 결제 조회도 실패하면 502를 반환한다", async () => {
    // 1차: confirm → ALREADY_PROCESSED_PAYMENT
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        {
          code: "ALREADY_PROCESSED_PAYMENT",
          message: "이미 처리된 결제 입니다.",
        },
        { status: 400, ok: false }
      )
    );

    // 2차: GET → 실패
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        { code: "NOT_FOUND", message: "결제를 찾을 수 없습니다." },
        { status: 404, ok: false }
      )
    );

    const request = createRequest({
      paymentKey: "pk_test_123",
      orderId: "order_test_456",
      amount: 990,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.success).toBe(false);
    expect(json.code).toBe("PAYMENT_LOOKUP_FAILED");
  });

  it("다른 결제 오류는 기존대로 에러를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse(
        {
          code: "INVALID_CARD_NUMBER",
          message: "유효하지 않은 카드 번호입니다.",
        },
        { status: 400, ok: false }
      )
    );

    const request = createRequest({
      paymentKey: "pk_test_123",
      orderId: "order_test_456",
      amount: 990,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.code).toBe("INVALID_CARD_NUMBER");
    // 결제 조회 API가 호출되지 않았는지 확인
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
