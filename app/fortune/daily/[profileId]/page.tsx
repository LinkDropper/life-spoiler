import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DailyErrorState, DailyFortuneScreen } from "@/components/daily";
import { isDailyError } from "@/libs/daily/errors";
import { resolveKstDate } from "@/libs/daily/kst-date";
import { loadOwnedDailyProfile } from "@/libs/daily/profile-access";
import { getDailyFortuneView } from "@/libs/daily/service";
import type { DailyFortuneView } from "@/libs/daily/types";
import { logger } from "@/libs/logger";

import type { OwnedDailyProfile } from "@/libs/daily/profile-access";

interface DailyFortunePageProps {
  params: Promise<{ profileId: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
}

// 개인 결과라 요청마다 서버에서 계산한다 (KST 자정 이후 새 날짜 반영)
export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("daily.result");
  return { title: t("pageTitle") };
};

const toSingle = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

/**
 * `/fortune/daily/[profileId]` — 오늘의 운세 결과 (서버 컴포넌트).
 *
 * noindex는 `app/fortune/layout.tsx`가 담당한다. 본인 소유 프로필만 허용하며,
 * 타인/없는 프로필은 404로 처리하고 다른 프로필이나 기본값으로 대체하지 않는다.
 * 명반·입력값은 로그에 남기지 않는다.
 */
export default async function DailyFortunePage({
  params,
  searchParams,
}: DailyFortunePageProps) {
  const { profileId } = await params;
  const { date: dateParam } = await searchParams;

  let profile: OwnedDailyProfile;
  let view: DailyFortuneView;
  let override: string | null;

  try {
    override = toSingle(dateParam);
    profile = await loadOwnedDailyProfile(profileId);
    const kstDate = resolveKstDate({ override });
    view = getDailyFortuneView({
      input: profile.input,
      kstDate,
      hasLifetime: profile.hasLifetime,
    });
  } catch (error) {
    if (isDailyError(error)) {
      if (error.code === "UNAUTHORIZED") {
        redirect("/login");
      }
      if (error.code === "PROFILE_NOT_FOUND" || error.code === "FORBIDDEN") {
        notFound();
      }
      return <DailyErrorState />;
    }

    logger.error(
      "[daily] 결과 페이지 처리 중 오류",
      error instanceof Error ? error : new Error(String(error))
    );
    return <DailyErrorState />;
  }

  return (
    <DailyFortuneScreen
      profileId={profileId}
      name={profile.name}
      initialView={view}
      canChangeProfile={profile.profileCount > 1}
      isDateFixed={override !== null && process.env.NODE_ENV !== "production"}
    />
  );
}
