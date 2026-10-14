"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { CopyToast } from "@/components/fortune/common";
import { ShareDrawer } from "@/components/fortune/ShareDrawer";
import { HeaderClient } from "@/components/landing";
import {
  consumeIsReturnDay,
  trackDailyEvent,
  type DailyShareChannel,
} from "@/libs/analytics";
import { toKstDateString } from "@/libs/daily/kst-date";
import { encodeShareToken, toShareKeys } from "@/libs/daily/share-token";
import type { DailyFortuneView } from "@/libs/daily/types";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao } from "@/libs/kakao";
import { useUser } from "@/libs/stores/user";

import { DailyCategoryRow } from "./DailyCategoryRow";
import { DailyShareCard } from "./DailyShareCard";
import { DailyStars } from "./DailyStars";
import { getColorSwatch } from "./color-swatch";
import { formatDailyDate } from "./format-date";
import styles from "./DailyFortuneScreen.module.css";

/**
 * 프로필 출생 시간 수정 화면 경로.
 * 현재 수정 화면이 없다(프로필은 생성/삭제만 가능: `/profile/setup`, `DELETE /api/profile/[id]`).
 * 수정 경로가 생기면 여기에 경로를 넣는다 — null이면 "시간을 입력하면 더 정확해져요" 안내와 링크를 숨긴다.
 */
const PROFILE_TIME_EDIT_PATH: string | null = null;

const TOAST_DURATION_MS = 2000;
const IMAGE_RENDER_WAIT_MS = 100;

type ScreenStatus = "idle" | "refreshing" | "error";

interface DailyFortuneScreenProps {
  profileId: string;
  /** 인사말 전용. View DTO에는 이름이 없다 */
  name: string;
  initialView: DailyFortuneView;
  /** 프로필이 2개 이상일 때만 "프로필 변경"을 보여준다 (1개면 선택 화면을 건너뛰므로) */
  canChangeProfile: boolean;
  /** 개발용 날짜 오버라이드 중에는 자정 재조회를 하지 않는다 */
  isDateFixed: boolean;
}

export const DailyFortuneScreen = ({
  profileId,
  name,
  initialView,
  canChangeProfile,
  isDateFixed,
}: DailyFortuneScreenProps) => {
  const t = useTranslations("daily");
  const locale = useLocale();
  const user = useUser();

  const [view, setView] = useState<DailyFortuneView>(initialView);
  const [status, setStatus] = useState<ScreenStatus>("idle");
  const [dateChangedNotice, setDateChangedNotice] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    ref: shareCardRef,
    download: downloadShareImage,
    isDownloading,
  } = useImageDownload({
    filename: t("result.shareImageFilename"),
    pixelRatio: 2,
  });

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    },
    []
  );

  const { date, confidence } = view;
  const overallLevel = view.overall.level;

  // 날짜별 1회 열람 계측
  useEffect(() => {
    trackDailyEvent("daily_view", {
      date,
      confidence: confidence === "exact" ? "time_known" : "time_unknown",
      overall_level: overallLevel,
      profile_time_known: confidence === "exact",
      is_return_day: consumeIsReturnDay(date),
    });
  }, [date, confidence, overallLevel]);

  const refetch = useCallback(async () => {
    setStatus("refreshing");

    try {
      const response = await fetch(
        `/api/daily/fortune?profileId=${encodeURIComponent(profileId)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("daily fetch failed");
      }

      const body = (await response.json()) as { data: DailyFortuneView };
      setView(body.data);
      setDateChangedNotice(body.data.date !== date);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [profileId, date]);

  // 자정(KST) 이후 탭으로 돌아오면 새 날짜 결과로 갱신
  useEffect(() => {
    if (isDateFixed) {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (toKstDateString(new Date()) !== date) {
        void refetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isDateFixed, date, refetch]);

  const shareToken = useMemo(() => encodeShareToken(toShareKeys(view)), [view]);

  const buildShareUrl = useCallback((): string => {
    const url = new URL("/daily/share", window.location.origin);
    url.searchParams.set("t", shareToken);
    if (user?.id) {
      url.searchParams.set("ref", user.id);
    }
    return url.toString();
  }, [shareToken, user?.id]);

  const trackShare = useCallback(
    (channel: DailyShareChannel) =>
      trackDailyEvent("daily_share_click", { date, channel }),
    [date]
  );

  const handleOpenShare = () => setIsShareOpen(true);
  const handleCloseShare = () => setIsShareOpen(false);

  const handleCopyLink = useCallback(async () => {
    trackShare("copy_link");
    const shareUrl = buildShareUrl();

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt(t("result.share"), shareUrl);
      return;
    }

    setShowCopyToast(true);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(
      () => setShowCopyToast(false),
      TOAST_DURATION_MS
    );
  }, [buildShareUrl, trackShare, t]);

  const handleShareKakao = useCallback(() => {
    trackShare("kakao");
    shareToKakao({
      title: t("result.shareTitle"),
      description: t("result.shareText", { headline: view.headline.text }),
      name: t("result.shareTitle"),
      webDomain: buildShareUrl(),
    });
    setIsShareOpen(false);
  }, [buildShareUrl, trackShare, t, view.headline.text]);

  const handleDownloadImage = useCallback(async () => {
    trackShare("image");
    setShowShareCard(true);
    // 숨김 카드가 렌더링될 시간을 확보
    await new Promise((resolve) => setTimeout(resolve, IMAGE_RENDER_WAIT_MS));

    try {
      await downloadShareImage();
    } finally {
      setShowShareCard(false);
      setIsShareOpen(false);
    }
  }, [downloadShareImage, trackShare]);

  const handleCategoryExpand = (category: string) =>
    trackDailyEvent("daily_category_expand", {
      date,
      category,
      overall_level: overallLevel,
    });

  const handleCtaClick = (ctaProduct: string) =>
    trackDailyEvent("daily_cta_click", {
      date,
      category: view.cta.category,
      cta_product: ctaProduct,
    });

  const handleToggleDetails = () => setIsDetailsOpen((prev) => !prev);

  const colorSwatch = getColorSwatch(view.keywords.color.slug);
  const keywordItems: { label: string; value: string; swatch?: string }[] = [
    {
      label: t("result.keywordColor"),
      value: view.keywords.color.label,
      swatch: colorSwatch,
    },
    { label: t("result.keywordItem"), value: view.keywords.item.label },
    { label: t("result.keywordNumber"), value: String(view.keywords.number) },
    { label: t("result.keywordTime"), value: view.keywords.timeSlot.label },
  ];

  const renderBody = () => {
    if (status === "error") {
      return (
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorText}>{t("result.errorMessage")}</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={refetch}
          >
            {t("result.retry")}
          </button>
        </div>
      );
    }

    return (
      <>
        <section
          className={styles.headlineCard}
          aria-labelledby="daily-headline"
        >
          <p className={styles.greeting}>
            {t("result.greeting", {
              date: formatDailyDate(view.date, locale),
              name,
            })}
          </p>
          <h2 id="daily-headline" className={styles.headlineLabel}>
            {t("result.headlineLabel")}
          </h2>
          <p className={styles.headline}>{view.headline.text}</p>
        </section>

        {view.confidence === "estimated" && (
          <div className={styles.notice}>
            <p className={styles.noticeText}>{t("result.timeUnknownNotice")}</p>
            {PROFILE_TIME_EDIT_PATH && (
              <Link
                href={PROFILE_TIME_EDIT_PATH}
                className={styles.noticeLink}
                onClick={() =>
                  trackDailyEvent("daily_time_unknown_notice_click")
                }
              >
                {t("result.timeUnknownImprove")}
              </Link>
            )}
          </div>
        )}

        <section className={styles.card} aria-labelledby="daily-overall">
          <div className={styles.overallHeader}>
            <h2 id="daily-overall" className={styles.cardTitle}>
              {t("category.overall")}
            </h2>
            <DailyStars level={view.overall.level} />
          </div>
          <p className={styles.bodyText}>{view.overall.text}</p>
          {view.variable && (
            <p className={styles.variableText}>
              <span className={styles.variableLabel}>
                {t("result.variableLabel")}
              </span>
              {view.variable.text}
            </p>
          )}
        </section>

        <section
          className={styles.card}
          aria-label={t("result.categoryListLabel")}
        >
          <p className={styles.hint}>{t("result.categoryToggleHint")}</p>
          <ul className={styles.categoryList}>
            {view.categories.map((result) => (
              <DailyCategoryRow
                key={`${view.date}-${result.category}`}
                result={result}
                onExpand={handleCategoryExpand}
              />
            ))}
          </ul>
        </section>

        <section className={styles.card} aria-labelledby="daily-keywords">
          <h2 id="daily-keywords" className={styles.cardTitle}>
            {t("result.keywordsTitle")}
          </h2>
          <dl className={styles.keywordGrid}>
            {keywordItems.map(({ label, value, swatch }) => (
              <div key={label} className={styles.keywordChip}>
                <dt className={styles.keywordLabel}>{label}</dt>
                <dd className={styles.keywordValue}>
                  {swatch && (
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: swatch }}
                      aria-hidden="true"
                    />
                  )}
                  <span>{value}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className={styles.bodyText}>{view.keywords.reason.text}</p>
        </section>

        <section className={styles.card} aria-labelledby="daily-caution">
          <h2 id="daily-caution" className={styles.cardTitle}>
            {t("result.cautionTitle")}
          </h2>
          <p className={styles.bodyText}>{view.caution.text}</p>
        </section>

        <section className={styles.card} aria-labelledby="daily-tip">
          <h2 id="daily-tip" className={styles.cardTitle}>
            {t("result.tipTitle")}
          </h2>
          <p className={styles.bodyText}>{view.tip.text}</p>
        </section>

        <section className={styles.ctaCard}>
          {view.cta.product === "lifetime" ? (
            <>
              <h2 className={styles.ctaTitle}>
                {t("result.ctaLifetimeTitle")}
              </h2>
              <p className={styles.ctaBody}>{t("result.ctaLifetimeBody")}</p>
              <Link
                href={`/fortune/lifetime/preview/${profileId}`}
                className={styles.ctaButton}
                onClick={() => handleCtaClick("lifetime")}
              >
                {t("result.ctaLifetimeButton")}
              </Link>
            </>
          ) : (
            <>
              <h2 className={styles.ctaTitle}>{t("result.ctaPaidTitle")}</h2>
              <p className={styles.ctaBody}>{t("result.ctaPaidBody")}</p>
              <div className={styles.ctaButtons}>
                <Link
                  href="/profiles?type=yearly"
                  className={styles.ctaButton}
                  onClick={() => handleCtaClick("yearly")}
                >
                  {t("result.ctaYearlyButton")}
                </Link>
                <Link
                  href="/compatibility"
                  className={styles.ctaButton}
                  onClick={() => handleCtaClick("compatibility")}
                >
                  {t("result.ctaCompatibilityButton")}
                </Link>
              </div>
            </>
          )}
        </section>

        <button
          type="button"
          className={styles.shareButton}
          onClick={handleOpenShare}
        >
          {t("result.share")}
        </button>

        <footer className={styles.footer}>
          <p className={styles.disclaimer}>{t("result.disclaimer")}</p>
          <p className={styles.disclaimer}>
            {t("result.midnightNotice")}{" "}
            <button
              type="button"
              className={styles.detailsToggle}
              onClick={handleToggleDetails}
              aria-expanded={isDetailsOpen}
              aria-controls="daily-details"
            >
              {isDetailsOpen
                ? t("result.detailsClose")
                : t("result.detailsOpen")}
            </button>
          </p>
          <p
            id="daily-details"
            className={styles.details}
            hidden={!isDetailsOpen}
          >
            {t("result.detailsBody")}
          </p>
        </footer>
      </>
    );
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t("result.pageTitle")}</h1>
          {canChangeProfile && (
            <Link href="/profiles?type=daily" className={styles.changeLink}>
              {t("result.changeProfile")}
            </Link>
          )}
        </div>

        {locale !== "ko" && (
          <div className={styles.notice}>
            <p className={styles.noticeText}>{t("result.koOnlyNotice")}</p>
          </div>
        )}

        <div className={styles.live} role="status" aria-live="polite">
          {status === "refreshing" && t("result.refreshing")}
          {status === "idle" && dateChangedNotice && t("result.dateChanged")}
        </div>

        {renderBody()}
      </main>

      <ShareDrawer
        isOpen={isShareOpen}
        onClose={handleCloseShare}
        title={t("result.share")}
        onCopyLink={handleCopyLink}
        onShareKakao={handleShareKakao}
        onDownloadImage={handleDownloadImage}
        isDownloading={isDownloading}
        showLine={false}
        downloadImageLabel={t("result.saveImage")}
      />

      {showShareCard && (
        <div className={styles.captureArea} aria-hidden="true">
          <DailyShareCard
            ref={shareCardRef}
            date={view.date}
            headline={view.headline.text}
            color={view.keywords.color.label}
            colorSlug={view.keywords.color.slug}
            item={view.keywords.item.label}
            number={view.keywords.number}
            timeSlot={view.keywords.timeSlot.label}
          />
        </div>
      )}

      {showCopyToast && <CopyToast message={t("result.copyToast")} />}
    </div>
  );
};
