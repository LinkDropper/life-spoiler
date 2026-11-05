"use client";

import { useId } from "react";
import type { ChangeEvent } from "react";
import { useTranslations } from "next-intl";

import { PaymentChoiceRow } from "./PaymentChoiceRow";
import styles from "./PaymentCouponSection.module.css";
import type { OwnedCoupon } from "./payment-view";

interface PaymentCouponSectionProps {
  ownedCoupons: OwnedCoupon[];
  promoCode: string;
  isApplied: boolean;
  isValidating: boolean;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
}

/**
 * "쿠폰 사용"을 고르면 결제 수단 목록 아래로 이어 붙는 영역.
 * 적용 후에도 보유 쿠폰 목록을 남겨 적용된 쿠폰에 체크를 유지하고 나머지는 비활성으로 둔다.
 */
export const PaymentCouponSection = ({
  ownedCoupons,
  promoCode,
  isApplied,
  isValidating,
  onCodeChange,
  onSubmit,
}: PaymentCouponSectionProps) => {
  const t = useTranslations("payment");
  const labelId = useId();
  const inputId = useId();
  const trimmedCode = promoCode.trim();

  const getBenefitLabel = (coupon: OwnedCoupon): string => {
    if (coupon.benefitType === "free_fortune") {
      return t("couponFree");
    }
    return coupon.discountPercent
      ? t("couponDiscount", { percent: coupon.discountPercent })
      : t("couponDiscountGeneric");
  };

  const handleSelectCoupon = (code: string) => {
    onCodeChange(code);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCodeChange(event.target.value);
  };

  // 다른 화면에서 이미 적용돼 코드를 알 수 없으면 입력란은 비워 둔다
  const showInput = !isApplied || trimmedCode !== "";

  return (
    <div className={styles.coupon}>
      {ownedCoupons.length > 0 && (
        <>
          <p className={styles.listLabel} id={labelId}>
            {t("ownedCoupons")}
          </p>
          <div
            className={styles.list}
            role="radiogroup"
            aria-labelledby={labelId}
          >
            {ownedCoupons.map((coupon) => {
              const isChosen = trimmedCode === coupon.code;
              return (
                <PaymentChoiceRow
                  key={coupon.id}
                  name="coupon"
                  value={coupon.code}
                  checked={isChosen}
                  disabled={(isApplied || isValidating) && !isChosen}
                  compact
                  onSelect={handleSelectCoupon}
                >
                  {coupon.code} <small>{getBenefitLabel(coupon)}</small>
                </PaymentChoiceRow>
              );
            })}
          </div>
        </>
      )}

      {showInput && (
        <div className={styles.entry}>
          <label className={styles.srOnly} htmlFor={inputId}>
            {t("couponCodeLabel")}
          </label>
          <input
            id={inputId}
            type="text"
            className={styles.input}
            placeholder={t("promoPlaceholder")}
            value={promoCode}
            onChange={handleInputChange}
            disabled={isValidating || isApplied}
            autoComplete="off"
            autoCapitalize="characters"
          />
          {!isApplied && (
            <button
              type="button"
              className={styles.submit}
              onClick={onSubmit}
              disabled={!trimmedCode || isValidating}
            >
              {t("promoSubmit")}
            </button>
          )}
        </div>
      )}

      {isApplied && (
        <p className={styles.applied}>{t("promoAppliedPlaceholder")}</p>
      )}
    </div>
  );
};
