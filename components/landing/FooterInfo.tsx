import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import styles from "./FooterInfo.module.css";

export const FooterInfo = async () => {
  const t = await getTranslations("landing.footer");

  return (
    <section className={styles.container}>
      <Image
        src="/images/landing/logo.png"
        alt={t("logoAlt", { default: "인생스포 로고" })}
        width={87}
        height={32}
        className={styles.logo}
      />
      <p className={styles.businessInfo}>
        {t("businessInfo.ceo", { default: "대표: 윤재혁" })}
        <br />
        {t("businessInfo.businessNumber", {
          default: "사업자등록번호: 123-45-67890",
        })}
        <br />
        {t("businessInfo.salesNumber", {
          default: "통신판매번호: 2026-서울노원-1503",
        })}
        <br />
        {t("businessInfo.address", { default: "서울시 버드나루로 12길 8" })}
        <br />
        {t("businessInfo.email", { default: "ttja@gmail.com" })}
        <br />
        {t("businessInfo.phone", { default: "070-8094-3030" })}
      </p>
      <div className={styles.links}>
        <Link href="/terms">{t("terms", { default: "이용약관" })}</Link>
        <span className={styles.divider}>|</span>
        <Link href="/privacy">
          {t("privacy", { default: "개인정보 처리방침" })}
        </Link>
      </div>
    </section>
  );
};
