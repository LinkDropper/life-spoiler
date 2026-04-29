"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  ZiweiChartGrid,
  SectionHeader,
  CopyToast,
  ShareDrawer,
  ScenarioItem,
  ScenarioList,
  MarkdownContent,
  ChevronIcon,
  EventBadge,
} from "@/components/fortune";
import { CompatibilityProfileCard } from "@/components/fortune/CompatibilityProfileCard";
import { ReviewDrawer } from "@/components/fortune/ReviewDrawer";
import { FollowUpEntry } from "@/components/fortune/FollowUpEntry";
import { CompatibilityCard } from "@/components/compatibility";
import { useCompatibilityResult } from "@/libs/hooks/compatibility";
import { useImageDownload } from "@/libs/hooks/useImageDownload";
import { shareToKakao, shareToKakaoWithImage } from "@/libs/kakao";
import { useUser } from "@/libs/stores/user";

import styles from "./page.module.css";

// ============================================================
// 인사이트 아이콘 매핑
// ============================================================

const INSIGHT_ITEMS = [
  { key: "overall", icon: "/images/compatibility/stars-filled.svg" },
  { key: "zodiac", icon: "/images/compatibility/paw-filled.svg" },
  { key: "fiveElement", icon: "/images/compatibility/pentagon-filled.svg" },
  { key: "chemistry", icon: "/images/compatibility/puzzle-filled.svg" },
  {
    key: "communication",
    icon: "/images/compatibility/message-circle-filled.svg",
  },
  {
    key: "growthSynergy",
    icon: "/images/compatibility/arrow-big-up-filled.svg",
  },
  { key: "trustIndex", icon: "/images/compatibility/heart-filled.svg" },
  {
    key: "crisisResilience",
    icon: "/images/compatibility/shield-filled.svg",
  },
] as const;

const KEYWORD_INSIGHT_KEYS: ReadonlySet<string> = new Set([
  "zodiac",
  "fiveElement",
  "chemistry",
]);

type CompatibilityCategoryKey =
  | "communication"
  | "growth"
  | "emotion"
  | "crisis";

const CATEGORY_KEYS: CompatibilityCategoryKey[] = [
  "communication",
  "growth",
  "emotion",
  "crisis",
];

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function CompatibilityResultPage() {
  const router = useRouter();
  const user = useUser();
  const tCard = useTranslations("compatibility.card");
  const tFortune = useTranslations("compatibility.fortune");
  const tResult = useTranslations("compatibility.fortune.result");
  const tCommon = useTranslations("fortune.common");

  const {
    isLoading,
    error,
    result,
    pairId,
    relationshipType,
    showCopyToast,
    isShareDrawerOpen,
    handleShare,
    handleOpenShareDrawer,
    handleCloseShareDrawer,
  } = useCompatibilityResult();

  // 후기 드로어 상태
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  // 프로필 이미지 공유 드로어 상태
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
    filename: "life_spoiler_compatibility",
    pixelRatio: 2,
  });

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [chartAExpanded, setChartAExpanded] = useState(true);
  const [chartBExpanded, setChartBExpanded] = useState(true);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [adviceExpanded, setAdviceExpanded] = useState(true);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    const handleRefresh = () => {
      window.location.reload();
    };

    const handleBack = () => {
      router.push("/compatibility");
    };

    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.error}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.errorTitle}>{tFortune("errorTitle")}</h2>
            <p className={styles.errorDescription}>
              {tFortune("errorDescription")}
            </p>
            <div className={styles.errorButtons}>
              <button
                type="button"
                className={styles.refreshButton}
                onClick={handleRefresh}
              >
                {tFortune("refresh")}
              </button>
              <button
                type="button"
                className={styles.errorBackButton}
                onClick={handleBack}
              >
                {tFortune("back")}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { interpretation, charts, subScores } = result;
  const nameA = charts.profileA.name;
  const nameB = charts.profileB.name;

  const scoreBadgeText = `${tFortune("score")} ${result.score}${tCard("scoreUnit")}`;
  const profileCardLabels = {
    communication: tFortune("insights.communication"),
    growthSynergy: tFortune("insights.growthSynergy"),
    trustIndex: tFortune("insights.trustIndex"),
    crisisResilience: tFortune("insights.crisisResilience"),
  };

  const shareUrl = `${window.location.origin}/compatibility/${pairId}/fortune/share?ref=${user?.id ?? ""}`;

  // 카카오톡 공유 핸들러
  const handleShareKakao = () => {
    shareToKakao({
      title: interpretation.headline,
      description: interpretation.spoiler,
      name: `${nameA} × ${nameB}`,
      webDomain: shareUrl,
    });
    handleCloseShareDrawer();
  };

  // 프로필 이미지 다운로드 핸들러
  const handleProfileDownloadImage = async () => {
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
  };

  // 프로필 이미지 카카오톡 공유 핸들러
  const handleProfileShareKakao = async () => {
    setShowProfileCard(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const blob = await profileCardToBlob();
      if (!blob) {
        alert("이미지 생성에 실패했습니다. 다시 시도해주세요.");
        return;
      }

      await shareToKakaoWithImage({
        imageBlob: blob,
        name: `${nameA} × ${nameB}`,
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
  };

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 섹션 1: 프로필 요약 카드 */}
        <CompatibilityCard
          nameA={nameA}
          nameB={nameB}
          score={result.score}
          relationshipType={relationshipType ?? undefined}
        />

        {/* 섹션 2: 메인 결과 카드 */}
        <CompatibilityProfileCard
          score={result.score}
          scoreBadgeText={scoreBadgeText}
          headline={interpretation.headline}
          tags={interpretation.tags}
          subScores={subScores}
          labels={profileCardLabels}
          isImage={false}
          onShareClick={() => setIsProfileShareDrawerOpen(true)}
        />

        {/* 섹션 3: A의 자미두수 명반 */}
        <SectionHeader
          title={tFortune("chartTitle", { name: nameA })}
          expanded={chartAExpanded}
          onToggle={() => setChartAExpanded(!chartAExpanded)}
        />
        {chartAExpanded && charts.profileA.rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={charts.profileA.rawChart}
              profileName={nameA}
              wuxingJu={charts.profileA.chart.wuxingJu}
            />
          </section>
        )}

        {/* 섹션 4: B의 자미두수 명반 */}
        <SectionHeader
          title={tFortune("chartTitle", { name: nameB })}
          expanded={chartBExpanded}
          onToggle={() => setChartBExpanded(!chartBExpanded)}
        />
        {chartBExpanded && charts.profileB.rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={charts.profileB.rawChart}
              profileName={nameB}
              wuxingJu={charts.profileB.chart.wuxingJu}
            />
          </section>
        )}

        {/* 섹션 5: 궁합 인사이트 (8개 전체 노출) */}
        <SectionHeader
          title={tFortune("insightsTitle")}
          expanded={insightsExpanded}
          onToggle={() => setInsightsExpanded(!insightsExpanded)}
        />
        {insightsExpanded && (
          <section className={styles.insightsContainer}>
            <div className={styles.insightsList}>
              {INSIGHT_ITEMS.map((item) => {
                const insight = interpretation.insights[item.key];
                const insightLabel = tFortune(`insights.${item.key}`);
                const value = KEYWORD_INSIGHT_KEYS.has(item.key)
                  ? insight.label || "???"
                  : tFortune("scoreUnit", { score: insight.score });
                return (
                  <div key={item.key} className={styles.insightItem}>
                    <Image
                      src={item.icon}
                      alt={insightLabel}
                      width={20}
                      height={20}
                      className={styles.insightIcon}
                    />
                    <span className={styles.insightLabel}>{insightLabel}</span>
                    <hr className={styles.insightDivider} />
                    <span className={styles.insightValue}>{value}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 섹션 6: 궁합 스포일러 */}
        <SectionHeader
          title={tFortune("spoilerTitle")}
          expanded={spoilerExpanded}
          onToggle={() => setSpoilerExpanded(!spoilerExpanded)}
        />
        {spoilerExpanded && (
          <section className={styles.spoilerContent}>
            <h2 className={styles.spoilerHeadline}>
              {interpretation.headline}
            </h2>
            <MarkdownContent className={styles.spoilerText}>
              {interpretation.spoiler}
            </MarkdownContent>
          </section>
        )}

        {/* 섹션 7: 핵심 시나리오 */}
        <SectionHeader
          title={tResult("coreScenarioTitle")}
          expanded={coreExpanded}
          onToggle={() => setCoreExpanded(!coreExpanded)}
        />
        {coreExpanded && interpretation.coreScenarios.length > 0 && (
          <section className={styles.section}>
            <ScenarioList>
              {interpretation.coreScenarios.map((scenario, idx) => (
                <ScenarioItem
                  key={idx}
                  label={`${idx + 1}`}
                  headline={scenario.title}
                  content={scenario.content}
                />
              ))}
            </ScenarioList>
          </section>
        )}

        {/* 섹션 8: 상세 시나리오 */}
        <SectionHeader
          title={tResult("detailScenarioTitle")}
          expanded={detailExpanded}
          onToggle={() => setDetailExpanded(!detailExpanded)}
        />
        {detailExpanded && (
          <section className={styles.section}>
            <div className={styles.categoriesContainer}>
              {CATEGORY_KEYS.map((key) => {
                const category = interpretation.categories[key];
                return (
                  <CompatibilityCategoryItem
                    key={key}
                    label={tResult(`categories.${key}`)}
                    headline={category.headline}
                    content={category.content}
                    tags={category.tags}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* 섹션 9: 종합 조언 */}
        <SectionHeader
          title={tResult("adviceTitle")}
          expanded={adviceExpanded}
          onToggle={() => setAdviceExpanded(!adviceExpanded)}
        />
        {adviceExpanded && (
          <section className={styles.section}>
            <MarkdownContent className={styles.adviceContent}>
              {interpretation.advice}
            </MarkdownContent>
          </section>
        )}
      </main>

      {/* 하단 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.reviewButton}
          onClick={() => setIsReviewDrawerOpen(true)}
        >
          {tResult("reviewButton", { default: "후기 남기기" })}
        </button>
        <div className={styles.shareButtonWrapper}>
          <EventBadge />
          <button
            type="button"
            className={styles.shareButton}
            onClick={handleOpenShareDrawer}
          >
            {tResult("shareButton")}
          </button>
        </div>
      </footer>

      {/* 전문가 질문 플로팅 버튼 + 채팅 드로어 */}
      <FollowUpEntry
        profileId={charts.profileA.profileId}
        pairId={pairId}
        fortuneType="compatibility"
        fortuneName="궁합"
        examplePrompts={[
          "어떻게 갈등을 풀어야 할까?",
          "장기적으로 잘 맞을까?",
          "서로 조심할 점은?",
        ]}
      />

      {/* 후기 드로어 */}
      <ReviewDrawer
        isOpen={isReviewDrawerOpen}
        onClose={() => setIsReviewDrawerOpen(false)}
        profileId={charts.profileA.profileId}
        fortuneType="compatibility"
      />

      {/* 공유 드로어 */}
      <ShareDrawer
        isOpen={isShareDrawerOpen}
        onClose={handleCloseShareDrawer}
        onCopyLink={handleShare}
        onShareKakao={handleShareKakao}
        showLine={false}
        showDownloadImage={false}
        showEventBanner={true}
        isDownloading={isDownloading}
      />

      {/* 프로필 이미지 공유 드로어 */}
      <ShareDrawer
        isOpen={isProfileShareDrawerOpen}
        onClose={() => setIsProfileShareDrawerOpen(false)}
        title={tResult("profileShareTitle")}
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
          <CompatibilityProfileCard
            ref={profileCardRef}
            isImage={true}
            score={result.score}
            scoreBadgeText={scoreBadgeText}
            headline={interpretation.headline}
            tags={interpretation.tags}
            subScores={subScores}
            labels={profileCardLabels}
          />
        </div>
      )}

      {/* 복사 완료 토스트 */}
      {showCopyToast && <CopyToast message={tCommon("copySuccess")} />}
    </div>
  );
}

// ============================================================
// 궁합 카테고리 아이템 (인라인 컴포넌트)
// ============================================================

interface CompatibilityCategoryItemProps {
  label: string;
  headline: string;
  content: string;
  tags: string[];
}

const CompatibilityCategoryItem = ({
  label,
  headline,
  content,
  tags,
}: CompatibilityCategoryItemProps) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </span>
        <ChevronIcon expanded={expanded} size="small" />
      </button>
      {expanded && (
        <>
          {headline && (
            <h4
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#ffffff",
                margin: "16px 0 0 0",
                lineHeight: 1.4,
                letterSpacing: 0.5,
              }}
            >
              {headline}
            </h4>
          )}
          <MarkdownContent
            style={{
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(255, 255, 255, 0.7)",
              margin: "16px 0 0 0",
              letterSpacing: 0.5,
            }}
          >
            {content}
          </MarkdownContent>
          {tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16,
              }}
            >
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 6px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: 4,
                    fontSize: 16,
                    fontWeight: 400,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
