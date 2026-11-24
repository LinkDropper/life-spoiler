-- 페이지 접속 로그 테이블
--
-- 사람이 연 모든 페이지 로드(문서 요청)를 한 행씩 남긴다 (middleware.ts).
-- 앱 안에서 링크로 이동하는 클라이언트 전환(RSC fetch)과 프리페치·봇 요청은 남기지 않는다.
--
-- visitor_id는 utm_events.visitor_id와 같은 브라우저별 익명 ID(ls_vid 쿠키)다.
-- 접속 → UTM 유입 → 가입 → 결제를 같은 방문자로 묶는 데 쓴다.
-- IP·User-Agent 원문과 쿼리스트링은 저장하지 않는다 (경로와 utm_* 값만 저장).
--
-- 접근 경로는 전부 service role(PostgREST + service role key)이다.
-- 009_create_utm_events.sql과 같은 방식으로 anon/authenticated 접근을 막는다.

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 브라우저별 익명 방문자 ID (ls_vid 쿠키)
  visitor_id UUID NOT NULL,
  -- 이 접속에서 방문자 ID를 처음 발급했는지 (신규 방문자 집계용)
  is_new_visitor BOOLEAN NOT NULL DEFAULT false,

  -- 요청 경로 (쿼리 제외)
  path TEXT NOT NULL,
  -- 외부 referrer의 호스트만 (경로·쿼리 제외)
  referrer_host TEXT,

  -- 이 요청 URL에 utm_* 가 붙어 있었을 때만 채워짐
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- 적용된 화면 언어 (ko/en/ja)
  locale TEXT,
  device_type TEXT
    CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  -- Vercel이 붙여주는 국가 코드 (ISO 3166-1 alpha-2)
  country TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기간별 접속 집계용
CREATE INDEX IF NOT EXISTS idx_access_logs_created
  ON access_logs (created_at DESC);

-- 페이지별 기간 집계용
CREATE INDEX IF NOT EXISTS idx_access_logs_path_created
  ON access_logs (path, created_at DESC);

-- 방문자 단위 연결용
CREATE INDEX IF NOT EXISTS idx_access_logs_visitor
  ON access_logs (visitor_id);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE access_logs FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on access_logs" ON access_logs;
CREATE POLICY "Service role full access on access_logs"
  ON access_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
