"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { Header } from "@/components/landing";
import { Loading } from "@/components/loading";
import {
  useProfileById,
  useIsProfilesLoaded,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";
import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";

import type { FortuneInterpretation } from "@/libs/services/ai";
import type { ZiweiChart, Palace } from "@/libs/zi-wei-dou-shu/types";
import type { DayunResult } from "@/libs/zi-wei-dou-shu/calculators";
import type { LifestyleRecommendation } from "@/libs/zi-wei-dou-shu/lifestyle";

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

// ============================================================
// 명반 그리드 컴포넌트
// ============================================================

const PALACE_GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  0: { row: 4, col: 3 },
  1: { row: 4, col: 2 },
  2: { row: 4, col: 1 },
  3: { row: 3, col: 1 },
  4: { row: 2, col: 1 },
  5: { row: 1, col: 1 },
  6: { row: 1, col: 2 },
  7: { row: 1, col: 3 },
  8: { row: 1, col: 4 },
  9: { row: 2, col: 4 },
  10: { row: 3, col: 4 },
  11: { row: 4, col: 4 },
};

const ChartGrid = ({
  chart,
  mingGong,
  shenGong,
}: {
  chart: ZiweiChart;
  mingGong: number;
  shenGong: number;
}) => {
  const palacesByBranch: Record<number, Palace> = {};
  chart.palaces.forEach((palace) => {
    palacesByBranch[palace.branch] = palace;
  });

  const renderPalaceCell = (branchIndex: number) => {
    const palace = palacesByBranch[branchIndex];
    if (!palace) return null;

    const isMing = branchIndex === mingGong;
    const isShen = branchIndex === shenGong;

    return (
      <div
        className={`${styles.palaceCell} ${isMing ? styles.ming : ""} ${isShen ? styles.shen : ""}`}
        style={{
          gridRow: PALACE_GRID_POSITIONS[branchIndex].row,
          gridColumn: PALACE_GRID_POSITIONS[branchIndex].col,
        }}
        key={branchIndex}
      >
        <div className={styles.palaceName}>
          {palace.name}
          {isMing && " (명)"}
          {isShen && " (신)"}
        </div>
        <div className={styles.palaceBranch}>
          {EARTHLY_BRANCHES[branchIndex]}
        </div>
        <div className={styles.starList}>
          {palace.mainStars.map((star, idx) => (
            <div key={idx} className={styles.mainStar}>
              {star.name}
              <span className={styles.brightness}>({star.brightness})</span>
              {star.sihua && (
                <span className={styles.sihua}>[{star.sihua}]</span>
              )}
            </div>
          ))}
        </div>
        {palace.minorStars.length > 0 && (
          <div className={styles.minorStars}>
            {palace.minorStars.map((s) => s.name).join(" ")}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.chartGrid}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(renderPalaceCell)}
      <div className={styles.centerCell}>
        <div className={styles.centerTitle}>자미두수 명반</div>
        <div className={styles.centerInfo}>
          <div>오행국: {chart.wuxingJu}</div>
          <div>
            화록: {chart.sihua.hualu} | 화권: {chart.sihua.huaquan}
          </div>
          <div>
            화과: {chart.sihua.huake} | 화기: {chart.sihua.huaji}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// 대운 타임라인 컴포넌트
// ============================================================

const DayunTimeline = ({
  dayun,
  currentAge,
}: {
  dayun: DayunResult;
  currentAge: number;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    "overall" | "wealth" | "career" | "relationship" | "health"
  >("overall");

  const categories = [
    { key: "overall" as const, label: "종합" },
    { key: "wealth" as const, label: "재물" },
    { key: "career" as const, label: "직업" },
    { key: "relationship" as const, label: "인연" },
    { key: "health" as const, label: "건강" },
  ];

  const getScoreClass = (score: number) => {
    if (score >= 70) return styles.high;
    if (score <= 40) return styles.low;
    return "";
  };

  return (
    <div className={styles.dayunTimeline}>
      <div className={styles.dayunHeader}>
        <span>대운 시작: {dayun.startAge}세</span>
        <span className={styles.dayunDirection}>{dayun.direction}</span>
      </div>

      <div className={styles.tabContainer}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`${styles.tab} ${selectedCategory === cat.key ? styles.active : ""}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {dayun.periods.map((period) => {
        const isCurrent =
          currentAge >= period.startAge && currentAge <= period.endAge;
        const score = period.score[selectedCategory];

        return (
          <div
            key={period.index}
            className={`${styles.dayunPeriod} ${isCurrent ? styles.current : ""}`}
          >
            <div className={styles.periodAge}>
              {period.startAge}-{period.endAge}세
            </div>
            <div className={styles.periodInfo}>
              <div className={styles.periodPalace}>{period.palaceName}</div>
              <div className={styles.periodStars}>
                {period.palace.mainStars.length > 0
                  ? period.palace.mainStars
                      .map((s) => `${s.name}(${s.brightness})`)
                      .join(", ")
                  : "주성 없음"}
              </div>
              <div className={styles.periodScores}>
                <span className={`${styles.scoreChip} ${getScoreClass(score)}`}>
                  {categories.find((c) => c.key === selectedCategory)?.label}:{" "}
                  {score}점
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// 라이프스타일 컴포넌트
// ============================================================

const LifestyleSection = ({
  lifestyle,
}: {
  lifestyle: LifestyleRecommendation;
}) => {
  return (
    <div>
      <div className={styles.lifestyleGrid}>
        <div className={styles.lifestyleCard}>
          <div className={styles.lifestyleLabel}>Lucky Colors</div>
          <div className={styles.lifestyleValue}>
            {lifestyle.luckyColors.primary}, {lifestyle.luckyColors.secondary}
          </div>
          <div className={styles.colorSwatches}>
            <div
              className={styles.colorSwatch}
              style={{ background: lifestyle.luckyColors.hex.primary }}
            />
            <div
              className={styles.colorSwatch}
              style={{ background: lifestyle.luckyColors.hex.secondary }}
            />
          </div>
        </div>

        <div className={styles.lifestyleCard}>
          <div className={styles.lifestyleLabel}>Lucky Direction</div>
          <div className={styles.lifestyleValue}>
            {lifestyle.luckyDirection.emoji}{" "}
            {lifestyle.luckyDirection.direction}
          </div>
          <div className={styles.lifestyleDesc}>
            {lifestyle.luckyDirection.description}
          </div>
        </div>

        <div className={styles.lifestyleCard}>
          <div className={styles.lifestyleLabel}>Lucky Numbers</div>
          <div className={styles.luckyNumbers}>
            {lifestyle.luckyNumbers.map((num) => (
              <span key={num} className={styles.luckyNumber}>
                {num}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 직업 적합도 */}
      <div className={styles.careerSection}>
        <h4 className={styles.subSectionTitle}>직업 적합도</h4>
        <div className={styles.careerList}>
          {lifestyle.careerFit.slice(0, 5).map((career, idx) => (
            <div key={idx} className={styles.careerItem}>
              <span className={styles.careerEmoji}>{career.emoji}</span>
              <div className={styles.careerInfo}>
                <div className={styles.careerName}>{career.category}</div>
                <div className={styles.careerDesc}>{career.description}</div>
              </div>
              <div className={styles.careerBar}>
                <div
                  className={styles.careerBarFill}
                  style={{ width: `${career.percentage}%` }}
                />
              </div>
              <span className={styles.careerPercent}>{career.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 궁합 */}
      <div className={styles.compatSection}>
        <h4 className={styles.subSectionTitle}>궁합 좋은 띠</h4>
        <div className={styles.compatGrid}>
          {lifestyle.compatibleSigns.map((sign, idx) => (
            <div key={idx} className={styles.compatCard}>
              <div className={styles.compatEmoji}>{sign.emoji}</div>
              <div className={styles.compatName}>{sign.sign}</div>
              <div className={styles.compatScore}>{sign.compatibility}%</div>
              <div className={styles.compatReason}>{sign.reason}</div>
            </div>
          ))}
        </div>
        <div className={styles.incompatList}>
          <span className={styles.incompatLabel}>상극:</span>
          {lifestyle.incompatibleSigns.map((sign, idx) => (
            <span key={idx} className={styles.incompatChip}>
              {sign}
            </span>
          ))}
        </div>
      </div>

      {/* 오행 밸런스 */}
      <div className={styles.elementSection}>
        <h4 className={styles.subSectionTitle}>
          오행 밸런스 (강: {lifestyle.elementBalance.dominant}, 약:{" "}
          {lifestyle.elementBalance.lacking})
        </h4>
        {[
          { name: "수", value: lifestyle.elementBalance.water, class: "water" },
          { name: "목", value: lifestyle.elementBalance.wood, class: "wood" },
          { name: "화", value: lifestyle.elementBalance.fire, class: "fire" },
          { name: "토", value: lifestyle.elementBalance.earth, class: "earth" },
          { name: "금", value: lifestyle.elementBalance.metal, class: "metal" },
        ].map((el) => (
          <div key={el.name} className={styles.elementRow}>
            <span className={styles.elementName}>{el.name}</span>
            <div className={styles.elementBarContainer}>
              <div
                className={`${styles.elementBar} ${styles[el.class]}`}
                style={{ width: `${el.value}%` }}
              />
            </div>
            <span className={styles.elementPercent}>{el.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// 메인 페이지 컴포넌트
// ============================================================

export default function LifetimeFortunePage() {
  const params = useParams();
  const router = useRouter();
  const authStatus = useAuthStatus();
  const profileId = params.profileId as string;

  // 전역 상태에서 프로필 가져오기
  const cachedProfile = useProfileById(profileId);
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FortuneResult | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // 프로필이 로드되지 않은 경우 로드 시도
  useEffect(() => {
    if (authStatus === "authenticated" && !isProfilesLoaded) {
      fetchProfiles();
    }
  }, [authStatus, isProfilesLoaded, fetchProfiles]);

  // 캐시된 프로필이 있으면 profile 상태에 설정
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

    // 프로필이 아직 로드되지 않은 경우 대기
    if (!isProfilesLoaded) {
      return;
    }

    // 전역 상태에서 프로필을 찾을 수 없는 경우
    if (!cachedProfile) {
      setError("프로필을 찾을 수 없습니다.");
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
          }),
        });

        if (!interpretRes.ok) {
          throw new Error("운세 해석에 실패했습니다.");
        }

        const fortuneData = await interpretRes.json();
        setResult(fortuneData.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchFortuneData();
  }, [authStatus, profileId, router, isProfilesLoaded, cachedProfile]);

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
              프로필 목록으로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!result || !profile) {
    return null;
  }

  const { interpretation, rawChart, dayun, lifestyle } = result;
  const currentAge = calculateAge(profile.birth_date);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{profile.name}님의 인생 운세</h1>
          <p className={styles.profileMeta}>
            {profile.birth_date} | {profile.gender === "male" ? "남" : "여"} |{" "}
            {currentAge}세
          </p>
        </div>

        {/* 미리보기 섹션 */}
        <section className={styles.previewSection}>
          <h2 className={styles.previewHeadline}>
            {interpretation.preview.headline}
          </h2>
          <p className={styles.previewDescription}>
            {interpretation.preview.description}
          </p>
        </section>

        {/* 명반 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>명반</h3>
            <span className={styles.sectionBadge}>{result.chart.wuxingJu}</span>
          </div>
          <ChartGrid
            chart={rawChart}
            mingGong={rawChart.mingGong}
            shenGong={rawChart.shenGong}
          />
        </section>

        {/* 대운 섹션 */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>대운 (10년 주기)</h3>
            <span className={styles.sectionBadge}>현재 {currentAge}세</span>
          </div>
          <DayunTimeline dayun={dayun} currentAge={currentAge} />
        </section>

        {/* 라이프스타일 섹션 */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>라이프스타일 추천</h3>
          <LifestyleSection lifestyle={lifestyle} />
        </section>

        {/* 상세 운세 섹션 */}
        {interpretation.details && (
          <div className={styles.detailsContainer}>
            <section className={styles.summarySection}>
              <h3>종합 운세</h3>
              <p>{interpretation.details.summary}</p>
            </section>

            <section className={styles.fortuneSection}>
              <h3>{interpretation.details.wealth.title}</h3>
              <p>{interpretation.details.wealth.content}</p>
              <ul className={styles.highlights}>
                {interpretation.details.wealth.highlights.map(
                  (highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  )
                )}
              </ul>
            </section>

            <section className={styles.fortuneSection}>
              <h3>{interpretation.details.career.title}</h3>
              <p>{interpretation.details.career.content}</p>
              <ul className={styles.highlights}>
                {interpretation.details.career.highlights.map(
                  (highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  )
                )}
              </ul>
            </section>

            <section className={styles.fortuneSection}>
              <h3>{interpretation.details.relationship.title}</h3>
              <p>{interpretation.details.relationship.content}</p>
              <ul className={styles.highlights}>
                {interpretation.details.relationship.highlights.map(
                  (highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  )
                )}
              </ul>
            </section>

            <section className={styles.fortuneSection}>
              <h3>{interpretation.details.health.title}</h3>
              <p>{interpretation.details.health.content}</p>
              <ul className={styles.highlights}>
                {interpretation.details.health.highlights.map(
                  (highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  )
                )}
              </ul>
            </section>
          </div>
        )}

        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/profiles")}
        >
          프로필 목록으로 돌아가기
        </button>
      </main>
    </div>
  );
}
