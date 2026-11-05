"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import { CharacterPoster, PosterRatings } from "./CharacterPoster";

type CategoryKey = "wealth" | "career" | "relationship" | "health";

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];

export interface YearlyCharacterPosterProps {
  name: string;
  year: number;
  /** 연도 간지 (병오년) */
  ganji: string;
  headline: string;
  tags?: string[];
  scores: Record<CategoryKey, number>;
  /** 분야 이름 (재물운 …) */
  categoryLabels: Record<CategoryKey, string>;
  isImage?: boolean;
  shouldShowShareButton?: boolean;
  onShareClick?: () => void;
}

const pickLead = (scores: Record<CategoryKey, number>): CategoryKey =>
  CATEGORY_KEYS.reduce((lead, key) =>
    scores[key] > scores[lead] ? key : lead
  );

/** 올해 캐릭터 포스터 (확정 A안, 기획서 §10): 연도 배경 타이포 + 최고 점수 분야 그림 + 네 갈래 평점 */
export const YearlyCharacterPoster = forwardRef<
  HTMLDivElement,
  YearlyCharacterPosterProps
>(
  (
    { name, year, ganji, headline, tags, scores, categoryLabels, ...rest },
    ref
  ) => {
    const t = useTranslations("fortune.screen.yearly.poster");
    const lead = pickLead(scores);

    return (
      <CharacterPoster
        ref={ref}
        backdropText={String(year)}
        heroSrc={`/images/category/${lead}.png`}
        heroAlt={categoryLabels[lead]}
        kicker={t("leadGenre", { category: categoryLabels[lead] })}
        castLine={t("castLine", { name, year, ganji })}
        headline={headline}
        tags={tags}
        bottom={
          <PosterRatings
            items={CATEGORY_KEYS.map((key) => ({
              key,
              label: categoryLabels[key],
              score: scores[key],
            }))}
          />
        }
        billing={[
          `LIFE SPOILER PRESENTS A ${year} PICTURE · RUNTIME 12 MONTHS`,
          "BASED ON THE ORIGINAL ZI WEI CHART · LIFE-SPOILER.COM",
        ]}
        brandLabel={t("brand")}
        shareLabel={t("share")}
        {...rest}
      />
    );
  }
);

YearlyCharacterPoster.displayName = "YearlyCharacterPoster";
