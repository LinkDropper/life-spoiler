"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { HeaderClient } from "@/components/landing";
import {
  getFortuneHref,
  getProfileSetupHref,
  isFortuneRouteType,
} from "@/libs/fortune/navigation";
import {
  useIsProfilesLoaded,
  useProfileActions,
  useSelectedProfile,
} from "@/libs/stores/profile";
import { useAuthStatus } from "@/libs/stores/user";

import styles from "./page.module.css";

/**
 * 프로필 선택은 홈의 프로필 셀렉트로 옮겼다. 이 경로는 곳곳에 남은
 * `/profiles?type=...` 진입점(메뉴, 오늘의 운세 CTA, 친구 별자리 홍보 등)을
 * 홈에서 고른 프로필의 운세로 바로 보내는 연결 지점으로만 남는다.
 * - 프로필이 있으면 → 선택된 프로필의 본편/예고편
 * - 프로필이 없으면 → 그 운세 이름이 붙은 프로필 입력
 * - 운세 종류가 없으면 → 홈
 */
export default function ProfilesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAuthStatus();
  const t = useTranslations("profiles");

  const typeParam = searchParams.get("type");
  const fortuneType = isFortuneRouteType(typeParam) ? typeParam : null;

  const isProfilesLoaded = useIsProfilesLoaded();
  const selectedProfile = useSelectedProfile();
  const { fetchProfiles } = useProfileActions();

  // 결제 직후 등 다른 화면에서 넘어오면 결제 여부가 바뀌었을 수 있어 새로 받는다.
  // 이전에 로드된 목록으로 먼저 이동하지 않도록, 새로 받은 뒤에만 이동한다
  const [hasRefetched, setHasRefetched] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetchProfiles(true).then(() => setHasRefetched(true));
  }, [authStatus, fetchProfiles]);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (!hasRefetched || !isProfilesLoaded) return;

    if (!fortuneType) {
      router.replace("/home");
      return;
    }

    router.replace(
      selectedProfile
        ? getFortuneHref(selectedProfile, fortuneType)
        : getProfileSetupHref(fortuneType)
    );
  }, [
    authStatus,
    hasRefetched,
    isProfilesLoaded,
    fortuneType,
    selectedProfile,
    router,
  ]);

  return (
    <div className={styles.page}>
      <HeaderClient />
      <div className={styles.loading} role="status">
        {t("loading", { default: "로딩 중..." })}
      </div>
    </div>
  );
}
