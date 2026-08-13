# ORG.md — 인생스포 조직 구조

이 문서는 `.claude/agents/*`, `.claude/rules/*`와 강결합된 운영 메타데이터입니다. 콘텐츠/전략 문서는 `docs/`를 참조하세요.

## 1. 조직도

```
대표 (사용자, ujh9208@gmail.com) — 최종 결정권자
├── CMO (marketing)   .claude/agents/cmo.md              [GitHub Actions 자동화 운영 중]
│   ├── content-writer          .claude/agents/content-writer.md
│   ├── social-media-marketer   .claude/agents/social-media-marketer.md
│   └── performance-analyst     .claude/agents/performance-analyst.md
├── CTO (engineering) .claude/agents/cto.md
│   ├── fullstack                .claude/agents/fullstack.md
│   ├── ai-dev                   .claude/agents/ai-dev.md
│   └── ziwei-expert             .claude/agents/ziwei-expert.md
└── CPO (product)     .claude/agents/cpo.md
    ├── planner                  .claude/agents/planner.md
    ├── designer                 .claude/agents/designer.md
    └── growth-strategist        .claude/agents/growth-strategist.md
```

## 2. 부서별 상세

| 부서 | 부서장 | 자동화 | 산하 IC | 책임 범위 |
|---|---|---|---|---|
| Marketing | `cmo` | O (GitHub Actions cron) | content-writer, social-media-marketer, performance-analyst | 콘텐츠 기획/작성/발행, 성과 분석, 브랜드 보이스 준수 |
| Engineering | `cto` | X (수동 호출) | fullstack, ai-dev, ziwei-expert | 아키텍처/구현/DB/AI 파이프라인/자미두수 계산 엔진 |
| Product | `cpo` | X (수동 호출) | planner, designer, growth-strategist | 로드맵/PRD/UX/전환율 전략 |

마케팅팀은 기존에 승인된 자동화 경로이며, 이 조직 재구성 작업은 마케팅팀 에이전트 파일 자체를 수정하지 않았습니다.

## 3. 의사결정권 매트릭스

| 항목 | 최종 결정권자 |
|---|---|
| 기능 우선순위/로드맵 | CPO |
| 기술 스택/아키텍처/구현 방식 | CTO |
| 콘텐츠 발행 (자동화 경로) | CMO (기존 승인된 자동화) |
| 코드/에러처리/React 컨벤션 | `.claude/rules/*.md` (부서장도 임의 변경 불가, 변경은 사용자 승인 필요) |
| git commit / push / 배포 / DB 마이그레이션 실제 적용 | **대표(사용자)** — 예외 없음 (마케팅 자동화 경로 제외) |

## 4. 에스컬레이션 규칙

```
IC → 부서장 판단
   → 해소 안 되면 관련 부서장과 SendMessage 교차검토
   → 그래도 해소 안 되면 사용자에게 보고 (선택지 + 권장안 제시)
```

부서장은 자기 부서 범위를 벗어나는 판단(예: CTO가 마케팅 전략에 개입)을 임의로 내리지 않고, 반드시 해당 부서장과 협의하거나 사용자에게 에스컬레이션합니다.

## 5. 부서 간 협업 프로토콜

`SendMessage`/`ListAgents` 도구(Agent Teams 기능)로 부서장 간 비동기 협의를 합니다.

**예시 1 — PRD 기술 검토**
```
CPO: SendMessage(to: "cto", message: "specs/onboarding-v2.md 검토 요청 — 이번 스프린트 내 가능?")
CTO: (검토 후) SendMessage(to: "cpo", message: "가능하나 결제 연동 부분은 범위 축소 제안...")
```

**예시 2 — 신규 기능의 마케팅 영향 확인**
```
CPO: SendMessage(to: "cmo", message: "궁합 기능 UI 개편이 이번 주 GTM 캠페인과 겹치는지 확인 요청")
```

리더(`/team` 실행 세션)가 직접 여러 부서장을 호출해 결과를 종합하는 것도 가능합니다 (`.claude/commands/team.md` 참조).

## 6. 네이밍 규약

| 이름 | 유형 | 역할 | 비고 |
|---|---|---|---|
| `growth-strategist` (구 `marketer`) | agent | CRO/카피 **제안**, 발행 없음 | `cmo`/`social-media-marketer`(실제 발행 집행)와 혼동 주의 — 서로 다른 팀 |
| `cmo`, `content-writer`, `social-media-marketer`, `performance-analyst` | agent | 실제 콘텐츠 발행/마케팅 실행 | GitHub Actions 자동화 대상, 무변경 |
| `cpo` | agent | 부서장, 전체 도구 상속 + SendMessage로 위임/협의 | `tools:` 미선언 (CMO와 동일 패턴) |
| `cto` | agent | 부서장, `tools:` 화이트리스트로 제한 + SendMessage로 위임/협의 | 업무 무관 MCP(figma/tosspayments-docs/gmail/calendar/drive) 스키마 로드 방지 목적의 예외. 상세는 8번 변경 이력 참조 |
| `planner`, `designer`, `growth-strategist`, `fullstack`, `ai-dev`, `ziwei-expert` | agent | IC(실무자), `tools:` 화이트리스트로 권한 하드 제한 | 상세는 각 파일 frontmatter 참조 |

## 7. 공통 제약 (모든 부서장/IC 동일 적용)

- 허락 없이 git commit/push 금지 (`CLAUDE.md` "작업 규칙")
- DB 파괴적 작업은 `.claude/rules/database-safety.md` 준수
- `tools:` frontmatter는 도구 단위 제한만 지원 — 경로 단위 스코프(예: planner는 `specs/`만)는 각 에이전트 본문의 프롬프트 지시 수준으로 강제되는 소프트 가드입니다. 하드 차단이 필요하면 별도로 `.claude/settings.json`의 permission 규칙을 검토하세요.

## 8. 변경 이력

- 2026-08-11: CTO/CPO 신설, 6개 페르소나 커맨드 → 서브에이전트 전환, `marketer` → `growth-strategist` 개명, 레거시 메모리 시스템 정리
- 2026-08-13: CTO 토큰 사용량(세션 46%) 원인 조사 후 2건 수정.
  1. `fullstack`의 `Agent` 툴 제거 — 유일하게 IC가 IC를 직접 스폰할 수 있던 경로였고, `ziwei-expert`/`ai-dev`까지 콜드 스폰이 3단 중첩되며 같은 컨텍스트(CONTEXT.md, 관련 코드)를 매 단계 재도출하던 게 주요 원인. 이제 fullstack은 교차검증 필요성을 최종 보고서에 남기고, CTO가 위임을 판단하는 단일 스폰 지점 구조로 변경.
  2. `cto`에 `tools:` 화이트리스트 추가 — figma/tosspayments-docs/gmail/calendar/drive 등 업무 무관 MCP 스키마가 매 턴 로드되던 것을 방지. `cpo`/`cmo`는 기존 전체 상속 패턴 유지(사용자 확인 하에 CTO만 예외 처리).
