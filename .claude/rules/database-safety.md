# DB/Supabase 안전 규칙

`libs/supabase/**`, `supabase/**`를 건드리거나 Supabase MCP 도구를 쓸 때 반드시 참조한다.

## 원칙

1. **마이그레이션은 파일로 먼저 작성한다.** `supabase/migrations/`에 마이그레이션 파일을 만들고 로컬에서 검증한 뒤에만 원격에 적용한다. 원격에 즉흥적으로 `execute_sql`을 날려 스키마를 바꾸지 않는다.
2. **RLS(Row Level Security) 정책을 항상 확인한다.** 새 테이블/컬럼 추가 시 RLS 정책 없이 방치하지 않는다.
3. **파괴적/원격 영향 MCP 도구는 사용자 승인 없이 실행 금지**:
   - `mcp__supabase__apply_migration`
   - `mcp__supabase__execute_sql`
   - `mcp__supabase__merge_branch`
   - `mcp__supabase__reset_branch`
   - `mcp__supabase__delete_branch`
   - 위 도구를 실행하기 전, 무엇을/왜 바꾸는지 사용자에게 먼저 제시하고 명시적 승인을 받는다. (CLAUDE.md "작업 규칙"의 커밋/푸시 금지 원칙과 동일한 정신)
4. **읽기 전용 도구는 자유롭게 사용 가능**: `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`, `get_logs`, `generate_typescript_types`, `search_docs`, `get_project_url`, `get_publishable_keys`.
5. 스키마 변경 시 마이그레이션 파일 필수 (기존 `supabase/migrations/`의 네이밍 컨벤션 준수).
