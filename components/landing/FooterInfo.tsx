import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import styles from "./FooterInfo.module.css";

const InstagramIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
      fill="currentColor"
    />
  </svg>
);

const XIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
    />
  </svg>
);

const KakaoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 3C6.477 3 2 6.463 2 10.691c0 2.72 1.794 5.108 4.508 6.457-.199.749-.72 2.712-.825 3.132-.128.514.188.506.396.368.163-.109 2.593-1.76 3.643-2.473.737.104 1.498.159 2.278.159 5.523 0 10-3.463 10-7.643C22 6.463 17.523 3 12 3z"
      fill="currentColor"
    />
  </svg>
);

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
      <div className={styles.socialLinks}>
        <a
          href="https://www.instagram.com/life.spoiler_?igsh=MTluajNqeTVhZjFrNQ%3D%3D&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className={styles.socialLink}
        >
          <InstagramIcon />
        </a>
        <a
          href="https://x.com/LDropper97603"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X (Twitter)"
          className={styles.socialLink}
        >
          <XIcon />
        </a>
        <a
          href="https://pf.kakao.com/_lVfAX"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KakaoTalk Channel"
          className={styles.socialLink}
        >
          <KakaoIcon />
        </a>
      </div>
    </section>
  );
};
