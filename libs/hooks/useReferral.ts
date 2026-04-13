"use client";

import { useCallback } from "react";

const STORAGE_KEY = "referrer_user_id";

interface ReferralData {
  referrerUserId: string;
}

export const useReferral = () => {
  const saveReferrer = useCallback((userId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, userId);
    } catch (e) {
      console.error("Failed to save referrer to localStorage:", e);
    }
  }, []);

  const getReferrer = useCallback((): ReferralData | null => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return null;
      return { referrerUserId: value };
    } catch (e) {
      console.error("Failed to read referrer from localStorage:", e);
      return null;
    }
  }, []);

  const clearReferrer = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear referrer from localStorage:", e);
    }
  }, []);

  const claimReferralReward = useCallback(async () => {
    const referral = getReferrer();
    if (!referral) return;

    try {
      const response = await fetch("/api/referral/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referrerUserId: referral.referrerUserId,
        }),
      });

      if (response.ok) {
        clearReferrer();
      } else {
        console.error(
          "Failed to claim referral reward:",
          response.status,
          response.statusText
        );
      }
    } catch (e) {
      console.error("Failed to claim referral reward:", e);
    }
  }, [getReferrer, clearReferrer]);

  return {
    saveReferrer,
    getReferrer,
    clearReferrer,
    claimReferralReward,
  };
};
