// [TEMP] Auto-Fix 파이프라인 end-to-end 테스트용 엔드포인트
// 테스트 완료 후 삭제 예정

import { NextResponse } from "next/server";

interface QueryResult {
  rows: Array<{ id: string; name: string }>;
}

const fetchResult = (): QueryResult => {
  return { rows: [{ id: "1", name: "Test User" }] };
};

export async function GET() {
  const result = fetchResult();
  // 의도적 버그: 빈 배열의 첫 원소에 .name 접근 → TypeError
  const firstName = result.rows[0].name;
  return NextResponse.json({ firstName });
}
