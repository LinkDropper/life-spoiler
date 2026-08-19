import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { getUniverseDetail } from "@/libs/universe/service";
import { getOpenGraphImage } from "@/libs/utils/og";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

/**
 * `/universe/{publicId}` 오픈그래프.
 *
 * 이 링크는 owner가 카카오톡/인스타그램으로 직접 공유하는 바이럴 루프의 핵심
 * 진입점이라(PRD 목표 2), 미리보기 카드가 "무슨 서비스인지" 바로 읽혀야 한다.
 * `page.tsx`가 "use client"라 메타데이터를 여기(서버 컴포넌트 layout)에서
 * 담당한다 — `app/compatibility/[id]/fortune/share/layout.tsx`와 같은 패턴.
 *
 * 개인정보 B안(이름만 공개)을 그대로 따른다 — ownerName/guestCount만 쓰고
 * 생년월일시는 애초에 `getUniverseDetail`의 응답에 없어서 노출할 방법이 없다.
 * 잘못된 publicId·조회 실패는 조용히 사이트 기본 메타데이터로 폴백한다
 * (에러를 던지면 메타데이터 생성 자체가 실패해 페이지 렌더링에 영향을 줄 수 있다).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const locale = await getLocale();
  const ogImage = getOpenGraphImage(locale);
  const t = await getTranslations("universe.detail");
  const tMeta = await getTranslations("metadata");

  let ownerName: string | null = null;
  let guestCount: number | null = null;

  try {
    const detail = await getUniverseDetail(publicId);
    ({ ownerName } = detail.ownerSummary);
    ({ guestCount } = detail);
  } catch {
    // 잘못된 링크·조회 실패 시 사이트 기본 메타데이터로 폴백한다
  }

  const ogTitle = ownerName
    ? t("ogTitleWithName", { name: ownerName })
    : guestCount !== null
      ? t("ogTitle")
      : tMeta("title");

  const ogDescription =
    guestCount !== null
      ? t("ogDescription", { count: guestCount })
      : tMeta("description");

  const pageUrl = `${SITE_URL}/universe/${publicId}`;

  return {
    title: ogTitle,
    description: ogDescription,
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : locale === "ja" ? "ja_JP" : "en_US",
      url: pageUrl,
      siteName: "인생스포",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 600,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default function UniverseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
