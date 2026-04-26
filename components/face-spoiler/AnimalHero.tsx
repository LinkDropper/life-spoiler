import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { AnimalMatch } from "@/libs/face-spoiler/types";

import {
  FACE_SPOILER_DOWNLOAD_SLOT_ID,
  FACE_SPOILER_HERO_CAPTURE_ID,
} from "./face-report-actions-constants";

import styles from "./AnimalHero.module.css";

interface AnimalHeroProps {
  animalMatch: AnimalMatch;
  characterImageUrl: string | null;
  characterImagePlaceholder?: string;
  /** true면 히어로에 rationale/matchedRegions 본편용 노출. 프리뷰는 false */
  showFullContext?: boolean;
  /** 우상단 다운로드 버튼 slot 컨테이너 노출 여부 (owner 전용) */
  showDownloadSlot?: boolean;
}

export const AnimalHero = async ({
  animalMatch,
  characterImageUrl,
  characterImagePlaceholder,
  showFullContext = true,
  showDownloadSlot = false,
}: AnimalHeroProps) => {
  const tAnimals = await getTranslations("faceSpoiler.animals");
  const tHero = await getTranslations("faceSpoiler.report.animalHero");

  const primaryLabel = tAnimals(animalMatch.primary);

  return (
    <section className={styles.hero} aria-label={primaryLabel}>
      <div id={FACE_SPOILER_HERO_CAPTURE_ID} className={styles.imageWrapper}>
        {characterImageUrl ? (
          <Image
            src={characterImageUrl}
            alt={primaryLabel}
            className={styles.image}
            width={1024}
            height={1024}
            priority
            unoptimized
            crossOrigin="anonymous"
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            {characterImagePlaceholder ?? ""}
          </div>
        )}
        <span className={styles.primaryLabel} aria-hidden="true">
          {primaryLabel}
        </span>
        {showDownloadSlot && (
          <div
            id={FACE_SPOILER_DOWNLOAD_SLOT_ID}
            className={styles.downloadSlot}
            data-capture-exclude="true"
          />
        )}
      </div>

      {showFullContext && animalMatch.matchedRegions.length > 0 && (
        <div className={styles.regionsRow}>
          <span className={styles.regionsLabel}>
            {tHero("matchedRegionsLabel")}
          </span>
          {animalMatch.matchedRegions.map((region, index) => (
            <span key={index} className={styles.regionChip}>
              {region}
            </span>
          ))}
        </div>
      )}

      {showFullContext && animalMatch.rationale && (
        <p className={styles.rationale}>{animalMatch.rationale}</p>
      )}
    </section>
  );
};
