// ============================================================
// 동물상 색상 / 아이콘 메타데이터.
//
// Figma 디자인 (node 746-915) 의 12종 동물상 컬러칩과 아이콘을 코드로 옮긴 것.
// 동물상 카드(나의 동물상 특징) 의 도넛 차트 색상과 아이콘 매핑에 사용한다.
// AnimalShortName 화이트리스트는 preview-parser.ts 와 일치해야 한다.
// ============================================================

import type { AnimalShortName } from "./preview-parser";

export interface AnimalMeta {
  /** Figma 컬러칩 — 도넛 차트 색상 (브랜드 톤). */
  color: string;
  /** /public 기준 아이콘 경로 (40x40 viewport, 흰색 채움). */
  iconSrc: string;
  /** 영문 슬러그 — alt / 이미지 키. */
  slug: string;
}

export const ANIMAL_META: Record<AnimalShortName, AnimalMeta> = {
  강아지상: {
    color: "#948F59",
    iconSrc: "/images/face-spoiler/animals/dog.svg",
    slug: "dog",
  },
  고양이상: {
    color: "#577D76",
    iconSrc: "/images/face-spoiler/animals/cat.svg",
    slug: "cat",
  },
  여우상: {
    color: "#DFAF57",
    iconSrc: "/images/face-spoiler/animals/fox.svg",
    slug: "fox",
  },
  사슴상: {
    color: "#94805B",
    iconSrc: "/images/face-spoiler/animals/deer.svg",
    slug: "deer",
  },
  곰상: {
    color: "#623E14",
    iconSrc: "/images/face-spoiler/animals/bear.svg",
    slug: "bear",
  },
  토끼상: {
    color: "#A1728F",
    iconSrc: "/images/face-spoiler/animals/rabbit.svg",
    slug: "rabbit",
  },
  늑대상: {
    color: "#49445F",
    iconSrc: "/images/face-spoiler/animals/wolf.svg",
    slug: "wolf",
  },
  공룡상: {
    color: "#146226",
    iconSrc: "/images/face-spoiler/animals/dinosaur.svg",
    slug: "dinosaur",
  },
  판다상: {
    color: "#35302A",
    iconSrc: "/images/face-spoiler/animals/panda.svg",
    slug: "panda",
  },
  호랑이상: {
    color: "#C5771C",
    iconSrc: "/images/face-spoiler/animals/tiger.svg",
    slug: "tiger",
  },
  독수리상: {
    color: "#20717F",
    iconSrc: "/images/face-spoiler/animals/eagle.svg",
    slug: "eagle",
  },
  너구리상: {
    color: "#593868",
    iconSrc: "/images/face-spoiler/animals/raccoon.svg",
    slug: "raccoon",
  },
};
