"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  GuestDetailDrawer,
  GuestEntryForm,
  GuestScoreList,
  OtherFortunesPromo,
  ShareLinkButton,
  UniverseOwnerSummary,
  UniverseVisualization,
} from "@/components/universe";
import { useGuestSubmit, useUniverse } from "@/libs/hooks/universe";

import styles from "./page.module.css";

import type { GuestFormValues } from "@/components/universe";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface UniversePageProps {
  params: Promise<{ publicId: string }>;
}

/**
 * `/universe/{publicId}` — 공유 페이지.
 *
 * 영역 순서는 CPO 확정 사항이므로 변경하지 않는다:
 * 1) owner 요약 → 2) 친구 입력 폼 → 3) 시각화 → 4) 순위 목록 → 5) 다른 운세 → 6) 공유
 *
 * 로케일과 무관하게 항상 정상 동작해야 한다. EN/JA에서 막으면 바이럴 루프가 끊긴다.
 * UI 골격은 해당 언어로 나가고, 한줄평/등급 라벨만 KO 고정 + 안내 문구를 덧붙인다.
 */
export default function UniversePage({ params }: UniversePageProps) {
  const { publicId } = use(params);
  const t = useTranslations("universe.detail");
  const locale = useLocale();

  const { state, detail, reload, applyGuest } = useUniverse(publicId);
  const { isSubmitting, submitError, submit } = useGuestSubmit(publicId);
  const [selfStarSeed, setSelfStarSeed] = useState<string | null>(null);
  const [isDuplicateNotice, setIsDuplicateNotice] = useState(false);
  const [detailGuest, setDetailGuest] = useState<UniverseGuestDto | null>(null);

  const scrollToListItem = useCallback((starSeed: string | null) => {
    const target = starSeed
      ? document.getElementById(`guest-${starSeed}`)
      : document.getElementById("universe-ranking");

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleGuestSubmit = useCallback(
    async (values: GuestFormValues) => {
      const result = await submit(values);

      if (!result) {
        return;
      }

      const guestDto: UniverseGuestDto = {
        starSeed: result.starSeed,
        name: result.name,
        score: result.score,
        tier: result.tier,
        oneLinerId: result.oneLinerId,
        oneLinerKo: result.oneLinerKo,
        confidence: result.confidence,
        posXRatio: result.posXRatio,
        posYRatio: result.posYRatio,
        factors: result.factors,
      };

      applyGuest(guestDto, result.isDuplicate);
      setSelfStarSeed(result.starSeed);
      setIsDuplicateNotice(result.isDuplicate);
      scrollToListItem(result.starSeed);
      // 등록 직후 결과를 스크롤 대신(과 함께) 바로 드로어로 보여준다 —
      // 목록까지 스크롤해서 찾아보게 하는 것보다 즉시 피드백이 낫다.
      setDetailGuest(guestDto);
    },
    [applyGuest, scrollToListItem, submit]
  );

  const handleShareScroll = useCallback(() => {
    document
      .getElementById("universe-share")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (state === "loading") {
    return (
      <div className={styles.page}>
        <HeaderClient />

        <main className={styles.main}>
          <p className={styles.status} role="status">
            {t("loading")}
          </p>
        </main>
      </div>
    );
  }

  if (state === "notFound") {
    return (
      <div className={styles.page}>
        <HeaderClient />

        <main className={styles.main}>
          <section className={styles.errorState}>
            <h1 className={styles.errorTitle}>{t("notFoundTitle")}</h1>
            <p className={styles.errorDescription}>
              {t("notFoundDescription")}
            </p>
            <Link href="/" className={styles.errorAction}>
              {t("goHome")}
            </Link>
          </section>
        </main>
      </div>
    );
  }

  if (state === "error" || !detail) {
    return (
      <div className={styles.page}>
        <HeaderClient />

        <main className={styles.main}>
          <section className={styles.errorState}>
            <h1 className={styles.errorTitle}>{t("notFoundTitle")}</h1>
            <button
              type="button"
              className={styles.errorAction}
              onClick={reload}
            >
              {t("retry")}
            </button>
          </section>
        </main>
      </div>
    );
  }

  const shareUrl =
    typeof window === "undefined"
      ? `/universe/${publicId}`
      : `${window.location.origin}/universe/${publicId}`;

  // owner가 시간 미상이면 모든 쌍이 estimated가 된다.
  // 이 경우 고지는 섹션1 배너 + 섹션3 캡션에서 각 1회만 하고,
  // 리스트 행과 별에는 반복하지 않는다 (30개에 같은 태그가 붙으면 벽지가 된다).
  const isUniverseEstimated = detail.ownerSummary.confidence === "estimated";

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 1. owner 요약 */}
        <UniverseOwnerSummary
          ownerName={detail.ownerSummary.ownerName}
          guestCount={detail.guestCount}
          isUniverseEstimated={isUniverseEstimated}
          ownerOneLinerKo={detail.ownerSummary.oneLinerKo}
          guestCountRank={detail.ownerSummary.guestCountRank}
        />

        {/* 2. 친구 입력 폼 */}
        {isDuplicateNotice && (
          <p className={styles.duplicateNotice} role="status">
            {t("duplicateNotice")}
          </p>
        )}
        <GuestEntryForm
          isSubmitting={isSubmitting}
          isFull={detail.isFull}
          submitError={submitError}
          onSubmit={handleGuestSubmit}
        />

        {/* 3. 우주 시각화 */}
        <UniverseVisualization
          ownerName={detail.ownerSummary.ownerName}
          guests={detail.guests}
          selfStarSeed={selfStarSeed}
          isUniverseEstimated={isUniverseEstimated}
          onSelectStar={scrollToListItem}
        />

        {/* 4. 궁합 점수·한줄평 리스트 (시각화의 공식 접근성 대체 구조) */}
        <GuestScoreList
          guests={detail.guests}
          selfStarSeed={selfStarSeed}
          isUniverseEstimated={isUniverseEstimated}
          showLocaleNotice={locale !== "ko"}
          onShareClick={handleShareScroll}
          onGuestClick={setDetailGuest}
        />

        {/* 5. 다른 운세 홍보 */}
        <OtherFortunesPromo />

        {/* 6. 공유 링크 복사 */}
        <div id="universe-share">
          <ShareLinkButton shareUrl={shareUrl} guestCount={detail.guestCount} />
        </div>
      </main>

      <GuestDetailDrawer
        guest={detailGuest}
        onClose={() => setDetailGuest(null)}
      />
    </div>
  );
}
