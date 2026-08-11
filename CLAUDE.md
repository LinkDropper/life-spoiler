# CLAUDE.md

이 문서는 AI 어시스턴트가 이 프로젝트에서 작업할 때 따라야 할 핵심 규칙과, 상황별로 어떤 문서를 참조해야 하는지 안내하는 지도입니다. 상세 규칙은 각 문서에 있으므로 여기서는 요약하지 않습니다.

## 프로젝트 개요

- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript (strict mode)
- **런타임**: React 19
- **패키지 매니저**: pnpm
- **테스트**: Jest
- **린터/포맷터**: ESLint + Prettier

## 주요 명령어

```bash
pnpm dev          # 개발 서버 실행
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint 실행
pnpm test         # 테스트 실행
pnpm test:watch   # 테스트 watch 모드
```

## 상황별 참조 지도

작업을 시작하기 전, 아래 표에서 현재 상황에 맞는 문서를 먼저 읽으세요.

| 상황 | 참조 문서 |
|---|---|
| 코드 스타일/네이밍/TypeScript/Import 규칙 확인 | `.claude/rules/code-style.md` |
| 에러 처리 작성, 버그 수정 | `.claude/rules/error-handling.md` |
| React/Next.js 컴포넌트 작성 | `.claude/rules/react-conventions.md` |
| 테스트 코드 작성 | `/create-jest` 스킬 |
| DB 스키마 변경, Supabase 마이그레이션, MCP로 원격 DB 작업 | `.claude/rules/database-safety.md` |
| UI 접근성(a11y), 다국어(KO/EN/JA) 작업 | `.claude/rules/ui-accessibility-i18n.md` |
| 마케팅 콘텐츠 작성/발행, UTM, 발행 승인 절차 | `.claude/rules/brand-voice.md`, `content-guidelines.md`, `post-approval.md`, `social-media-tracker.md`, `utm-parameters.md` |
| 조직 구조 파악, 누구(어느 에이전트)에게 위임할지 판단 | `.claude/ORG.md` |
| 여러 부서에 걸친 작업 위임 | `/team` |
| 특정 모듈 코드 파악 | 해당 폴더의 `CONTEXT.md` (없으면 `/w-context`로 생성) |
| 새 기능 구현 | `specs/{name}.md` 작성 후 `/spec {name}` |
| 커밋/PR 생성 | `/pr` |
| PR 리뷰 코멘트 반영 | `/apply-review` |

## 디렉토리 구조

```
/
├── app/                    # Next.js App Router 페이지
├── libs/                   # 재사용 가능한 라이브러리
│   ├── fetch/             # HTTP 클라이언트
│   ├── logger/            # 로깅 유틸리티
│   └── services/          # 외부 서비스 연동
│       └── oauth/         # OAuth 클라이언트
├── public/                # 정적 파일
├── specs/                  # 기능 명세서 (PRD)
└── env.ts                  # 환경 변수 스키마
```

## 환경 변수

- 환경 변수는 `env.ts`에서 Zod로 검증
- `.env.example`에 필수 환경 변수 문서화
- 민감한 정보는 절대 커밋하지 않음

## 조직 구조

이 프로젝트는 CMO(마케팅) / CTO(엔지니어링) / CPO(프로덕트) 3개 부서로 구성된 서브에이전트 조직을 사용합니다. 각 부서장이 IC(실무자) 에이전트를 조율하고, 필요 시 `SendMessage`로 서로 교차 검토합니다. 전체 조직도·의사결정권·에스컬레이션 규칙·네이밍 규약은 `.claude/ORG.md`를 참조하세요. 에이전트 정의는 `.claude/agents/*.md`, 여러 부서에 걸친 작업은 `/team`으로 위임합니다.

## 메모리 정책

세션 간 맥락 유지는 두 경로로만 이루어집니다.

1. 하네스 기본 auto-memory (사용자 개인 로컬, 이 저장소에는 커밋되지 않음)
2. 각 서브에이전트의 `memory: project` 설정 (`.claude/agent-memory/<agent>/`, 저장소에 커밋되어 공유됨)

이 외의 수동 메모리 파일(예: 별도 `MEMORY.md`, 노트 파일)을 새로 만들지 않습니다. 운영 데이터(`docs/social-tracker.csv`, `docs/insights/*` 등)는 메모리가 아니라 공유 운영 데이터이며, 해당 에이전트/rule 문서에서 직접 참조합니다.

## 작업 규칙

허락없이 마음대로 커밋이나 푸쉬 금지. 이 원칙은 CMO/CTO/CPO 및 산하 모든 서브에이전트에게 동일하게 적용됩니다. 단, 마케팅팀의 GitHub Actions 자동 발행 경로(`cmo`/`social-media-marketer`/`content-writer`, `scripts/marketing/post-to-x.js` 등)는 기존에 승인된 예외입니다.
