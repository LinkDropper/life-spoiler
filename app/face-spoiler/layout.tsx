import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

import "./face-spoiler.css";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("faceSpoiler.metadata");

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
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: "website",
    },
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
