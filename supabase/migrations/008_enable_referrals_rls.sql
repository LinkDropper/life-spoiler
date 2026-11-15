-- referrals 테이블 RLS 활성화
--
-- Supabase advisor(rls_disabled_in_public, ERROR): public.referrals에 RLS가 꺼져 있어
-- anon 키만으로 PostgREST를 통해 누가 누구를 초대했는지(user_id 쌍)와 프로모 코드 ID를
-- 읽거나, 행을 직접 INSERT/UPDATE/DELETE 할 수 있는 상태였다.
--
-- 코드상 referrals 접근 경로는 전부 service role 클라이언트(createServerClient)다.
--   - libs/services/referral/core.ts  checkDuplicateReferral: SELECT count
--   - libs/services/referral/core.ts  rewardReferral: INSERT ... RETURNING
--   - libs/services/referral/notify.ts updateNotificationStatus: UPDATE by id
-- 브라우저/로그인 사용자 클라이언트(createBrowserClient, createAuthClient)로 읽거나 쓰는
-- 경로는 없다. service role은 RLS를 우회하므로 anon/authenticated 정책은 만들지 않는다
-- (정책 없음 = 전면 거부). 005_create_friend_universe.sql과 같은 방식으로 테이블 권한도
-- 회수해 이중으로 막는다.

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE referrals FROM anon, authenticated;

DROP POLICY IF EXISTS "Service role full access on referrals" ON referrals;
CREATE POLICY "Service role full access on referrals"
  ON referrals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
