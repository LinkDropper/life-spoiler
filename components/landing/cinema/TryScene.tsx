"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { trackLandingEvent } from "@/libs/analytics";
import { saveLandingBirthDraft } from "@/libs/landing/birth-draft";

import { gsap, useGSAP } from "./gsap";
import { PalaceGrid } from "./PalaceGrid";
import styles from "./TryScene.module.css";
import { useLandingCta } from "../useLandingCta";

import type { FormEvent } from "react";
import type { ChartSnapshot } from "@/libs/landing/chart-snapshot";

export interface TryResult {
  snapshot: ChartSnapshot;
  birthYear: number;
}

interface TrySceneProps {
  result: TryResult | null;
  onResult: (result: TryResult) => void;
}

type CalendarType = "solar" | "lunar";
type Gender = "female" | "male";

/** 예고편처럼 키워드 일부만 보여주고 나머지는 본편용으로 가린다 */
const VISIBLE_KEYWORD_COUNT = 5;

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * 장면 4 — 방문자가 자기 생년월일시로 명반을 바로 그려본다 (로그인 불필요).
 * 결과는 화면에만 쓰고 저장하지 않는다. 이후 필름 장면도 이 결과로 바뀐다.
 */
export const TryScene = ({ result, onResult }: TrySceneProps) => {
  const t = useTranslations("landing.cinema.try");
  const { handleCtaClick } = useLandingCta("try");
  const sectionRef = useRef<HTMLElement>(null);
  const formId = useId();

  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [gender, setGender] = useState<Gender>("female");
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 명반 칸이 하나씩 켜지며 "그려지는" 순간 — 사용자가 누른 결과에만 쓰는 모션
  useGSAP(
    () => {
      if (!result) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(`.${styles.result} li`, {
        opacity: 0,
        scale: 0.7,
        duration: 0.5,
        stagger: 0.035,
        ease: "back.out(1.6)",
      });
    },
    { scope: sectionRef, dependencies: [result], revertOnUpdate: true }
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!birthDate || (!isTimeUnknown && !birthTime)) {
      setErrorMessage(t("errorRequired"));
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const response = await fetch("/api/landing/chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate,
        birthTime: isTimeUnknown ? "unknown" : birthTime,
        gender,
        calendarType,
      }),
    }).catch(() => null);
    setIsSubmitting(false);

    const timeKnown = !isTimeUnknown;
    if (!response?.ok) {
      setErrorMessage(t("errorFailed"));
      trackLandingEvent("landing_try_submit", {
        status: "error",
        time_known: timeKnown,
        calendar: calendarType,
      });
      return;
    }

    const { snapshot } = (await response.json()) as { snapshot: ChartSnapshot };
    onResult({ snapshot, birthYear: Number(birthDate.slice(0, 4)) });
    // 로그인 뒤 첫 프로필 입력에 그대로 이어 쓰도록 이 기기에만 잠깐 보관한다 (30분, 서버 전송 없음)
    saveLandingBirthDraft({
      birthDate,
      birthTime: isTimeUnknown ? "" : birthTime,
      birthTimeUnknown: isTimeUnknown,
      calendarType,
      gender,
    });
    trackLandingEvent("landing_try_submit", {
      status: "success",
      time_known: timeKnown,
      calendar: calendarType,
    });
  };

  const ming = result?.snapshot.focuses.find(
    (focus) => focus.palaceKey === "명궁"
  );

  return (
    <section
      ref={sectionRef}
      id="landing-try"
      className={styles.section}
      aria-labelledby="try-title"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="try-title" className={styles.title}>
            {t("title")}
          </h2>
          <p className={styles.description}>{t("description")}</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.row}>
              <label className={styles.field} htmlFor={`${formId}-date`}>
                <span className={styles.label}>{t("birthDate")}</span>
                <input
                  id={`${formId}-date`}
                  type="date"
                  min="1920-01-01"
                  max={TODAY}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={styles.input}
                  required
                />
              </label>
              <label className={styles.field} htmlFor={`${formId}-calendar`}>
                <span className={styles.label}>{t("calendar")}</span>
                <select
                  id={`${formId}-calendar`}
                  value={calendarType}
                  onChange={(e) =>
                    setCalendarType(e.target.value as CalendarType)
                  }
                  className={styles.input}
                >
                  <option value="solar">{t("solar")}</option>
                  <option value="lunar">{t("lunar")}</option>
                </select>
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field} htmlFor={`${formId}-time`}>
                <span className={styles.label}>{t("birthTime")}</span>
                <input
                  id={`${formId}-time`}
                  type="time"
                  value={birthTime}
                  disabled={isTimeUnknown}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className={styles.input}
                />
              </label>
              <fieldset className={styles.field}>
                <legend className={styles.label}>{t("gender")}</legend>
                <div className={styles.segment}>
                  {(["female", "male"] as const).map((value) => (
                    <label
                      key={value}
                      className={`${styles.segmentItem} ${gender === value ? styles.segmentActive : ""}`}
                    >
                      <input
                        type="radio"
                        name={`${formId}-gender`}
                        value={value}
                        checked={gender === value}
                        onChange={() => setGender(value)}
                        className={styles.srOnly}
                      />
                      {t(`genderOption.${value}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <label className={styles.check}>
              <input
                type="checkbox"
                checked={isTimeUnknown}
                onChange={(e) => setIsTimeUnknown(e.target.checked)}
              />
              {t("timeUnknown")}
            </label>

            <button
              type="submit"
              className={styles.submit}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </button>
            <p className={styles.privacy}>{t("privacy")}</p>
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          </form>
        </div>

        <div className={styles.resultArea} aria-live="polite">
          {result ? (
            <div className={styles.result}>
              <PalaceGrid
                cells={result.snapshot.cells}
                mingBranch={result.snapshot.mingBranch}
                highlightBranch={result.snapshot.mingBranch}
                centerLabel={t("chartCenter")}
                ariaLabel={t("chartAriaLabel")}
              />
              <div className={styles.reading}>
                {result.snapshot.oneLiner && (
                  <p className={styles.oneLiner}>{result.snapshot.oneLiner}</p>
                )}
                {ming && <p className={styles.mingReading}>{ming.reading}</p>}
                <ul className={styles.keywords}>
                  {result.snapshot.keywords.map((keyword, index) => (
                    <li
                      key={keyword}
                      className={
                        index < VISIBLE_KEYWORD_COUNT
                          ? styles.keyword
                          : `${styles.keyword} ${styles.keywordLocked}`
                      }
                      aria-hidden={index >= VISIBLE_KEYWORD_COUNT || undefined}
                    >
                      #{keyword}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={handleCtaClick}
                  data-landing-cta
                >
                  {t("cta")}
                </button>
                <p className={styles.ctaNote}>{t("ctaNote")}</p>
              </div>
            </div>
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <span>{t("placeholder")}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
