import type { StarPalaceFactTable } from "../types";

import { BUCHEOGUNG_FACTS } from "./bucheogung";
import { GWALLOKGUNG_FACTS } from "./gwallokgung";
import { JAEBAEKGUNG_FACTS } from "./jaebaekgung";
import { JILAEKGUNG_FACTS } from "./jilaekgung";
import { MYEONGGUNG_FACTS } from "./myeonggung";

/**
 * 사실이 부족한 섹션을 채우는 별 × 영역 보충 주장 (LLM 전용).
 * 화면용 궁 설명(STAR_IN_PALACE)과 뜻은 같고, 표현만 "그 영역에서 실제로 생기는 일 + 장면"이다.
 */
export const STAR_PALACE_FACTS: StarPalaceFactTable = {
  명궁: MYEONGGUNG_FACTS,
  재백궁: JAEBAEKGUNG_FACTS,
  관록궁: GWALLOKGUNG_FACTS,
  부처궁: BUCHEOGUNG_FACTS,
  질액궁: JILAEKGUNG_FACTS,
};
