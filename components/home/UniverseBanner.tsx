"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import styles from "./UniverseBanner.module.css";

interface UniverseBannerProps {
  href: string;
}

/**
 * 홈 — 나만의 별자리(친구 우주 궁합) 가로 한 칸.
 *
 * **KO 로케일에서만 노출한다** (노출 분기는 호출부인 `app/home/page.tsx`가 담당).
 * 한줄평/등급 라벨의 EN/JA 번역이 Phase 2이므로, EN/JA 사용자가 홈에서 이 기능을
 * 발견해 한국어 콘텐츠를 마주하는 경로를 차단하는 것이 목적이다.
 * 링크 직접 진입(/universe/{publicId})은 막지 않는다 — 막으면 바이럴 루프가 끊긴다.
 */
export const UniverseBanner = ({ href }: UniverseBannerProps) => {
  const t = useTranslations("home.universe");

  return (
    <Link href={href} className={styles.banner}>
      <Image
        src="/images/home/objects/universe.png"
        alt=""
        width={150}
        height={110}
        className={styles.image}
      />
      <span className={styles.name}>
        {t("title")} <span className={styles.free}>{t("free")}</span>
      </span>
      <span className={styles.line}>{t("description")}</span>
    </Link>
  );
};
