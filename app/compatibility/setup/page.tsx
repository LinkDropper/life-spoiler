"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import Image from "next/image";

import { HeaderClient } from "@/components/landing";
import { SelectableChips } from "@/components/form";
import { getRelationshipLabel } from "@/components/compatibility";
import {
  useProfiles,
  useIsProfilesLoading,
  useProfileActions,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import { ProfileSelectModal } from "./ProfileSelectModal";
import { formatBirthDate, formatBirthTime } from "./utils";
import styles from "./page.module.css";

import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

const RELATIONSHIP_TYPES: CompatibilityRelationshipType[] = [
  "lover",
  "some",
  "friend",
  "colleague",
  "family",
  "ex_partner",
  "ex_spouse",
  "custom",
];

const MAX_SELECTED = 2;

export default function CompatibilitySetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const t = useTranslations("compatibility.setup");
  const tCard = useTranslations("compatibility.card");
  const tProfile = useTranslations("profiles.card");

  const profiles = useProfiles();
  const isProfilesLoading = useIsProfilesLoading();
  const { fetchProfiles } = useProfileActions();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [relationshipType, setRelationshipType] =
    useState<CompatibilityRelationshipType>("lover");
  const [relationshipTypeCustom, setRelationshipTypeCustom] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfiles(true);
    }
  }, [authStatus, fetchProfiles]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  // 프로필 생성 후 돌아왔을 때 모달 자동 열기
  useEffect(() => {
    if (searchParams.get("modal") === "open" && !isProfilesLoading) {
      setIsModalOpen(true);
      router.replace("/compatibility/setup", {
        scroll: false,
      });
    }
  }, [searchParams, isProfilesLoading, router]);

  const selectedProfiles = profiles.filter((p) => selectedIds.includes(p.id));

  const handleBack = useCallback(() => {
    router.push("/compatibility");
  }, [router]);

  const handleOpenModal = useCallback(() => {
    setTempSelectedIds([...selectedIds]);
    setIsModalOpen(true);
  }, [selectedIds]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleToggleProfile = useCallback((profileId: string) => {
    setTempSelectedIds((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      }
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, profileId];
    });
  }, []);

  const handleConfirmSelection = useCallback(() => {
    setSelectedIds(tempSelectedIds);
    setIsModalOpen(false);
  }, [tempSelectedIds]);

  const handleNewProfile = useCallback(() => {
    const path = "/compatibility/setup?modal=open";
    const redirect = encodeURIComponent(path);
    router.push(`/profile/setup?redirect=${redirect}`);
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (selectedIds.length < MAX_SELECTED) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileAId: selectedIds[0],
          profileBId: selectedIds[1],
          relationshipType,
          ...(relationshipType === "custom" && relationshipTypeCustom.trim()
            ? { relationshipTypeCustom: relationshipTypeCustom.trim() }
            : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create compatibility pair");
      }

      router.push("/compatibility");
    } catch {
      alert(
        t("createError", {
          default: "궁합 생성에 실패했습니다. 다시 시도해주세요.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedIds, relationshipType, relationshipTypeCustom, router, t]);

  const getCalendarLabel = (type: "solar" | "lunar") => {
    return type === "solar"
      ? tProfile("solar", { default: "양력" })
      : tProfile("lunar", { default: "음력" });
  };

  const getGenderLabel = (g: "male" | "female") => {
    return g === "male"
      ? tProfile("male", { default: "남성" })
      : tProfile("female", { default: "여성" });
  };

  const isFormValid =
    selectedIds.length === MAX_SELECTED &&
    !isSubmitting &&
    (relationshipType !== "custom" || relationshipTypeCustom.trim().length > 0);
  const timeUnknownLabel = tProfile("timeUnknown", {
    default: "시간 모름",
  });

  if (
    authStatus === "loading" ||
    isProfilesLoading ||
    authStatus === "unauthenticated"
  ) {
    return (
      <div className={styles.page}>
        <HeaderClient />
        <div className={styles.loading}>
          {t("loading", { default: "로딩 중..." })}
        </div>
      </div>
    );
  }

  const relationshipOptions = RELATIONSHIP_TYPES.map((type) => ({
    value: type,
    label: getRelationshipLabel(type, tCard),
  }));

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        {/* 프로필 선택 섹션 */}
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            {t("profileSelection", {
              default: "프로필 선택",
            })}
          </span>

          {selectedProfiles.length > 0 && (
            <div className={styles.selectedProfiles}>
              {selectedProfiles.map((profile) => (
                <div key={profile.id} className={styles.selectedProfileCard}>
                  <div className={styles.profileCardNameRow}>
                    <span className={styles.profileCardName}>
                      {profile.name}
                    </span>
                  </div>
                  <div className={styles.profileCardInfoRow}>
                    <div className={styles.profileCardDateTime}>
                      <span className={styles.profileCardInfoText}>
                        {formatBirthDate(profile.birth_date)}
                      </span>
                      <span className={styles.profileCardInfoText}>
                        {formatBirthTime(
                          profile.birth_time,
                          profile.birth_time_unknown,
                          timeUnknownLabel
                        )}
                      </span>
                    </div>
                    <div className={styles.profileCardTags}>
                      <span className={styles.profileCardTag}>
                        {getCalendarLabel(profile.calendar_type)}
                      </span>
                      <span className={styles.profileCardTag}>
                        {getGenderLabel(profile.gender)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.changeButton}
                onClick={handleOpenModal}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 15H15.75"
                    stroke="#FFCCD9"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.375 2.62499C12.6734 2.32662 13.078 2.15906 13.5 2.15906C13.7091 2.15906 13.9162 2.20023 14.1094 2.28029C14.3025 2.36034 14.4781 2.47775 14.625 2.62499C14.7722 2.77224 14.8897 2.94781 14.9697 3.14097C15.0498 3.33413 15.0909 3.54122 15.0909 3.75031C15.0909 3.9594 15.0498 4.16649 14.9697 4.35965C14.8897 4.55281 14.7722 4.72838 14.625 4.87562L5.25 14.2506L2.25 15L3 12L12.375 2.62499Z"
                    stroke="#FFCCD9"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={styles.changeButtonLabel}>
                  {t("edit", { default: "수정하기" })}
                </span>
              </button>
            </div>
          )}

          {selectedProfiles.length === 0 && (
            <button
              type="button"
              className={styles.profileSelectButton}
              onClick={handleOpenModal}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 3.75V14.25"
                  stroke="#FFCCD9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.75 9H14.25"
                  stroke="#FFCCD9"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.profileSelectButtonLabel}>
                {t("addProfile", {
                  default: "프로필 추가",
                })}
              </span>
            </button>
          )}
        </div>

        {/* 관계 선택 섹션 */}
        <SelectableChips
          label={t("relationshipSelection", { default: "관계 선택" })}
          options={relationshipOptions}
          value={relationshipType}
          customValue={relationshipTypeCustom}
          onChange={(value, customValue) => {
            setRelationshipType(value as CompatibilityRelationshipType);
            setRelationshipTypeCustom(customValue ?? "");
          }}
          columns={2}
          customPlaceholder={t("customRelationshipPlaceholder", {
            default: "직접 입력해주세요",
          })}
          customMaxLength={20}
        />
      </main>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          aria-label={t("back", { default: "뒤로가기" })}
        >
          <Image
            src="/images/common/back-button.svg"
            alt=""
            width={52}
            height={52}
          />
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          {isSubmitting
            ? t("submitting", { default: "생성 중..." })
            : t("save", {
                default: "저장하기",
              })}
        </button>
      </footer>

      {isModalOpen && (
        <ProfileSelectModal
          profiles={profiles}
          tempSelectedIds={tempSelectedIds}
          onToggleProfile={handleToggleProfile}
          onNewProfile={handleNewProfile}
          onConfirm={handleConfirmSelection}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
