"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import { preloadTheater } from "@/components/screening";
import { trackDailyEvent, trackHomeEvent } from "@/libs/analytics";
import {
  fromSnapshotFrames,
  getFilmAge,
  readOwnedFilm,
} from "@/libs/home/home-film";
import {
  orderHomeProfiles,
  pickNextFortune,
  resolveHomeState,
  selectHomeProfile,
  toChartRequest,
} from "@/libs/home/home-profile";

import { FilmHero } from "./FilmHero";
import styles from "./HomeScreen.module.css";
import { NextTicket } from "./NextTicket";
import { Timetable } from "./Timetable";
import { TodayCard } from "./TodayCard";
import { useChartSnapshot } from "./useChartSnapshot";

import type { Locale } from "@/i18n/config";
import type { HomeCtaPosition, HomeCtaTarget } from "@/libs/analytics";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

/** 입장 연출을 이 세션에서 이미 봤는지 (세션 저장소, 실패해도 화면은 정상) */
const INTRO_SEEN_KEY = "life-spoiler:home-intro-seen";
/** 고른 프로필은 URL에 둔다 — 새로고침·뒤로 가기에도 유지된다 */
const PROFILE_PARAM = "profile";

const readIntroSeen = (): boolean => {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return true;
  }
};

const markIntroSeen = () => {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // 저장소를 못 쓰면 다음 방문에 연출이 한 번 더 나올 뿐이다
  }
};

interface HomeScreenProps {
  profiles: ProfileWithFortunes[];
  isProfilesLoading: boolean;
}

/**
 * 로그인 홈 — 랜딩의 다음 장면, "지금 상영 중".
 * 첫 화면에 내 필름의 지금 칸 + 본편 버튼, 다음 상영작·오늘의 상영 관람권,
 * 그 아래 상영 시간표. 구성 근거: docs/home-redesign-2026-11.md
 */
export const HomeScreen = ({
  profiles,
  isProfilesLoading,
}: HomeScreenProps) => {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 서버 렌더와 어긋나지 않게 첫 페인트 직전(layout effect)에 정한다
  const [shouldPlayIntro, setShouldPlayIntro] = useState(false);
  useLayoutEffect(() => {
    setShouldPlayIntro(!readIntroSeen());
  }, []);

  const orderedProfiles = useMemo(
    () => orderHomeProfiles(profiles),
    [profiles]
  );
  const profile = isProfilesLoading
    ? null
    : selectHomeProfile(profiles, searchParams.get(PROFILE_PARAM));
  const state = useMemo(
    () => (isProfilesLoading ? null : resolveHomeState(profile)),
    [isProfilesLoading, profile]
  );

  // 본편 결과가 있으면 그 안의 대운·줄거리로, 없으면 생년월일시 계산으로 필름을 감는다
  const ownedFrames = useMemo(
    () =>
      state?.kind === "owned"
        ? readOwnedFilm(state.lifetimeResult, locale)
        : [],
    [state, locale]
  );
  const needsSnapshot = Boolean(profile) && ownedFrames.length === 0;
  const chartRequest = useMemo(
    () => (needsSnapshot && profile ? toChartRequest(profile) : null),
    [needsSnapshot, profile]
  );
  const chart = useChartSnapshot(chartRequest);
  const frames =
    ownedFrames.length > 0
      ? ownedFrames
      : chart.snapshot
        ? fromSnapshotFrames(chart.snapshot.frames)
        : [];
  const age = profile ? getFilmAge(profile.birth_date) : null;
  const nextKey = state ? pickNextFortune(state) : null;

  // 상영관 3D 장면은 홈이 다 뜬 뒤 한가할 때 미리 받아 둔다(첫 화면 로딩을 늦추지 않게)
  useEffect(() => {
    const idle =
      window.requestIdleCallback ??
      ((callback: () => void) => window.setTimeout(callback, 1500));
    idle(() => preloadTheater());
  }, []);

  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (!state || hasTrackedView.current) {
      return;
    }
    hasTrackedView.current = true;
    trackHomeEvent("home_view", { state: state.kind });
    markIntroSeen();
  }, [state]);

  const handleSelectProfile = useCallback(
    (profileId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(PROFILE_PARAM, profileId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      trackHomeEvent("home_profile_change", {
        profile_count: profiles.length,
      });
    },
    [pathname, profiles.length, router, searchParams]
  );

  const handleClick = (position: HomeCtaPosition, target: HomeCtaTarget) => {
    if (!state) {
      return;
    }
    trackHomeEvent("home_cta_click", { position, target, state: state.kind });
    if (target === "daily") {
      trackDailyEvent("daily_entry_click", { source: "home" });
    }
  };

  return (
    <div className={styles.screen}>
      <FilmHero
        state={state}
        frames={frames}
        age={age}
        isFilmLoading={chart.status === "loading" || isProfilesLoading}
        profiles={orderedProfiles}
        onSelectProfile={handleSelectProfile}
        shouldPlayIntro={shouldPlayIntro}
        onCtaClick={(target) => handleClick("hero", target)}
      />
      {state && (
        <div className={styles.body}>
          {nextKey && profile && (
            <NextTicket
              profile={profile}
              fortuneKey={nextKey}
              onClick={() => handleClick("ticket", nextKey)}
            />
          )}
          {locale === "ko" && profile && (
            <TodayCard
              profile={profile}
              onClick={() => handleClick("daily", "daily")}
            />
          )}
          <Timetable
            profile={profile}
            nextKey={nextKey}
            onClick={handleClick}
          />
        </div>
      )}
    </div>
  );
};
