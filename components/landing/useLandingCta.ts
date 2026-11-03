"use client";

import { useRouter } from "next/navigation";

import { trackLandingEvent } from "@/libs/analytics";
import type { LandingCtaPosition } from "@/libs/analytics";
import { useAuthStatus, useUser } from "@/libs/stores/user";

/**
 * 랜딩의 모든 CTA가 공유하는 이동 규칙.
 * 비로그인은 `/login`, 로그인 상태는 운세를 고르는 `/home`으로 보낸다.
 */
export const useLandingCta = (position: LandingCtaPosition) => {
  const router = useRouter();
  const user = useUser();
  const authStatus = useAuthStatus();

  const isAuthenticated = authStatus === "authenticated" && Boolean(user);

  const handleCtaClick = () => {
    trackLandingEvent("landing_cta_click", {
      position,
      authenticated: isAuthenticated,
    });
    router.push(isAuthenticated ? "/home" : "/login");
  };

  return { isAuthenticated, handleCtaClick };
};
