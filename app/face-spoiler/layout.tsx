import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

import { getSeoLocale } from "@/libs/seo/metadata";
import { OPEN_GRAPH_LOCALE, buildLocalizedUrl } from "@/libs/seo/site";

import "./face-spoiler.css";

const OG_IMAGE = "/images/face-spoiler-open-graph.png";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("faceSpoiler.metadata");
  const locale = await getSeoLocale();

  const title = t("title", {
    default: "관상스포 — 사진 한 장으로 보는 나의 관상 리포트",
  });
  const description = t("description", {
    default:
      "사진 한 장으로 1분 만에 받아보는 AI 관상 리포트. 990원으로 5,000자 이상의 디테일 리포트를 확인해보세요.",
  });
  const ogTitle = t("ogTitle", { default: "관상스포" });
  const ogDescription = t("ogDescription", {
    default:
      "사진 한 장으로 1분 만에 받아보는 관상 리포트. 지금 바로 확인해보세요.",
  });

  return {
    title,
    description,
    keywords: [
      "관상",
      "관상스포",
      "AI 관상",
      "관상 분석",
      "얼굴 분석",
      "동물상",
      "동물상 테스트",
      "인상",
      "face reading",
      "face spoiler",
      "physiognomy",
    ],
    authors: [{ name: "관상스포" }],
    creator: "관상스포",
    publisher: "관상스포",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
      locale: OPEN_GRAPH_LOCALE[locale],
      url: buildLocalizedUrl("/face-spoiler", locale),
      siteName: "관상스포",
      images: [
        {
          url: OG_IMAGE,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
    },
    // canonical은 하위 페이지로 상속되지 않도록 각 page.tsx에서 지정한다.
  };
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface FaceSpoilerLayoutProps {
  children: React.ReactNode;
}

export default function FaceSpoilerLayout({
  children,
}: FaceSpoilerLayoutProps) {
  return <div className="faceSpoilerRoot">{children}</div>;
}
