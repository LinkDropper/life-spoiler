"use client";

import { useTranslations } from "next-intl";

import { Select } from "@/components/form";

import styles from "./ProfileSelect.module.css";

import type { ProfileWithFortunes } from "@/libs/stores/profile/types";

interface ProfileSelectProps {
  /** 본인(처음 만든 프로필)이 맨 앞인 목록 */
  profiles: ProfileWithFortunes[];
  selectedId: string;
  onChange: (profileId: string) => void;
}

/**
 * 홈이 상영할 프로필을 고르는 셀렉트 (서비스 공용 Select 사용).
 * 기본은 처음 만든 프로필이고, 프로필이 2개 이상일 때만 보인다(1개가 86%).
 * 항목은 "지수님의 인생"처럼 히어로 첫 줄 문구 그대로 보여 준다.
 */
export const ProfileSelect = ({
  profiles,
  selectedId,
  onChange,
}: ProfileSelectProps) => {
  const t = useTranslations("home.hero");

  return (
    <Select
      name="home-profile"
      label={t("profileLabel")}
      isLabelHidden
      variant="plain"
      value={selectedId}
      options={profiles.map((profile) => ({
        value: profile.id,
        label: t("label", { name: profile.name }),
      }))}
      onChange={onChange}
      className={styles.select}
    />
  );
};
