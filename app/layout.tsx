import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "인생스포 - 당신의 인생 시나리오를 미리 확인하세요",
  description:
    "사주보다 더 정밀한 자미두수. 114개 별이 그리는 당신만의 운명 지도를 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
