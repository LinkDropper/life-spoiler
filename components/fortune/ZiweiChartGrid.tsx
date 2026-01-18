"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { EARTHLY_BRANCHES } from "@/libs/zi-wei-dou-shu/constants/branches";

import type { YearlySihua } from "@/libs/zi-wei-dou-shu/calculators";
import type { ZiweiChart, Palace } from "@/libs/zi-wei-dou-shu/types";

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

// ============================================================
// 유년 사화 마커 매핑
// ============================================================

const SIHUA_MARKERS: Record<string, string> = {
  hualu: "화록",
  huaquan: "화권",
  huake: "화과",
  huaji: "화기",
};

// ============================================================
// 타입 정의
// ============================================================

interface ZiweiChartGridProps {
  chart: ZiweiChart;
  profileName: string;
  wuxingJu: string;
  yearlySihua?: YearlySihua;
}

// ============================================================
// 유틸리티 함수
// ============================================================

const getYearlySihuaMarker = (
  starName: string,
  yearlySihua?: YearlySihua
): string | null => {
  if (!yearlySihua) return null;

  if (yearlySihua.hualu.star === starName) return SIHUA_MARKERS.hualu;
  if (yearlySihua.huaquan.star === starName) return SIHUA_MARKERS.huaquan;
  if (yearlySihua.huake.star === starName) return SIHUA_MARKERS.huake;
  if (yearlySihua.huaji.star === starName) return SIHUA_MARKERS.huaji;

  return null;
};

// ============================================================
// 궁 셀 컴포넌트
// ============================================================

const PalaceCell = ({
  palace,
  isMingGong,
  yearlySihua,
}: {
  palace: Palace;
  isMingGong: boolean;
  yearlySihua?: YearlySihua;
}) => {
  const position = PALACE_GRID_POSITIONS[palace.branch];
  const [firstMainStar, ...additionalMainStars] = palace.mainStars;

  return (
    <div
      className={`${styles.palaceCell} ${isMingGong ? styles.mingGong : ""}`}
      style={{
        gridRow: position.row,
        gridColumn: position.col,
      }}
      data-row={position.row}
      data-col={position.col}
    >
      {/* 상단: 궁 이름 + 지지 */}
      <div className={styles.palaceHeader}>
        <span className={styles.palaceName}>{palace.name}</span>
        <span className={styles.palaceBranch}>
          {EARTHLY_BRANCHES[palace.branch]}
        </span>
      </div>

      {/* 첫 번째 주성 */}
      {firstMainStar && (
        <div className={styles.mainStarsArea}>
          <div className={styles.mainStarRow}>
            <span className={styles.mainStarName}>{firstMainStar.name}</span>
            <span className={styles.starBrightness}>
              [{firstMainStar.brightness}]
            </span>
            {yearlySihua &&
              getYearlySihuaMarker(firstMainStar.name, yearlySihua) && (
                <span className={styles.yearlySihuaMarker}>
                  [{getYearlySihuaMarker(firstMainStar.name, yearlySihua)}]
                </span>
              )}
          </div>
        </div>
      )}

      {/* 추가 주성 (두 번째부터) */}
      {additionalMainStars.length > 0 && (
        <div className={styles.additionalStarsArea}>
          {additionalMainStars.map((star, idx) => {
            const sihuaMarker = getYearlySihuaMarker(star.name, yearlySihua);
            return (
              <div key={idx} className={styles.mainStarRow}>
                <span className={styles.mainStarName}>{star.name}</span>
                <span className={styles.starBrightness}>
                  [{star.brightness}]
                </span>
                {sihuaMarker && (
                  <span className={styles.yearlySihuaMarker}>
                    [{sihuaMarker}]
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
            {palace.minorStars.map((s) => s.name).join(" ")}
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
}: {
  chart: ZiweiChart;
  profileName: string;
  wuxingJu: string;
  yearlySihua?: YearlySihua;
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
      {starImage ? (
        <div className={styles.starImageContainer}>
          <Image
            src={starImage}
            alt={mainStar}
            width={146}
            height={80}
            className={styles.starImage}
          />
        </div>
      ) : (
        <div className={styles.starImagePlaceholder} />
      )}

      {/* 프로필 이름 + 오행국 */}
      <div className={styles.profileInfo}>
        <span className={styles.profileName}>{profileName}</span>
        <span className={styles.wuxingBadge}>{shortWuxingJu}</span>
      </div>

      {/* 사화 정보 */}
      <div className={styles.sihuaInfo}>
        <span>
          {t("hualu", { default: "화록" })}: {sihuaData.hualu} |{" "}
          {t("huaquan", { default: "화권" })}: {sihuaData.huaquan}
        </span>
        <span>
          {t("huake", { default: "화과" })}: {sihuaData.huake} |{" "}
          {t("huaji", { default: "화기" })}: {sihuaData.huaji}
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
}: ZiweiChartGridProps) => {
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
          />
        );
      })}

      {/* 가운데 셀 */}
      <CenterCell
        chart={chart}
        profileName={profileName}
        wuxingJu={wuxingJu}
        yearlySihua={yearlySihua}
      />
    </div>
  );
};
