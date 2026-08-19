import { z } from "zod/v4";

const BIRTH_DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const BIRTH_TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** 이름 1~20자 (DB CHECK 및 ZiweiInputSchema.name과 동일한 상한) */
const NameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length >= 1 && value.length <= 20, {
    message: "이름은 1~20자로 입력해주세요.",
  });

const birthFields = {
  birthDate: z
    .string()
    .regex(
      BIRTH_DATE_REGEX,
      "생년월일 형식이 올바르지 않습니다. (예: 1990-01-15)"
    ),
  birthTime: z
    .string()
    .regex(BIRTH_TIME_REGEX, "시간 형식이 올바르지 않습니다. (예: 16:40)")
    .optional(),
  birthTimeUnknown: z.boolean().default(false),
  calendarType: z.enum(["solar", "lunar"]).default("solar"),
  isLeapMonth: z.boolean().default(false),
};

interface BirthFieldValues {
  birthTime?: string;
  birthTimeUnknown: boolean;
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
}

/**
 * 시간 미상 플래그/실제 시각, 윤달/음력의 정합성 검사.
 * DB CHECK 제약과 같은 불변식을 API 경계에서 먼저 막아
 * 잘못된 값이 하류(엔진·DB)로 흘러가지 않게 한다.
 */
const checkBirthConsistency = (
  data: BirthFieldValues,
  ctx: z.RefinementCtx
): void => {
  if (!data.birthTimeUnknown && !data.birthTime) {
    ctx.addIssue({
      code: "custom",
      message: "태어난 시간을 입력하거나 '시간 모름'을 선택해주세요.",
      path: ["birthTime"],
    });
  }

  if (data.isLeapMonth && data.calendarType !== "lunar") {
    ctx.addIssue({
      code: "custom",
      message: "윤달은 음력에서만 선택할 수 있습니다.",
      path: ["isLeapMonth"],
    });
  }
};

export const UniverseCreateSchema = z
  .object({
    ...birthFields,
    gender: z.enum(["male", "female"]),
    ownerName: NameSchema.optional(),
  })
  .superRefine(checkBirthConsistency);

export const GuestSubmitSchema = z
  .object({
    ...birthFields,
    name: NameSchema,
  })
  .superRefine(checkBirthConsistency);

export type UniverseCreateInput = z.infer<typeof UniverseCreateSchema>;
export type GuestSubmitInput = z.infer<typeof GuestSubmitSchema>;

/** zod 에러를 사용자에게 보여줄 한국어 한 줄로 축약한다 */
export const firstIssueMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "입력값을 다시 확인해주세요.";
