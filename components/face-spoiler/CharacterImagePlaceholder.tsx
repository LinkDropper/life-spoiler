import { getTranslations } from "next-intl/server";

import styles from "./CharacterImagePlaceholder.module.css";

export const CharacterImagePlaceholder = async () => {
  const t = await getTranslations("faceSpoiler.preview");

  return (
    <div className={styles.placeholder}>
      <div className={styles.silhouetteWrapper}>
        <svg
          className={styles.silhouette}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* 머리 */}
          <circle cx="60" cy="46" r="24" fill="currentColor" />
          {/* 어깨/상반신 */}
          <path
            d="M20 120 C 20 92, 38 78, 60 78 C 82 78, 100 92, 100 120 Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <p className={styles.caption}>
        {t("characterPlaceholder", {
          default: "결제하면 나만의 관상 캐릭터가 그려져요",
        })}
      </p>
    </div>
  );
};
