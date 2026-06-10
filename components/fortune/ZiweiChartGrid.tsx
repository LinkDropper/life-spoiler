"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import {
  translatePalaceName,
  translateMainStar,
  translateMinorStar,
  translateBranch,
  translateBrightness,
  translateSihuaMarker,
  translateStarName,
} from "@/libs/zi-wei-dou-shu/i18n";
import { buildPalaceExplanation } from "@/libs/zi-wei-dou-shu/palace-explanation";

import type { Locale } from "@/i18n/config";
import type { YearlySihua } from "@/libs/zi-wei-dou-shu/calculators";
import type { ZiweiChart, Palace } from "@/libs/zi-wei-dou-shu/types";

import { PalaceDetailPanel } from "./PalaceDetailPanel";
import styles from "./ZiweiChartGrid.module.css";

// ============================================================
// 주성 이미지 매핑
// ============================================================

const STAR_IMAGE_MAP: Record<string, string> = {
  자미: "/images/star/jami.png",
  천기: "/images/star/cheongi.png",
  태양: "/images/star/taeyang.png",
  무곡: "/images/star/mugok.png",
  천동: "/images/star/cheondong.png",
  염정: "/images/star/yeomjeong.png",
  천부: "/images/star/cheonbu.png",
  태음: "/images/star/taeeum.png",
  탐랑: "/images/star/tamrang.png",
  거문: "/images/star/geomun.png",
  천상: "/images/star/cheonsang.png",
  천량: "/images/star/cheonryang.png",
  칠살: "/images/star/chilsal.png",
  파군: "/images/star/pagun.png",
};

// ============================================================
// 그리드 위치 매핑 (지지 순서대로)
// ============================================================

const PALACE_GRID_POSITIONS: Record<number, { row: number; col: number }> = {
  0: { row: 4, col: 3 }, // 자
  1: { row: 4, col: 2 }, // 축
  2: { row: 4, col: 1 }, // 인
  3: { row: 3, col: 1 }, // 묘
  4: { row: 2, col: 1 }, // 진
  5: { row: 1, col: 1 }, // 사
  6: { row: 1, col: 2 }, // 오
  7: { row: 1, col: 3 }, // 미
  8: { row: 1, col: 4 }, // 신
  9: { row: 2, col: 4 }, // 유
  10: { row: 3, col: 4 }, // 술
  11: { row: 4, col: 4 }, // 해
};

// 좌측 상단(첫 행·첫 열) 셀의 지지 — 기본 선택값
const TOP_LEFT_BRANCH = (() => {
  const found = Object.keys(PALACE_GRID_POSITIONS).find((branch) => {
    const pos = PALACE_GRID_POSITIONS[Number(branch)];
    return pos.row === 1 && pos.col === 1;
  });
  return found ? Number(found) : 5;
})();

// ============================================================
// 유년 사화 마커 타입
// ============================================================

type SihuaType = "hualu" | "huaquan" | "huake" | "huaji";

// ============================================================
// UI 라벨 (간단한 chrome 문구만)
// ============================================================

const TAP_HINT: Record<Locale, string> = {
  ko: "궁을 눌러보세요. 그 자리에 대한 풀이가 아래에 나타나요.",
  en: "Tap a palace to see its reading below.",
  ja: "宮をタップすると、その場所の読み解きが下に表示されます。",
};

const VIEW_DETAIL: Record<Locale, string> = {
  ko: "자세히 보기",
  en: "view details",
  ja: "詳しく見る",
};

// ============================================================
// 타입 정의
// ============================================================

interface ZiweiChartGridProps {
  chart: ZiweiChart;
  profileName: string;
  wuxingJu: string;
  yearlySihua?: YearlySihua;
  /** 궁 셀 클릭 → 설명 패널 인터랙션 활성화 (기본 true). 공유/미리보기/이미지에서는 false */
  interactive?: boolean;
}

// ============================================================
// 유틸리티 함수
// ============================================================

const getYearlySihuaType = (
  starName: string,
  yearlySihua?: YearlySihua
): SihuaType | null => {
  if (!yearlySihua) return null;

  if (yearlySihua.hualu.star === starName) return "hualu";
  if (yearlySihua.huaquan.star === starName) return "huaquan";
  if (yearlySihua.huake.star === starName) return "huake";
  if (yearlySihua.huaji.star === starName) return "huaji";

  return null;
};

// ============================================================
// 궁 셀 컴포넌트
// ============================================================

const PalaceCell = ({
  palace,
  isMingGong,
  yearlySihua,
  locale,
  interactive,
  isSelected,
  onSelect,
}: {
  palace: Palace;
  isMingGong: boolean;
  yearlySihua?: YearlySihua;
  locale: Locale;
  interactive: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const position = PALACE_GRID_POSITIONS[palace.branch];
  const [firstMainStar, ...additionalMainStars] = palace.mainStars;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  const interactiveProps = interactive
    ? {
        role: "button",
        tabIndex: 0,
        "aria-pressed": isSelected,
        "aria-label": `${translatePalaceName(palace.name, locale)}, ${
          VIEW_DETAIL[locale]
        }`,
        onClick: onSelect,
        onKeyDown: handleKeyDown,
      }
    : {};

  return (
    <div
      className={[
        styles.palaceCell,
        isMingGong ? styles.mingGong : "",
        interactive ? styles.interactive : "",
        isSelected ? styles.selected : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        gridRow: position.row,
        gridColumn: position.col,
      }}
      data-row={position.row}
      data-col={position.col}
      {...interactiveProps}
    >
      {/* 상단: 궁 이름 + 지지 */}
      <div className={styles.palaceHeader}>
        <span className={styles.palaceName}>
          {translatePalaceName(palace.name, locale)}
        </span>
        <span className={styles.palaceBranch}>
          {translateBranch(palace.branch, locale)}
        </span>
      </div>

      {/* 첫 번째 주성 */}
      {firstMainStar && (
        <div className={styles.mainStarsArea}>
          <div className={styles.mainStarRow}>
            <span className={styles.mainStarName}>
              {translateMainStar(firstMainStar.name, locale)}
            </span>
            <span className={styles.starBrightness}>
              [{translateBrightness(firstMainStar.brightness, locale)}]
            </span>
            {yearlySihua &&
              getYearlySihuaType(firstMainStar.name, yearlySihua) && (
                <span className={styles.yearlySihuaMarker}>
                  [
                  {translateSihuaMarker(
                    getYearlySihuaType(firstMainStar.name, yearlySihua)!,
                    locale
                  )}
                  ]
                </span>
              )}
          </div>
        </div>
      )}

      {/* 추가 주성 (두 번째부터) */}
      {additionalMainStars.length > 0 && (
        <div className={styles.additionalStarsArea}>
          {additionalMainStars.map((star, idx) => {
            const sihuaType = getYearlySihuaType(star.name, yearlySihua);
            return (
              <div key={idx} className={styles.mainStarRow}>
                <span className={styles.mainStarName}>
                  {translateMainStar(star.name, locale)}
                </span>
                <span className={styles.starBrightness}>
                  [{translateBrightness(star.brightness, locale)}]
                </span>
                {sihuaType && (
                  <span className={styles.yearlySihuaMarker}>
                    [{translateSihuaMarker(sihuaType, locale)}]
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 하단: 보조성 (점선 위) */}
      {palace.minorStars.length > 0 && (
        <div className={styles.minorStarsArea}>
          <span className={styles.minorStars}>
            {palace.minorStars
              .map((s) => translateMinorStar(s.name, locale))
              .join(" ")}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 가운데 정보 셀 컴포넌트
// ============================================================

const CenterCell = ({
  chart,
  profileName,
  wuxingJu,
  yearlySihua,
  locale,
}: {
  chart: ZiweiChart;
  profileName: string;
  wuxingJu: string;
  yearlySihua?: YearlySihua;
  locale: Locale;
}) => {
  const t = useTranslations("fortune.common");

  // 명궁의 첫 번째 주성 이미지 찾기
  const mingPalace = chart.palaces.find((p) => p.branch === chart.mingGong);
  const mainStar = mingPalace?.mainStars[0]?.name || "";
  const starImage = STAR_IMAGE_MAP[mainStar];

  // 오행국 짧은 이름 (예: "금사국(金四局)" -> "금사국")
  const [shortWuxingJu] = wuxingJu.split("(");

  // 사화 정보 (유년 사화가 있으면 유년 사화 사용)
  const sihuaData = yearlySihua
    ? {
        hualu: yearlySihua.hualu.star,
        huaquan: yearlySihua.huaquan.star,
        huake: yearlySihua.huake.star,
        huaji: yearlySihua.huaji.star,
      }
    : chart.sihua;

  return (
    <div className={styles.centerCell}>
      {/* 주성 이미지 */}
      <div className={styles.starImageContainer}>
        <Image
          src={starImage || "/images/star/mu.png"}
          alt={mainStar ? translateMainStar(mainStar, locale) : "empty"}
          width={146}
          height={80}
          className={styles.starImage}
        />
      </div>

      {/* 프로필 이름 + 오행국 */}
      <div className={styles.profileInfo}>
        <span className={styles.profileName}>{profileName}</span>
        <span className={styles.wuxingBadge}>{shortWuxingJu}</span>
      </div>

      {/* 사화 정보 */}
      <div className={styles.sihuaInfo}>
        <span>
          {t("hualu", { default: "화록" })}:{" "}
          {translateStarName(sihuaData.hualu, locale)} |{" "}
          {t("huaquan", { default: "화권" })}:{" "}
          {translateStarName(sihuaData.huaquan, locale)}
        </span>
        <span>
          {t("huake", { default: "화과" })}:{" "}
          {translateStarName(sihuaData.huake, locale)} |{" "}
          {t("huaji", { default: "화기" })}:{" "}
          {translateStarName(sihuaData.huaji, locale)}
        </span>
      </div>
    </div>
  );
};

// ============================================================
// 메인 컴포넌트
// ============================================================

export const ZiweiChartGrid = ({
  chart,
  profileName,
  wuxingJu,
  yearlySihua,
  interactive = true,
}: ZiweiChartGridProps) => {
  const locale = useLocale() as Locale;
  // 기본으로 좌측 상단 궁을 선택해둔다 (비인터랙티브일 때만 선택 없음)
  const [selectedBranch, setSelectedBranch] = useState<number | null>(
    interactive ? TOP_LEFT_BRANCH : null
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const wasClosedRef = useRef(true);
  const didMountRef = useRef(false);

  const handleSelect = useCallback((branch: number) => {
    setSelectedBranch((prev) => (prev === branch ? null : branch));
  }, []);

  const handleClose = useCallback(() => setSelectedBranch(null), []);

  // 선택된 궁의 해석 조립 (상수 기반, AI 호출 없음)
  const explanation = useMemo(() => {
    if (selectedBranch === null || !chart?.palaces) return null;
    const palace = chart.palaces.find((p) => p.branch === selectedBranch);
    if (!palace) return null;
    return buildPalaceExplanation(palace, chart.palaces, locale);
  }, [selectedBranch, chart, locale]);

  // 패널이 새로 열릴 때만 부드럽게 스크롤 (내용 교체 시엔 유지)
  useEffect(() => {
    if (selectedBranch === null) {
      wasClosedRef.current = true;
      return;
    }
    // 최초 마운트의 기본 선택에서는 자동 스크롤하지 않음
    if (!didMountRef.current) {
      didMountRef.current = true;
      wasClosedRef.current = false;
      return;
    }
    if (wasClosedRef.current && panelRef.current) {
      panelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    wasClosedRef.current = false;
  }, [selectedBranch]);

  // Esc 로 닫기
  useEffect(() => {
    if (selectedBranch === null) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedBranch(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBranch]);

  // chart가 없으면 렌더링하지 않음
  if (!chart || !chart.palaces) {
    return null;
  }

  // 지지별 궁 매핑
  const palacesByBranch: Record<number, Palace> = {};
  chart.palaces.forEach((palace) => {
    palacesByBranch[palace.branch] = palace;
  });

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartGrid}>
        {/* 12궁 렌더링 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((branchIndex) => {
          const palace = palacesByBranch[branchIndex];
          if (!palace) return null;

          return (
            <PalaceCell
              key={branchIndex}
              palace={palace}
              isMingGong={branchIndex === chart.mingGong}
              yearlySihua={yearlySihua}
              locale={locale}
              interactive={interactive}
              isSelected={interactive && selectedBranch === branchIndex}
              onSelect={() => handleSelect(branchIndex)}
            />
          );
        })}

        {/* 가운데 셀 */}
        <CenterCell
          chart={chart}
          profileName={profileName}
          wuxingJu={wuxingJu}
          yearlySihua={yearlySihua}
          locale={locale}
        />
      </div>

      {interactive && (
        <div ref={panelRef}>
          {explanation ? (
            <PalaceDetailPanel
              explanation={explanation}
              locale={locale}
              onClose={handleClose}
            />
          ) : (
            <p className={styles.tapHint}>{TAP_HINT[locale]}</p>
          )}
        </div>
      )}
    </div>
  );
};
