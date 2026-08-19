"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";

import type { GuestFormValues } from "@/components/universe";
import type { GuestSubmitResultDto } from "@/libs/universe/types";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

interface UseGuestSubmitResult {
  isSubmitting: boolean;
  submitError: string | null;
  result: GuestSubmitResultDto | null;
  submit: (values: GuestFormValues) => Promise<GuestSubmitResultDto | null>;
}

export const useGuestSubmit = (publicId: string): UseGuestSubmitResult => {
  const t = useTranslations("universe.errors");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<GuestSubmitResultDto | null>(null);

  const submit = useCallback(
    async (values: GuestFormValues) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/universe/${publicId}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            birthDate: values.birthDate,
            birthTime: values.birthTimeUnknown ? undefined : values.birthTime,
            birthTimeUnknown: values.birthTimeUnknown,
            calendarType: values.calendarType,
            isLeapMonth: values.isLeapMonth,
          }),
        });

        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => ({}))) as ApiErrorBody;
          // 서버가 내려준 한국어 메시지를 그대로 보여준다(검증/rate limit/하드캡 등)
          setSubmitError(body.error?.message ?? t("unknown"));
          return null;
        }

        const submitted = (await response.json()) as GuestSubmitResultDto;
        setResult(submitted);
        return submitted;
      } catch {
        setSubmitError(t("network"));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [publicId, t]
  );

  return { isSubmitting, submitError, result, submit };
};
