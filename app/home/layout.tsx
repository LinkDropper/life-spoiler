import type { Metadata } from "next";

import { NOINDEX_METADATA } from "@/libs/seo/metadata";

/** 로그인 사용자 전용 홈이라 검색·AI 답변 색인에서 제외한다. */
export const metadata: Metadata = NOINDEX_METADATA;

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
