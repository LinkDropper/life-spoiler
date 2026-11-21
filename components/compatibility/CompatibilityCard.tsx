"use client";

import { useTranslations } from "next-intl";

import { getRelationshipLabel } from "./utils";
import styles from "./CompatibilityCard.module.css";

import type { CompatibilityRelationshipType } from "@/libs/supabase/types";

interface CompatibilityCardProps {
  nameA: string;
  nameB: string;
  score: number | null;
  relationshipType?: CompatibilityRelationshipType;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

export const CompatibilityCard = ({
  nameA,
  nameB,
  score,
  relationshipType,
  isSelected = false,
  onSelect,
  onDelete,
}: CompatibilityCardProps) => {
  const t = useTranslations("compatibility.card");

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const cardClassName = [
    styles.card,
    isSelected && styles.selected,
    !onSelect && styles.static,
  ]
    .filter(Boolean)
    .join(" ");

  const cardContent = (
    <div className={styles.content}>
      <div className={styles.nameRow}>
        <span className={styles.names}>
          {nameA} <span className={styles.separator}>X</span> {nameB}
        </span>
        {onDelete && (
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleDeleteClick}
            aria-label={t("deleteAriaLabel", {
              default: "궁합 삭제",
            })}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.33325 3.125C8.278 3.125 8.22501 3.14695 8.18594 3.18602C8.14687 3.22509 8.12492 3.27808 8.12492 3.33333V5.20833H11.8749V3.33333C11.8749 3.27808 11.853 3.22509 11.8139 3.18602C11.7748 3.14695 11.7218 3.125 11.6666 3.125H8.33325ZM13.1249 5.20833V3.33333C13.1249 2.94656 12.9713 2.57563 12.6978 2.30214C12.4243 2.02865 12.0534 1.875 11.6666 1.875H8.33325C7.94648 1.875 7.57555 2.02865 7.30205 2.30214C7.02856 2.57563 6.87492 2.94656 6.87492 3.33333V5.20833H4.17389C4.1695 5.20829 4.16509 5.20829 4.16067 5.20833H3.33325C2.98807 5.20833 2.70825 5.48816 2.70825 5.83333C2.70825 6.17851 2.98807 6.45833 3.33325 6.45833H3.5915L4.37509 15.8614C4.3824 16.459 4.62298 17.0306 5.04613 17.4538C5.4759 17.8836 6.0588 18.125 6.66659 18.125H13.3333C13.941 18.125 14.5239 17.8836 14.9537 17.4538C15.3769 17.0306 15.6174 16.459 15.6247 15.8614L16.4083 6.45833H16.6666C17.0118 6.45833 17.2916 6.17851 17.2916 5.83333C17.2916 5.48816 17.0118 5.20833 16.6666 5.20833H15.8392C15.8347 5.20829 15.8303 5.20829 15.8259 5.20833H13.1249ZM4.84583 6.45833L5.62276 15.7814C5.6242 15.7987 5.62492 15.816 5.62492 15.8333C5.62492 16.1096 5.73467 16.3746 5.93002 16.5699C6.12537 16.7653 6.39032 16.875 6.66659 16.875H13.3333C13.6095 16.875 13.8745 16.7653 14.0698 16.5699C14.2652 16.3746 14.3749 16.1096 14.3749 15.8333C14.3749 15.816 14.3756 15.7987 14.3771 15.7814L15.154 6.45833H4.84583ZM8.33325 8.54167C8.67843 8.54167 8.95825 8.82149 8.95825 9.16667V14.1667C8.95825 14.5118 8.67843 14.7917 8.33325 14.7917C7.98807 14.7917 7.70825 14.5118 7.70825 14.1667V9.16667C7.70825 8.82149 7.98807 8.54167 8.33325 8.54167ZM11.6666 8.54167C12.0118 8.54167 12.2916 8.82149 12.2916 9.16667V14.1667C12.2916 14.5118 12.0118 14.7917 11.6666 14.7917C11.3214 14.7917 11.0416 14.5118 11.0416 14.1667V9.16667C11.0416 8.82149 11.3214 8.54167 11.6666 8.54167Z"
                fill="currentColor"
                fillOpacity="0.5"
              />
            </svg>
          </button>
        )}
      </div>
      <div className={styles.infoRow}>
        {score !== null && (
          <span className={styles.score}>
            {t("score", { default: "궁합 점수" })}: {score}
            {t("scoreUnit", { default: "점" })}
          </span>
        )}
        {relationshipType && (
          <span className={styles.tag}>
            {getRelationshipLabel(relationshipType, t)}
          </span>
        )}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button type="button" className={cardClassName} onClick={onSelect}>
        {cardContent}
      </button>
    );
  }

  return <div className={cardClassName}>{cardContent}</div>;
};
