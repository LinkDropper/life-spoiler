"use client";

import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Sheet } from "@/components/common/sheet";
import type { ProfileRow } from "@/libs/supabase/types";

import styles from "./CastingSheet.module.css";

export type CastingSlot = "a" | "b";

interface CastingSheetProps {
  /** 지금 채우는 칸. null이면 닫힘 */
  slot: CastingSlot | null;
  profiles: ProfileRow[];
  cast: Record<CastingSlot, string | null>;
  /** 반려 관계에서의 배역 이름 (집사 · 고양이 · 강아지) */
  roleLabel: string | null;
  toProfileLine: (profile: ProfileRow) => string;
  onCast: (slot: CastingSlot, profileId: string) => void;
  onNewProfile: (slot: CastingSlot) => void;
  onClose: () => void;
}

/**
 * 배우 고르기 시트: 칸 하나에 배우 한 명. 누르면 바로 그 칸에 앉는다.
 * 다른 칸에 이미 앉은 배우는 흐리게(고를 수 없게) 보여 준다.
 */
export const CastingSheet = ({
  slot,
  profiles,
  cast,
  roleLabel,
  toProfileLine,
  onCast,
  onNewProfile,
  onClose,
}: CastingSheetProps) => {
  const t = useTranslations("compatibility.casting");
  const label = slot === "b" ? "LEAD B" : "LEAD A";
  const otherSlot: CastingSlot = slot === "b" ? "a" : "b";
  const otherLabel = slot === "b" ? "LEAD A" : "LEAD B";

  return (
    <Sheet
      isOpen={slot !== null}
      onClose={onClose}
      eyebrow={`CASTING · ${label}${roleLabel ? ` · ${roleLabel}` : ""}`}
      title={t("sheetTitle")}
    >
      <ul className={styles.list}>
        {profiles.map((profile) => {
          const isCurrent = slot !== null && cast[slot] === profile.id;
          const isTaken = cast[otherSlot] === profile.id;
          return (
            <li key={profile.id}>
              <button
                type="button"
                className={`${styles.actor} ${isCurrent ? styles.actorCurrent : ""} ${
                  slot === "b" ? styles.slotB : styles.slotA
                }`}
                onClick={() => slot && onCast(slot, profile.id)}
                disabled={isTaken}
                aria-pressed={isCurrent}
              >
                <span className={styles.monogram} aria-hidden="true">
                  {profile.name.slice(0, 1)}
                </span>
                <span className={styles.text}>
                  <b>{profile.name}</b>
                  <span>{toProfileLine(profile)}</span>
                </span>
                {isTaken ? (
                  <span className={styles.taken}>{otherLabel}</span>
                ) : (
                  isCurrent && (
                    <span className={styles.check} aria-hidden="true">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={styles.newActor}
        onClick={() => slot && onNewProfile(slot)}
      >
        <Plus size={20} aria-hidden="true" />
        <b>{t("newActor")}</b>
      </button>
    </Sheet>
  );
};
