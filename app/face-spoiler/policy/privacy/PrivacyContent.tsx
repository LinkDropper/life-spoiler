"use client";

import { useTranslations } from "next-intl";

import { FacePolicyLayout } from "@/components/face-spoiler/FacePolicyLayout";

import styles from "./page.module.css";

export const PrivacyContent = () => {
  const t = useTranslations("faceSpoiler.policy.privacy");

  return (
    <FacePolicyLayout title={t("title")} closeButtonText={t("closeButton")}>
      <p>{t("intro")}</p>

      <p>
        <strong className={styles.articleTitle}>{t("article1.title")}</strong>
        <br />
        {t("article1.content")}
        <br />
        1. {t("article1.item1")}
        <br />
        2. {t("article1.item2")}
        <br />
        3. {t("article1.item3")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article2.title")}</strong>
        <br />
        {t("article2.content")}
        <br />
        1. {t("article2.item1")}
        <br />
        2. {t("article2.item2")}
        <br />
        3. {t("article2.item3")}
      </p>

      {/* 이미지 처리 정책 — 별도 강조 조항 */}
      <p className={styles.highlightArticle}>
        <strong className={styles.articleTitle}>{t("article3.title")}</strong>
        <br />
        {t("article3.content")}
        <br />
        1. {t("article3.item1")}
        <br />
        2. {t("article3.item2")}
        <br />
        3. {t("article3.item3")}
        <br />
        4. {t("article3.item4")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article4.title")}</strong>
        <br />
        {t("article4.content")}
        <br />
        1. {t("article4.item1")}
        <br />
        2. {t("article4.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article5.title")}</strong>
        <br />
        {t("article5.content")}
        <br />
        1. {t("article5.item1")}
        <br />
        2. {t("article5.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article6.title")}</strong>
        <br />
        {t("article6.content")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article7.title")}</strong>
        <br />
        {t("article7.content")}
        <br />
        {t("article7.name")}
        <br />
        {t("article7.email")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article8.title")}</strong>
        <br />
        {t("article8.content")}
        <br />
        <br />
        {t("article8.purpose")}
        <br />
        <br />
        {t("article8.settings")}
      </p>

      <p>{t("effectiveDate")}</p>
    </FacePolicyLayout>
  );
};
