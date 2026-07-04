import { z } from "zod/v4";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    NEXT_PUBLIC_API_URL: z.url().optional(),

    // OAuth - Google
    OAUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    OAUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),

    // OAuth - Kakao
    OAUTH_KAKAO_CLIENT_ID: z.string().optional(),
    OAUTH_KAKAO_CLIENT_SECRET: z.string().optional(),

    // AI - Gemini (인생스포 텍스트 해석 롤백용, LIFE_SPOILER_LLM_PROVIDER=gemini일 때 사용)
    GEMINI_API_KEY: z.string().optional(),

    // AI - OpenAI (face-spoiler + 인생스포 텍스트 해석 공용)
    OPENAI_API_KEY: z.string().optional(),

    // Face-spoiler 텍스트 리포트 LLM 제공자 스위칭.
    // "gemini" (default) 또는 "openai". 실험 중에만 "openai"로 지정.
    FACE_SPOILER_LLM_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),

    // 인생스포(자미두수/궁합/전생/추가질문) 텍스트 해석 LLM 제공자 스위칭.
    // "openai" (default). 장애 시 "gemini"로 즉시 롤백 가능.
    LIFE_SPOILER_LLM_PROVIDER: z.enum(["gemini", "openai"]).default("openai"),

    // OpenAI 모델 ID. face-spoiler와 인생스포 텍스트 해석이 공유. 공식 release 시 snapshot ID 주입.
    // Default는 2026-03-17 snapshot.
    OPENAI_FACE_MODEL: z.string().default("gpt-5.4-mini-2026-03-17"),

    // Phase 20.6 (2026-04-23) — FaceMetrics 파생 정보 노출 레벨 실험.
    // 한국인 측정값 분포가 좁아 LLM에 같은 힌트가 가면 해석이 수렴한다는 가설을 A/B 검증.
    //  - "metrics" (default): 현재 동작. Stage A 수치 hint, Stage B/C 문장 hint, 부위 조합 블록 주입.
    //  - "minimal": 동물상 이름 숨김, 점수 상위 1개 부위만 노출, 조합 블록 제거.
    //  - "none": 측정값·분류 정보 없이 사진+톤 규칙만. shareLine 전용 동물상 이름만 유지.
    FACE_SPOILER_HINT_MODE: z
      .enum(["metrics", "minimal", "none"])
      .default("metrics"),

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // TossPayments
    NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional(),
    TOSS_SECRET_KEY: z.string().optional(),

    // TossPayments PayPal (해외 간편결제)
    NEXT_PUBLIC_TOSS_PAYPAL_CLIENT_KEY: z.string().optional(),
    TOSS_PAYPAL_SECRET_KEY: z.string().optional(),

    // Google Analytics
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

    // Kakao JavaScript SDK
    NEXT_PUBLIC_KAKAO_JS_KEY: z.string().optional(),

    // Discord Webhook
    DISCORD_WEBHOOK_URL: z.url().optional(),

    // Resend (Email)
    RESEND_API_KEY: z.string().optional(),

    // Internal proxy (마케팅 스케쥴러 샌드박스 egress 우회용)
    INTERNAL_API_TOKEN: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!!data.OAUTH_GOOGLE_CLIENT_ID !== !!data.OAUTH_GOOGLE_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Google OAuth client ID and secret must be provided together.",
        path: ["OAUTH_GOOGLE_CLIENT_ID"],
      });
    }
    if (!!data.OAUTH_KAKAO_CLIENT_ID !== !!data.OAUTH_KAKAO_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kakao OAuth client ID and secret must be provided together.",
        path: ["OAUTH_KAKAO_CLIENT_ID"],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ 환경변수 검증 실패:");
  console.error(z.flattenError(parsed.error).fieldErrors);
  throw new Error("환경변수가 올바르지 않습니다.");
}

export const env = parsed.data;
