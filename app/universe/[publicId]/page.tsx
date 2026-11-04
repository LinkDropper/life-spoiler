"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  EndingCredits,
  GuestDetailDrawer,
  GuestEntryForm,
  MyCompatibilitySummary,
  OtherFortunesPromo,
  ScreeningHero,
  ShareLinkButton,
  UniverseToast,
} from "@/components/universe";
import theme from "@/components/universe/ScreeningTheme.module.css";
import {
  useGuestSubmit,
  useShareUniverseLink,
  useUniverse,
} from "@/libs/hooks/universe";
import { buildSeatMap } from "@/libs/universe/seat-map";

import styles from "./page.module.css";

import type { GuestFormValues } from "@/components/universe";
import type { UniverseGuestDto } from "@/libs/universe/types";

interface UniversePageProps {
  params: Promise<{ publicId: string }>;
}

/**
 * `/universe/{publicId}` — 공유 페이지.
 *
 * 영역 순서(2026-11 친구 시사회 개편으로 1·3을 합쳤다):
 * 1) 스크린 + 좌석 배치도 → 2) 초대장 폼 / 내 관람권 → 4) 엔딩 크레딧
 * → 5) 내 시사회 열기 + 다른 운세 → 6) 초대장 보내기
 *
 * 로케일과 무관하게 항상 정상 동작해야 한다. EN/JA에서 막으면 바이럴 루프가 끊긴다.
 * UI 골격은 해당 언어로 나가고, 한줄평/등급 라벨만 KO 고정 + 안내 문구를 덧붙인다.
 */
export default function UniversePage({ params }: UniversePageProps) {
  const { publicId } = use(params);
  const t = useTranslations("universe.detail");
  const locale = useLocale();

  // detail 로딩 전에도 useShareUniverseLink(훅)를 호출해야 하므로 publicId만으로 계산한다
  const shareUrl =
    typeof window === "undefined"
      ? `/universe/${publicId}`
      : `${window.location.origin}/universe/${publicId}`;

  const { state, detail, reload, applyGuest } = useUniverse(publicId);
  const { isSubmitting, submitError, submit } = useGuestSubmit(publicId);
  const { copyState, showToast, handleShare } = useShareUniverseLink({
    shareUrl,
    shareText: t("shareText"),
  });
  const [justSubmittedGuest, setJustSubmittedGuest] =
    useState<UniverseGuestDto | null>(null);
  const [isDuplicateNotice, setIsDuplicateNotice] = useState(false);
  const [detailGuest, setDetailGuest] = useState<UniverseGuestDto | null>(null);

  // 방금 이 세션에서 입장했으면 그 결과를, 아니면 참여 기록 쿠키로 서버가 내려준
  // detail.selfGuest를 쓴다 — "방금 입장"과 "재방문" 두 경로 모두 이 값 하나로 커버된다.
  const selfGuest = justSubmittedGuest ?? detail?.selfGuest ?? null;
  const selfStarSeed = selfGuest?.starSeed ?? null;

  // 좌석 배정은 점수 구간이 정한다 — 저장 좌표(posXRatio/posYRatio)는 이 화면에서 쓰지 않는다
  const seatMap = useMemo(
    () => buildSeatMap(detail?.guests ?? [], selfStarSeed),
    [detail?.guests, selfStarSeed]
  );

  // 6번 영역(초대장 보내기)에서 클립보드 복사에 실패하면, fallback 안내/원문 URL이
  // 보이는 자리로 스크롤시켜 사용자가 수동 복사를 이어갈 수 있게 한다.
  useEffect(() => {
    if (copyState === "fallback") {
      document
        .getElementById("universe-share")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [copyState]);

  // 입장 직후에는 폼 자리를 대신한 내 관람권으로 시선을 옮긴다 (렌더가 끝난 뒤여야 대상이 있다)
  useEffect(() => {
    if (!justSubmittedGuest) {
      return;
    }
    document
      .getElementById("screening-ticket")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [justSubmittedGuest]);

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
      setJustSubmittedGuest(guestDto);
      setIsDuplicateNotice(result.isDuplicate);
    },
    [applyGuest, submit]
  );

  if (state === "loading") {
    return (
      <div className={`${theme.theme} ${styles.page}`}>
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
      <div className={`${theme.theme} ${styles.page}`}>
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
      <div className={`${theme.theme} ${styles.page}`}>
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

  // owner가 시간 미상이면 모든 쌍이 estimated가 된다.
  // 이 경우 고지는 1번 영역에서 우주 단위로 1회만 하고, 크레딧 행에는 반복하지 않는다.
  const isUniverseEstimated = detail.ownerSummary.confidence === "estimated";
  const mySeat = selfStarSeed
    ? (seatMap.seatsByStarSeed.get(selfStarSeed) ?? null)
    : null;
  const detailSeat = detailGuest
    ? (seatMap.seatsByStarSeed.get(detailGuest.starSeed) ?? null)
    : null;

  return (
    <div className={`${theme.theme} ${styles.page}`}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 1. 스크린 + 좌석 배치도 */}
        <ScreeningHero
          ownerName={detail.ownerSummary.ownerName}
          ownerOneLinerKo={detail.ownerSummary.oneLinerKo}
          guestCount={detail.guestCount}
          guestCountRank={detail.ownerSummary.guestCountRank}
          isUniverseEstimated={isUniverseEstimated}
          seatMap={seatMap}
          mySeat={mySeat}
        />

        {/* 2. 초대장 폼 — 이미 입장한 방문자(쿠키로 판별)에게는 내 관람권으로 대체 */}
        {selfGuest ? (
          <MyCompatibilitySummary
            guest={selfGuest}
            ownerName={detail.ownerSummary.ownerName}
            seat={mySeat}
            showDuplicateNotice={isDuplicateNotice}
          />
        ) : (
          <GuestEntryForm
            ownerName={detail.ownerSummary.ownerName}
            isSubmitting={isSubmitting}
            isFull={detail.isFull}
            submitError={submitError}
            onSubmit={handleGuestSubmit}
          />
        )}

        {/* 4. 엔딩 크레딧 (좌석 배치도의 공식 접근성 대체 구조) */}
        <EndingCredits
          guests={detail.guests}
          selfStarSeed={selfStarSeed}
          seatMap={seatMap}
          isUniverseEstimated={isUniverseEstimated}
          showLocaleNotice={locale !== "ko"}
          onGuestClick={setDetailGuest}
        />

        {/* 5. 이번엔 내 시사회 열기 + 다른 운세 */}
        <OtherFortunesPromo isPrimary={selfGuest !== null} />

        {/* 6. 초대장 보내기 */}
        <div id="universe-share">
          <ShareLinkButton
            shareUrl={shareUrl}
            ownerName={detail.ownerSummary.ownerName}
            guestCount={detail.guestCount}
            copyState={copyState}
            onShare={handleShare}
          />
        </div>
      </main>

      <GuestDetailDrawer
        guest={detailGuest}
        seat={detailSeat}
        onClose={() => setDetailGuest(null)}
      />

      {showToast && <UniverseToast message={t("shareCopied")} />}
    </div>
  );
}
