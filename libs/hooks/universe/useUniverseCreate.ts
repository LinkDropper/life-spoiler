"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { UniverseCreateResultDto } from "@/libs/universe/types";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export interface UniverseCreateValues {
  ownerName: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
  gender: "male" | "female";
}

interface UseUniverseCreateResult {
  isSubmitting: boolean;
  submitError: string | null;
  create: (values: UniverseCreateValues) => Promise<void>;
}

export const useUniverseCreate = (): UseUniverseCreateResult => {
  const router = useRouter();
  const t = useTranslations("universe.errors");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const create = useCallback(
    async (values: UniverseCreateValues) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch("/api/universe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerName: values.ownerName.trim() || undefined,
            birthDate: values.birthDate,
            birthTime: values.birthTimeUnknown ? undefined : values.birthTime,
            birthTimeUnknown: values.birthTimeUnknown,
            calendarType: values.calendarType,
            isLeapMonth: values.isLeapMonth,
            gender: values.gender,
          }),
        });

        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => ({}))) as ApiErrorBody;
          setSubmitError(body.error?.message ?? t("unknown"));
          return;
        }

        const { publicId } = (await response.json()) as UniverseCreateResultDto;
        router.push(`/universe/${publicId}`);
      } catch {
        setSubmitError(t("network"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, t]
  );

  return { isSubmitting, submitError, create };
};
