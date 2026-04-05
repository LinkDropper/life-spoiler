"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useUser, useAuthStatus } from "@/libs/stores/user";

import styles from "./CTAButton.module.css";

export const CTAButton = () => {
  const router = useRouter();
  const user = useUser();
  const authStatus = useAuthStatus();
  const t = useTranslations("landing.cta");

  const isAuthenticated = authStatus === "authenticated";

  const handleClick = () => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    router.push("/home");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {!isAuthenticated && (
          <p className={styles.tooltip}>
            {t("subtext", { default: "3분이면 충분해요" })}
          </p>
        )}
        <button type="button" className={styles.button} onClick={handleClick}>
          {isAuthenticated ? (
            <>
              <span className={styles.text}>
                {t("buttonAuthenticated", {
                  default: "내 운세 결과 보기",
                })}
              </span>
              <Image
                src="/images/landing/arrow-right.svg"
                alt=""
                width={24}
                height={24}
              />
            </>
          ) : (
            <>
              <span className={styles.text}>
                {t("button", {
                  default: "내 전성기 확인하기",
                })}
              </span>
              <span className={styles.priceBadge}>
                {t("priceBadge", { default: "990원" })}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
