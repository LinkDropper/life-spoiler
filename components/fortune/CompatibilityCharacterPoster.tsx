"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import {
  COMPATIBILITY_STORY_KEYS,
  getStoryScore,
} from "@/libs/fortune/compatibility-screen";
import type { CompatibilityGenre } from "@/libs/fortune/compatibility-screen";
import type { CompatibilitySubScores } from "@/libs/hooks/compatibility/types";
import { getStarImagePath } from "@/libs/utils";

import { CharacterPoster, PosterRatings } from "./CharacterPoster";

interface PosterLead {
  name: string;
  /** 명궁 주성 한글 이름 (그림 경로용) */
  starKey: string | null;
  /** 화면 언어로 옮긴 주성 이름 */
  starLabel: string;
}

export interface CompatibilityCharacterPosterProps {
  leadA: PosterLead;
  leadB: PosterLead;
  genre: CompatibilityGenre;
  score: number;
  headline: string;
  tags: string[];
  subScores: CompatibilitySubScores;
  isImage?: boolean;
  shouldShowShareButton?: boolean;
  onShareClick?: () => void;
}

/**
 * 공동 주연 포스터 (기획서 §13): 인생·올해와 같은 틀에 두 사람의 명궁 주성 그림을 좌우로.
 * 배경 타이포 = 두 이름, 하단 = 네 갈래 평점.
 */
export const CompatibilityCharacterPoster = forwardRef<
  HTMLDivElement,
  CompatibilityCharacterPosterProps
>(({ leadA, leadB, genre, score, headline, tags, subScores, ...rest }, ref) => {
  const t = useTranslations("fortune.screen.compatibility");

  return (
    <CharacterPoster
      ref={ref}
      heroLayout="duo"
      backdropText={`${leadA.name}×${leadB.name}`}
      heroSrc={getStarImagePath(leadA.starKey ?? "")}
      heroAlt={leadA.starLabel}
      secondHero={{
        src: getStarImagePath(leadB.starKey ?? ""),
        alt: leadB.starLabel,
      }}
      cornerLabel="CO-STARRING POSTER"
      kicker={t("poster.kicker", {
        genre: t(`genre.${genre}`),
        score,
      })}
      castLine={t("poster.castLine", { a: leadA.name, b: leadB.name })}
      headline={headline}
      tags={tags.map((tag) => tag.replace(/^#/, ""))}
      bottom={
        <PosterRatings
          items={COMPATIBILITY_STORY_KEYS.map((key) => ({
            key,
            label: t(`stories.${key}`),
            score: getStoryScore(subScores, key),
          }))}
        />
      }
      billing={[
        // 두 이름은 출연진 줄에 있으니 빌링은 장르만 (길어도 한 줄)
        `LIFE SPOILER PRESENTS A ${t(`genreEn.${genre}`)} · CO-STARRING TWO`,
        "BASED ON TWO ORIGINAL ZI WEI CHARTS · LIFE-SPOILER.COM",
      ]}
      brandLabel={t("poster.brand")}
      shareLabel={t("poster.share")}
      {...rest}
    />
  );
});

CompatibilityCharacterPoster.displayName = "CompatibilityCharacterPoster";
