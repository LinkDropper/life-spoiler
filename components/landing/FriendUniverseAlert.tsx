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
 * 상영관 컨셉에 맞춰 가로 띠가 아니라 장면 위에 얹힌 금색 상태 칩으로 둔다.
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
    <div className={styles.wrap}>
      <Link
        href="/universe/create"
        className={styles.chip}
        aria-label={t("ariaLabel")}
      >
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>{t("chip")}</span>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path
            d="M6 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
    </div>
  );
};
