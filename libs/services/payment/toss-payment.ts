const TOSS_PAYMENTS_API_URL = "https://api.tosspayments.com/v1/payments";

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  approvedAt: string;
}

/**
 * 토스에 paymentKey로 결제 상세를 조회한다.
 *
 * 승인 전 결제는 DONE이 아닌 상태로 내려오거나 4xx가 나므로, 조회에 실패하면
 * null을 돌려 호출부가 정상 승인 흐름으로 진행하게 한다. 승인 여부의 최종 판단은
 * confirm API가 하므로 여기서 실패를 에러로 올리지 않는다.
 */
export const fetchTossPayment = async (
  paymentKey: string,
  encodedSecretKey: string
): Promise<TossPayment | null> => {
  try {
    const response = await fetch(
      `${TOSS_PAYMENTS_API_URL}/${encodeURIComponent(paymentKey)}`,
      {
        method: "GET",
        headers: { Authorization: `Basic ${encodedSecretKey}` },
      }
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as TossPayment;
  } catch (error) {
    console.warn("토스 결제 조회 실패:", { paymentKey, error });
    return null;
  }
};

/**
 * 이 주문에 대해 이미 승인이 끝난 결제인지 판단한다.
 * 다른 주문의 paymentKey를 끼워 넣는 경우를 막기 위해 orderId까지 맞아야 한다.
 */
export const isApprovedPaymentForOrder = (
  payment: TossPayment | null,
  orderId: string
): payment is TossPayment => {
  if (!payment) {
    return false;
  }
  return payment.status === "DONE" && payment.orderId === orderId;
};
