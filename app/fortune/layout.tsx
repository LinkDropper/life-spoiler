import type { Metadata } from "next";

import { NOINDEX_METADATA } from "@/libs/seo/metadata";

/** 개인 운세 결과·미리보기·공유 페이지(이름 등 개인 정보 포함)라 검색·AI 답변 색인에서 제외한다. */
export const metadata: Metadata = NOINDEX_METADATA;

export default function FortuneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
