import type { Metadata } from "next";

import { generateYearlyShareMetadata } from "@/libs/fortune/yearly-share-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  return generateYearlyShareMetadata("yearly_2027", profileId);
}

export default function Yearly2027ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
