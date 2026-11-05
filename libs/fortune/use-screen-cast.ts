"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { getMingConstellation } from "@/libs/fortune/lifetime-screen";
import type { ConstellationStar } from "@/libs/fortune/lifetime-screen";
import {
  translateMainStar,
  translatePalaceName,
} from "@/libs/zi-wei-dou-shu/i18n";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";
import type { Locale } from "@/i18n/config";

interface ScreenCast {
  stars: ConstellationStar[];
  /** 별자리 점마다 붙일 이름: 주성, 없으면 궁 이름 */
  starLabels: string[];
  /** 출연진 줄의 "명궁 천부" */
  leadStar: string;
}

/** 포스터·명반·크레딧에 함께 쓰는 내 별자리와 출연진 이름 */
export const useScreenCast = (chart: ZiweiChart | null): ScreenCast => {
  const locale = useLocale() as Locale;
  const t = useTranslations("fortune.screen.poster");

  return useMemo(() => {
    const stars = chart ? getMingConstellation(chart) : [];
    const starLabels = stars.map((star) =>
      star.starName
        ? translateMainStar(star.starName, locale)
        : translatePalaceName(star.palaceName, locale)
    );
    const [self] = stars;
    const leadStar = self?.starName
      ? t("leadStar", { star: translateMainStar(self.starName, locale) })
      : t("noStar");
    return { stars, starLabels, leadStar };
  }, [chart, locale, t]);
};
