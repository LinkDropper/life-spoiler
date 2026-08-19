-- 친구 우주 궁합 — 계정 귀속(ownership claim) 컬럼 추가
--
-- 배경: 우주는 비로그인 상태로도 생성 가능하다(owner_token_hash 쿠키로 소유권을 증명).
-- 이 마이그레이션은 우주를 실제 계정(users)에 귀속시킬 수 있는 컬럼을 추가한다.
--   1) 로그인 상태에서 생성 → 생성 시점에 즉시 귀속
--   2) 비로그인 상태에서 생성 → 이후 같은 브라우저에서 로그인 시 owner_token_hash로 매칭해 귀속
--
-- user_id는 nullable이다 — 익명 생성/미로그인 사용자는 영구히 NULL일 수 있다.
-- 계정 삭제 시 우주 자체는 남기고(공유 링크가 이미 배포됐을 수 있음) 귀속만 해제한다.
--
-- 원격 적용은 사용자 승인 필요 (.claude/rules/database-safety.md 준수).

ALTER TABLE universes
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_universes_user_id
  ON universes (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN universes.user_id IS '이 우주가 귀속된 계정. 생성 시점 로그인 상태였거나, 이후 owner_token_hash 쿠키로 로그인 시 귀속됨(둘 다 아니면 NULL로 익명 유지)';
