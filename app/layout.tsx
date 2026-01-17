import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { ProfileProvider } from "@/libs/stores/profile";
import { UserProvider } from "@/libs/stores/user";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: t("title", {
      default: "인생스포 - 당신의 인생 시나리오를 미리 확인하세요",
    }),
    description: t("description", {
      default:
        "사주보다 더 정밀한 자미두수. 114개 별이 그리는 당신만의 운명 지도를 확인하세요.",
    }),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <UserProvider>
            <ProfileProvider>{children}</ProfileProvider>
          </UserProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
