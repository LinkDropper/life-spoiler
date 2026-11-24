/**
 * 로그 테이블(utm_events, access_logs) 공용 INSERT.
 *
 * middleware(edge runtime)에서도 호출하므로 supabase-js 클라이언트 대신
 * PostgREST에 service role key로 직접 INSERT 한다.
 * 로그 기록 실패가 접속·가입·결제 흐름을 막으면 안 되므로 예외를 던지지 않고
 * 콘솔에만 남긴다.
 */

type LogTable = "utm_events" | "access_logs";

export const insertLogRow = async (
  table: LogTable,
  row: Record<string, unknown>
): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      `[${table}] Supabase 서버 환경 변수가 없어 로그를 남기지 않습니다.`
    );
    return;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!response.ok) {
      console.error(`[${table}] 로그 기록 실패:`, {
        status: response.status,
        body: await response.text(),
      });
    }
  } catch (error) {
    console.error(`[${table}] 로그 기록 오류:`, error);
  }
};
