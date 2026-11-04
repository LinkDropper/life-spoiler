"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { DecadeCounter } from "@/components/landing/cinema/DecadeCounter";
import { FilmFrameStill } from "@/components/landing/cinema/FilmFrameStill";
import {
  DEFAULT_TINT,
  PALACE_TINTS,
} from "@/components/landing/cinema/film-still";
import { findNowIndex } from "@/libs/home/home-film";
import { getFortuneHref } from "@/libs/home/home-profile";
import { pickParticle } from "@/libs/utils";

import styles from "./FilmHero.module.css";
import { ProfileSelect } from "./ProfileSelect";

import type { CSSProperties } from "react";
import type { HomeCtaTarget } from "@/libs/analytics";
import type { HomeFilmFrame } from "@/libs/home/home-film";
import type { HomeState } from "@/libs/home/home-profile";
import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

/** 손으로 넘긴 필름이 멈춘 뒤 가운데 칸을 고르기까지 기다리는 시간 */
const SCROLL_SETTLE_MS = 120;

const tintOf = (frame: HomeFilmFrame) =>
  PALACE_TINTS[frame.palaceKey] ?? DEFAULT_TINT;

/** 별 이름을 언어에 맞게 잇는다 (한국어는 받침에 따라 과/와) */
const joinStarNames = (stars: string[], locale: string): string => {
  if (locale === "ko") {
    return stars.reduce(
      (joined, star, index) =>
        index === 0
          ? star
          : `${joined}${pickParticle(stars[index - 1], "과", "와")} ${star}`,
      ""
    );
  }
  if (locale === "ja") {
    return stars.join("と");
  }
  return new Intl.ListFormat(locale, { type: "conjunction" }).format(stars);
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 가로 스크롤 줄에서 index번째 칸을 가운데로 */
const centerChild = (
  container: HTMLElement | null,
  index: number,
  smooth: boolean
) => {
  const item = container?.children[index];
  if (!container || !(item instanceof HTMLElement)) {
    return;
  }
  container.scrollTo({
    left: item.offsetLeft - (container.clientWidth - item.clientWidth) / 2,
    behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
  });
};

interface FilmHeroProps {
  state: HomeState | null;
  frames: HomeFilmFrame[];
  age: number | null;
  isFilmLoading: boolean;
  profiles: ProfileWithFortunes[];
  onSelectProfile: (profileId: string) => void;
  /** 세션에서 처음 볼 때만 영사기 켜짐 연출을 한다 */
  shouldPlayIntro: boolean;
  onCtaClick: (target: HomeCtaTarget) => void;
}

/**
 * 홈 첫 화면 — 랜딩 인생 필름의 다음 장면 (docs/home-redesign-2026-11.md E안).
 * 헤드라인 → 내 인생 필름(지금 10년의 밤하늘 + 줄거리 자막) → 10년 썸네일 → 본편 버튼.
 * 소장자에겐 랜딩이 "본편에서 공개"로 잠가 둔 그 10년의 줄거리를 자막으로 연다.
 */
export const FilmHero = ({
  state,
  frames,
  age,
  isFilmLoading,
  profiles,
  onSelectProfile,
  shouldPlayIntro,
  onCtaClick,
}: FilmHeroProps) => {
  const t = useTranslations("home.hero");
  const tFilm = useTranslations("landing.cinema.film");
  const locale = useLocale();
  const trackRef = useRef<HTMLOListElement>(null);

  const nowIndex = age === null ? -1 : findNowIndex(frames, age);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(nowIndex, 0));
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // 프로필이 바뀌어 필름이 새로 감기면 지금 칸을 가운데로
  useEffect(() => {
    const index = Math.max(nowIndex, 0);
    setSelectedIndex(index);
    centerChild(trackRef.current, index, false);
  }, [frames, nowIndex]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    centerChild(trackRef.current, index, true);
  };

  // 손으로 넘긴 필름이 멈추면 가운데 칸을 고르고 썸네일 줄을 따라 맞춘다
  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const middle = track.scrollLeft + track.clientWidth / 2;
        let closest = 0;
        let distance = Infinity;
        Array.from(track.children).forEach((child, index) => {
          if (!(child instanceof HTMLElement)) {
            return;
          }
          const gap = Math.abs(
            child.offsetLeft + child.clientWidth / 2 - middle
          );
          if (gap < distance) {
            distance = gap;
            closest = index;
          }
        });
        if (closest !== selectedIndexRef.current) {
          setSelectedIndex(closest);
        }
      }, SCROLL_SETTLE_MS);
    };
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      track.removeEventListener("scroll", handleScroll);
    };
  }, [frames]);

  const copy = state ? getHeroCopy(state, t) : null;
  const profile = state && state.kind !== "noProfile" ? state.profile : null;
  const selected = frames[selectedIndex];

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.pad}>
        {copy?.label &&
          (profile ? (
            <ProfileSelect
              profiles={profiles}
              selectedId={profile.id}
              onChange={onSelectProfile}
            />
          ) : (
            <p className={styles.who}>{copy.label}</p>
          ))}
        <h1 id="home-hero-title" className={styles.headline}>
          {copy ? copy.title : t("loading")}
        </h1>
      </div>

      <div className={styles.reel} aria-busy={isFilmLoading}>
        <div className={styles.edgeRow} aria-hidden="true">
          <span>
            {tFilm("edgeCode", {
              number: String(selectedIndex + 1).padStart(2, "0"),
            })}
          </span>
          {selected && (
            <span>
              {selected.startAge}–{selected.endAge}
            </span>
          )}
        </div>

        {frames.length > 0 ? (
          <ol
            ref={trackRef}
            className={styles.track}
            tabIndex={0}
            aria-label={t("filmAria", { name: profile?.name ?? "" })}
          >
            {frames.map((frame, index) => {
              const isSelected = index === selectedIndex;
              const isNow = index === nowIndex;
              return (
                <li
                  key={`${frame.palaceKey}-${frame.startAge}`}
                  className={[
                    styles.frame,
                    isSelected ? styles.selected : "",
                    isSelected && isNow && shouldPlayIntro ? styles.intro : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={isSelected ? "step" : undefined}
                >
                  <FilmFrameStill
                    seedKey={`${frame.palaceKey}-${frame.startAge}`}
                    tint={tintOf(frame)}
                    starNames={frame.stars}
                    skyLabel={t("skyAria", {
                      palace: frame.palaceName,
                      stars: frame.stars.join(", ") || "-",
                    })}
                    ages={tFilm("ages", {
                      start: frame.startAge,
                      end: frame.endAge,
                    })}
                    nowLabel={isNow ? tFilm("nowShowing") : undefined}
                    subtitle={frame.isUnlocked ? frame.caption : null}
                    lockedLabel={tFilm("lockedSrText")}
                  />
                </li>
              );
            })}
          </ol>
        ) : (
          <div
            className={styles.emptyFrame}
            role={isFilmLoading ? "status" : undefined}
          >
            {isFilmLoading && (
              <span className={styles.srOnly}>{t("loading")}</span>
            )}
          </div>
        )}
      </div>

      {frames.length > 1 && (
        <DecadeCounter
          className={styles.counter}
          items={frames.map((frame) => ({
            key: `${frame.palaceKey}-${frame.startAge}`,
            tint: tintOf(frame),
            label: `${frame.startAge}~${frame.endAge}`,
          }))}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          ariaLabel={t("counterAria")}
        />
      )}

      {selected && (
        <p className={styles.meta}>
          {selected.stars.length > 0
            ? t.rich("meta", {
                palace: selected.palaceName,
                stars: joinStarNames(selected.stars, locale),
                copula: pickParticle(
                  selected.stars[selected.stars.length - 1],
                  "이에요",
                  "예요"
                ),
                b: (chunks) => (
                  <b
                    className={styles.metaPalace}
                    style={{ "--tint": tintOf(selected) } as CSSProperties}
                  >
                    {chunks}
                  </b>
                ),
              })
            : t.rich("metaEmpty", {
                palace: selected.palaceName,
                b: (chunks) => (
                  <b
                    className={styles.metaPalace}
                    style={{ "--tint": tintOf(selected) } as CSSProperties}
                  >
                    {chunks}
                  </b>
                ),
              })}
        </p>
      )}

      {copy && (
        <div className={styles.pad}>
          <Link
            href={copy.href ?? getFortuneHref(profile, "lifetime")}
            className={styles.cta}
            // 운세로 가는 링크는 ScreeningProvider가 상영관 입장과 함께 이동시킨다
            onClick={() => onCtaClick(copy.target)}
          >
            {copy.cta}
          </Link>
        </div>
      )}
    </section>
  );
};

interface HeroCopy {
  label: string | null;
  title: string;
  cta: string;
  /** 없으면 본인 프로필의 인생 운세(소장이면 결과, 아니면 예고편) */
  href?: string;
  target: HomeCtaTarget;
}

const getHeroCopy = (
  state: HomeState,
  t: ReturnType<typeof useTranslations<"home.hero">>
): HeroCopy => {
  if (state.kind === "noProfile") {
    return {
      label: null,
      title: t("noProfile.title"),
      cta: t("noProfile.cta"),
      href: "/profile/setup",
      target: "profileSetup",
    };
  }

  const { name } = state.profile;

  if (state.kind === "fresh") {
    return {
      label: t("label", { name }),
      title: t("fresh.title"),
      cta: t("fresh.cta"),
      target: "lifetime",
    };
  }

  if (state.kind === "preview") {
    return {
      label: t("preview.label", { name }),
      title: state.headline ?? t("preview.fallback"),
      cta: t("preview.cta"),
      target: "lifetime",
    };
  }

  return {
    label: t("label", { name }),
    title: state.headline ?? t("owned.fallback"),
    cta: state.headline ? t("owned.cta") : t("owned.ctaFirst"),
    target: "lifetime",
  };
};
