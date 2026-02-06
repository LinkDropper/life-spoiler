// 천간/지지
export {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  BRANCH_INDEX_MAP,
  STEM_INDEX_MAP,
} from "./branches";

// 12궁
export {
  PALACE_ORDER,
  PALACE_CHINESE_NAMES,
  PALACE_MEANINGS,
  type PalaceName,
} from "./palaces";

// 60갑자 납음
export { NAYIN_TABLE, WUXING_JU_MAP } from "./nayin";

// 자미성 위치
export { ZIWEI_POSITION_TABLE } from "./ziwei-table";

// 별 밝기
export { BRIGHTNESS_SCORE, STAR_BRIGHTNESS_TABLE } from "./brightness-table";

// 사화성
export { SIHUA_TABLE } from "./sihua-table";

// 별 관련 상수
export {
  MAIN_STAR_NAMES,
  MINOR_STAR_NAMES,
  ZIWEI_GROUP_OFFSETS,
  TIANFU_GROUP_OFFSETS,
  TIANFU_FROM_ZIWEI,
  TIANKUI_TABLE,
  TIANYUE_TABLE,
  QINGYANG_TABLE,
  TUOLUO_TABLE,
  TIANMA_TABLE,
  type MainStarName,
  type MinorStarName,
} from "./stars";

// 점수 계산
export { PALACE_CATEGORY_WEIGHTS, type CategoryScores } from "./scoring";

// 격국 패턴
export { GEOK_GUK_PATTERNS, type GeokGukPattern } from "./geok-guk-patterns";

// 주성 × 밝기 키워드
export {
  STAR_BRIGHTNESS_KEYWORDS,
  getStarBrightnessKeyword,
  KEYWORD_COUNT,
} from "./keywords";
