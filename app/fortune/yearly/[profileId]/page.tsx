"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Header } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import type { YearlyFortuneInterpretation } from "@/libs/services/ai";
import { calculateAge } from "@/libs/utils";
import type {
  MonthlyFortune,
  YearlyPalaceInfo,
  YearlyPeachBlossomInfo,
  YearlySihua,
} from "@/libs/zi-wei-dou-shu/calculators";

import styles from "./page.module.css";

// ============================================================
// 타입 정의
// ============================================================

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

interface YearlyFortuneResult {
  year: number;
  chart: {
    wuxingJu: string;
    mingGong: string;
  };
  yearlySihua: YearlySihua;
  yearlyPalaces: YearlyPalaceInfo;
  peachBlossom: YearlyPeachBlossomInfo;
  currentDayun: {
    period: string;
    palaceName: string;
    mainStars: string[];
  } | null;
  scores: {
    overall: number;
    wealth: number;
    career: number;
    relationship: number;
    health: number;
  };
  monthlyFortunes: MonthlyFortune[];
  luckyMonths: number[];
  cautionMonths: number[];
  interpretation: YearlyFortuneInterpretation;
}

// ============================================================
// 유틸리티 함수
// ============================================================

const getScoreColor = (score: number) => {
  if (score >= 70) return "#deff7c";
  if (score >= 50) return "#ffc854";
  return "#fb7194";
};

// ============================================================
// 점수 게이지 컴포넌트
// ============================================================

const ScoreGauge = ({
  score,
  label,
  unit,
}: {
  score: number;
  label: string;
  unit: string;
}) => {
  return (
    <div className={styles.scoreGauge}>
      <div className={styles.scoreLabel}>{label}</div>
      <div className={styles.scoreBarContainer}>
        <div
          className={styles.scoreBar}
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score),
          }}
        />
      </div>
      <div className={styles.scoreValue}>
        {score}
        {unit}
      </div>
    </div>
  );
};

// ============================================================
// 유년 사화 카드 컴포넌트
// ============================================================

const SihuaCard = ({
  type,
  sihua,
  t,
}: {
  type: "hualu" | "huaquan" | "huake" | "huaji";
  sihua: YearlySihua;
  t: ReturnType<typeof useTranslations>;
}) => {
  const typeInfo = {
    hualu: { emoji: "🌟", color: "#deff7c" },
    huaquan: { emoji: "👑", color: "#ffc854" },
    huake: { emoji: "🏆", color: "#b8a4ff" },
    huaji: { emoji: "⚠️", color: "#fb7194" },
  };

  const info = typeInfo[type];
  const data = sihua[type];

  const sihuaNames = {
    hualu: t("sihua.hualu.name", { default: "화록" }),
    huaquan: t("sihua.huaquan.name", { default: "화권" }),
    huake: t("sihua.huake.name", { default: "화과" }),
    huaji: t("sihua.huaji.name", { default: "화기" }),
  };

  return (
    <div className={styles.sihuaCard}>
      <div className={styles.sihuaHeader}>
        <span className={styles.sihuaEmoji}>{info.emoji}</span>
        <span className={styles.sihuaType} style={{ color: info.color }}>
          {sihuaNames[type]}
        </span>
      </div>
      <div className={styles.sihuaStar}>{data.star}</div>
      <div className={styles.sihuaPalace}>{data.palace}</div>
      <div className={styles.sihuaMeaning}>{data.palaceMeaning}</div>
    </div>
  );
};

// ============================================================
// 월별 운세 차트 컴포넌트
// ============================================================

const MonthlyChart = ({
  monthlyFortunes,
  luckyMonths,
  cautionMonths,
  t,
}: {
  monthlyFortunes: MonthlyFortune[];
  luckyMonths: number[];
  cautionMonths: number[];
  t: ReturnType<typeof useTranslations>;
}) => {
  const maxScore = Math.max(...monthlyFortunes.map((m) => m.score));

  return (
    <div className={styles.monthlyChart}>
      <div className={styles.chartBars}>
        {monthlyFortunes.map((month) => {
          const isLucky = luckyMonths.includes(month.month);
          const isCaution = cautionMonths.includes(month.month);
          const barHeight = (month.score / maxScore) * 100;

          return (
            <div key={month.month} className={styles.chartColumn}>
              <div className={styles.chartBarWrapper}>
                <div
                  className={`${styles.chartBar} ${isLucky ? styles.lucky : ""} ${isCaution ? styles.caution : ""}`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
              <div className={styles.chartMonth}>
                {month.month}
                {t("monthly.monthUnit", { default: "월" })}
              </div>
              {isLucky && (
                <div className={styles.monthBadge}>
                  {t("monthly.good", { default: "좋음" })}
                </div>
              )}
              {isCaution && (
                <div className={`${styles.monthBadge} ${styles.cautionBadge}`}>
                  {t("monthly.caution", { default: "주의" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// 월별 운세 리스트 컴포넌트
// ============================================================

const getScoreEmoji = (score: number) => {
  if (score >= 75) return "🔥";
  if (score >= 60) return "✨";
  if (score >= 45) return "👍";
  return "💪";
};

const MonthlyFortuneList = ({
  monthlyFortunes,
  t,
}: {
  monthlyFortunes: YearlyFortuneInterpretation["monthlyFortunes"];
  t: ReturnType<typeof useTranslations>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayFortunes = expanded
    ? monthlyFortunes
    : monthlyFortunes.slice(0, 4);

  return (
    <div className={styles.monthlyFortune}>
      <div className={styles.fortuneList}>
        {displayFortunes.map((fortune) => (
          <div key={fortune.month} className={styles.fortuneItem}>
            <div className={styles.fortuneHeader}>
              <div className={styles.fortuneMonth}>
                {fortune.month}
                {t("monthly.monthUnit", { default: "월" })}
              </div>
              <div
                className={styles.fortuneScore}
                style={{ color: getScoreColor(fortune.score) }}
              >
                {getScoreEmoji(fortune.score)} {fortune.score}
                {t("scores.unit", { default: "점" })}
              </div>
            </div>
            <div className={styles.fortuneTheme}>{fortune.theme}</div>
            <div className={styles.fortuneContent}>{fortune.content}</div>
            {fortune.tip && (
              <div className={styles.fortuneTip}>💡 {fortune.tip}</div>
            )}
          </div>
        ))}
      </div>
      {monthlyFortunes.length > 4 && (
        <button
          type="button"
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? t("monthly.collapse", { default: "접기" })
            : t("monthly.expand", {
                count: monthlyFortunes.length - 4,
                default: `나머지 ${monthlyFortunes.length - 4}개월 보기`,
              })}
        </button>
      )}
    </div>
  );
};

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================

export default function YearlyFortunePage() {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const profileId = params.profileId as string;
  const t = useTranslations("fortune.yearly");
  const tCommon = useTranslations("fortune.common");

  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<YearlyFortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

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
      setError(
        tCommon("profileNotFound", { default: "프로필을 찾을 수 없습니다." })
      );
      setIsLoading(false);
      return;
    }

    const fetchYearlyFortune = async () => {
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
            profileId: targetProfile.id,
          }),
        });

        if (!res.ok) {
          throw new Error(
            t("fetchError", { default: "올해 운세 조회에 실패했습니다." })
          );
        }

        const data = await res.json();
        setResult(data.data);
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

    fetchYearlyFortune();
  }, [
    authStatus,
    profileId,
    router,
    isProfilesLoaded,
    cachedProfile,
    currentYear,
    t,
    tCommon,
  ]);

  if (authStatus === "loading" || isLoading || !isProfilesLoaded) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
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

  const {
    interpretation,
    yearlySihua,
    peachBlossom,
    scores,
    monthlyFortunes,
    luckyMonths,
    cautionMonths,
    currentDayun,
  } = result;
  const currentAge = calculateAge(profile.birth_date);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>
            {t("title", {
              name: profile.name,
              year: currentYear,
              default: `${profile.name}님의 ${currentYear}년 운세`,
            })}
          </h1>
          <p className={styles.profileMeta}>
            {t("yearInfo", {
              stem: yearlySihua.yearStemName,
              branch: yearlySihua.yearBranchName,
              default: `${yearlySihua.yearStemName}${yearlySihua.yearBranchName}년`,
            })}{" "}
            | {tCommon("age", { age: currentAge, default: `${currentAge}세` })}
          </p>
        </div>

        {/* 연간 총평 섹션 */}
        <section className={styles.overviewSection}>
          <h2 className={styles.overviewHeadline}>
            {interpretation.overview.headline}
          </h2>
          <p className={styles.overviewSummary}>
            {interpretation.overview.summary}
          </p>
          <div className={styles.keywordList}>
            {interpretation.overview.keywords.map((keyword) => (
              <span key={keyword} className={styles.keyword}>
                #{keyword}
              </span>
            ))}
          </div>
        </section>

        {/* 도화성 정보 섹션 (활성화된 경우) */}
        {peachBlossom.isPeachBlossomActive &&
          peachBlossom.peachBlossomNotes.length > 0 && (
            <section className={styles.peachBlossomSection}>
              <div className={styles.peachBlossomHeader}>
                <span className={styles.peachBlossomEmoji}>🌸</span>
                <h3 className={styles.peachBlossomTitle}>
                  {t("peachBlossom.title", { default: "올해 인연의 기운" })}
                </h3>
              </div>
              <ul className={styles.peachBlossomList}>
                {peachBlossom.peachBlossomNotes.map((note, idx) => (
                  <li key={idx} className={styles.peachBlossomNote}>
                    {note}
                  </li>
                ))}
              </ul>
              <div className={styles.peachBlossomStars}>
                <span className={styles.starInfo}>
                  {t("peachBlossom.hongluanPosition", { default: "홍란 위치" })}
                  : {peachBlossom.hongluan.palaceName}
                </span>
                <span className={styles.starInfo}>
                  {t("peachBlossom.tianxiPosition", { default: "천희 위치" })}:{" "}
                  {peachBlossom.tianxi.palaceName}
                </span>
              </div>
            </section>
          )}

        {/* 연간 점수 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              {t("scores.title", { default: "올해 운세 점수" })}
            </h3>
            <span className={styles.sectionBadge}>
              {t("scores.overall", {
                score: scores.overall,
                default: `종합 ${scores.overall}점`,
              })}
            </span>
          </div>
          <div className={styles.scoresContainer}>
            <ScoreGauge
              score={scores.wealth}
              label={t("scores.wealth", { default: "재물운" })}
              unit={t("scores.unit", { default: "점" })}
            />
            <ScoreGauge
              score={scores.career}
              label={t("scores.career", { default: "직업운" })}
              unit={t("scores.unit", { default: "점" })}
            />
            <ScoreGauge
              score={scores.relationship}
              label={t("scores.relationship", { default: "인연운" })}
              unit={t("scores.unit", { default: "점" })}
            />
            <ScoreGauge
              score={scores.health}
              label={t("scores.health", { default: "건강운" })}
              unit={t("scores.unit", { default: "점" })}
            />
          </div>
        </section>

        {/* 유년 사화 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              {t("sihua.title", { default: "올해의 사화" })}
            </h3>
          </div>
          <div className={styles.sihuaGrid}>
            <SihuaCard type="hualu" sihua={yearlySihua} t={t} />
            <SihuaCard type="huaquan" sihua={yearlySihua} t={t} />
            <SihuaCard type="huake" sihua={yearlySihua} t={t} />
            <SihuaCard type="huaji" sihua={yearlySihua} t={t} />
          </div>
        </section>

        {/* 현재 대운 섹션 */}
        {currentDayun && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>
                {t("currentDayun.title", { default: "현재 대운" })}
              </h3>
              <span className={styles.sectionBadge}>{currentDayun.period}</span>
            </div>
            <div className={styles.dayunInfo}>
              <div className={styles.dayunPalace}>
                {currentDayun.palaceName}
              </div>
              <div className={styles.dayunStars}>
                {currentDayun.mainStars.length > 0
                  ? currentDayun.mainStars.join(", ")
                  : tCommon("noMainStars", { default: "주성 없음" })}
              </div>
            </div>
          </section>
        )}

        {/* 월별 운세 차트 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              {t("monthly.title", { default: "월별 운세 흐름" })}
            </h3>
          </div>
          <MonthlyChart
            monthlyFortunes={monthlyFortunes}
            luckyMonths={luckyMonths}
            cautionMonths={cautionMonths}
            t={t}
          />
          <div className={styles.monthLegend}>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.luckyDot}`} />
              {t("monthly.luckyMonths", { default: "좋은 달" })}:{" "}
              {luckyMonths
                .map((m) => `${m}${t("monthly.monthUnit", { default: "월" })}`)
                .join(", ")}
            </span>
            <span className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.cautionDot}`} />
              {t("monthly.cautionMonths", { default: "주의할 달" })}:{" "}
              {cautionMonths
                .map((m) => `${m}${t("monthly.monthUnit", { default: "월" })}`)
                .join(", ")}
            </span>
          </div>
        </section>

        {/* 분야별 운세 섹션 */}
        <div className={styles.categoriesContainer}>
          <section className={styles.categorySection}>
            <h3>{interpretation.categories.wealth.title}</h3>
            <p>{interpretation.categories.wealth.content}</p>
            <div className={styles.advice}>
              {interpretation.categories.wealth.advice}
            </div>
          </section>

          <section className={styles.categorySection}>
            <h3>{interpretation.categories.career.title}</h3>
            <p>{interpretation.categories.career.content}</p>
            <div className={styles.advice}>
              {interpretation.categories.career.advice}
            </div>
          </section>

          <section className={styles.categorySection}>
            <h3>{interpretation.categories.relationship.title}</h3>
            <p>{interpretation.categories.relationship.content}</p>
            <div className={styles.advice}>
              {interpretation.categories.relationship.advice}
            </div>
          </section>

          <section className={styles.categorySection}>
            <h3>{interpretation.categories.health.title}</h3>
            <p>{interpretation.categories.health.content}</p>
            <div className={styles.advice}>
              {interpretation.categories.health.advice}
            </div>
          </section>
        </div>

        {/* 월별 운세 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              {t("monthly.detailTitle", { default: "월별 운세" })}
            </h3>
          </div>
          <MonthlyFortuneList
            monthlyFortunes={interpretation.monthlyFortunes}
            t={t}
          />
        </section>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/profiles")}
        >
          {tCommon("backToProfiles", { default: "프로필 목록으로 돌아가기" })}
        </button>
      </main>
    </div>
  );
}
