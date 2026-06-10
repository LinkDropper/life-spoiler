import type { StarInPalaceTable } from "../types";

import { BOKDEOKGUNG_STARS } from "./bokdeokgung";
import { BUCHEOGUNG_STARS } from "./bucheogung";
import { BUMOGUNG_STARS } from "./bumogung";
import { CHEONIGUNG_STARS } from "./cheonigung";
import { GWALLOKGUNG_STARS } from "./gwallokgung";
import { GYOWOOGUNG_STARS } from "./gyowoogung";
import { HYEONGJEGUNG_STARS } from "./hyeongjegung";
import { JAEBAEKGUNG_STARS } from "./jaebaekgung";
import { JANYEOGUNG_STARS } from "./janyeogung";
import { JEONTAEKGUNG_STARS } from "./jeontaekgung";
import { JILAEKGUNG_STARS } from "./jilaekgung";
import { MYEONGGUNG_STARS } from "./myeonggung";

/**
 * 별×궁 전체 매트릭스 (12궁 × 14주성).
 * 같은 별이라도 어느 궁에 있느냐에 따라 다른 해석을 갖는다.
 */
export const STAR_IN_PALACE: StarInPalaceTable = {
  명궁: MYEONGGUNG_STARS,
  형제궁: HYEONGJEGUNG_STARS,
  부처궁: BUCHEOGUNG_STARS,
  자녀궁: JANYEOGUNG_STARS,
  재백궁: JAEBAEKGUNG_STARS,
  질액궁: JILAEKGUNG_STARS,
  천이궁: CHEONIGUNG_STARS,
  교우궁: GYOWOOGUNG_STARS,
  관록궁: GWALLOKGUNG_STARS,
  전택궁: JEONTAEKGUNG_STARS,
  복덕궁: BOKDEOKGUNG_STARS,
  부모궁: BUMOGUNG_STARS,
};
