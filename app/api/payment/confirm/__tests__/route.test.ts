import type { NextRequest } from "next/server";

const mockIsFirstPaymentEligible = jest.fn();
const mockUpdateFortunePaidAt = jest.fn();
const mockSendPaymentNotification = jest.fn();

jest.mock("@/libs/services/payment/first-payment-eligibility", () => ({
  isFirstPaymentEligible: (...args: unknown[]) =>
    mockIsFirstPaymentEligible(...args),
}));

jest.mock("@/libs/supabase", () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { name: "테스트" } }) }),
      }),
    }),
  }),
  updateFortunePaidAt: (...args: unknown[]) => mockUpdateFortunePaidAt(...args),
  updateCompatibilityPaidAt: jest.fn(),
}));

jest.mock("@/libs/discord", () => ({
  sendPaymentNotification: (...args: unknown[]) =>
    mockSendPaymentNotification(...args),
}));

process.env.TOSS_SECRET_KEY = "test_sk_dummy";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("../route") as typeof import("../route");

const ORDER_ID = "order-1";
const PAYMENT_KEY = "pay-key-1";

const approvedPayment = {
  paymentKey: PAYMENT_KEY,
  orderId: ORDER_ID,
  status: "DONE",
  totalAmount: 100,
  method: "카드",
  approvedAt: "2026-11-15T10:00:00+09:00",
};

const createRequest = (amount: number): NextRequest =>
  ({
    json: async () => ({
      paymentKey: PAYMENT_KEY,
      orderId: ORDER_ID,
      amount,
      profileId: "profile-1",
      fortuneType: "lifetime",
    }),
  }) as unknown as NextRequest;

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

describe("POST /api/payment/confirm 중복 승인 처리", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
    mockSendPaymentNotification.mockResolvedValue(undefined);
    mockUpdateFortunePaidAt.mockResolvedValue(true);
  });

  it("이미 승인된 결제로 다시 들어오면 승인 호출 없이 성공을 돌려준다", async () => {
    // 첫 결제 할인으로 결제한 뒤라 자격이 사라진 상태
    mockIsFirstPaymentEligible.mockResolvedValue(false);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, approvedPayment));

    const response = await POST(createRequest(100));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alreadyProcessed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockUpdateFortunePaidAt).not.toHaveBeenCalled();
    expect(mockSendPaymentNotification).not.toHaveBeenCalled();
  });

  it("다른 주문의 승인된 paymentKey면 재사용하지 않고 정상 검증으로 넘긴다", async () => {
    mockIsFirstPaymentEligible.mockResolvedValue(false);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { ...approvedPayment, orderId: "other-order" })
    );

    const response = await POST(createRequest(100));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("AMOUNT_MISMATCH");
  });

  it("승인 전 결제는 정상적으로 승인하고 paid_at·알림을 처리한다", async () => {
    mockIsFirstPaymentEligible.mockResolvedValue(true);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { ...approvedPayment, status: "IN_PROGRESS" })
      )
      .mockResolvedValueOnce(jsonResponse(200, approvedPayment));

    const response = await POST(createRequest(100));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alreadyProcessed).toBeUndefined();
    expect(mockUpdateFortunePaidAt).toHaveBeenCalledTimes(1);
    expect(mockSendPaymentNotification).toHaveBeenCalledTimes(1);
  });

  it("동시 요청으로 승인 단계에서 ALREADY_PROCESSED_PAYMENT가 나면 성공으로 돌려준다", async () => {
    mockIsFirstPaymentEligible.mockResolvedValue(true);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { ...approvedPayment, status: "IN_PROGRESS" })
      )
      .mockResolvedValueOnce(
        jsonResponse(400, {
          code: "ALREADY_PROCESSED_PAYMENT",
          message: "이미 처리된 결제 입니다.",
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, approvedPayment));
    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    const response = await POST(createRequest(100));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.alreadyProcessed).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(mockUpdateFortunePaidAt).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("승인 전 결제 조회가 실패해도 정상 승인 흐름으로 진행한다", async () => {
    mockIsFirstPaymentEligible.mockResolvedValue(true);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, { code: "NOT_FOUND_PAYMENT" }))
      .mockResolvedValueOnce(jsonResponse(200, approvedPayment));

    const response = await POST(createRequest(100));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdateFortunePaidAt).toHaveBeenCalledTimes(1);
  });
});
