-- 레퍼럴 프로모션 테이블
-- 공유 링크를 통한 친구 가입 시 보상 추적

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 공유자 (보상 수령자)
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 피공유자 (가입자)
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 지급된 프로모 코드
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,

  -- 알림 발송 정보
  notification_channel TEXT DEFAULT 'email',
  notification_sent_at TIMESTAMPTZ,
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sent', 'failed')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 동일 공유자-가입자 쌍 중복 보상 방지
CREATE UNIQUE INDEX idx_referrals_unique_pair
  ON referrals (referrer_user_id, referred_user_id);

-- 공유자별 보상 이력 조회용
CREATE INDEX idx_referrals_referrer
  ON referrals (referrer_user_id);

-- 알림 상태 관리용
CREATE INDEX idx_referrals_notification_status
  ON referrals (notification_status)
  WHERE notification_status = 'pending';
