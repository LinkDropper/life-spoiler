"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import styles from "./PreviewFooter.module.css";

interface PreviewFooterProps {
  shareId: string;
}

export const PreviewFooter = ({ shareId }: PreviewFooterProps) => {
  const router = useRouter();
  const t = useTranslations("faceSpoiler.preview");

  const handleBack = () => {
    router.push("/face-spoiler/profiles");
  };

  const handlePayment = () => {
    router.push(`/face-spoiler/payment/${shareId}`);
  };

  return (
    <footer className={styles.footer}>
      <button
        type="button"
        className={styles.backButton}
        onClick={handleBack}
        aria-label={t("backAriaLabel", { default: "업로드 페이지로 돌아가기" })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.5303 5.46967C15.8232 5.76256 15.8232 6.23744 15.5303 6.53033L10.0607 12L15.5303 17.4697C15.8232 17.7626 15.8232 18.2374 15.5303 18.5303C15.2374 18.8232 14.7626 18.8232 14.4697 18.5303L8.46967 12.5303C8.17678 12.2374 8.17678 11.7626 8.46967 11.4697L14.4697 5.46967C14.7626 5.17678 15.2374 5.17678 15.5303 5.46967Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <button
        type="button"
        className={styles.paymentButton}
        onClick={handlePayment}
      >
        {t("ctaButton", { default: "전체 스포 확인하기 (990원)" })}
      </button>
    </footer>
  );
};
