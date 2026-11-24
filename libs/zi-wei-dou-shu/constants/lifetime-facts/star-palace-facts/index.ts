import type { StarPalaceFactTable } from "../types";

import { GWALLOKGUNG_FACTS } from "./gwallokgung";
import { JAEBAEKGUNG_FACTS } from "./jaebaekgung";
import { JILAEKGUNG_FACTS } from "./jilaekgung";
import { MYEONGGUNG_FACTS } from "./myeonggung";

/**
 * 사실이 부족한 섹션을 채우는 별 × 영역 보충 주장 (LLM 전용).
 * 화면용 궁 설명(STAR_IN_PALACE)과 뜻은 같고, 판정 한 줄 + 장면 재료(lens·cues·voice·avoid)로 쓴다.
 * 부처궁은 연애 재료 표(../love-facts.ts)가 대신한다.
 */
export const STAR_PALACE_FACTS: StarPalaceFactTable = {
  명궁: MYEONGGUNG_FACTS,
  재백궁: JAEBAEKGUNG_FACTS,
  관록궁: GWALLOKGUNG_FACTS,
  질액궁: JILAEKGUNG_FACTS,
};
