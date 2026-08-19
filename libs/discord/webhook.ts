/**
 * Discord Webhook 유틸리티
 */

import { env } from "@/env";
import {
  isYearlyEdition,
  resolveTargetYear,
} from "@/libs/fortune/yearly-editions";
import type { FortuneType } from "@/libs/supabase/types";

const DISCORD_EMBED_COLORS = {
  SUCCESS: 0x4ade80, // 초록색
  INFO: 0x60a5fa, // 파란색
  WARNING: 0xfbbf24, // 노란색
};

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: {
    text: string;
  };
  timestamp?: string;
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Discord 웹훅으로 메시지 전송
 */
const sendWebhookMessage = async (
  payload: DiscordWebhookPayload
): Promise<boolean> => {
  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      "[Discord] 웹훅 URL이 설정되지 않았습니다. 알림이 전송되지 않습니다."
    );
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Discord] 웹훅 전송 실패:", {
        status: response.status,
        body: errorBody,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Discord] 웹훅 전송 오류:", error);
    return false;
  }
};

interface PaymentNotificationParams {
  orderId: string;
  amount: number;
  currency: "KRW" | "USD";
  method: string;
  fortuneType: FortuneType;
  profileId: string;
  profileName?: string;
  approvedAt: string;
  year?: number;
  /** paid_at 업데이트 실패 여부 (true면 DB 동기화 실패) */
  fortuneUpdateFailed?: boolean;
}

/**
 * 결제 완료 알림 전송
 */
export const sendPaymentNotification = async (
  params: PaymentNotificationParams
): Promise<boolean> => {
  const {
    orderId,
    amount,
    currency,
    method,
    fortuneType,
    profileId,
    profileName,
    approvedAt,
    year,
    fortuneUpdateFailed,
  } = params;

  const productName =
    fortuneType === "compatibility"
      ? "궁합"
      : isYearlyEdition(fortuneType)
        ? `${year ?? resolveTargetYear(fortuneType)} 신년운세`
        : fortuneType === "past_life"
          ? "전생운세"
          : "평생운세";
  const formattedAmount =
    currency === "USD"
      ? `$${amount.toFixed(2)}`
      : `₩${amount.toLocaleString()}`;

  const approvedDate = new Date(approvedAt);
  const formattedDate = approvedDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fields: DiscordEmbedField[] = [
    {
      name: "📦 상품",
      value: productName,
      inline: true,
    },
    {
      name: "💵 결제 금액",
      value: formattedAmount,
      inline: true,
    },
    {
      name: "💳 결제 수단",
      value: method,
      inline: true,
    },
    {
      name: "🧾 주문번호",
      value: `\`${orderId}\``,
      inline: false,
    },
    {
      name: "👤 프로필",
      value: profileName
        ? `${profileName} (\`${profileId}\`)`
        : `\`${profileId}\``,
      inline: true,
    },
    {
      name: "🕐 결제 시각",
      value: formattedDate,
      inline: true,
    },
  ];

  // paid_at 업데이트 실패 시 경고 필드 추가
  if (fortuneUpdateFailed) {
    fields.push({
      name: "⚠️ 동기화 실패",
      value:
        "fortunes 테이블에 paid_at 업데이트 실패!\n수동 확인 필요: 운세 레코드가 없을 수 있음",
      inline: false,
    });
  }

  const embed: DiscordEmbed = {
    title: fortuneUpdateFailed ? "⚠️ 결제 완료 (동기화 실패)" : "💰 결제 완료",
    description: fortuneUpdateFailed
      ? "결제는 완료되었으나 DB 동기화에 실패했습니다!"
      : "새로운 결제가 완료되었습니다!",
    color: fortuneUpdateFailed
      ? DISCORD_EMBED_COLORS.WARNING
      : DISCORD_EMBED_COLORS.SUCCESS,
    fields,
    footer: {
      text: "Life Spoiler",
    },
    timestamp: approvedAt,
  };

  return sendWebhookMessage({ embeds: [embed] });
};

interface FaceReportPaymentNotificationParams {
  orderId: string;
  amount: number;
  currency: "KRW" | "USD";
  method: string;
  shareId: string;
  userId: string;
  userEmail?: string;
  approvedAt: string;
  updateFailed?: boolean;
}

/**
 * 관상스포 결제 완료 알림
 */
export const sendFaceReportPaymentNotification = async (
  params: FaceReportPaymentNotificationParams
): Promise<boolean> => {
  const {
    orderId,
    amount,
    currency,
    method,
    shareId,
    userId,
    userEmail,
    approvedAt,
    updateFailed,
  } = params;

  const formattedAmount =
    currency === "USD"
      ? `$${amount.toFixed(2)}`
      : `₩${amount.toLocaleString()}`;

  const approvedDate = new Date(approvedAt);
  const formattedDate = approvedDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fields: DiscordEmbedField[] = [
    {
      name: "📦 상품",
      value: "관상 운세 스포일러",
      inline: true,
    },
    {
      name: "💵 결제 금액",
      value: formattedAmount,
      inline: true,
    },
    {
      name: "💳 결제 수단",
      value: method,
      inline: true,
    },
    {
      name: "🧾 주문번호",
      value: `\`${orderId}\``,
      inline: false,
    },
    {
      name: "🪪 관상 리포트",
      value: `\`${shareId}\``,
      inline: true,
    },
    {
      name: "👤 사용자",
      value: userEmail ? `${userEmail} (\`${userId}\`)` : `\`${userId}\``,
      inline: true,
    },
    {
      name: "🕐 결제 시각",
      value: formattedDate,
      inline: true,
    },
  ];

  if (updateFailed) {
    fields.push({
      name: "⚠️ 동기화 실패",
      value: "face_reports 테이블에 paid_at 업데이트 실패!",
      inline: false,
    });
  }

  const embed: DiscordEmbed = {
    title: updateFailed
      ? "⚠️ 관상스포 결제 완료 (동기화 실패)"
      : "🎭 관상스포 결제 완료",
    description: updateFailed
      ? "결제는 완료되었으나 DB 동기화에 실패했습니다!"
      : "새로운 관상 리포트 결제가 완료되었습니다!",
    color: updateFailed
      ? DISCORD_EMBED_COLORS.WARNING
      : DISCORD_EMBED_COLORS.SUCCESS,
    fields,
    footer: {
      text: "Face Spoiler",
    },
    timestamp: approvedAt,
  };

  return sendWebhookMessage({ embeds: [embed] });
};

interface ReviewNotificationParams {
  fortuneType: string;
  rating: number;
  content: string;
}

const FORTUNE_TYPE_LABELS: Record<string, string> = {
  lifetime: "인생운세",
  yearly: "올해운세",
  yearly_2027: "내년운세",
  past_life: "전생운세",
  compatibility: "궁합",
  face_spoiler: "관상스포",
};

const ratingToStars = (rating: number): string =>
  "⭐".repeat(rating) + "☆".repeat(5 - rating);

/**
 * 후기 등록 알림 전송
 */
export const sendReviewNotification = async (
  params: ReviewNotificationParams
): Promise<boolean> => {
  const { fortuneType, rating, content } = params;

  const embed: DiscordEmbed = {
    title: `📝 새 후기 (${ratingToStars(rating)})`,
    description: content,
    color:
      rating >= 4
        ? DISCORD_EMBED_COLORS.SUCCESS
        : rating >= 3
          ? DISCORD_EMBED_COLORS.INFO
          : DISCORD_EMBED_COLORS.WARNING,
    fields: [
      {
        name: "📦 운세 타입",
        value: FORTUNE_TYPE_LABELS[fortuneType] ?? fortuneType,
        inline: true,
      },
      {
        name: "⭐ 별점",
        value: `${rating}점`,
        inline: true,
      },
    ],
    footer: {
      text: "Life Spoiler",
    },
  };

  return sendWebhookMessage({ embeds: [embed] });
};

type SignupService = "life-spoiler" | "face-spoiler";

interface SignupNotificationParams {
  userId: string;
  email: string;
  name: string | null;
  provider: string;
  signedUpAt: string;
  service: SignupService;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  kakao: "카카오",
  apple: "Apple",
};

/**
 * 회원가입 알림 전송
 */
const SERVICE_LABELS: Record<SignupService, string> = {
  "life-spoiler": "인생스포",
  "face-spoiler": "관상스포",
};

const SERVICE_FOOTER: Record<SignupService, string> = {
  "life-spoiler": "Life Spoiler",
  "face-spoiler": "Face Spoiler",
};

interface UniverseCreatedNotificationParams {
  /** owner 표시 이름 (미입력 시 null → "익명"으로 표기) */
  ownerName: string | null;
  publicId: string;
  createdAt: string;
}

const resolveSiteUrl = (): string =>
  process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

/**
 * 친구 우주 궁합 생성 알림 전송.
 *
 * **개인정보 경계**: 이 기능은 생년월일시 비공개 원칙(B안)을 따른다.
 * 생년월일/생시/성별/내부 PK/IP 해시/owner 토큰은 절대 포함하지 않는다.
 * 공유 링크는 애초에 공유를 위해 발급되는 값이라 노출해도 무해하다.
 */
export const sendUniverseCreatedNotification = async (
  params: UniverseCreatedNotificationParams
): Promise<boolean> => {
  const { ownerName, publicId, createdAt } = params;

  const createdDate = new Date(createdAt);
  const formattedDate = createdDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const embed: DiscordEmbed = {
    title: "🌌 새 우주 생성",
    description: "친구 우주 궁합이 새로 생성되었습니다!",
    color: DISCORD_EMBED_COLORS.INFO,
    fields: [
      {
        name: "👤 owner",
        value: ownerName ?? "익명",
        inline: true,
      },
      {
        name: "🔗 공유 링크",
        value: `${resolveSiteUrl()}/universe/${publicId}`,
        inline: false,
      },
      {
        name: "🕐 생성 시각",
        value: formattedDate,
        inline: true,
      },
    ],
    footer: {
      text: "Life Spoiler",
    },
    timestamp: createdAt,
  };

  return sendWebhookMessage({ embeds: [embed] });
};

export const sendSignupNotification = async (
  params: SignupNotificationParams
): Promise<boolean> => {
  const { userId, email, name, provider, signedUpAt, service } = params;

  const signedUpDate = new Date(signedUpAt);
  const formattedDate = signedUpDate.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const embed: DiscordEmbed = {
    title: "👋 신규 회원가입",
    description: `${SERVICE_LABELS[service]}에 새로운 회원이 가입했습니다!`,
    color: DISCORD_EMBED_COLORS.INFO,
    fields: [
      {
        name: "📦 서비스",
        value: SERVICE_LABELS[service],
        inline: true,
      },
      {
        name: "👤 이름",
        value: name ?? "미설정",
        inline: true,
      },
      {
        name: "📧 이메일",
        value: email || "미제공",
        inline: true,
      },
      {
        name: "🔐 가입 방법",
        value: PROVIDER_LABELS[provider] ?? provider,
        inline: true,
      },
      {
        name: "🆔 사용자 ID",
        value: `\`${userId}\``,
        inline: false,
      },
      {
        name: "🕐 가입 시각",
        value: formattedDate,
        inline: true,
      },
    ],
    footer: {
      text: SERVICE_FOOTER[service],
    },
    timestamp: signedUpAt,
  };

  return sendWebhookMessage({ embeds: [embed] });
};
