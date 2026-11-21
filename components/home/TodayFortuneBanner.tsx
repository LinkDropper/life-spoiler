"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import styles from "./TodayFortuneBanner.module.css";

interface TodayFortuneBannerProps {
  href: string;
  onClick?: () => void;
}

/**
 * 홈 — 오늘의 운세 가로 한 칸.
 *
 * **KO 로케일에서만 노출한다** (노출 분기는 호출부인 `app/home/page.tsx`가 담당).
 * 문구 사전이 KO뿐이라 EN/JA 화면에서는 진입점을 숨긴다. 링크 직접 진입은 막지 않는다.
 */
export const TodayFortuneBanner = ({
  href,
  onClick,
}: TodayFortuneBannerProps) => {
  const t = useTranslations("home.today");
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <Link href={href} className={styles.banner} onClick={onClick}>
      <Image
        src="/images/home/objects/daily.png"
        alt=""
        width={168}
        height={168}
        className={styles.image}
      />
      <span className={styles.date}>{date}</span>
      <span className={styles.title}>{t("title")}</span>
      <span className={styles.description}>{t("description")}</span>
    </Link>
  );
};
