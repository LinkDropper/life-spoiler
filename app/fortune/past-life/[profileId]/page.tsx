"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ProfileInfo,
  ZiweiChartGrid,
  SectionHeader,
  CopyToast,
  ErrorState,
  ShareDrawer,
} from "@/components/fortune";
import PastLifeProfileCard from "@/components/fortune/PastLifeProfileCard";
import { usePastLifeFortune } from "@/libs/hooks/fortune";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage, shareToLine } from "@/libs/kakao";

import styles from "./page.module.css";

export default function PastLifeFortunePage() {
  const router = useRouter();
  const t = useTranslations("fortune.pastLife");
  const tCommon = useTranslations("fortune.common");

  const {
    isLoading,
    error,
    result,
    profile,
    profileId,
    showCopyToast,
    handleShare,
  } = usePastLifeFortune({
    onProfileNotFound: () => tCommon("profileNotFound"),
    onFetchError: () => t("interpretError"),
    onUnknownError: () => tCommon("unknownError"),
  });

  const [statsExpanded, setStatsExpanded] = useState(true);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [worldExpanded, setWorldExpanded] = useState(true);
  const [birthExpanded, setBirthExpanded] = useState(true);
  const [journeyExpanded, setJourneyExpanded] = useState(true);
  const [endExpanded, setEndExpanded] = useState(true);
  const [contrastExpanded, setContrastExpanded] = useState(true);
  const [connectionsExpanded, setConnectionsExpanded] = useState(true);
  const [tracesExpanded, setTracesExpanded] = useState(true);
  const [lessonsExpanded, setLessonsExpanded] = useState(true);

  // 공유 드로어 상태
  const [isShareDrawerOpen, setIsShareDrawerOpen] = useState(false);
  const [isProfileShareDrawerOpen, setIsProfileShareDrawerOpen] =
    useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 프로필 카드 이미지 훅
  const {
    ref: profileCardRef,
    download: downloadProfileImage,
    toBlob: profileCardToBlob,
    isDownloading,
  } = useImageDownload({
    filename: "life_spoiler_past_life_profile",
    pixelRatio: 2,
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 프로필 이미지 다운로드 핸들러
  const handleProfileDownloadImage = useCallback(async () => {
    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await downloadProfileImage();
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [downloadProfileImage]);

  // 카카오톡 공유 핸들러
  const handleShareKakao = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}`;
    const { interpretation } = result;

    shareToKakao({
      title: interpretation.spoiler.headline,
      description: interpretation.spoiler.description,
      name: profile.name,
      webDomain: shareUrl,
    });

    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

  // LINE 공유 핸들러
  const handleShareLine = useCallback(() => {
    if (!result || !profile) return;

    const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}`;
    const { interpretation } = result;
    const text = `${interpretation.spoiler.headline} - ${profile.name}`;

    shareToLine(shareUrl, text);
    setIsShareDrawerOpen(false);
  }, [result, profile, profileId]);

  // 프로필 이미지 공유 - 카카오톡 핸들러
  const handleProfileShareKakao = useCallback(async () => {
    if (!result || !profile) return;

    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const blob = await profileCardToBlob();
      if (!blob) {
        alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      const shareUrl = `${window.location.origin}/fortune/past-life/share/${profileId}`;

      await shareToKakaoWithImage({
        imageBlob: blob,
        name: profile.name,
        webDomain: shareUrl,
      });
    } catch (err) {
      console.error("Failed to share to Kakao with image:", err);
      alert("공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      timeoutRef.current = setTimeout(() => {
        setShowProfileCard(false);
        setIsProfileShareDrawerOpen(false);
      }, 500);
    }
  }, [result, profile, profileId, profileCardToBlob]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <ErrorState
            message={error}
            buttonText={tCommon("backToProfiles")}
            onButtonClick={() => router.push("/profiles?type=past-life")}
          />
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation } = result;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 정보 */}
        <ProfileInfo
          name={profile.name}
          fortuneType="past_life"
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        <div style={{ width: "100%", height: 16 }} />

        {/* 프로필 카드 (페이지 내 표시용) */}
        <PastLifeProfileCard
          headline={interpretation.spoiler.headline}
          description={interpretation.spoiler.description}
          imageUrl={interpretation.imageUrl}
          profileCard={interpretation.profileCard}
          isImage={false}
          onShareClick={() => setIsProfileShareDrawerOpen(true)}
        />

        {/* 능력치 그래프 섹션 */}
        {interpretation.stats && interpretation.stats.stats.length > 0 && (
          <>
            <SectionHeader
              title={t("statsTitle")}
              expanded={statsExpanded}
              onToggle={() => setStatsExpanded(!statsExpanded)}
            />

            {statsExpanded && (
              <section className={styles.section}>
                <div className={styles.statsList}>
                  {interpretation.stats.stats.map((stat, idx) => (
                    <div key={idx} className={styles.statItem}>
                      <div className={styles.statHeader}>
                        <span className={styles.statLabel}>{stat.label}</span>
                        <span className={styles.statPercent}>
                          {stat.score}%
                        </span>
                      </div>
                      <div className={styles.statBarOuter}>
                        <div
                          className={styles.statBarFill}
                          style={{ width: `${stat.score}%` }}
                        />
                        {[25, 50, 75].map((pos) => (
                          <div
                            key={pos}
                            className={styles.statBarDivider}
                            style={{ left: `${pos}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 자미두수 명반 섹션 */}
        <SectionHeader
          title={t("chartTitle")}
          expanded={chartExpanded}
          onToggle={() => setChartExpanded(!chartExpanded)}
        />

        {chartExpanded && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={result.rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
            />
          </section>
        )}

        {/* 전생 스포일러 */}
        <SectionHeader
          title={t("spoilerTitle")}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />

        {spoilerExpanded && (
          <section className={styles.overviewSection}>
            <h2 className={styles.overviewHeadline}>
              {interpretation.spoiler.headline}
            </h2>
            <p className={styles.overviewSummary}>
              {interpretation.spoiler.summary}
            </p>
          </section>
        )}

        {/* 섹션 2: 전생의 세계 */}
        {interpretation.world && interpretation.world.era && (
          <>
            <SectionHeader
              title={t("worldTitle")}
              expanded={worldExpanded}
              onToggle={() => setWorldExpanded(!worldExpanded)}
            />

            {worldExpanded && (
              <section className={styles.section}>
                <div className={styles.sectionContent}>
                  <div className={styles.worldMeta}>
                    <span className={styles.worldEra}>
                      {interpretation.world.era}
                    </span>
                    <span className={styles.worldLocation}>
                      {interpretation.world.location}
                    </span>
                    <span className={styles.worldRole}>
                      {interpretation.world.socialRole}
                    </span>
                  </div>
                  <p className={styles.sectionText}>
                    {interpretation.world.atmosphere}
                  </p>
                  {interpretation.world.description && (
                    <p className={styles.sectionText}>
                      {interpretation.world.description}
                    </p>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* 섹션 3: 탄생 스토리 */}
        <SectionHeader
          title={t("birthTitle")}
          expanded={birthExpanded}
          onToggle={() => setBirthExpanded(!birthExpanded)}
        />

        {birthExpanded && interpretation.birth.content && (
          <section className={styles.section}>
            <div className={styles.sectionContent}>
              {interpretation.birth.headline && (
                <h3 className={styles.sectionHeadline}>
                  {interpretation.birth.headline}
                </h3>
              )}
              <p className={styles.sectionText}>
                {interpretation.birth.content}
              </p>
            </div>
          </section>
        )}

        {/* 섹션 4: 삶의 여정 */}
        <SectionHeader
          title={t("journeyTitle")}
          expanded={journeyExpanded}
          onToggle={() => setJourneyExpanded(!journeyExpanded)}
        />

        {journeyExpanded && interpretation.journey.content && (
          <section className={styles.section}>
            <div className={styles.sectionContent}>
              {interpretation.journey.headline && (
                <h3 className={styles.sectionHeadline}>
                  {interpretation.journey.headline}
                </h3>
              )}

              {interpretation.journey.events.length > 0 && (
                <div className={styles.scenarioList}>
                  {interpretation.journey.events.map((event, idx) => (
                    <div key={idx} className={styles.scenarioItem}>
                      <div className={styles.scenarioHeader}>
                        <span className={styles.scenarioPeriod}>
                          {event.period}
                        </span>
                      </div>
                      <p className={styles.scenarioContent}>{event.event}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className={styles.sectionText}>
                {interpretation.journey.content}
              </p>
            </div>
          </section>
        )}

        {/* 섹션 5: 죽음과 카르마 */}
        <SectionHeader
          title={t("endTitle")}
          expanded={endExpanded}
          onToggle={() => setEndExpanded(!endExpanded)}
        />

        {endExpanded && interpretation.end.content && (
          <section className={styles.section}>
            <div className={styles.sectionContent}>
              {interpretation.end.headline && (
                <h3 className={styles.sectionHeadline}>
                  {interpretation.end.headline}
                </h3>
              )}
              <p className={styles.sectionText}>{interpretation.end.content}</p>

              {interpretation.end.lastWords && (
                <div className={styles.lastWordsContainer}>
                  <p className={styles.lastWordsText}>
                    &ldquo;{interpretation.end.lastWords}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 섹션 6: 전생 vs 현생 */}
        {interpretation.contrast &&
          interpretation.contrast.contrasts.length > 0 && (
            <>
              <SectionHeader
                title={t("contrastTitle")}
                expanded={contrastExpanded}
                onToggle={() => setContrastExpanded(!contrastExpanded)}
              />

              {contrastExpanded && (
                <section className={styles.section}>
                  <div className={styles.contrastList}>
                    {interpretation.contrast.contrasts.map((item, idx) => (
                      <div key={idx} className={styles.contrastItem}>
                        <span className={styles.contrastAspect}>
                          {item.aspect}
                        </span>
                        <div className={styles.contrastPair}>
                          <div className={styles.contrastSide}>
                            <span className={styles.contrastLabel}>
                              {t("contrastPastLife")}
                            </span>
                            <p className={styles.contrastValue}>
                              {item.pastLife}
                            </p>
                          </div>
                          <div className={styles.contrastArrow}>
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M5 12H19M19 12L13 6M19 12L13 18"
                                stroke="rgba(255,204,217,0.6)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className={styles.contrastSide}>
                            <span className={styles.contrastLabel}>
                              {t("contrastPresentLife")}
                            </span>
                            <p className={styles.contrastValue}>
                              {item.presentLife}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        {/* 섹션 7: 전생 인연 */}
        <SectionHeader
          title={t("connectionsTitle")}
          expanded={connectionsExpanded}
          onToggle={() => setConnectionsExpanded(!connectionsExpanded)}
        />

        {connectionsExpanded && interpretation.connections.content && (
          <section className={styles.section}>
            <div className={styles.sectionContent}>
              {interpretation.connections.headline && (
                <h3 className={styles.sectionHeadline}>
                  {interpretation.connections.headline}
                </h3>
              )}
              <p className={styles.sectionText}>
                {interpretation.connections.content}
              </p>
            </div>
          </section>
        )}

        {/* 섹션 8: 전생의 흔적 */}
        {interpretation.traces && interpretation.traces.traces.length > 0 && (
          <>
            <SectionHeader
              title={t("tracesTitle")}
              expanded={tracesExpanded}
              onToggle={() => setTracesExpanded(!tracesExpanded)}
            />

            {tracesExpanded && (
              <section className={styles.section}>
                <div className={styles.tracesList}>
                  {interpretation.traces.traces.map((trace, idx) => (
                    <div key={idx} className={styles.traceCard}>
                      <span className={styles.traceCategory}>
                        {trace.category}
                      </span>
                      <p className={styles.traceText}>{trace.trace}</p>
                      <p className={styles.traceOrigin}>{trace.origin}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 섹션 9: 전생 교훈 */}
        {interpretation.lessons &&
          interpretation.lessons.lessons.length > 0 && (
            <>
              <SectionHeader
                title={t("lessonsTitle")}
                expanded={lessonsExpanded}
                onToggle={() => setLessonsExpanded(!lessonsExpanded)}
              />

              {lessonsExpanded && (
                <section className={styles.section}>
                  <div className={styles.lessonsList}>
                    {interpretation.lessons.lessons.map((lesson, idx) => (
                      <div key={idx} className={styles.lessonCard}>
                        <h4 className={styles.lessonHeadline}>
                          {lesson.headline}
                        </h4>
                        <p className={styles.lessonContent}>{lesson.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

        {/* 면책 문구 */}
        <p className={styles.disclaimer}>{t("disclaimer")}</p>
      </main>

      {/* 하단 공유하기 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={() => setIsShareDrawerOpen(true)}
        >
          {t("shareButton")}
        </button>
      </footer>

      {/* 공유 드로어 */}
      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={() => setIsShareDrawerOpen(false)}
        onCopyLink={handleShare}
        onShareKakao={handleShareKakao}
        onShareLine={handleShareLine}
        showDownloadImage={false}
        isDownloading={isDownloading}
      />

      {/* 프로필 이미지 공유 드로어 */}
      <ShareDrawer
        isOpen={isProfileShareDrawerOpen}
        onClose={() => setIsProfileShareDrawerOpen(false)}
        title={t("profileShareTitle")}
        showCopyLink={false}
        showLine={false}
        onShareKakao={handleProfileShareKakao}
        onDownloadImage={handleProfileDownloadImage}
        isDownloading={isDownloading}
      />

      {/* 이미지 생성용 숨겨진 프로필 카드 */}
      {showProfileCard && (
        <div
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <PastLifeProfileCard
            ref={profileCardRef}
            headline={interpretation.spoiler.headline}
            description={interpretation.spoiler.description}
            imageUrl={interpretation.imageUrl}
            profileCard={interpretation.profileCard}
            isImage={true}
          />
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}
