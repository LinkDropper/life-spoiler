"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { AnalysisLoading } from "@/components/face-spoiler/AnalysisLoading";
import { Header } from "@/components/face-spoiler/Header";
import { trackPurchase } from "@/libs/analytics";

import styles from "./page.module.css";

type Stage =
  | "confirming"
  | "generating"
  | "done"
  | "error-confirm"
  | "error-generate";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tFace = useTranslations("faceSpoiler.payment");
  const tPayment = useTranslations("payment");

  const shareId = searchParams.get("shareId");
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const currency = (searchParams.get("currency") as "KRW" | "USD") || "KRW";
  const isPromo = searchParams.get("promo") === "true";

  const [stage, setStage] = useState<Stage>(
    isPromo ? "generating" : "confirming"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  const generateCharacterImage = async (): Promise<boolean> => {
    if (!shareId) return false;
    try {
      const response = await fetch("/api/face-spoiler/character-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(
          result.error ??
            tFace("errorCharacterFailed", {
              default: "캐릭터 이미지 생성에 실패했습니다.",
            })
        );
        return false;
      }
      return true;
    } catch {
      setErrorMessage(
        tFace("errorCharacterError", {
          default: "캐릭터 이미지 생성 중 오류가 발생했습니다.",
        })
      );
      return false;
    }
  };

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const runFlow = async () => {
      if (!shareId) {
        setStage("error-confirm");
        setErrorMessage(
          tFace("errorInvalidAccess", { default: "잘못된 접근입니다." })
        );
        return;
      }

      // 프로모 경유 (paid_at 이미 설정됨) → 바로 이미지 생성
      if (isPromo) {
        const ok = await generateCharacterImage();
        if (!ok) {
          setStage("error-generate");
          return;
        }
        setStage("done");
        router.replace(`/face-spoiler/r/${shareId}`);
        return;
      }

      // 일반 결제 → 결제 승인 → 이미지 생성
      if (!paymentKey || !orderId || !amount) {
        setStage("error-confirm");
        setErrorMessage(
          tFace("errorMissingPayment", {
            default: "결제 정보가 누락되었습니다.",
          })
        );
        return;
      }

      try {
        const response = await fetch("/api/face-spoiler/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            shareId,
            currency,
          }),
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          setStage("error-confirm");
          setErrorMessage(
            result.message ??
              tFace("errorConfirmFailed", {
                default: "결제 승인에 실패했습니다.",
              })
          );
          return;
        }

        // GA 결제 이벤트
        if (orderId && amount) {
          trackPurchase({
            transaction_id: orderId,
            value: Number(amount),
            currency,
            items: [
              {
                item_id: "face_spoiler",
                item_name: tFace("productName", {
                  default: "관상 운세 스포일러",
                }),
                price: Number(amount),
                quantity: 1,
              },
            ],
          });
        }

        // 다음 단계: 캐릭터 이미지 생성
        setStage("generating");
        const ok = await generateCharacterImage();
        if (!ok) {
          setStage("error-generate");
          return;
        }
        setStage("done");
        router.replace(`/face-spoiler/r/${shareId}`);
      } catch {
        setStage("error-confirm");
        setErrorMessage(
          tFace("errorServerError", { default: "서버 오류가 발생했습니다." })
        );
      }
    };

    runFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetryGenerate = async () => {
    setStage("generating");
    setErrorMessage(null);
    const ok = await generateCharacterImage();
    if (!ok) {
      setStage("error-generate");
      return;
    }
    setStage("done");
    if (shareId) router.replace(`/face-spoiler/r/${shareId}`);
  };

  const handleViewResult = () => {
    if (shareId) router.push(`/face-spoiler/r/${shareId}`);
  };

  const handleBackToUpload = () => {
    router.push("/face-spoiler/profiles");
  };

  if (stage === "confirming" || stage === "generating") {
    const messages =
      stage === "confirming"
        ? [tPayment("processing", { default: "결제 확인 중..." })]
        : [
            tFace("characterGenerating", { default: "캐릭터 그리는 중..." }),
            tFace("successDescription", {
              default: "관상 캐릭터를 생성하고 있어요",
            }),
          ];

    return <AnalysisLoading messages={messages} />;
  }

  if (stage === "error-confirm") {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.resultCard}>
            <div className={styles.iconError}>⚠️</div>
            <h2 className={styles.title}>
              {tPayment("confirmFailed", { default: "결제 확인 실패" })}
            </h2>
            <p className={styles.description}>
              {errorMessage ??
                tPayment("confirmError", {
                  default: "결제 승인 중 오류가 발생했습니다.",
                })}
            </p>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleBackToUpload}
            >
              {tFace("goToUpload", { default: "업로드로 돌아가기" })}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (stage === "error-generate") {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.resultCard}>
            <div className={styles.iconSuccess}>✅</div>
            <h2 className={styles.title}>
              {tFace("successTitle", { default: "결제가 완료되었습니다" })}
            </h2>
            <p className={styles.description}>
              {tFace("characterGenerateFailed", {
                default: "캐릭터 이미지 생성에 실패했어요",
              })}
              {errorMessage ? ` (${errorMessage})` : ""}
            </p>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleRetryGenerate}
              >
                {tFace("characterRetry", { default: "다시 시도" })}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleViewResult}
              >
                {tFace("viewResult", { default: "결과 보기" })}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // done: should have been redirected, but fallback
  return (
    <AnalysisLoading
      messages={[tFace("viewResult", { default: "결과 보기" })]}
    />
  );
}

export default function FaceSpoilerPaymentSuccessPage() {
  return (
    <Suspense fallback={<AnalysisLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
