/**
 * Discord Webhook 유틸리티
 */

import { env } from "@/env";

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
  fortuneType: "yearly" | "lifetime";
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
    fortuneType === "yearly"
      ? `${year ?? new Date().getFullYear()} 신년운세`
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

interface SignupNotificationParams {
  userId: string;
  email: string;
  name: string | null;
  provider: string;
  signedUpAt: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  kakao: "카카오",
  apple: "Apple",
};

/**
 * 회원가입 알림 전송
 */
export const sendSignupNotification = async (
  params: SignupNotificationParams
): Promise<boolean> => {
  const { userId, email, name, provider, signedUpAt } = params;

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
    description: "새로운 회원이 가입했습니다!",
    color: DISCORD_EMBED_COLORS.INFO,
    fields: [
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
      text: "Life Spoiler",
    },
    timestamp: signedUpAt,
  };

  return sendWebhookMessage({ embeds: [embed] });
};
