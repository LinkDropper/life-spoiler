"use client";

import { useTranslations } from "next-intl";
import { forwardRef } from "react";

import { toPastLifeTraits } from "@/libs/fortune/past-life-screen";
import type { PastLifeProfileCardResponse } from "@/libs/services/ai/types";

import { CharacterPoster, PosterTraitsIntro } from "./CharacterPoster";

/** 그림이 없을 때(생성 실패·예전 결과) 쓰는 기본 그림 */
const FALLBACK_KEYART = "/images/star/jami.png";

export interface PastLifeCharacterPosterProps {
  name: string;
  imageUrl: string | null;
  headline: string;
  /** 칭호 (stats.title) */
  title: string;
  /** 시대 · 장소 */
  era: string;
  location: string;
  profileCard: PastLifeProfileCardResponse;
  isImage?: boolean;
  shouldShowShareButton?: boolean;
  onShareClick?: () => void;
}

/**
 * 전생 캐릭터 포스터 (기획서 §12): 같은 틀(CharacterPoster)의 키 아트 레이아웃.
 * AI 키 아트가 위를 채우고, 칭호 · 묘비명 · 해시태그 · 캐릭터 소개(성향 4).
 */
export const PastLifeCharacterPoster = forwardRef<
  HTMLDivElement,
  PastLifeCharacterPosterProps
>(
  (
    { name, imageUrl, headline, title, era, location, profileCard, ...rest },
    ref
  ) => {
    const t = useTranslations("fortune.screen.pastLife.poster");

    return (
      <CharacterPoster
        ref={ref}
        heroLayout={imageUrl ? "keyart" : "emblem"}
        backdropText="PREQUEL"
        heroSrc={imageUrl ?? FALLBACK_KEYART}
        heroAlt={headline}
        cornerLabel="CHARACTER POSTER · PREQUEL"
        kicker={t("title", { title })}
        castLine={t("castLine", { name, era, location })}
        headline={headline}
        quote={profileCard.epitaph}
        tags={profileCard.hashtags.map((tag) => tag.replace(/^#/, ""))}
        bottom={
          <PosterTraitsIntro
            lead={t("introducing")}
            items={toPastLifeTraits(profileCard.spectrums)}
          />
        }
        billing={[
          `LIFE SPOILER PRESENTS A PREQUEL · STARRING ${name.toUpperCase()}`,
          "BASED ON THE ORIGINAL ZI WEI CHART · LIFE-SPOILER.COM",
        ]}
        brandLabel={t("brand")}
        shareLabel={t("share")}
        {...rest}
      />
    );
  }
);

PastLifeCharacterPoster.displayName = "PastLifeCharacterPoster";
