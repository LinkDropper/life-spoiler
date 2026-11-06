"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmSheet, Sheet, SheetButton } from "@/components/common/sheet";
import { HeaderClient } from "@/components/landing";
import { RosterCard } from "@/components/profile";
import { trackDailyEvent } from "@/libs/analytics";
import { pickOwnProfile } from "@/libs/home/home-profile";
import { toRosterFortuneType, toRosterItem } from "@/libs/profile/cast-roster";
import { formatProfileLine } from "@/libs/profile/format-profile";
import {
  useIsProfilesLoaded,
  useIsProfilesLoading,
  useProfileActions,
  useProfiles,
} from "@/libs/stores/profile";
import { useAuthStatus, useUser } from "@/libs/stores/user";

import { useProfileDelete } from "./hooks";
import styles from "./page.module.css";

// 임시: 특정 유저는 프로필 추가/삭제 버튼 숨김
const RESTRICTED_USER_ID = "97f9d7a9-23f2-4fd8-98cf-ac52aa4fe059";

/**
 * 프로필 목록 = 출연진 명단 (2026-11-06).
 * 운세가 정해져 들어오면(?type=) 배우를 누르면 그 운세로 바로(소장 = 본편, 아니면 예고편),
 * 운세 없이 들어오면 그 배우의 홈 상영관으로. 삭제는 카드의 ⋯ 안에.
 */
export default function ProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const user = useUser();
  const t = useTranslations("profiles");
  const tRoster = useTranslations("profiles.roster");
  const tCard = useTranslations("profiles.card");
  const tDelete = useTranslations("profiles.deleteModal");

  // 임시: 특정 유저는 프로필 추가/삭제 버튼 숨김
  const isRestrictedUser = user?.id === RESTRICTED_USER_ID;
  const fortuneType = toRosterFortuneType(searchParams.get("type"));

  const profiles = useProfiles();
  const isProfilesLoading = useIsProfilesLoading();
  const isProfilesLoaded = useIsProfilesLoaded();
  const { fetchProfiles } = useProfileActions();

  const {
    deleteTargetId,
    isDeleting,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
  } = useProfileDelete();
  const [manageId, setManageId] = useState<string | null>(null);
  // 삭제 실패는 열려 있는 확인 시트 안에 남긴다(시트 뒤 알림은 놓치기 쉽다)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null
  );

  const items = useMemo(() => {
    const ownId = pickOwnProfile(profiles)?.id ?? null;
    return profiles.map((profile) => toRosterItem(profile, fortuneType, ownId));
  }, [profiles, fortuneType]);
  const managed = items.find((item) => item.id === manageId);
  const deleteTargetName = items.find(
    (item) => item.id === deleteTargetId
  )?.name;

  // 페이지 접근 시 프로필 정보를 다시 가져옴
  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfiles(true);
    }
  }, [authStatus, fetchProfiles]);

  // 오늘의 운세: 프로필이 1개뿐이면 고르는 화면을 건너뛰고 바로 결과로
  const singleProfileId =
    fortuneType === "daily" && isProfilesLoaded && profiles.length === 1
      ? profiles[0].id
      : null;

  useEffect(() => {
    if (authStatus === "authenticated" && singleProfileId) {
      router.replace(`/fortune/daily/${singleProfileId}`);
    }
  }, [authStatus, singleProfileId, router]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  const newProfileHref = fortuneType
    ? `/profile/setup?type=${fortuneType}`
    : "/profile/setup";

  const handleDeleteFromSheet = useCallback(() => {
    if (!manageId) return;
    setManageId(null);
    setDeleteErrorMessage(null);
    handleDeleteClick(manageId);
  }, [manageId, handleDeleteClick]);

  const onDeleteConfirm = useCallback(async () => {
    setDeleteErrorMessage(null);
    const success = await handleDeleteConfirm();
    if (!success) {
      setDeleteErrorMessage(t("deleteError"));
    }
  }, [handleDeleteConfirm, t]);

  const toProfileLine = (profile: (typeof profiles)[number]) =>
    formatProfileLine(profile, {
      solar: tCard("solar"),
      lunar: tCard("lunar"),
      male: tCard("male"),
      female: tCard("female"),
      timeUnknown: tCard("timeUnknown"),
    });

  const isPending =
    authStatus === "loading" ||
    authStatus === "unauthenticated" ||
    isProfilesLoading ||
    Boolean(singleProfileId);

  return (
    <div className={styles.page}>
      <HeaderClient />

      <main className={styles.main}>
        <header className={styles.head}>
          <span className={styles.kicker}>
            {fortuneType
              ? `CAST LIST · ${tRoster(`kicker.${fortuneType}`)}`
              : "CAST LIST"}
          </span>
          <h1 className={styles.title}>
            {fortuneType
              ? tRoster(`title.${fortuneType}`)
              : tRoster("title.plain")}
          </h1>
          <p className={styles.desc}>
            {fortuneType ? tRoster("descTyped") : tRoster("descPlain")}
          </p>
        </header>

        {isPending ? (
          <p className={styles.status} role="status">
            {t("loading")}
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((item, index) => (
              <li key={item.id}>
                <RosterCard
                  item={item}
                  profileLine={toProfileLine(profiles[index])}
                  onMore={
                    isRestrictedUser ? undefined : () => setManageId(item.id)
                  }
                  onOpen={
                    item.state === "daily"
                      ? () => trackDailyEvent("daily_profile_select")
                      : undefined
                  }
                />
              </li>
            ))}
            {!isRestrictedUser && (
              <li>
                <Link href={newProfileHref} className={styles.newActor}>
                  <span className={styles.newIcon} aria-hidden="true">
                    <Plus size={24} />
                  </span>
                  <span className={styles.newText}>
                    <b>{tRoster("newTitle")}</b>
                    <span>{tRoster("newDesc")}</span>
                  </span>
                </Link>
              </li>
            )}
          </ul>
        )}
      </main>

      <Sheet
        isOpen={Boolean(managed)}
        onClose={() => setManageId(null)}
        eyebrow="MANAGE"
        title={managed?.name ?? ""}
      >
        <p className={styles.manageNote}>{tRoster("deleteSub")}</p>
        <SheetButton variant="ghost" onClick={handleDeleteFromSheet}>
          {tRoster("delete")}
        </SheetButton>
      </Sheet>

      <ConfirmSheet
        isOpen={deleteTargetId !== null}
        onClose={handleDeleteCancel}
        onConfirm={onDeleteConfirm}
        eyebrow="DELETE"
        title={tDelete("title")}
        description={tDelete("description")}
        targetLabel={tDelete("target")}
        targetValue={deleteTargetName}
        cancelLabel={tDelete("cancel")}
        confirmLabel={tDelete("delete")}
        busyLabel={tDelete("deleting")}
        isBusy={isDeleting}
        errorMessage={deleteErrorMessage}
      />
    </div>
  );
}
