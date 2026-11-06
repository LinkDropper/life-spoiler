"use client";

import { useTranslations } from "next-intl";

import {
  PolicyArticle,
  PolicyBox,
  PolicyLayout,
  PolicyLead,
  PolicySubList,
} from "@/components/policy/PolicyLayout";

const ARTICLE_KEYS = [
  "article1",
  "article2",
  "article3",
  "article4",
  "article5",
  "article6",
  "article7",
] as const;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

export const PrivacyContent = () => {
  const t = useTranslations("policy.privacy");
  const tCommon = useTranslations("policy.common");

  const articles = ARTICLE_KEYS.map((key) => ({
    id: key,
    title: t(`${key}.title`),
  }));
  const [a1, a2, a3, a4, a5, a6, a7] = articles;

  // "이메일: ttja.when@gmail.com" 문장은 그대로 두고 주소만 메일 링크로
  const emailLine = t("article6.email");
  const email = EMAIL_PATTERN.exec(emailLine)?.[0];
  const [emailLabel] = email ? emailLine.split(email) : [emailLine];

  return (
    <PolicyLayout
      kind="privacy"
      title={t("title")}
      lead={<PolicyLead>{t("intro")}</PolicyLead>}
      articles={articles}
      closeButtonText={t("closeButton")}
    >
      <PolicyArticle
        {...a1}
        lead={t("article1.content")}
        items={[t("article1.item1"), t("article1.item2"), t("article1.item3")]}
      />
      <PolicyArticle
        {...a2}
        lead={t("article2.content")}
        items={[t("article2.item1"), t("article2.item2")]}
      />
      <PolicyArticle
        {...a3}
        lead={t("article3.content")}
        items={[
          t("article3.item1"),
          <>
            {t("article3.item2")}
            <PolicySubList
              items={[t("article3.item2a"), t("article3.item2b")]}
            />
          </>,
        ]}
      />
      <PolicyArticle {...a4} lead={t("article4.content")} />
      <PolicyArticle
        {...a5}
        items={[t("article5.item1"), t("article5.item2")]}
      />
      <PolicyArticle {...a6} lead={t("article6.content")}>
        <PolicyBox tone="contact">
          <ul>
            <li>{t("article6.name")}</li>
            <li>
              {email ? (
                <>
                  {emailLabel}
                  <a
                    href={`mailto:${email}`}
                    aria-label={tCommon("emailAria", { email })}
                  >
                    {email}
                  </a>
                </>
              ) : (
                emailLine
              )}
            </li>
          </ul>
        </PolicyBox>
      </PolicyArticle>
      <PolicyArticle {...a7} lead={t("article7.content")}>
        <PolicyBox>
          <p>{t("article7.purpose")}</p>
        </PolicyBox>
        <PolicyBox>
          <p>{t("article7.settings")}</p>
        </PolicyBox>
        <PolicyBox tone="notice">
          <p>{t("article7.warning")}</p>
        </PolicyBox>
      </PolicyArticle>
    </PolicyLayout>
  );
};
