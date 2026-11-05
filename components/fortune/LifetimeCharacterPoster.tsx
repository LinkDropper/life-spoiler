"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import type { ProfileTraitsResponse } from "@/libs/services/ai/types";
import { getStarImagePath } from "@/libs/utils";

import {
  CharacterPoster,
  PosterRatings,
  PosterTraitsIntro,
} from "./CharacterPoster";
import type { PosterTrait } from "./CharacterPoster";

type CategoryKey = "wealth" | "career" | "relationship" | "health";
type SpectrumKey = keyof ProfileTraitsResponse["spectrums"];

const CATEGORY_KEYS: CategoryKey[] = [
  "wealth",
  "career",
  "relationship",
  "health",
];
const SPECTRUM_KEYS: SpectrumKey[] = ["activity", "work", "economy", "romance"];
const SPECTRUM_CODES: Record<SpectrumKey, string> = {
  activity: "ACTIVITY",
  work: "WORK",
  economy: "MONEY",
  romance: "LOVE",
};

export interface LifetimeCharacterPosterProps {
  name: string;
  /** 명궁 주성 한글 이름 (그림 경로용). 空宮이면 차용 주성 */
  leadStarKey: string | null;
  /** 화면 언어로 옮긴 주성 이름 (배경 타이포) */
  leadStarLabel: string;
  headline: string;
  /** 성향 데이터 (예전 결과에는 없음) */
  profileTraits?: ProfileTraitsResponse;
  scores: Record<CategoryKey, number>;
  categoryLabels: Record<CategoryKey, string>;
  isImage?: boolean;
  shouldShowShareButton?: boolean;
  onShareClick?: () => void;
}

/** 두 성향 중 기운 쪽 단어와 비율 */
export const toPosterTraits = (traits: ProfileTraitsResponse): PosterTrait[] =>
  SPECTRUM_KEYS.map((key) => {
    const { leftLabel, rightLabel, leftPercentage } = traits.spectrums[key];
    const leansLeft = leftPercentage >= 50;
    return {
      key,
      code: SPECTRUM_CODES[key],
      word: leansLeft ? leftLabel : rightLabel,
      percent: Math.round(leansLeft ? leftPercentage : 100 - leftPercentage),
    };
  });

/**
 * 인생 캐릭터 포스터 (기획서 §11): 올해 포스터와 같은 틀.
 * 배경 타이포 = 명궁 주성 이름, 주인공 그림 = 주성 그림.
 * 하단은 성향 데이터가 있으면 캐릭터 소개 타이틀, 없으면(예전 결과) 네 갈래 평점.
 */
export const LifetimeCharacterPoster = forwardRef<
  HTMLDivElement,
  LifetimeCharacterPosterProps
>(
  (
    {
      name,
      leadStarKey,
      leadStarLabel,
      headline,
      profileTraits,
      scores,
      categoryLabels,
      ...rest
    },
    ref
  ) => {
    const t = useTranslations("fortune.screen.lifetime.poster");
    const hasTraits = Boolean(profileTraits?.spectrums);

    return (
      <CharacterPoster
        ref={ref}
        backdropText={leadStarLabel}
        heroSrc={getStarImagePath(leadStarKey ?? "")}
        heroAlt={leadStarLabel}
        kicker={t("leadStar", { star: leadStarLabel })}
        castLine={t("castLine", { name })}
        headline={headline}
        tags={profileTraits?.hashtags.map((tag) => tag.replace(/^#/, ""))}
        bottom={
          profileTraits && hasTraits ? (
            <PosterTraitsIntro
              lead={t("introducing")}
              items={toPosterTraits(profileTraits)}
            />
          ) : (
            <PosterRatings
              items={CATEGORY_KEYS.map((key) => ({
                key,
                label: categoryLabels[key],
                score: scores[key],
              }))}
            />
          )
        }
        billing={[
          `LIFE SPOILER PRESENTS A LIFE PICTURE · RUNTIME 99 YEARS`,
          "BASED ON THE ORIGINAL ZI WEI CHART · LIFE-SPOILER.COM",
        ]}
        brandLabel={t("brand")}
        shareLabel={t("share")}
        {...rest}
      />
    );
  }
);

LifetimeCharacterPoster.displayName = "LifetimeCharacterPoster";
