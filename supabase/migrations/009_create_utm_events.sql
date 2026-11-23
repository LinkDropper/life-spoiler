-- UTM 유입 로그 테이블
--
-- 마케팅 링크(utm_*)로 들어온 랜딩과, 그 유입이 이어진 회원가입·결제를 한 테이블에 남긴다.
--   - landing: utm_* 파라미터가 붙은 페이지 요청 (middleware.ts)
--   - signup : 신규 회원가입 (app/auth/callback/route.ts)
--   - payment: 결제 승인 (app/api/payment/confirm, app/api/face-spoiler/payment/confirm)
-- signup/payment 행의 utm_* 값은 가입·결제 시점의 마지막 UTM 유입(쿠키, 30일)이다.
-- UTM 없이 가입·결제한 경우에도 행을 남기고 utm_* 는 NULL로 둔다 (전환 분모 계산용).
--
-- visitor_id는 브라우저별 익명 ID(쿠키)다. 랜딩 → 가입 → 결제를 같은 방문자로 묶는 데 쓴다.
-- IP·User-Agent 원문은 저장하지 않는다.
--
-- 접근 경로는 전부 service role(PostgREST + service role key)이다.
-- 008_enable_referrals_rls.sql과 같은 방식으로 anon/authenticated 접근을 막는다.

CREATE TABLE IF NOT EXISTS utm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  event_type TEXT NOT NULL
    CHECK (event_type IN ('landing', 'signup', 'payment')),

  -- 브라우저별 익명 방문자 ID (ls_vid 쿠키)
  visitor_id UUID,

  -- 로그인 사용자 (signup, 관상스포 payment에서만 채워짐)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- UTM이 붙어 들어온 첫 페이지 경로 (쿼리 제외)
  landing_path TEXT,
  -- 외부 referrer의 호스트만 (경로·쿼리 제외)
  referrer_host TEXT,
  -- 해당 UTM 유입이 발생한 시각 (landing 행은 created_at과 같음)
  touched_at TIMESTAMPTZ,

  -- payment 전용
  order_id TEXT,
  amount NUMERIC,
  currency TEXT,
  -- 상품 구분 (signup: life-spoiler/face-spoiler, payment: fortune_type 또는 face_spoiler)
  product TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 캠페인별 기간 집계용
CREATE INDEX IF NOT EXISTS idx_utm_events_campaign_created
  ON utm_events (utm_campaign, created_at DESC);

-- 이벤트 종류별 기간 집계용
CREATE INDEX IF NOT EXISTS idx_utm_events_type_created
  ON utm_events (event_type, created_at DESC);

-- 방문자 단위 랜딩 → 가입 → 결제 연결용
CREATE INDEX IF NOT EXISTS idx_utm_events_visitor
  ON utm_events (visitor_id)
  WHERE visitor_id IS NOT NULL;

ALTER TABLE utm_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE utm_events FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on utm_events" ON utm_events;
CREATE POLICY "Service role full access on utm_events"
  ON utm_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
