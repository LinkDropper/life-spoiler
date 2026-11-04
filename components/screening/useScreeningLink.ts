"use client";

import { isPlainLeftClick } from "@/libs/screening/screening-policy";

import { useScreening } from "./ScreeningProvider";

import type { MouseEvent } from "react";
import type { ScreeningEntry } from "@/libs/screening/screening-policy";

/**
 * Link의 onClick에 걸어 쓰는 상영 전환. 실제 a href는 그대로 두고(새 탭·우클릭·SEO 유지),
 * 수정 키 없는 왼쪽 클릭만 가로채 연출과 함께 이동한다.
 */
export const useScreeningLink = () => {
  const { startScreening } = useScreening();

  return (
    event: MouseEvent<HTMLAnchorElement>,
    options: { href: string; title: string; entry: ScreeningEntry }
  ) => {
    if (!isPlainLeftClick(event)) {
      return;
    }
    event.preventDefault();
    startScreening({ ...options, trigger: event.currentTarget });
  };
};
