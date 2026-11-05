"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { CopyToast } from "@/components/fortune/common";
import { FortuneShareSheet } from "@/components/fortune/screen/FortuneShareSheet";
import { HeaderClient } from "@/components/landing";
import {
  consumeIsReturnDay,
  trackDailyEvent,
  type DailyShareChannel,
} from "@/libs/analytics";
import {
  formatCallSheetDate,
  formatCallSheetWeekday,
  getTimeUntilNextCall,
} from "@/libs/daily/call-sheet";
import { toKstDateString } from "@/libs/daily/kst-date";
import { shareLinkWithSystem } from "@/libs/share/system-share";
import { encodeShareToken, toShareKeys } from "@/libs/daily/share-token";
import type { DailyFortuneView } from "@/libs/daily/types";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao } from "@/libs/kakao";
import { useUser } from "@/libs/stores/user";

import { DailyShareCard } from "./DailyShareCard";
import { DailyStars } from "./DailyStars";
import { getColorSwatch } from "./color-swatch";
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

  // 기기 공유 시트(인스타그램 등). 지원하지 않으면 링크 복사로 대신한다
  const handleShareSystem = useCallback(async () => {
    trackShare("system");
    try {
      const shared = await shareLinkWithSystem({
        title: t("result.shareTitle"),
        text: t("result.shareText", { headline: view.headline.text }),
        url: buildShareUrl(),
      });
      if (shared === "unsupported") {
        await handleCopyLink();
      }
    } catch (shareError) {
      console.error("Failed to share with system sheet:", shareError);
    }
    setIsShareOpen(false);
  }, [buildShareUrl, handleCopyLink, trackShare, t, view.headline.text]);

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

  const handleCtaClick = (ctaProduct: string) =>
    trackDailyEvent("daily_cta_click", {
      date,
      category: view.cta.category,
      cta_product: ctaProduct,
    });

  const handleToggleDetails = () => setIsDetailsOpen((prev) => !prev);

  // 다음 콜시트(KST 자정)까지 남은 시간. 서버 렌더와 어긋나지 않게 마운트 뒤에 계산하고 1분마다 갱신한다
  const [timeUntilNextCall, setTimeUntilNextCall] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  useEffect(() => {
    const update = () => setTimeUntilNextCall(getTimeUntilNextCall(new Date()));
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const colorSwatch = getColorSwatch(view.keywords.color.slug);
  const callSheetDate = `${formatCallSheetDate(view.date)} ${formatCallSheetWeekday(view.date, locale)}`;

  const renderCallSheet = () => (
    <div className={styles.sheetStage}>
      <span className={styles.sheetGlow} aria-hidden="true" />
      <span className={styles.clip} aria-hidden="true" />
      <article className={styles.sheet} aria-labelledby="daily-title">
        <div className={styles.sheetHead}>
          <span className={styles.sheetMark}>{t("result.callSheet.mark")}</span>
          <span className={styles.sheetDate}>{callSheetDate}</span>
        </div>

        <div className={styles.titleBlock}>
          <span className={styles.titleLabel}>
            {t("result.callSheet.titleLabel")}
          </span>
          <h2 id="daily-title" className={styles.dayTitle}>
            {view.stick.text}
          </h2>
          <span className={styles.lead}>
            {t("result.callSheet.lead")} <b>{name}</b>
          </span>
        </div>

        <dl className={styles.cells}>
          <div className={styles.cell}>
            <dt className={styles.monoLabel}>{t("result.callSheet.scene")}</dt>
            <dd className={styles.sceneValue}>
              {t("result.callSheet.sceneValue", {
                number: view.keywords.number,
              })}
            </dd>
          </div>
          <div className={styles.cell}>
            <dt className={styles.monoLabel}>
              {t("result.callSheet.callTime")}
            </dt>
            <dd className={styles.cellValue}>{view.keywords.timeSlot.label}</dd>
          </div>
          <div className={styles.cell}>
            <dt className={styles.monoLabel}>{t("category.overall")}</dt>
            <dd className={styles.cellValue}>
              <DailyStars
                level={view.overall.level}
                layout="stacked"
                tone="paper"
              />
            </dd>
          </div>
        </dl>

        <section className={styles.sheetSection}>
          <h3 className={styles.monoLabel}>{t("result.callSheet.synopsis")}</h3>
          <p className={styles.headline}>{view.headline.text}</p>
          <p className={styles.synopsis}>{view.overall.text}</p>
        </section>

        <section className={styles.sheetSection}>
          <h3 className={styles.monoLabel}>{t("result.callSheet.props")}</h3>
          <dl className={styles.propGrid}>
            <div className={styles.propBox}>
              <dt className={styles.propLabel}>{t("result.callSheet.prop")}</dt>
              <dd className={styles.propValue}>{view.keywords.item.label}</dd>
            </div>
            <div className={styles.propBox}>
              <dt className={styles.propLabel}>
                {t("result.callSheet.wardrobe")}
              </dt>
              <dd className={styles.propValue}>
                {colorSwatch && (
                  <span
                    className={styles.swatch}
                    style={{ backgroundColor: colorSwatch }}
                    aria-hidden="true"
                  />
                )}
                {view.keywords.color.label}
              </dd>
            </div>
          </dl>
          <p className={styles.propReason}>{view.keywords.reason.text}</p>
        </section>

        <div className={styles.sheetFoot}>
          <span>{t("result.callSheet.nextCall")}</span>
          {timeUntilNextCall && (
            <span>{t("result.callSheet.remaining", timeUntilNextCall)}</span>
          )}
        </div>
      </article>
    </div>
  );

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

        {renderCallSheet()}

        <section className={styles.panel} aria-labelledby="daily-cast">
          <h2 id="daily-cast" className={styles.panelLabel}>
            {t("result.callSheet.cast")}
          </h2>
          <ul className={styles.castList}>
            {view.categories.map((result) => (
              <li key={result.category} className={styles.castRow}>
                <span className={styles.castName}>
                  {t(`category.${result.category}`)}
                </span>
                <DailyStars level={result.level} />
                <p className={styles.castText}>{result.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel} aria-labelledby="daily-notes">
          <h2 id="daily-notes" className={styles.panelLabel}>
            {t("result.callSheet.notes")}
          </h2>
          <dl className={styles.notes}>
            {view.variable && (
              <>
                <dt className={styles.noteLabel}>
                  {t("result.callSheet.noteVariable")}
                </dt>
                <dd className={styles.noteText}>{view.variable.text}</dd>
              </>
            )}
            <dt className={`${styles.noteLabel} ${styles.noteCaution}`}>
              {t("result.callSheet.noteCaution")}
            </dt>
            <dd className={styles.noteText}>{view.caution.text}</dd>
            <dt className={styles.noteLabel}>
              {t("result.callSheet.noteTip")}
            </dt>
            <dd className={`${styles.noteText} ${styles.noteTip}`}>
              {view.tip.text}
            </dd>
          </dl>
        </section>

        <button
          type="button"
          className={styles.shareButton}
          onClick={handleOpenShare}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("result.callSheet.share")}
        </button>

        <section className={styles.next} aria-labelledby="daily-next">
          {view.cta.product === "lifetime" ? (
            <>
              <h2 id="daily-next" className={styles.nextTitle}>
                {t("result.ctaLifetimeTitle")}
              </h2>
              <p className={styles.nextBody}>{t("result.ctaLifetimeBody")}</p>
              <div className={styles.nextButtons}>
                <Link
                  href={`/fortune/lifetime/preview/${profileId}`}
                  className={styles.nextButton}
                  onClick={() => handleCtaClick("lifetime")}
                >
                  {t("result.ctaLifetimeButton")}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 id="daily-next" className={styles.nextTitle}>
                {t("result.ctaPaidTitle")}
              </h2>
              <p className={styles.nextBody}>{t("result.ctaPaidBody")}</p>
              <div className={styles.nextButtons}>
                <Link
                  href="/profiles?type=yearly"
                  className={styles.nextButton}
                  onClick={() => handleCtaClick("yearly")}
                >
                  {t("result.ctaYearlyButton")}
                </Link>
                <Link
                  href="/compatibility"
                  className={styles.nextButton}
                  onClick={() => handleCtaClick("compatibility")}
                >
                  {t("result.ctaCompatibilityButton")}
                </Link>
              </div>
            </>
          )}
        </section>

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

      <FortuneShareSheet
        isOpen={isShareOpen}
        onClose={handleCloseShare}
        eyebrow="SHARE"
        title={t("result.share")}
        onShareKakao={handleShareKakao}
        onShareSystem={handleShareSystem}
        onCopyLink={handleCopyLink}
        onDownloadImage={handleDownloadImage}
        downloadLabel={t("result.saveImage")}
        isBusy={isDownloading}
      />

      {showShareCard && (
        <div className={styles.captureArea} aria-hidden="true">
          <DailyShareCard
            ref={shareCardRef}
            date={view.date}
            headline={view.headline.text}
            overallLevel={view.overall.level}
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
