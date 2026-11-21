import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { DailyShareCard, DailySharedActions } from "@/components/daily";
import { HeaderClient } from "@/components/landing";
import { isDailyError } from "@/libs/daily/errors";
import { resolveKstDate } from "@/libs/daily/kst-date";
import { getSharedDailyCard } from "@/libs/daily/service";
import type { SharedDailyCard } from "@/libs/daily/service";
import { logger } from "@/libs/logger";
import { NOINDEX_METADATA } from "@/libs/seo/metadata";

import styles from "./page.module.css";

interface DailySharePageProps {
  searchParams: Promise<{ t?: string | string[]; ref?: string | string[] }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toSingle = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export const generateMetadata = async ({
  searchParams,
}: DailySharePageProps): Promise<Metadata> => {
  const t = await getTranslations("daily.share");
  const { t: tokenParam } = await searchParams;
  const token = toSingle(tokenParam);
  const title = t("ogTitle");

  // 유효하지 않은 토큰이면 OG 이미지 없이 기본 noindex 메타만 낸다 (페이지는 /daily로 리다이렉트된다)
  try {
    const card = getSharedDailyCard(token, resolveKstDate());
    const imageUrl = `/daily/share/og?t=${encodeURIComponent(token ?? "")}`;

    return {
      ...NOINDEX_METADATA,
      title,
      description: card.headline,
      openGraph: {
        type: "website",
        title,
        description: card.headline,
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: card.headline,
        images: [imageUrl],
      },
    };
  } catch {
    return { ...NOINDEX_METADATA, title };
  }
};

/**
 * `/daily/share?t=` — 공유 수신자 화면 (noindex, 로그인 불필요).
 *
 * 토큰은 서명 없이 화이트리스트로만 검증한다. 화면에는 사전 조회 결과만 렌더하며
 * 쿼리 값을 그대로 출력하는 경로는 없다. 검증 실패 시 `/daily`로 보낸다.
 */
export default async function DailySharePage({
  searchParams,
}: DailySharePageProps) {
  const t = await getTranslations("daily.share");
  const locale = await getLocale();
  const { t: tokenParam, ref: refParam } = await searchParams;
  const ref = toSingle(refParam);

  let card: SharedDailyCard;

  try {
    card = getSharedDailyCard(toSingle(tokenParam), resolveKstDate());
  } catch (error) {
    if (isDailyError(error) && error.code === "INVALID_SHARE_TOKEN") {
      redirect("/daily");
    }

    if (!isDailyError(error)) {
      logger.error(
        "[daily] 공유 카드 처리 중 오류",
        error instanceof Error ? error : new Error(String(error))
      );
    }

    return (
      <div className={styles.page}>
        <HeaderClient />
        <main className={styles.main}>
          <div className={styles.errorBox} role="alert">
            <p className={styles.errorTitle}>{t("unavailableTitle")}</p>
            <p className={styles.errorBody}>{t("unavailableBody")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <HeaderClient />
      <main className={styles.main}>
        <DailyShareCard
          date={card.date}
          headline={card.headline}
          color={card.color}
          colorSlug={card.colorSlug}
          item={card.item}
          number={card.number}
          timeSlot={card.timeSlot}
        />
        <DailySharedActions
          referrerUserId={ref && UUID_REGEX.test(ref) ? ref : null}
        />
        {locale !== "ko" && (
          <p className={styles.disclaimer}>{t("koOnlyNotice")}</p>
        )}
        <p className={styles.disclaimer}>{t("disclaimer")}</p>
      </main>
    </div>
  );
}
