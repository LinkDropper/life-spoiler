"use client";

import { useTranslations } from "next-intl";

import { GuestCompatibilityContent } from "./GuestCompatibilityContent";
import styles from "./MyCompatibilitySummary.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface MyCompatibilitySummaryProps {
  guest: UniverseGuestDto;
  ownerName: string | null;
}

/**
 * 2번 영역 — 참여 기록 쿠키로 "이미 참여함"이 확인된 방문자에게 친구 입력 폼 대신
 * 보여주는 인라인 궁합 카드. 방금 등록을 마친 직후에도 동일하게 쓰인다(등록 직후
 * drawer를 따로 띄우지 않고 이 카드가 그 자리를 대신한다).
 *
 * 콘텐츠는 `GuestDetailDrawer`(궁합 순위 클릭 시 바텀시트)와 `GuestCompatibilityContent`를
 * 공유해 중복 없이 동일한 정보를 보여준다.
 */
export const MyCompatibilitySummary = ({
  guest,
  ownerName,
}: MyCompatibilitySummaryProps) => {
  const t = useTranslations("universe.detail");
  const title = ownerName
    ? t("myCompatibilityTitle", { name: ownerName })
    : t("myCompatibilityTitleFallback");

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.card}>
        <GuestCompatibilityContent guest={guest} />
      </div>
    </section>
  );
};
