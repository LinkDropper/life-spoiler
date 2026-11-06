import type { StarCareerTable } from "./types";

import { lt } from "./builders";

/**
 * 주성별 직업 분야 후보 (14행, 전통 매핑).
 *
 * 전제 (삼합파)
 * - 관록궁(+ 재백궁·명궁) 주성 기준의 "경향" 후보이며 직업 단정이 아니다.
 *   LLM은 이 fields 안에서만 분야명을 고른다.
 * - 보좌·살성, 밝기, 사화에 따라 강약이 갈리지만 이 표는 주성 단독 기준이다.
 * - 유파 이견: 염정(공직·법 vs 연예), 태음(부동산·예술 vs 야간·온라인),
 *   천동(복지·서비스 vs 예술) 등은 문헌마다 분야가 조금씩 달라 교집합만 채택했다.
 */
export const STAR_CAREER: StarCareerTable = {
  자미: {
    fields: ["경영·관리", "공공기관", "기획 총괄", "컨설팅", "조직 운영"],
    how: "전체를 내려다보고 사람을 배치하며 책임지는 자리에서 힘이 나요",
    evidence: lt(
      "사람과 일을 총괄하는 자리에 어울리는 기운이에요",
      "Suited to roles that oversee people and projects as a whole.",
      "人と仕事を統括する立場が似合う気質です。"
    ),
  },
  천기: {
    fields: ["기획", "데이터 분석", "IT 개발", "연구", "교육 설계"],
    how: "정보를 모아 구조를 짜고 개선안을 내는 데 머리가 빨리 돌아가요",
    evidence: lt(
      "분석하고 설계하는 일에 쓰이는 기운이에요",
      "Suited to analyzing and designing things.",
      "分析して設計する仕事に向く気質です。"
    ),
  },
  태양: {
    fields: ["공공·행정", "방송·홍보", "교육", "사회 활동", "대외 업무"],
    how: "사람들 앞에 나서서 알리고 베푸는 역할에서 보람을 얻어요",
    evidence: lt(
      "앞에 나서서 알리고 베푸는 일에 어울리는 기운이에요",
      "Suited to work that is public-facing and generous.",
      "前に出て伝え、与える仕事に合う気質です。"
    ),
  },
  무곡: {
    fields: ["금융", "회계·재무", "제조·기계", "보안·안전", "자산 관리"],
    how: "숫자와 실물을 단단하게 다루며 약속한 결과를 책임져요",
    evidence: lt(
      "돈과 실물을 단단하게 다루는 일에 어울리는 기운이에요",
      "Suited to work that handles money and hard assets firmly.",
      "お金や実物を堅実に扱う仕事に合う気質です。"
    ),
  },
  천동: {
    fields: ["서비스", "복지·상담", "외식·숙박", "돌봄", "생활 디자인"],
    how: "사람을 편하게 해 주고 분위기를 부드럽게 만드는 데 강해요",
    evidence: lt(
      "사람을 편안하게 하는 일에 어울리는 기운이에요",
      "Suited to work that puts people at ease.",
      "人を安らがせる仕事に合う気質です。"
    ),
  },
  염정: {
    fields: ["법무·감사", "인사", "홍보·브랜딩", "엔터테인먼트", "공직"],
    how: "규정과 사람 사이를 조율하거나 이미지를 만드는 일에서 존재감이 커져요",
    evidence: lt(
      "원칙과 이미지를 다루는 일에 어울리는 기운이에요",
      "Suited to work involving rules, people, and public image.",
      "ルールとイメージを扱う仕事に合う気質です。"
    ),
  },
  천부: {
    fields: ["은행·재무 관리", "총무·운영", "공무", "부동산", "유통"],
    how: "곳간을 지키고 안정적으로 굴리는 운영 자리에서 신뢰를 받아요",
    evidence: lt(
      "안정적으로 지키고 운영하는 일에 어울리는 기운이에요",
      "Suited to work that safeguards and runs things steadily.",
      "安定して守り、運営する仕事に合う気質です。"
    ),
  },
  태음: {
    fields: ["부동산", "디자인·인테리어", "예술", "온라인 콘텐츠", "섬유·뷰티"],
    how: "차분하게 감각을 쌓아 공간과 결과물을 다듬는 일에 강해요",
    evidence: lt(
      "섬세한 감각으로 다듬는 일에 어울리는 기운이에요",
      "Suited to work refined through delicate sensibility.",
      "繊細な感覚で仕上げる仕事に合う気質です。"
    ),
  },
  탐랑: {
    fields: ["영업·마케팅", "엔터테인먼트", "외식", "뷰티", "이벤트 기획"],
    how: "사람의 욕구를 읽고 매력으로 끌어당기는 일에서 빛나요",
    evidence: lt(
      "사람을 끌어당기는 매력을 쓰는 일에 어울리는 기운이에요",
      "Suited to work that uses personal charm to attract people.",
      "人を惹きつける魅力を活かす仕事に合う気質です。"
    ),
  },
  거문: {
    fields: ["언어·법률", "교육·강의", "통역·번역", "방송·상담", "평론"],
    how: "말과 글로 따지고 설명하고 설득하는 일에 재능이 있어요",
    evidence: lt(
      "말과 글로 설명하고 설득하는 일에 어울리는 기운이에요",
      "Suited to work that explains and persuades through words.",
      "言葉と文章で説明し説得する仕事に合う気質です。"
    ),
  },
  천상: {
    fields: ["비서·행정", "인사·총무", "조정·중재", "회계 보조", "공공 서비스"],
    how: "여러 사람 사이에서 서류와 일정을 맞추고 균형을 잡아 줘요",
    evidence: lt(
      "사람 사이를 맞추고 돕는 일에 어울리는 기운이에요",
      "Suited to work that coordinates and supports others.",
      "人の間を調整して支える仕事に合う気質です。"
    ),
  },
  천량: {
    fields: ["감사·법률", "의료·보건", "교육·멘토링", "공공·복지", "자문"],
    how: "원칙을 지키며 어려운 사람을 돕고 조언하는 자리에서 신뢰를 얻어요",
    evidence: lt(
      "원칙을 지키며 조언하고 돕는 일에 어울리는 기운이에요",
      "Suited to work that advises and helps while upholding principles.",
      "原則を守りつつ助言し支える仕事に合う気質です。"
    ),
  },
  칠살: {
    fields: ["군·경·소방", "영업 개척", "제조·건설", "스포츠", "창업"],
    how: "위험이 크고 속도가 필요한 현장에서 앞장서는 역할에 강해요",
    evidence: lt(
      "현장에서 앞장서 돌파하는 일에 어울리는 기운이에요",
      "Suited to front-line work that breaks through obstacles.",
      "現場で先頭に立って突破する仕事に合う気質です。"
    ),
  },
  파군: {
    fields: ["창업", "신사업 개발", "리모델링·개편", "무역", "구조 개선"],
    how: "낡은 것을 허물고 새 틀을 시도하는 일에서 에너지가 나요",
    evidence: lt(
      "낡은 것을 바꾸고 새로 시도하는 일에 어울리는 기운이에요",
      "Suited to work that breaks old patterns and starts anew.",
      "古いものを変え、新しく挑む仕事に合う気質です。"
    ),
  },
};
