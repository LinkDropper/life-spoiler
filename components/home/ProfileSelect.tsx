"use client";

import { useTranslations } from "next-intl";

import { Select } from "@/components/form";
import { HOME_REDIRECT } from "@/libs/profile/setup-redirect";

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
 * 기본은 처음 만든 프로필이다. 프로필이 1개여도 보여서(1개가 86%)
 * 목록 아래 "다른 사람 인생 추가"로 가족·친구 프로필을 바로 만들 수 있다.
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
      sheetAction={{
        label: t("addProfile"),
        // 저장하면 홈으로 돌아와 새 프로필을 상영한다(profile/setup이 처리)
        href: `/profile/setup?redirect=${encodeURIComponent(HOME_REDIRECT)}`,
      }}
      className={styles.select}
    />
  );
};
