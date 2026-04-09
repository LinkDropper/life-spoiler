"use client";

import { useTranslations } from "next-intl";

import { FacePolicyLayout } from "@/components/face-spoiler/FacePolicyLayout";

import styles from "./page.module.css";

export const TermsContent = () => {
  const t = useTranslations("faceSpoiler.policy.terms");

  return (
    <FacePolicyLayout
      title={t("title")}
      closeButtonText={t("closeButton")}
    >
      <p>
        <strong className={styles.articleTitle}>{t("article1.title")}</strong>
        <br />
        {t("article1.content")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article2.title")}</strong>
        <br />
        1. {t("article2.item1")}
        <br />
        2. {t("article2.item2")}
        <br />
        3. {t("article2.item3")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article3.title")}</strong>
        <br />
        1. {t("article3.item1")}
        <br />
        2. {t("article3.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article4.title")}</strong>
        <br />
        1. {t("article4.item1")}
        <br />
        2. {t("article4.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article5.title")}</strong>
        <br />
        1. {t("article5.item1")}
        <br />
        2. {t("article5.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article6.title")}</strong>
        <br />
        1. {t("article6.item1")}
        <br />
        2. {t("article6.item2")}
        <br />
        3. {t("article6.item3")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article7.title")}</strong>
        <br />
        1. {t("article7.item1")}
        <br />
        2. {t("article7.item2")}
      </p>

      <p>
        <strong className={styles.articleTitle}>{t("article8.title")}</strong>
        <br />
        1. {t("article8.item1")}
        <br />
        2. {t("article8.item2")}
      </p>

      <p>{t("effectiveDate")}</p>
    </FacePolicyLayout>
  );
};
