-- 친구 우주 궁합 (Friend Universe) — 익명 링크 기반 무료 바이럴 기능
--
-- 플로우
--   1) owner가 생년월일시 + 성별을 입력 → universes 행 생성, public_id로 공유 링크 발급
--   2) 친구(guest)가 링크로 진입 → 이름 + 생년월일시 입력 → universe_guests 행 생성
--   3) 궁합 계산은 순수 동기 함수(calculateFriendCompatibility)로 서버에서 수행하고
--      결과를 universe_guests에 스냅샷으로 저장한다 (matrix_version 함께 기록)
--
-- 설계 원칙
--   - 로그인이 없다. auth.users 참조가 전혀 없으며 기존 유료 궁합(profiles/compatibility_pairs)과
--     완전히 분리된 신규 테이블이다. 기존 테이블은 이 마이그레이션에서 일절 변경하지 않는다.
--   - anon 키는 브라우저에 노출되므로 두 테이블 모두 클라이언트 직접 접근을 봉쇄한다.
--     (RLS 활성화 + anon/authenticated 정책 없음 + 테이블 권한 REVOKE)
--     모든 읽기/쓰기는 Next.js Route Handler에서 service role로만 수행한다.
--   - 개인정보 최소 저장: guest는 성별/연락처를 받지 않는다.
--     IP는 원문 대신 HMAC(서버 시크릿, IP)만 보관한다 (단순 SHA-256은 IPv4 전수 대입으로 가역).
--   - birth_time은 사용자 원본 입력(HH:mm)을 저장한다. 엔진이 받는 시진(TimeBranchValue)은
--     여기서 파생되는 값이므로 저장하지 않는다 (시진 산출 규칙이 바뀌면 저장값이 낡는다).
--     "시간 모름"은 birth_time_unknown = true AND birth_time IS NULL로 표현하며,
--     엔진은 이 경우 시진 12개를 전수 열거해 평균을 낸다 (confidence/chart_combinations 참조).
--   - 궁합 결과는 스냅샷으로 저장하고 기본적으로 백필하지 않는다 (CTO 확정).
--     예외는 매트릭스에 명백한 계산 버그가 있는 경우뿐이며, 그때만 사용자 승인 후
--     해당 matrix_version 행을 선택 백필한다. 단순 튜닝(점수 분포 조정, 문구 수정)은 백필 대상이 아니다.
--
-- 원격 적용은 사용자 승인 필요 (.claude/rules/database-safety.md 준수).

-- ---------------------------------------------------------------------------
-- 1. universes — owner의 우주 (공유 링크의 주체)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS universes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL에 노출되는 공개 식별자.
  -- 애플리케이션(nanoid)에서 생성한다. 혼동하기 쉬운 문자(0/O/1/l/I)를 제외한
  -- 소문자+숫자 31자 알파벳 12자리 = 약 59.6bit 엔트로피로, 순차 추측/열거가 불가능하다.
  -- 내부 PK(id)는 절대 URL이나 API 응답에 노출하지 않는다.
  public_id TEXT NOT NULL,

  -- owner 표시 이름 (선택). "OO님의 우주" 헤더/OG 이미지용.
  -- 입력받지 않기로 결정되면 NULL로 두면 되며 스키마 변경이 필요 없다.
  owner_name TEXT,

  -- owner 명반 입력값
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_unknown BOOLEAN NOT NULL DEFAULT false,
  calendar_type TEXT NOT NULL DEFAULT 'solar'
    CHECK (calendar_type IN ('solar', 'lunar')),
  is_leap_month BOOLEAN NOT NULL DEFAULT false,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),

  -- 친구 별 개수 (트리거로 자동 유지). 우주당 상한 검사와 목록 미조회 카운트에 사용.
  guest_count INTEGER NOT NULL DEFAULT 0 CHECK (guest_count >= 0),

  -- owner 본인 확인용 토큰 해시 (선택). 향후 owner가 자기 우주의 별을 삭제하는 기능에 사용.
  -- 생성 시 HttpOnly 쿠키에 원문 토큰을 심고 여기에는 해시만 저장하는 용도이며,
  -- 해당 기능을 도입하지 않으면 NULL로 두어도 무해하다.
  owner_token_hash TEXT,

  -- 생성자 IP 해시 (선택). 우주 대량 생성 rate limit 조회용. 원문 IP는 저장하지 않는다.
  creator_ip_hash TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 마지막 조회 시각. 매 조회마다 UPDATE하면 쓰기가 증폭되므로
  -- 애플리케이션에서 "직전 갱신 후 1시간 경과 시에만 갱신"하는 정책을 권장한다.
  last_viewed_at TIMESTAMPTZ,

  -- 시간 미상 플래그와 실제 시각의 정합성 보장
  CONSTRAINT universes_birth_time_consistency CHECK (
    (birth_time_unknown = true AND birth_time IS NULL)
    OR (birth_time_unknown = false AND birth_time IS NOT NULL)
  ),

  -- 윤달은 음력에서만 성립
  CONSTRAINT universes_leap_month_requires_lunar CHECK (
    is_leap_month = false OR calendar_type = 'lunar'
  ),

  -- public_id 형식 강제 (혼동 문자 제외 소문자+숫자 12자리)
  CONSTRAINT universes_public_id_format CHECK (
    public_id ~ '^[23456789abcdefghjkmnpqrstuvwxyz]{12}$'
  ),

  -- 자유 텍스트 길이 제한 (저장 최소화)
  CONSTRAINT universes_owner_name_length CHECK (
    owner_name IS NULL OR char_length(btrim(owner_name)) BETWEEN 1 AND 20
  )
);

-- 링크 진입 시 유일한 조회 경로
CREATE UNIQUE INDEX IF NOT EXISTS idx_universes_public_id
  ON universes (public_id);

-- IP 기반 생성 rate limit 조회용 (해시가 있는 행만)
CREATE INDEX IF NOT EXISTS idx_universes_creator_ip
  ON universes (creator_ip_hash, created_at DESC)
  WHERE creator_ip_hash IS NOT NULL;

COMMENT ON TABLE universes IS '친구 우주 궁합 — owner의 익명 우주 (로그인 없음, 서버 전용 접근)';
COMMENT ON COLUMN universes.public_id IS 'URL 공개 식별자 (nanoid 12자, 열거 불가). 내부 id는 노출 금지';
COMMENT ON COLUMN universes.owner_name IS 'owner 표시 이름 (선택, 최대 20자)';
COMMENT ON COLUMN universes.guest_count IS '등록된 친구 별 개수 (트리거로 자동 유지)';
COMMENT ON COLUMN universes.owner_token_hash IS 'owner 본인 확인 토큰의 해시 (선택, 별 삭제 기능용)';
COMMENT ON COLUMN universes.creator_ip_hash IS '생성자 IP의 HMAC (rate limit 용, 원문 미저장). 단순 SHA-256 금지 — HMAC(서버 시크릿, IP) 필수';
COMMENT ON COLUMN universes.last_viewed_at IS '마지막 조회 시각 (쓰기 증폭 방지를 위해 앱에서 스로틀 갱신)';

-- ---------------------------------------------------------------------------
-- 2. universe_guests — 우주에 등록된 친구 별 + 궁합 계산 스냅샷
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS universe_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  universe_id UUID NOT NULL REFERENCES universes(id) ON DELETE CASCADE,

  -- 별 배치용 안정 시드. 프론트는 이 값 + score만으로 결정론적으로 좌표를 계산하므로
  -- 새로고침/재정렬에도 별 위치가 흔들리지 않는다. 내부 PK 대신 이 값을 API로 내려준다.
  star_seed TEXT NOT NULL DEFAULT substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16),

  -- 친구 입력값 (성별은 받지 않는다)
  guest_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_unknown BOOLEAN NOT NULL DEFAULT false,
  calendar_type TEXT NOT NULL DEFAULT 'solar'
    CHECK (calendar_type IN ('solar', 'lunar')),
  is_leap_month BOOLEAN NOT NULL DEFAULT false,

  -- 궁합 계산 스냅샷 (calculateFriendCompatibility 결과)
  -- 재계산 대신 스냅샷을 저장하는 이유: 친구가 캡처/공유한 점수와 owner가 보는 점수가
  -- 매트릭스 버전 업으로 달라지면 신뢰가 깨진다. matrix_version을 함께 남겨두면
  -- 필요 시 특정 버전 행만 골라 백필할 수 있다.
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  tier TEXT NOT NULL,
  one_liner_id TEXT NOT NULL,
  factors JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (
      jsonb_typeof(factors) = 'array'
      AND jsonb_array_length(factors) BETWEEN 1 AND 20
    ),
  matrix_version TEXT NOT NULL,

  -- 시간 미상 처리 결과 (fu-1.1.0 계약).
  -- 시간을 모르면 명궁이 확정되지 않아 시진 12개를 전수 열거해 평균을 낸다.
  -- confidence / chart_combinations 모두 birth_time_unknown 조합에서 "현재 버전 기준으로는"
  -- 파생 가능하지만, 그 파생 규칙 자체가 matrix_version에 종속된 엔진 소유 로직이다.
  -- 백필하지 않는 스냅샷이므로 스냅샷은 자기충족적이어야 한다 (앱이 신버전 규칙으로
  -- 구버전 행을 재해석하는 사고를 막는다). 두 값 모두 저장한다.
  confidence TEXT NOT NULL,
  chart_combinations SMALLINT NOT NULL CHECK (chart_combinations >= 1),

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 등록자 IP 해시 (선택). 우주당 도배 쿨다운 판정용. 원문 IP는 저장하지 않는다.
  creator_ip_hash TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT universe_guests_birth_time_consistency CHECK (
    (birth_time_unknown = true AND birth_time IS NULL)
    OR (birth_time_unknown = false AND birth_time IS NOT NULL)
  ),

  CONSTRAINT universe_guests_leap_month_requires_lunar CHECK (
    is_leap_month = false OR calendar_type = 'lunar'
  ),

  -- 이름은 자유 텍스트이므로 길이를 강하게 제한한다 (자미두수 ZiweiInput.name과 동일한 상한)
  CONSTRAINT universe_guests_name_length CHECK (
    char_length(btrim(guest_name)) BETWEEN 1 AND 20
  ),

  CONSTRAINT universe_guests_star_seed_format CHECK (
    char_length(star_seed) BETWEEN 8 AND 32
  ),

  CONSTRAINT universe_guests_tier_length CHECK (
    char_length(tier) BETWEEN 1 AND 40
  ),

  CONSTRAINT universe_guests_one_liner_id_length CHECK (
    char_length(one_liner_id) BETWEEN 1 AND 80
  ),

  CONSTRAINT universe_guests_matrix_version_length CHECK (
    char_length(matrix_version) BETWEEN 1 AND 40
  ),

  -- confidence는 현재 'exact' | 'estimated' 두 값이지만, tier와 마찬가지로 엔진 소유 어휘라
  -- 값 목록을 DB CHECK로 고정하지 않는다. 엔진이 값을 추가하면 익명 등록 플로우가
  -- 프로덕션에서 INSERT 실패로 막히기 때문이다. 값 검증은 TS 유니온 타입(빌드 타임)이 담당한다.
  CONSTRAINT universe_guests_confidence_length CHECK (
    char_length(confidence) BETWEEN 1 AND 20
  )
);

-- 우주별 별 목록 조회 (등록 순 고정 정렬)
CREATE INDEX IF NOT EXISTS idx_universe_guests_universe
  ON universe_guests (universe_id, created_at);

-- star_seed는 프론트 배치 키이므로 전역 유일해야 좌표 충돌 추론이 불가능하다
CREATE UNIQUE INDEX IF NOT EXISTS idx_universe_guests_star_seed
  ON universe_guests (star_seed);

-- 동일인 재등록 방지.
-- 생년월일시만으로 UNIQUE를 걸면 "생일이 같은 서로 다른 친구"까지 막히므로
-- 이름(공백/대소문자 정규화)까지 포함한다. 즉 같은 사람이 같은 이름으로 다시 넣는 경우만 충돌한다.
-- birth_time이 NULL이면 UNIQUE가 무력화되므로 COALESCE로 정규화한다.
-- 애플리케이션은 이 충돌을 에러가 아니라 "이미 등록한 별" upsert로 처리하는 것을 권장한다.
CREATE UNIQUE INDEX IF NOT EXISTS idx_universe_guests_dedupe
  ON universe_guests (
    universe_id,
    lower(btrim(guest_name)),
    birth_date,
    COALESCE(birth_time, TIME '00:00:00'),
    birth_time_unknown,
    calendar_type,
    is_leap_month
  );

-- 우주별 IP 쿨다운 판정용 (해시가 있는 행만)
CREATE INDEX IF NOT EXISTS idx_universe_guests_creator_ip
  ON universe_guests (universe_id, creator_ip_hash, created_at DESC)
  WHERE creator_ip_hash IS NOT NULL;

COMMENT ON TABLE universe_guests IS '친구 우주 궁합 — 우주에 등록된 친구 별 및 궁합 계산 스냅샷 (서버 전용 접근)';
COMMENT ON COLUMN universe_guests.star_seed IS '별 배치용 안정 시드. 프론트가 seed+score로 결정론적 좌표를 계산';
COMMENT ON COLUMN universe_guests.guest_name IS '친구 이름 (자유 텍스트, 1~20자)';
COMMENT ON COLUMN universe_guests.score IS '궁합 점수 스냅샷 (0-100)';
COMMENT ON COLUMN universe_guests.tier IS '궁합 등급 슬러그 스냅샷 (엔진 소유 값이라 DB CHECK로 목록을 고정하지 않음)';
COMMENT ON COLUMN universe_guests.one_liner_id IS '한줄평 템플릿 ID. 실제 문구는 렌더 시점에 조회하여 다국어 확장을 막지 않는다';
COMMENT ON COLUMN universe_guests.factors IS '점수 기여 요인 배열 스냅샷 [{label, detail, delta}]. 엔진 계약: delta 음수 가능, 배열 길이 3~8, label 8종 고정. DB CHECK는 1~20의 느슨한 안전 상한만 강제하고 정확한 3~8은 엔진/TS가 담당';
COMMENT ON COLUMN universe_guests.matrix_version IS '계산 매트릭스 버전 (예: fu-1.1.0). 기본 정책은 백필하지 않음 — 명백한 계산 버그일 때만 사용자 승인 후 해당 버전 행을 선택 백필';
COMMENT ON COLUMN universe_guests.confidence IS '결과 확신도 스냅샷. 현재 exact(양쪽 시간 확정) | estimated(한쪽 이상 시간 미상 → 시진 전수 평균). UI의 "추정치" 배지·시간 입력 유도에 사용';
COMMENT ON COLUMN universe_guests.chart_combinations IS '평균에 사용한 명반 조합 수 스냅샷. 현재 1(둘 다 확정) | 12(한쪽 미상) | 144(둘 다 미상). 파생 규칙이 matrix_version 종속이라 저장';
COMMENT ON COLUMN universe_guests.creator_ip_hash IS '등록자 IP의 HMAC (도배 쿨다운 용, 원문 미저장). 단순 SHA-256 금지 — HMAC(서버 시크릿, IP) 필수';

-- ---------------------------------------------------------------------------
-- 3. guest_count 자동 유지 트리거
-- ---------------------------------------------------------------------------
--
-- 주의(핫 로우 경합): 이 트리거는 guest INSERT/DELETE마다 부모 universes 행을 UPDATE하므로,
-- 인기 우주 하나에 친구들이 동시에 몰리면 해당 행에 락 경합이 생길 수 있다.
-- 현재 트래픽 규모에서는 문제가 아니라고 판단해 이 구조를 유지한다.
-- 병목이 실제로 관측되면 집계 테이블 분리 또는 조회 시 COUNT(*) 방식으로 전환할 것.
--
-- search_path를 빈 문자열로 고정하고 테이블 참조를 스키마 정규화한다.
-- (Supabase advisor의 function_search_path_mutable 경고 방지 및 search_path 하이재킹 차단)

CREATE OR REPLACE FUNCTION public.sync_universe_guest_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.universes
      SET guest_count = guest_count + 1
      WHERE id = NEW.universe_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.universes
      SET guest_count = GREATEST(guest_count - 1, 0)
      WHERE id = OLD.universe_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_universe_guests_count ON universe_guests;
CREATE TRIGGER trg_universe_guests_count
  AFTER INSERT OR DELETE ON universe_guests
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_universe_guest_count();

-- ---------------------------------------------------------------------------
-- 4. RLS — 클라이언트 직접 접근 전면 차단, service role 전용
-- ---------------------------------------------------------------------------
--
-- anon 키는 브라우저에 노출되므로 anon SELECT를 허용하면
--   (a) universes 전체 열거로 남의 우주 생년월일/성별을 수집할 수 있고
--   (b) universe_guests 열거로 남의 친구 목록과 그 생년월일까지 노출된다.
-- RLS의 USING 절은 "행 필터"이지 "클라이언트가 보낸 조건의 진위 검증"이 아니므로
-- public_id를 아는 사람만 읽게 하는 규칙을 RLS만으로 안전하게 표현할 수 없다.
-- 따라서 anon/authenticated에는 정책을 만들지 않는다 (정책 없음 = 전면 거부).
-- 추가로 PostgREST가 참조하는 테이블 권한 자체를 회수해 이중으로 막는다.

ALTER TABLE universes ENABLE ROW LEVEL SECURITY;
ALTER TABLE universe_guests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE universes FROM anon, authenticated;
REVOKE ALL ON TABLE universe_guests FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on universes" ON universes;
CREATE POLICY "Service role full access on universes"
  ON universes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on universe_guests" ON universe_guests;
CREATE POLICY "Service role full access on universe_guests"
  ON universe_guests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
