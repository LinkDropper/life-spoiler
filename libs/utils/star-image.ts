/**
 * 주성 이름 → 이미지 경로 매핑
 *
 * 자미두수 14주성의 한글 이름을 이미지 파일 경로로 변환합니다.
 */

/** 14주성 이미지 매핑 */
const MAIN_STAR_IMAGE_MAP: Record<string, string> = {
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

/** 기본 주성 이미지 (주성이 없는 경우) */
const DEFAULT_STAR_IMAGE = "/images/star/jami.png";

/**
 * 주성 이름으로 이미지 경로 가져오기
 *
 * @param starName - 주성 한글 이름 (예: "자미", "천기")
 * @returns 이미지 경로
 */
export const getStarImagePath = (starName: string): string => {
  return MAIN_STAR_IMAGE_MAP[starName] || DEFAULT_STAR_IMAGE;
};

/**
 * 주성 이름 목록에서 첫 번째 주성의 이미지 경로 가져오기
 *
 * @param starNames - 주성 이름 배열 (예: ["자미", "천기"])
 * @returns 첫 번째 주성의 이미지 경로
 */
export const getFirstStarImagePath = (starNames: string[]): string => {
  if (starNames.length === 0) {
    return DEFAULT_STAR_IMAGE;
  }
  return getStarImagePath(starNames[0]);
};

/**
 * 14주성인지 확인
 *
 * @param starName - 별 이름
 * @returns 14주성 여부
 */
export const isMainStar = (starName: string): boolean => {
  return starName in MAIN_STAR_IMAGE_MAP;
};

/**
 * 14주성 목록
 */
export const MAIN_STARS = Object.keys(MAIN_STAR_IMAGE_MAP);
