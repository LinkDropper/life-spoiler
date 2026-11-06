"use client";

import { useTranslations } from "next-intl";

import {
  PolicyArticle,
  PolicyBox,
  PolicyChip,
  PolicyLayout,
} from "@/components/policy/PolicyLayout";

/** 조항별 번호 항목 수. 제1조는 번호 없이 문단 하나 */
const ARTICLE_ITEM_COUNTS = [0, 3, 2, 2, 2, 3, 2, 2] as const;

export const TermsContent = () => {
  const t = useTranslations("policy.terms");

  const articles = ARTICLE_ITEM_COUNTS.map((itemCount, index) => {
    const key = `article${index + 1}`;
    return {
      id: key,
      title: t(`${key}.title`),
      lead: itemCount === 0 ? t(`${key}.content`) : undefined,
      items: Array.from({ length: itemCount }, (_, itemIndex) =>
        t(`${key}.item${itemIndex + 1}`)
      ),
    };
  });

  return (
    <PolicyLayout
      kind="terms"
      title={t("title")}
      lead={<PolicyChip>{t("effectiveChip")}</PolicyChip>}
      articles={articles}
      closeButtonText={t("closeButton")}
    >
      {articles.map((article) => (
        <PolicyArticle
          key={article.id}
          id={article.id}
          title={article.title}
          lead={article.lead}
          items={article.items}
        />
      ))}
      <PolicyBox>
        <p>{t("effectiveDate")}</p>
      </PolicyBox>
    </PolicyLayout>
  );
};
