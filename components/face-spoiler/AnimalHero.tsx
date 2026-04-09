import Image from "next/image";
import { getTranslations } from "next-intl/server";

import type { AnimalMatch } from "@/libs/face-spoiler/types";

import styles from "./AnimalHero.module.css";

interface AnimalHeroProps {
  animalMatch: AnimalMatch;
  characterImageUrl: string | null;
  characterImagePlaceholder?: string;
  /** true면 히어로에 rationale/matchedRegions 본편용 노출. 프리뷰는 false */
  showFullContext?: boolean;
}

export const AnimalHero = async ({
  animalMatch,
  characterImageUrl,
  characterImagePlaceholder,
  showFullContext = true,
}: AnimalHeroProps) => {
  const tAnimals = await getTranslations("faceSpoiler.animals");
  const tHero = await getTranslations("faceSpoiler.report.animalHero");

  const primaryLabel = tAnimals(animalMatch.primary);

  return (
    <section className={styles.hero} aria-label={primaryLabel}>
      <div className={styles.imageWrapper}>
        {characterImageUrl ? (
          <Image
            src={characterImageUrl}
            alt={primaryLabel}
            className={styles.image}
            width={1024}
            height={1024}
            priority
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            {characterImagePlaceholder ?? ""}
          </div>
        )}
        <span className={styles.primaryLabel} aria-hidden="true">
          {primaryLabel}
        </span>
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

      {showFullContext && (
        <p className={styles.rationale}>{animalMatch.rationale}</p>
      )}
    </section>
  );
};
