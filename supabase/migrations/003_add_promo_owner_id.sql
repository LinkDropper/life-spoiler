-- 프로모 코드 소유자 (쿠폰함 기능)
-- 레퍼럴 보상으로 생성된 프로모 코드의 소유자를 추적

ALTER TABLE promo_codes ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 소유자별 쿠폰 목록 조회용 부분 인덱스
CREATE INDEX idx_promo_codes_owner ON promo_codes (owner_id) WHERE owner_id IS NOT NULL;

COMMENT ON COLUMN promo_codes.owner_id IS '프로모 코드 소유자 (레퍼럴 보상 수령자)';
