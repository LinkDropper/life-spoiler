"use client";

import { useTranslations } from "next-intl";

import {
  Sheet,
  SheetActionRow,
  SheetButton,
  SheetList,
  SheetOption,
} from "@/components/common/sheet";

import { formatBirthDate, formatBirthTime } from "./utils";
import styles from "./page.module.css";

import type { ProfileRow } from "@/libs/supabase/types";

const MAX_SELECTED = 2;

interface ProfileSelectModalProps {
  profiles: ProfileRow[];
  tempSelectedIds: string[];
  onToggleProfile: (id: string) => void;
  onNewProfile: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** 궁합 프로필 2개를 고르는 공용 시트. 다 차면 나머지는 비활성, 목록만 스크롤된다 */
export const ProfileSelectModal = ({
  profiles,
  tempSelectedIds,
  onToggleProfile,
  onNewProfile,
  onConfirm,
  onClose,
}: ProfileSelectModalProps) => {
  const t = useTranslations("compatibility.setup");
  const tProfile = useTranslations("profiles.card");

  const timeUnknownLabel = tProfile("timeUnknown", {
    default: "시간 모름",
  });

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

  const getDescription = (profile: ProfileRow) =>
    [
      formatBirthDate(profile.birth_date),
      formatBirthTime(
        profile.birth_time,
        profile.birth_time_unknown,
        timeUnknownLabel
      ),
      getCalendarLabel(profile.calendar_type),
      getGenderLabel(profile.gender),
    ].join(" · ");

  const title = t("modalTitle", { default: "프로필 2개를 선택해 주세요" });
  const isFull = tempSelectedIds.length >= MAX_SELECTED;
  const initialFocusId =
    profiles.find((profile) => tempSelectedIds.includes(profile.id))?.id ??
    profiles[0]?.id;

  return (
    <Sheet
      isOpen
      onClose={onClose}
      eyebrow="COMPATIBILITY"
      title={title}
      footer={
        <>
          <SheetActionRow
            label={t("newProfile", { default: "새 프로필 만들기" })}
            onClick={onNewProfile}
          />
          <div className={styles.modalButtons}>
            <SheetButton variant="ghost" onClick={onClose}>
              {t("cancel", { default: "취소" })}
            </SheetButton>
            <SheetButton
              onClick={onConfirm}
              disabled={tempSelectedIds.length !== MAX_SELECTED}
            >
              {t("confirm", { default: "확인" })}
            </SheetButton>
          </div>
        </>
      }
    >
      <SheetList label={title} isMultiple>
        {profiles.map((profile) => {
          const isSelected = tempSelectedIds.includes(profile.id);
          return (
            <SheetOption
              key={profile.id}
              label={profile.name}
              description={getDescription(profile)}
              isSelected={isSelected}
              isDisabled={!isSelected && isFull}
              isInitialFocus={profile.id === initialFocusId}
              onSelect={() => onToggleProfile(profile.id)}
            />
          );
        })}
      </SheetList>
    </Sheet>
  );
};
