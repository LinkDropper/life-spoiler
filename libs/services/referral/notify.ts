import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerClient } from "@/libs/supabase";
import type { Database } from "@/libs/supabase/types";

type SupabaseDB = SupabaseClient<Database>;

const MAX_RETRY_COUNT = 3;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://life-spoiler.com";

/**
 * referrals 테이블의 알림 상태 업데이트
 */
const updateNotificationStatus = async (
  supabase: SupabaseDB,
  referralId: string,
  status: "sent" | "failed"
): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("referrals") as any)
    .update({
      notification_status: status,
      notification_channel: "email",
      notification_sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", referralId);

  if (error) {
    console.error("알림 상태 업데이트 실패:", error);
  }
};

/**
 * 공유자의 이메일 조회
 */
const getReferrerEmail = async (
  supabase: SupabaseDB,
  referrerUserId: string
): Promise<string | null> => {
  const { data, error } =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("users") as any)
      .select("email")
      .eq("id", referrerUserId)
      .single();

  if (error || !data) {
    console.error("공유자 이메일 조회 실패:", error);
    return null;
  }

  return data.email as string;
};

/**
 * 유효기간 Date를 YYYY.MM.DD 형식으로 포맷
 */
const formatExpiryDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

/**
 * 이메일 HTML 템플릿 생성
 */
const buildEmailHtml = (promoCode: string, expiryDate: string): string => {
  const imageUrl =
    "https://nhaoigeijuujopdwkvvc.supabase.co/storage/v1/object/public/common/share-event-image.png";

  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#111118;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111118;">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#18181b;border-radius:12px;overflow:hidden;">

        <!-- 이벤트 이미지 -->
        <tr><td style="padding:0;">
          <img src="${imageUrl}" alt="무료 운세 쿠폰 받아가세요!" width="440" style="display:block;width:100%;height:auto;border:0;" />
        </td></tr>

        <!-- 타이틀 -->
        <tr><td align="center" style="padding:24px 24px 0;">
          <h1 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:20px;font-weight:700;color:#ffffff;line-height:1.4;">
            친구가 가입했어요!
          </h1>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.4;">
            회원님의 초대로 친구가 인생스포에 가입했습니다.
          </p>
        </td></tr>

        <!-- 프로모션 코드 카드 -->
        <tr><td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.08);border-radius:8px;">
            <tr><td align="center" style="padding:20px 20px 8px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);">
                프로모션 코드
              </p>
            </td></tr>
            <tr><td align="center" style="padding:0 20px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:24px;font-weight:700;letter-spacing:2px;color:#ffccd9;-webkit-user-select:all;user-select:all;cursor:pointer;">
                ${promoCode}
              </p>
            </td></tr>
            <tr><td align="center" style="padding:8px 20px 16px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);">
                코드를 클릭하면 전체 선택됩니다
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- 안내 사항 -->
        <tr><td style="padding:0 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.4;">
              유효기간: ${expiryDate}까지
            </td></tr>
            <tr><td style="padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);line-height:1.4;">
              사용방법: 결제 화면에서 프로모션 코드를 입력해주세요.
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA 버튼 -->
        <tr><td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="background:#ffccd9;border-radius:8px;">
              <a href="${SITE_URL}/home" target="_blank"
                 style="display:block;padding:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#18181b;text-decoration:none;text-align:center;">
                지금 사용하기
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- 푸터 -->
        <tr><td align="center" style="padding:0 24px 24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.4;">
            인생스포 | life-spoiler.com
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/**
 * Resend로 레퍼럴 보상 이메일 발송
 */
const sendEmail = async (
  email: string,
  promoCode: string,
  validUntil: Date
): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY가 설정되지 않았습니다.");
    return false;
  }

  const resend = new Resend(apiKey);
  const expiryDate = formatExpiryDate(validUntil);

  const { error } = await resend.emails.send({
    from: "인생스포 <noreply@life-spoiler.com>",
    to: email,
    subject: "[인생스포] 친구가 가입했어요! 무료 운세 코드가 도착했습니다",
    html: buildEmailHtml(promoCode, expiryDate),
  });

  if (error) {
    console.error("Resend 이메일 발송 실패:", error);
    return false;
  }

  return true;
};

/**
 * 레퍼럴 알림 발송 (이메일)
 *
 * 최대 3회 재시도하며, 실패 시 notification_status를 "failed"로 업데이트한다.
 */
export const sendReferralNotification = async (
  referrerUserId: string,
  promoCode: string,
  referralId: string,
  validUntil: Date
): Promise<void> => {
  const supabase = createServerClient() as SupabaseDB;

  const email = await getReferrerEmail(supabase, referrerUserId);

  if (!email) {
    await updateNotificationStatus(supabase, referralId, "failed");
    return;
  }

  let success = false;

  for (let attempt = 1; attempt <= MAX_RETRY_COUNT; attempt++) {
    try {
      success = await sendEmail(email, promoCode, validUntil);
      if (success) {
        break;
      }
    } catch (error) {
      console.error(
        `레퍼럴 이메일 발송 실패 (시도 ${attempt}/${MAX_RETRY_COUNT}):`,
        error
      );
    }
  }

  await updateNotificationStatus(
    supabase,
    referralId,
    success ? "sent" : "failed"
  );
};
