import type { DailyCategory } from "@/libs/zi-wei-dou-shu/constants/daily-fortune-table";

interface CategoryIconProps {
  category: DailyCategory;
  className?: string;
}

const PATHS: Record<DailyCategory, string> = {
  overall:
    "M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8L12 3z",
  love: "M12 20s-7-4.4-7-9.6A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.4C19 15.6 12 20 12 20z",
  money:
    "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3v1.2m0 7.6V17m-2.4-5.6c0-1 1-1.6 2.4-1.6s2.4.6 2.4 1.6-1 1.4-2.4 1.6c-1.4.2-2.4.6-2.4 1.6s1 1.6 2.4 1.6 2.4-.6 2.4-1.6",
  work: "M4 8h16v10H4V8zm5 0V6h6v2M4 13h16",
  health: "M3 12h4l2-5 4 10 2-5h6",
};

/** 카테고리 장식 아이콘. 의미는 옆의 라벨 텍스트가 전달하므로 스크린리더에서는 숨긴다 */
export const CategoryIcon = ({ category, className }: CategoryIconProps) => (
  <svg
    className={className}
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={PATHS[category]} />
  </svg>
);
