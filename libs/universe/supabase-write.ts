import type { PostgrestError } from "@supabase/supabase-js";

/**
 * 쓰기 쿼리용 최소 구조 타입.
 *
 * 이 저장소의 `Database` 타입은 supabase-js가 요구하는 형태를 완전히 만족하지 않아
 * 테이블 제네릭이 `never`로 무너진다(신규 테이블만의 문제가 아니라 `fortunes` 등
 * 기존 테이블도 동일하며, 기존 코드는 `as any` 캐스팅으로 우회하고 있다).
 *
 * 근본 해결은 `libs/supabase/types.ts`의 `Database` 정의를 supabase-js 최신 규격에
 * 맞추는 것이지만, 그 변경은 기존 모든 쿼리의 타입에 영향을 주므로 이 트랙의 범위를 넘는다.
 * 여기서는 `any`를 쓰지 않으면서 필요한 메서드만 드러내는 구조 타입으로 좁혀 캐스팅한다.
 * (`any`는 코드 스타일 규칙상 금지 — `.claude/rules/code-style.md`)
 */

interface WriteResult {
  error: PostgrestError | null;
}

interface WriteFilterBuilder extends PromiseLike<WriteResult> {
  eq(column: string, value: string | number | boolean): WriteFilterBuilder;
  or(filters: string): WriteFilterBuilder;
}

export interface WritableTable {
  insert(values: Record<string, unknown>): PromiseLike<WriteResult>;
  update(values: Record<string, unknown>): WriteFilterBuilder;
}

interface TableSource {
  from(table: string): unknown;
}

/** 쓰기 전용 핸들. 읽기는 `.maybeSingle<T>()` / `.returns<T[]>()`로 타입을 명시한다. */
export const writableTable = (
  client: TableSource,
  table: string
): WritableTable => client.from(table) as WritableTable;
