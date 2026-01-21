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
        상호: 웬 컴퍼니 (When Company)
        <br />
        {t("businessInfo.ceo", { default: "대표: 윤재혁" })}
        <br />
        {t("businessInfo.businessNumber", {
          default: "사업자등록번호: 430-05-03654",
        })}
        <br />
        {t("businessInfo.salesNumber", {
          default: "통신판매번호: 2026-서울관악-0200",
        })}
        <br />
        {t("businessInfo.address", {
          default: "서울특별시 관악구 봉천로13나길 19(봉천동)",
        })}
        <br />
        <a href="mailto:ttja.when@gmail.com">
          {t("businessInfo.email", { default: "ttja.when@gmail.com" })}
        </a>
        <br />
        <a href="tel:070-8098-6285">
          {t("businessInfo.phone", { default: "070-8098-6285" })}
        </a>
      </p>
      <div className={styles.links}>
        <Link href="/policy/terms">{t("terms", { default: "이용약관" })}</Link>
        <span className={styles.divider}>|</span>
        <Link href="/policy/privacy">
          {t("privacy", { default: "개인정보 처리방침" })}
        </Link>
      </div>
    </section>
  );
};
