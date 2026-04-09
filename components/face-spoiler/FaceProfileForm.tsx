"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import styles from "./FaceProfileForm.module.css";

import type { FaceProfileGender, FaceProfileRow } from "@/libs/supabase/types";

interface CreateProfileResponse {
  success: boolean;
  data?: { profile: FaceProfileRow };
  error?: string;
}

const MAX_NAME_LENGTH = 30;

export const FaceProfileForm = () => {
  const router = useRouter();
  const t = useTranslations("faceSpoiler.profiles.form");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<FaceProfileGender | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedName = name.trim();
  const isValid =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_NAME_LENGTH &&
    gender !== null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleGenderSelect = (next: FaceProfileGender) => {
    setGender(next);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleBack = () => {
    router.push("/face-spoiler/profiles");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || isSubmitting || !gender) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/face-spoiler/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, gender }),
      });

      const result: CreateProfileResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        setErrorMessage(
          result.error ??
            t("errorCreate", {
              default: "프로필을 생성하지 못했습니다. 다시 시도해주세요.",
            })
        );
        setIsSubmitting(false);
        return;
      }

      const profileId = result.data.profile.id;
      router.push(`/face-spoiler/upload?profileId=${profileId}`);
    } catch (error) {
      console.error("Error creating face profile:", error);
      setErrorMessage(
        t("errorNetwork", {
          default: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        })
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="face-profile-name">
          {t("nameLabel", { default: "이름" })}
        </label>
        <input
          id="face-profile-name"
          type="text"
          className={styles.input}
          placeholder={t("namePlaceholder", { default: "이름을 입력해주세요" })}
          value={name}
          onChange={handleNameChange}
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          {t("genderLabel", { default: "성별" })}
        </span>
        <div className={styles.genderGroup} role="radiogroup">
          <button
            type="button"
            role="radio"
            aria-checked={gender === "male"}
            className={`${styles.genderButton} ${
              gender === "male" ? styles.genderSelected : ""
            }`}
            onClick={() => handleGenderSelect("male")}
            disabled={isSubmitting}
          >
            {t("male", { default: "남성" })}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={gender === "female"}
            className={`${styles.genderButton} ${
              gender === "female" ? styles.genderSelected : ""
            }`}
            onClick={() => handleGenderSelect("female")}
            disabled={isSubmitting}
          >
            {t("female", { default: "여성" })}
          </button>
        </div>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={isSubmitting}
          aria-label={t("backAriaLabel", { default: "뒤로가기" })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting
            ? t("submitting", { default: "등록 중..." })
            : t("submit", { default: "등록하기" })}
        </button>
      </footer>
    </form>
  );
};
