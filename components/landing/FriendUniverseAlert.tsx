"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import styles from "./FriendUniverseAlert.module.css";

/**
 * 랜딩 최상단 — 친구 우주 궁합(나만의 별자리 만들기) 알림 바.
 *
 * 이 기능은 로그인 없이 쓸 수 있는데도 진입점이 `/home`(로그인 필수)과 이미 우주
 * 링크를 받아 들어온 사람이 보는 홍보 영역뿐이라, 비로그인 신규 방문자가 도달할
 * 경로가 없었다. 랜딩 하단에 섹션을 두면 끝까지 스크롤한 사람만 보게 되므로,
 * 헤더 바로 아래 첫 화면에서 존재만 한 줄로 알리는 형태를 택했다.
 *
 * `/login`을 거치지 않고 `/universe/create`로 직행한다 — 로그인을 끼우면 익명
 * 기능의 진입 장벽을 스스로 만드는 셈이 된다.
 * **KO 로케일에서만 노출**하는 것은 홈 카드(`FriendUniverseCard`)와 동일 정책이다.
 */
export const FriendUniverseAlert = () => {
  const t = useTranslations("landing.friendUniverse.alert");
  const locale = useLocale();

  if (locale !== "ko") {
    return null;
  }

  return (
    <Link
      href="/universe/create"
      className={styles.bar}
      aria-label={t("ariaLabel")}
    >
      <span className={styles.badge}>{t("badge")}</span>
      <span className={styles.text}>{t("text")}</span>
      <span className={styles.action}>
        <span className={styles.actionText}>{t("action")}</span>
        {/* 공용 chevron 에셋은 stroke가 white로 고정이라, 강조색과 맞추려고 인라인으로 둔다 */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7.5 4.375L13.125 10L7.5 15.625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
};
