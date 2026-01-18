"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import { Loading } from "@/components/loading";
import { ProfileInfo, ZiweiChartGrid } from "@/components/fortune";
import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import type { FortuneInterpretation } from "@/libs/services/ai";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";
import type { DayunResult } from "@/libs/zi-wei-dou-shu/calculators";
import type { LifestyleRecommendation } from "@/libs/zi-wei-dou-shu/lifestyle";

import styles from "./page.module.css";

interface ProfileData {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  calendar_type: "solar" | "lunar";
  gender: "male" | "female";
  relationship_status: string | null;
  relationship_status_custom: string | null;
  occupation_status: string | null;
  occupation_status_custom: string | null;
}

interface FortuneResult {
  chart: {
    wuxingJu: string;
    mingGong: string;
    shenGong: string;
    sihua: {
      hualu: string;
      huaquan: string;
      huake: string;
      huaji: string;
    };
  };
  rawChart: ZiweiChart;
  dayun: DayunResult;
  lifestyle: LifestyleRecommendation;
  interpretation: FortuneInterpretation;
}

type CategoryKey = "wealth" | "career" | "relationship" | "health";

const CategoryItem = ({
  categoryKey,
  category,
  t,
}: {
  categoryKey: CategoryKey;
  category: { content: string; tags: string[] };
  t: ReturnType<typeof useTranslations>;
}) => {
  const [expanded, setExpanded] = useState(true);

  const defaultLabels: Record<CategoryKey, string> = {
    wealth: "재물운",
    career: "직업운",
    relationship: "인연운",
    health: "건강운",
  };

  const label = t(`categories.${categoryKey}`, {
    default: defaultLabels[categoryKey],
  });

  return (
    <div className={styles.categoryCard}>
      <button
        type="button"
        className={styles.categoryHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.categoryLabel}>{label}</span>
        <svg
          className={`${styles.chevronSmall} ${expanded ? styles.expanded : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 12.5L10 7.5L15 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {expanded && (
        <>
          <p className={styles.categoryContent}>{category.content}</p>
          {category.tags && category.tags.length > 0 && (
            <div className={styles.categoryTags}>
              {category.tags.map((tag, idx) => (
                <span key={idx} className={styles.tag}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AgeScenarioItem = ({
  scenario,
}: {
  scenario: { period: string; headline: string; content: string };
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={styles.scenarioItem}>
      <button
        type="button"
        className={styles.scenarioHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.scenarioHeaderLeft}>
          <div className={styles.scenarioPeriod}>{scenario.period}</div>
          <div className={styles.scenarioHeadline}>{scenario.headline}</div>
        </div>
        <svg
          className={`${styles.chevronSmall} ${expanded ? styles.expanded : ""}`}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 12.5L10 7.5L15 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {expanded && (
        <div className={styles.scenarioContent}>{scenario.content}</div>
      )}
    </div>
  );
};

const AgeScenarioList = ({
  ageScenarios,
}: {
  ageScenarios: FortuneInterpretation["ageScenarios"];
}) => {
  return (
    <div className={styles.ageScenarioContainer}>
      <div className={styles.scenarioList}>
        {ageScenarios.map((scenario, idx) => (
          <AgeScenarioItem key={idx} scenario={scenario} />
        ))}
      </div>
    </div>
  );
};

export default function LifetimeFortunePage() {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const profileId = params.profileId as string;
  const t = useTranslations("fortune.lifetime");
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const locale = useLocale();

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);
  const [coreExpanded, setCoreExpanded] = useState(true);
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [ageExpanded, setAgeExpanded] = useState(true);
  const [showCopyToast, setShowCopyToast] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated" && !isProfilesLoaded) {
      fetchProfiles();
    }
  }, [authStatus, isProfilesLoaded, fetchProfiles]);

  useEffect(() => {
    if (cachedProfile) {
      setProfile(cachedProfile);
    }
  }, [cachedProfile]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }

    if (!isProfilesLoaded) {
      return;
    }

    if (!cachedProfile) {
      setError(
        tCommon("profileNotFound", { default: "프로필을 찾을 수 없습니다." })
      );
      setIsLoading(false);
      return;
    }

    const fetchFortuneData = async () => {
      try {
        const targetProfile = cachedProfile;

        const interpretRes = await fetch("/api/interpret", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: targetProfile.name,
            birthDate: targetProfile.birth_date,
            birthTime: targetProfile.birth_time_unknown
              ? "unknown"
              : targetProfile.birth_time?.slice(0, 5) || "unknown",
            gender: targetProfile.gender,
            calendarType: targetProfile.calendar_type,
            ...(targetProfile.relationship_status && {
              relationshipStatus: targetProfile.relationship_status,
            }),
            ...(targetProfile.relationship_status_custom && {
              relationshipStatusCustom:
                targetProfile.relationship_status_custom,
            }),
            ...(targetProfile.occupation_status && {
              occupationStatus: targetProfile.occupation_status,
            }),
            ...(targetProfile.occupation_status_custom && {
              occupationStatusCustom: targetProfile.occupation_status_custom,
            }),
            includeDetails: true,
            profileId: targetProfile.id,
            language: locale,
          }),
        });

        if (!interpretRes.ok) {
          throw new Error(
            t("interpretError", { default: "운세 해석에 실패했습니다." })
          );
        }

        const fortuneData = await interpretRes.json();
        setResult(fortuneData.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : tCommon("unknownError", {
                default: "알 수 없는 오류가 발생했습니다.",
              })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFortuneData();
  }, [
    authStatus,
    profileId,
    router,
    isProfilesLoaded,
    cachedProfile,
    locale,
    t,
    tCommon,
  ]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/fortune/lifetime/share/${profileId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
      } catch {
        alert(
          `링크 복사에 실패했습니다. 다음 주소를 직접 복사해주세요: ${shareUrl}`
        );
      }
    }
  };

  if (authStatus === "loading" || isLoading || !isProfilesLoaded) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.error}>
            <p>{error}</p>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.push("/profiles")}
            >
              {tCommon("backToProfiles", {
                default: "프로필 목록으로 돌아가기",
              })}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart } = result;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 정보 */}
        <ProfileInfo
          name={profile.name}
          fortuneType="lifetime"
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        {/* 자미두수 명반 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setChartExpanded(!chartExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {tPreview("chartTitle", { default: "자미두수 명반" })}
          </h3>
          <svg
            className={`${styles.chevron} ${chartExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {chartExpanded && rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
            />
          </section>
        )}

        {/* 인생 스포일러 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setSpoilerExpanded(!spoilerExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {tPreview("spoilerTitle", { default: "인생 스포일러" })}
          </h3>
          <svg
            className={`${styles.chevron} ${spoilerExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {spoilerExpanded && (
          <section className={styles.overviewSection}>
            <h2 className={styles.overviewHeadline}>
              {interpretation.lifeSpoiler.headline}
            </h2>
            <p className={styles.overviewSummary}>
              {interpretation.lifeSpoiler.summary}
            </p>
          </section>
        )}

        {/* 핵심 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setCoreExpanded(!coreExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("coreScenario.title", { default: "핵심 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${coreExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {coreExpanded && interpretation.coreScenario.content && (
          <section className={styles.section}>
            <div className={styles.coreScenario}>
              <p>{interpretation.coreScenario.content}</p>
            </div>
          </section>
        )}

        {/* 상세 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setDetailExpanded(!detailExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("detailScenario.title", { default: "상세 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${detailExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {detailExpanded && (
          <section className={styles.section}>
            <div className={styles.categoriesContainer}>
              {(["wealth", "career", "relationship", "health"] as const).map(
                (key) => (
                  <CategoryItem
                    key={key}
                    categoryKey={key}
                    category={interpretation.categories[key]}
                    t={t}
                  />
                )
              )}
            </div>
          </section>
        )}

        {/* 나이대별 시나리오 섹션 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setAgeExpanded(!ageExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {t("ageScenario.title", { default: "나이대별 시나리오" })}
          </h3>
          <svg
            className={`${styles.chevron} ${ageExpanded ? styles.expanded : ""}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5 12.5L10 7.5L15 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {ageExpanded && interpretation.ageScenarios.length > 0 && (
          <section className={styles.section}>
            <AgeScenarioList ageScenarios={interpretation.ageScenarios} />
          </section>
        )}
      </main>

      {/* 하단 공유하기 버튼 */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleShare}
        >
          {t("shareButton", { default: "공유하기" })}
        </button>
      </footer>

      {/* 복사 완료 토스트 */}
      {showCopyToast && (
        <div className={styles.copyToast}>
          <div className={styles.copyToastContent}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.687 4.31295C13.8823 4.50821 13.8823 4.8248 13.687 5.02006L7.02038 11.6867C6.82512 11.882 6.50854 11.882 6.31328 11.6867L2.97994 8.35339C2.78468 8.15813 2.78468 7.84155 2.97994 7.64628C3.1752 7.45102 3.49179 7.45102 3.68705 7.64628L6.66683 10.6261L12.9799 4.31295C13.1752 4.11769 13.4918 4.11769 13.687 4.31295Z"
                fill="white"
              />
            </svg>{" "}
            {tCommon("copySuccess")}
          </div>
        </div>
      )}
    </div>
  );
}
