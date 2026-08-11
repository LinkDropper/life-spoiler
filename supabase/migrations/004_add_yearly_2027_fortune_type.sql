-- 신규 운세 타입 'yearly_2027'(내년 운세) 추가
-- 대상 테이블 5개의 fortune_type CHECK 제약에 'yearly_2027'을 추가한다.
-- 기존에 허용되던 값은 하나도 제거하지 않고 전부 유지한다.
-- reviews.fortune_type은 CHECK 제약이 없으므로 이 마이그레이션에서 다루지 않는다.
--
-- 주의: 각 CHECK 제약의 실제 이름을 사전에 알 수 없으므로, pg_constraint에서
-- 해당 컬럼에 걸린 CHECK 제약을 동적으로 찾아 DROP한 뒤 명시적 이름으로 다시 ADD한다.
-- 이 방식은 실제 제약 이름과 무관하게 동작하며 재실행에도 안전하다.
--
-- 원격 적용은 사용자 승인 필요 (.claude/rules/database-safety.md 준수).

-- 1. fortunes.fortune_type
--    기존: ['lifetime','yearly','past_life']
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.fortunes'::regclass
    AND con.contype = 'c'
    AND att.attname = 'fortune_type';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.fortunes DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.fortunes
  ADD CONSTRAINT fortunes_fortune_type_check
  CHECK (fortune_type::text = ANY (ARRAY['lifetime', 'yearly', 'past_life', 'yearly_2027']));

-- 2. profile_free_access.fortune_type
--    기존: ['lifetime','yearly','past_life','compatibility']
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.profile_free_access'::regclass
    AND con.contype = 'c'
    AND att.attname = 'fortune_type';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profile_free_access DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.profile_free_access
  ADD CONSTRAINT profile_free_access_fortune_type_check
  CHECK (fortune_type = ANY (ARRAY['lifetime', 'yearly', 'past_life', 'compatibility', 'yearly_2027']));

-- 3. promo_codes.fortune_type
--    기존: ['lifetime','yearly','all','past_life','face_spoiler']
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.promo_codes'::regclass
    AND con.contype = 'c'
    AND att.attname = 'fortune_type';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.promo_codes DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_fortune_type_check
  CHECK (fortune_type::text = ANY (ARRAY['lifetime', 'yearly', 'all', 'past_life', 'face_spoiler', 'yearly_2027']));

-- 4. promo_code_usages.fortune_type (nullable)
--    기존: NULL 허용 또는 ['lifetime','yearly','past_life','face_spoiler','compatibility']
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.promo_code_usages'::regclass
    AND con.contype = 'c'
    AND att.attname = 'fortune_type';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.promo_code_usages DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.promo_code_usages
  ADD CONSTRAINT promo_code_usages_fortune_type_check
  CHECK (
    fortune_type IS NULL
    OR (fortune_type::text = ANY (ARRAY['lifetime', 'yearly', 'past_life', 'face_spoiler', 'compatibility', 'yearly_2027']))
  );

-- 5. follow_up_questions.fortune_type
--    기존: ['lifetime','yearly','past_life','compatibility']
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att
    ON att.attrelid = con.conrelid
   AND att.attnum = ANY (con.conkey)
  WHERE con.conrelid = 'public.follow_up_questions'::regclass
    AND con.contype = 'c'
    AND att.attname = 'fortune_type';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.follow_up_questions DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.follow_up_questions
  ADD CONSTRAINT follow_up_questions_fortune_type_check
  CHECK (fortune_type = ANY (ARRAY['lifetime', 'yearly', 'past_life', 'compatibility', 'yearly_2027']));
