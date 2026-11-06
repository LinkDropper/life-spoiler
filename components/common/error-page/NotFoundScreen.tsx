"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import styles from "./ErrorPage.module.css";

const DIRECTORY = [
  { key: "lifetime", href: "/profiles?type=lifetime" },
  { key: "daily", href: "/daily" },
  { key: "compatibility", href: "/compatibility" },
] as const;

/**
 * 없는 페이지 = 극장 안에서 길을 잃음 (2026-11-06).
 * 천장에 매달린 SCREEN 404 번호판 + 상영관 안내도로 갈 곳을 보여 준다.
 */
export const NotFoundScreen = () => {
  const router = useRouter();
  const t = useTranslations("errorPage.notFound");

  // 링크로 바로 들어와 돌아갈 곳이 없으면 로비로
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <main className={styles.main}>
      <div className={styles.sign} aria-hidden="true">
        <span className={styles.signLabel}>{t("screen")}</span>
        <b className={styles.signNumber}>404</b>
        <span className={styles.signBill}>{t("bill")}</span>
      </div>
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.desc}>{t("desc")}</p>

      <nav className={styles.directory} aria-labelledby="directory-label">
        <span id="directory-label" className={styles.directoryLabel}>
          {t("directoryLabel")}
        </span>
        <ul className={styles.directoryList}>
          {DIRECTORY.map(({ key, href }) => (
            <li key={key}>
              <Link href={href} className={styles.directoryLink}>
                <span className={styles.hall}>
                  {t(`directory.${key}.hall`)}
                </span>
                <span className={styles.directoryText}>
                  <b>{t(`directory.${key}.name`)}</b>
                  <span>{t(`directory.${key}.desc`)}</span>
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.actions}>
        <Link href="/" className={styles.primary}>
          {t("home")}
        </Link>
        <button type="button" className={styles.ghost} onClick={handleBack}>
          {t("back")}
        </button>
      </div>
    </main>
  );
};
