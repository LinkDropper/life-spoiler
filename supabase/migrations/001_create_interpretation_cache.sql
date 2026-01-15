-- AI 해석 결과 캐싱 테이블
-- 동일한 명반(생년월일+시간+성별)에 대해 AI 응답을 재사용

CREATE TABLE IF NOT EXISTS interpretation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 명반 고유 식별자 (생년월일+시간+성별+역법으로 생성한 해시)
  chart_hash TEXT NOT NULL,

  -- 해석 유형 (preview, wealth, career, relationship, health, summary, full)
  interpretation_type TEXT NOT NULL,

  -- AI 응답 결과 (JSON)
  result JSONB NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- 같은 명반+해석유형은 하나만 존재
  UNIQUE(chart_hash, interpretation_type)
);

-- 조회 성능을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_interpretation_cache_lookup
  ON interpretation_cache(chart_hash, interpretation_type);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_interpretation_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_interpretation_cache_updated_at
  BEFORE UPDATE ON interpretation_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_interpretation_cache_updated_at();

-- RLS 정책 (서비스 역할 키로만 접근 - 서버 전용)
ALTER TABLE interpretation_cache ENABLE ROW LEVEL SECURITY;

-- 서비스 역할은 모든 작업 허용
CREATE POLICY "Service role full access on interpretation_cache"
  ON interpretation_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE interpretation_cache IS '자미두수 AI 해석 결과 캐시 테이블 (서버 전용)';
COMMENT ON COLUMN interpretation_cache.chart_hash IS '명반 고유 해시 (생년월일+시간+성별+역법)';
COMMENT ON COLUMN interpretation_cache.interpretation_type IS '해석 유형 (preview/wealth/career/relationship/health/summary/full)';
COMMENT ON COLUMN interpretation_cache.result IS 'AI 해석 결과 JSON';
