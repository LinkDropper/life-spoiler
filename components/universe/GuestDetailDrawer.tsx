"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { GuestCompatibilityContent } from "./GuestCompatibilityContent";
import styles from "./GuestDetailDrawer.module.css";

import type { UniverseGuestDto } from "@/libs/universe/types";

interface GuestDetailDrawerProps {
  /** null이면 닫힌 상태 (렌더하지 않는다) */
  guest: UniverseGuestDto | null;
  onClose: () => void;
}

/**
 * 궁합 순위 목록 항목 클릭 시 뜨는 바텀시트.
 *
 * `components/fortune/ShareDrawer.tsx`와 같은 배경 dim + 하단 슬라이드업 패턴을
 * 따르되, 색은 앱 전역 다크 서피스 토큰 대신 이 기능의 우주 테마(남색/보라
 * 그라디언트, `UniverseVisualization.module.css`의 `.canvas`와 동일 톤)를 쓴다.
 *
 * 여기서 보여주는 데이터는 이미 `GET /api/universe/{publicId}` 응답에 전부
 * 들어있는 UniverseGuestDto다 — 이 드로어를 위해 새로 fetch하지 않는다.
 *
 * factor 근거 breakdown(축 이름 + 판정 문장 + 기여도)도 함께 보여준다.
 * "정보가 너무 적다"는 피드백에 대응하되, 경쟁사 예시(캐릭터 일러스트,
 * "내가 아끼는 내 사람" 같은 관계 유형 라벨)를 그대로 베끼지 않고 이미
 * 엔진이 실제로 산출하는 결정론적 데이터(factors)로 채운다 — 없는 걸
 * 지어내지 않는다는 브랜드 원칙(근거 기반 콘텐츠)과도 맞다.
 */
export const GuestDetailDrawer = ({
  guest,
  onClose,
}: GuestDetailDrawerProps) => {
  const t = useTranslations("universe.detail");

  useEffect(() => {
    if (guest) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [guest]);

  if (!guest) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.drawer} role="dialog" aria-modal="true">
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("drawerClose")}
        >
          ×
        </button>

        <GuestCompatibilityContent guest={guest} className={styles.content} />
      </div>
    </div>
  );
};
