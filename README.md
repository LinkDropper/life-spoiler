# life-spoiler

Next.js 15 + React 19 기반 프로젝트

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm
- **Test**: Jest
- **Lint/Format**: ESLint + Prettier

## 시작하기

```bash
pnpm install
pnpm dev
```

http://localhost:3000 에서 확인

## 주요 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # 린트 검사
pnpm test         # 테스트 실행
```

## AI 자동화 개발 (Claude Code)

이 프로젝트는 Claude Code를 활용한 자동화 개발 환경이 구축되어 있습니다.

### 개발 워크플로우

```
1. 명세서 작성     specs/{기능명}.md
        ↓
2. 기능 구현       /spec {기능명}
        ↓
3. 문서화          /w-context
        ↓
4. 테스트 작성     /create-jest
        ↓
5. PR 생성         /pr
        ↓
6. 리뷰 대기       Gemini Code Assist 자동 리뷰
        ↓
7. 리뷰 반영       /apply-review
        ↓
8. 머지
```

### 명령어 목록

| 명령어           | 설명                  |
| ---------------- | --------------------- |
| `/spec {명세서}` | 명세서 기반 기능 구현 |
| `/w-context`     | CONTEXT.md 문서 생성  |
| `/create-jest`   | 테스트 코드 생성      |
| `/pr`            | 커밋 및 PR 생성       |
| `/apply-review`  | PR 리뷰 자동 반영     |

### 명세서 작성

`specs/_template.md`를 참고하여 명세서를 작성합니다.

**네이밍 규칙**: `{순번}-{기능명}.md`

```
specs/
├── _template.md          # 템플릿
├── 001-logger.md         # 1번째 작업
├── 002-custom-fetch.md   # 2번째 작업
└── 003-social-login.md   # 3번째 작업
```

```bash
cp specs/_template.md specs/001-user-auth.md
# 명세서 작성 후
/spec 001-user-auth
```

### 프로젝트 규칙

- `CLAUDE.md`: AI 어시스턴트용 코드 컨벤션
- `CONTEXT.md`: 각 모듈별 설계 문서 (AI가 코드 파악 시 우선 참조)

## 디렉토리 구조

```
├── app/                 # Next.js 페이지
├── libs/                # 공용 라이브러리
│   ├── fetch/          # HTTP 클라이언트
│   ├── logger/         # 로깅
│   └── services/       # 외부 서비스
├── specs/              # 기능 명세서
└── .claude/commands/   # Claude 명령어
```
