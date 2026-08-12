import type { Metadata } from "next";

import { generateYearlyShareMetadata } from "@/libs/fortune/yearly-share-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ profileId: string }>;
}): Promise<Metadata> {
  const { profileId } = await params;
  return generateYearlyShareMetadata("yearly", profileId);
}

export default function YearlyShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
