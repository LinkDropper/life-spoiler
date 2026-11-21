import { useTranslations } from "next-intl";

import { getCareerFields, getPartner } from "@/libs/fortune/lifetime-extras";
import type { FortuneInterpretation } from "@/libs/services/ai/types";

import { CareerFields, EvidenceLine, PartnerProfile } from "./CategoryExtras";
import { CategoryItem } from "./common";
import type { CategoryKey } from "./common";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

const DEFAULT_LABELS: Record<CategoryKey, string> = {
  wealth: "재물운",
  career: "직업운",
  relationship: "인연운",
  health: "건강운",
};

interface LifetimeCategoryListProps {
  categories: FortuneInterpretation["categories"];
  oneLinerLabel: string;
}

/**
 * 인생 운세 상세 시나리오(재물·직업·인연·건강).
 * 근거 한 줄·직업 분야·만날 사람은 데이터가 있을 때만 그린다 (구 결과에는 없음).
 */
export const LifetimeCategoryList = ({
  categories,
  oneLinerLabel,
}: LifetimeCategoryListProps) => {
  const t = useTranslations("fortune.lifetime");

  const careerFields = getCareerFields({ categories });
  const partner = getPartner({ categories });

  const getExtra = (key: CategoryKey) => {
    if (key === "career" && careerFields.length > 0) {
      return <CareerFields fields={careerFields} />;
    }
    if (key === "relationship" && partner) {
      return <PartnerProfile partner={partner} />;
    }
    return undefined;
  };

  return (
    <>
      {CATEGORY_KEYS.map((key) => {
        const { evidence } = categories[key];
        return (
          <CategoryItem
            key={key}
            categoryKey={key}
            label={t(`categories.${key}`, { default: DEFAULT_LABELS[key] })}
            headline={categories[key].headline}
            content={categories[key].content}
            subSections={categories[key].subSections}
            oneLiner={categories[key].oneLiner}
            oneLinerLabel={oneLinerLabel}
            tags={categories[key].tags}
            showHashtag={false}
            evidence={evidence ? <EvidenceLine text={evidence} /> : undefined}
            extra={getExtra(key)}
          />
        );
      })}
    </>
  );
};
