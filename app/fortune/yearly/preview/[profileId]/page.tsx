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

import type { YearlySihua } from "@/libs/zi-wei-dou-shu/calculators";
import type { ZiweiChart } from "@/libs/zi-wei-dou-shu/types";

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

interface YearlyPreviewResult {
  year: number;
  chart: {
    wuxingJu: string;
    mingGong: string;
  };
  rawChart: ZiweiChart;
  yearlySihua: YearlySihua;
  interpretation: {
    overview: {
      headline: string;
      summary: string;
      keywords: string[];
    };
  };
}

export default function YearlyFortunePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const profileId = params.profileId as string;
  const tCommon = useTranslations("fortune.common");
  const tPreview = useTranslations("fortune.preview");
  const tYearly = useTranslations("fortune.yearly");
  const locale = useLocale();

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyPreviewResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [chartExpanded, setChartExpanded] = useState(true);
  const [spoilerExpanded, setSpoilerExpanded] = useState(true);

  const currentYear = new Date().getFullYear();

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
      setError(tCommon("profileNotFound"));
      setIsLoading(false);
      return;
    }

    const fetchPreviewData = async () => {
      try {
        const targetProfile = cachedProfile;

        const res = await fetch("/api/interpret/yearly", {
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
            targetYear: currentYear,
            includeDetails: true,
            profileId: targetProfile.id,
            language: locale,
          }),
        });

        if (!res.ok) {
          throw new Error(tYearly("fetchError"));
        }

        const fortuneData = await res.json();
        setResult(fortuneData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : tCommon("unknownError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [
    authStatus,
    profileId,
    router,
    isProfilesLoaded,
    cachedProfile,
    locale,
    currentYear,
    tYearly,
    tCommon,
  ]);

  const handlePayment = () => {
    router.push(`/payment/yearly/${profileId}`);
  };

  const handleBack = () => {
    router.push("/profiles");
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
              onClick={handleBack}
            >
              {tCommon("backToProfiles")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart, yearlySihua } = result;

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 정보 */}
        <ProfileInfo
          name={profile.name}
          fortuneType="yearly"
          year={currentYear}
          birthDate={profile.birth_date}
          birthTime={profile.birth_time}
          birthTimeUnknown={profile.birth_time_unknown}
          calendarType={profile.calendar_type}
          gender={profile.gender}
        />

        {/* 자미두수 명반 섹션 헤더 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setChartExpanded(!chartExpanded)}
        >
          <h3 className={styles.sectionTitle}>{tPreview("chartTitle")}</h3>
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

        {/* 명반 그리드 */}
        {chartExpanded && rawChart && (
          <section className={styles.chartSection}>
            <ZiweiChartGrid
              chart={rawChart}
              profileName={profile.name}
              wuxingJu={result.chart.wuxingJu}
              yearlySihua={yearlySihua}
            />
          </section>
        )}

        {/* 올해 스포일러 섹션 헤더 */}
        <button
          type="button"
          className={styles.sectionHeader}
          onClick={() => setSpoilerExpanded(!spoilerExpanded)}
        >
          <h3 className={styles.sectionTitle}>
            {tPreview("yearlySpoilerTitle")}
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

        {/* 미리보기 텍스트 */}
        {spoilerExpanded && (
          <section className={styles.previewContent}>
            <h2 className={styles.previewHeadline}>
              {interpretation.overview.headline}
            </h2>
            <p className={styles.previewDescription}>
              {interpretation.overview.summary}
            </p>
            <p className={styles.previewTeaser}>{tPreview("teaser")}</p>
          </section>
        )}
      </main>

      {/* 하단 CTA */}
      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.shareButton}
          onClick={handleBack}
          aria-label={tCommon("back")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.5303 5.46967C15.8232 5.76256 15.8232 6.23744 15.5303 6.53033L10.0607 12L15.5303 17.4697C15.8232 17.7626 15.8232 18.2374 15.5303 18.5303C15.2374 18.8232 14.7626 18.8232 14.4697 18.5303L8.46967 12.5303C8.17678 12.2374 8.17678 11.7626 8.46967 11.4697L14.4697 5.46967C14.7626 5.17678 15.2374 5.17678 15.5303 5.46967Z"
              fill="#18181B"
            />
          </svg>
        </button>
        <button
          type="button"
          className={styles.paymentButton}
          onClick={handlePayment}
        >
          {tPreview("ctaButton")}
        </button>
      </footer>
    </div>
  );
}
