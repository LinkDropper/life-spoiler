# 자동 오류 수정 파이프라인 구현 계획

> Vercel/Supabase에서 런타임 에러 발생 시, Claude가 자동으로 원인 분석 → 수정 → 검증 → PR 생성하는 파이프라인.
>
> - **트리거**: 이벤트 기반 (Push/Webhook, Vercel Log Drain)
> - **인증**: Claude OAuth (Max 플랜 한도 사용, 추가 API 요금 없음)
> - **상태 저장소**: GitHub 자체 (브랜치/PR/라벨) — 별도 DB 없음
> - **목표 MTTR**: 에러 발생 → PR 생성까지 5분 이내

## 1. 전체 아키텍처

```
┌─────────────────┐        ┌──────────────────────┐
│  Vercel Runtime │        │  Supabase Postgres/  │
│  (5xx, uncaught)│        │  Edge Function 에러  │
└────────┬────────┘        └──────────┬───────────┘
         │ Log Drain (HTTPS)          │ get_logs 폴링 (cron)
         ▼                            ▼
   ┌────────────────────────────────────────┐
   │  Supabase Edge Function: /ingest-error │
   │  (얇은 프록시 — 상태 저장 없음)        │
   │  - 서명 검증                             │
   │  - 5xx/uncaught 필터                    │
   │  - guarded path 필터                    │
   │  - fingerprint 생성                      │
   │  - GitHub repository_dispatch 호출      │
   └───────────────┬────────────────────────┘
                   │ repository_dispatch API
                   ▼
   ┌────────────────────────────────────────┐
   │  GitHub Actions: auto-fix-from-logs    │
   │  - dedupe: fix/auto-<fp> 브랜치/PR 존재│
   │    여부로 판단 (GitHub이 상태 저장소)  │
   │  - Claude Code Action (OAuth)          │
   │  - 분석 → 수정 → 테스트 → PR          │
   └───────────────┬────────────────────────┘
                   │
                   ▼
            ┌─────────────┐     ┌──────────────┐
            │  Auto PR    │────▶│ Discord 알림 │
            └─────────────┘     └──────────────┘
```

## 2. 구성 요소별 상세 설계

### 2.1 상태 저장소: GitHub 자체

별도 DB 없이 GitHub의 기존 리소스를 상태로 활용:

| 상태 | GitHub에서의 표현 |
|------|-------------------|
| 같은 에러 처리 중 | 브랜치 `fix/auto-<fingerprint>` 존재 |
| 이미 PR 열림 | 해당 브랜치에 open PR 존재 |
| 처리 시도 횟수 | 라벨 `auto-fix` + fingerprint 라벨을 가진 전체 PR 수 |
| 쿨다운 | 같은 fingerprint 라벨의 가장 최근 closed PR 시각 |
| 전체 비활성화 (kill switch) | repo 루트에 `AUTO_FIX_DISABLED` 파일 존재 |

**fingerprint 라벨 표기**: `fp:<hash-12자>` (GitHub 라벨 길이 제한 대응)

### 2.2 Supabase Edge Function: `ingest-error` (얇은 프록시)

**경로**: `supabase/functions/ingest-error/index.ts`

**책임** (상태 저장 없음, 단방향 전달만):
1. Vercel Log Drain payload 파싱 (NDJSON)
2. Vercel 서명 (`x-vercel-signature`) 검증
3. 필터링:
   - `level=error` + HTTP 5xx 또는 uncaught exception만
   - guarded path 1차 필터 (§7.1 참조) — 매칭 시 Discord 알림만 발송 후 종료
4. fingerprint 생성: `sha256(error.name + first_app_frame).slice(0, 12)`
5. PII 마스킹 (이메일/토큰/UUID 패턴)
6. GitHub `POST /repos/LinkDropper/life-spoiler/dispatches` 호출
   - `event_type: error-detected`
   - `client_payload`: fingerprint, source, error_type, message, stack, path, raw_excerpt
7. 에러/스킵 시 Discord 알림 발송

**환경 변수**:
- `GITHUB_DISPATCH_TOKEN` — repo dispatch 권한 fine-grained PAT
- `VERCEL_LOG_DRAIN_SECRET` — drain 서명 검증용
- `DISCORD_WEBHOOK_URL` — 알림용

**Note**: dedup/cooldown/attempts는 Edge Function에서 판단하지 않고 **GitHub Actions 워크플로 시작부**에서 처리. Edge Function은 빠르게 dispatch만 하고 응답 반환.

### 2.3 Vercel Log Drain 설정

1. Vercel Dashboard → Project → Settings → Log Drains
2. 신규 Drain 생성:
   - Delivery: HTTPS JSON
   - Endpoint: `https://<supabase-ref>.supabase.co/functions/v1/ingest-error`
   - Sources: `Runtime Logs` 체크
   - Secret: 자동 생성된 값을 `VERCEL_LOG_DRAIN_SECRET`으로 복사
3. Edge Function에서 `x-vercel-signature` HMAC-SHA1 검증

### 2.4 GitHub Actions 워크플로

**파일**: `.github/workflows/auto-fix-from-logs.yml`

```yaml
name: Auto Fix from Logs

on:
  repository_dispatch:
    types: [error-detected]

concurrency:
  group: auto-fix-${{ github.event.client_payload.fingerprint }}
  cancel-in-progress: false

jobs:
  fix:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: write
      pull-requests: write
      issues: write
    env:
      FP: ${{ github.event.client_payload.fingerprint }}
      BRANCH: fix/auto-${{ github.event.client_payload.fingerprint }}
      GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: develop

      - name: Kill switch check
        run: |
          if [ -f AUTO_FIX_DISABLED ]; then
            echo "Auto-fix disabled via AUTO_FIX_DISABLED file"
            exit 0
          fi

      - name: Dedup via GitHub state
        id: dedup
        run: |
          # 같은 fingerprint 브랜치가 이미 있으면 skip
          if git ls-remote --exit-code --heads origin "$BRANCH" > /dev/null; then
            echo "Branch $BRANCH already exists — skip"
            echo "skip=true" >> $GITHUB_OUTPUT
            exit 0
          fi

          # fingerprint 라벨 붙은 PR 3개 이상이면 attempts 초과
          LABEL="fp:$FP"
          COUNT=$(gh pr list --state all --label "$LABEL" --json number -q 'length')
          if [ "$COUNT" -ge 3 ]; then
            echo "Exceeded 3 attempts for $FP — skip"
            echo "skip=true" >> $GITHUB_OUTPUT
            exit 0
          fi

          # 같은 fingerprint로 최근 24h 내 closed PR이 있으면 쿨다운
          RECENT=$(gh pr list --state closed --label "$LABEL" \
            --json closedAt -q '.[0].closedAt // empty')
          if [ -n "$RECENT" ]; then
            RECENT_EPOCH=$(date -d "$RECENT" +%s 2>/dev/null || echo 0)
            NOW=$(date +%s)
            if [ $((NOW - RECENT_EPOCH)) -lt 86400 ]; then
              echo "In cooldown window for $FP — skip"
              echo "skip=true" >> $GITHUB_OUTPUT
              exit 0
            fi
          fi

          echo "skip=false" >> $GITHUB_OUTPUT

      - uses: pnpm/action-setup@v4
        if: steps.dedup.outputs.skip != 'true'
      - uses: actions/setup-node@v4
        if: steps.dedup.outputs.skip != 'true'
        with:
          node-version: 20
          cache: pnpm

      - name: Install deps
        if: steps.dedup.outputs.skip != 'true'
        run: pnpm install --frozen-lockfile

      - name: Ensure labels exist
        if: steps.dedup.outputs.skip != 'true'
        run: |
          gh label create "auto-fix" --color "D73A4A" --force || true
          gh label create "needs-review" --color "FBCA04" --force || true
          gh label create "fp:$FP" --color "C5DEF5" --force || true

      - name: Create fix branch
        if: steps.dedup.outputs.skip != 'true'
        run: |
          git config user.name "claude-auto-fix"
          git config user.email "claude@life-spoiler.local"
          git checkout -b "$BRANCH"

      - name: Run Claude Code
        if: steps.dedup.outputs.skip != 'true'
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            # 자동 오류 수정 작업

            ## 감지된 에러
            ```json
            ${{ toJSON(github.event.client_payload) }}
            ```

            ## 작업 순서 (반드시 순서 준수)

            1. **판단 게이트**: 아래 중 하나라도 해당하면 수정하지 말고
               `SKIP_REASON=<사유>`를 출력하고 종료 (커밋 금지):
               - 외부 API/업스트림 장애 (Gemini, Supabase 네트워크 등)
               - 400대 사용자 입력 오류
               - 환경변수/인프라 설정 누락
               - 스택트레이스가 앱 코드를 가리키지 않음
               - 스택트레이스/변경 필요 파일이 guarded path 포함:
                 `app/api/pay/**`, `app/api/auth/**`, OAuth 콜백,
                 `libs/services/oauth/**`, `supabase/migrations/**`,
                 `env.ts`, `.env*`

            2. **원인 분석**: 스택트레이스의 앱 코드 위치를 Grep으로 찾아
               근본 원인 1문단으로 정리.

            3. **최소 수정**: 증상이 아닌 원인을 고치는 최소 변경.
               리팩토링/주변 정리 금지 (CLAUDE.md 규칙 준수).

            4. **재현 테스트 추가**: Jest로 수정 전에는 실패, 후에는 통과하는
               테스트를 `__tests__/` 아래 추가.

            5. **검증**: `pnpm lint && pnpm test` 통과 확인.
               실패 시 수정 반복. 3회 실패 시 포기하고 `SKIP_REASON` 출력.

            6. **커밋**: 현재 브랜치에 커밋.
               메시지: `fix: <한 줄 요약> (auto fp:${{ env.FP }})`

          allowed_tools: "Bash(pnpm *),Edit,Read,Grep,Glob,Write"

      - name: Push & open PR
        if: steps.dedup.outputs.skip != 'true' && success()
        id: pr
        run: |
          if [ -z "$(git log origin/develop..HEAD 2>/dev/null)" ]; then
            echo "No commits — Claude skipped. Exiting."
            echo "created=false" >> $GITHUB_OUTPUT
            exit 0
          fi
          git push -u origin "$BRANCH"
          PR_URL=$(gh pr create \
            --base develop \
            --title "[auto-fix] ${{ github.event.client_payload.error_type }}" \
            --body-file .github/auto-fix-pr-template.md \
            --label "auto-fix,needs-review,fp:$FP" \
            --reviewer AGLOP-1354 \
            --draft)
          echo "pr_url=$PR_URL" >> $GITHUB_OUTPUT
          echo "created=true" >> $GITHUB_OUTPUT

      - name: Notify Discord
        if: always()
        run: node scripts/ops/notify-auto-fix.js \
          --status "${{ job.status }}" \
          --fingerprint "$FP" \
          --pr-url "${{ steps.pr.outputs.pr_url }}" \
          --skipped "${{ steps.dedup.outputs.skip }}"
```

### 2.5 OAuth 토큰 발급 및 등록

1. 로컬에서 `claude setup-token` 실행
2. 출력된 토큰을 GitHub repo Secrets에 등록:
   - 이름: `CLAUDE_CODE_OAUTH_TOKEN`
3. Max 플랜 한도를 GitHub Actions가 소진 → 로컬 Claude Code와 한도 공유됨에 유의

### 2.6 안전 장치

| 장치 | 구현 위치 | 목적 |
|------|-----------|------|
| 브랜치 존재로 dedup | Actions `dedup` step (`git ls-remote`) | 같은 에러로 PR 폭주 방지 |
| fingerprint 라벨 PR 수 제한 (≤3) | Actions `dedup` step (`gh pr list`) | 무한 재시도 방지 |
| 최근 closed PR 24h 쿨다운 | Actions `dedup` step | PR 머지 전 재트리거 방지 |
| `concurrency group` | Actions `concurrency` | 동일 fingerprint 동시 실행 차단 |
| `timeout-minutes: 20` | Actions job 설정 | 런어웨이 방지 |
| `AUTO_FIX_DISABLED` 파일 | repo 루트 kill switch | 전체 파이프라인 비활성화 |
| Guarded path 1차 필터 | Edge Function | 민감 경로 dispatch 차단 |
| Guarded path 2차 확인 | Claude 프롬프트 판단 게이트 | Edge Function 우회 시 방어 |
| PII 마스킹 | Edge Function | 로그 내 민감정보 제거 |
| Draft PR + Auto-merge 금지 | PR 옵션 `--draft` + 정책 | 항상 사람 리뷰 필수 |

## 3. 구현 체크리스트 (MVP 순서)

### Phase 1: 관측 (수정 자동화 없이 수집만) — 1~2일
- [ ] `supabase/functions/ingest-error/` Edge Function 작성
      (dispatch 대신 Discord 알림만 발송하는 모드로 시작)
- [ ] Vercel Log Drain 연결
- [ ] Supabase 자체 에러 폴링: `scripts/ops/poll-supabase-errors.js` (cron 1h)
- [ ] 1주일 운영하며 fingerprint 품질/노이즈 비율 확인

### Phase 2: Draft PR 자동화 — 2일
- [ ] GitHub Secrets 등록:
  - `CLAUDE_CODE_OAUTH_TOKEN`
  - Edge Function용 `GITHUB_DISPATCH_TOKEN` (Supabase에 등록)
- [ ] `.github/workflows/auto-fix-from-logs.yml` 작성
- [ ] `.github/auto-fix-pr-template.md` 작성
- [ ] `scripts/ops/notify-auto-fix.js` 작성
- [ ] Edge Function을 `repository_dispatch` 호출 모드로 전환
- [ ] **Draft PR만 생성** — 자동 머지 없음, 항상 사람 리뷰
- [ ] 첫 주엔 트리거 조건 보수적으로 운영, Discord 알림 모니터링

### Phase 3: 튜닝 — 지속
- [ ] 판단 게이트 정확도 측정 (Claude가 SKIP한 것 중 실제 수정 필요했던 비율)
- [ ] PR 머지율 추적 → 낮으면 프롬프트/허용 범위 조정
- [ ] 트리거 조건 조정
- [ ] 월 OAuth 토큰 한도 사용량 모니터링

## 4. 파일 구조 (신규 추가)

```
.github/
├── workflows/
│   └── auto-fix-from-logs.yml          (신규)
└── auto-fix-pr-template.md             (신규)

scripts/
└── ops/
    ├── notify-auto-fix.js              (신규)
    └── poll-supabase-errors.js         (신규, Phase 1 보조)

supabase/
└── functions/
    └── ingest-error/
        └── index.ts                    (신규)

docs/
└── auto-fix-pipeline-plan.md           (본 문서)
```

**신규 DB 테이블/마이그레이션 없음.**

## 5. 비용/한도 예상

- **Claude OAuth**: Max 플랜 한도 공유. 에러 1건 처리 시 Opus 토큰 수만~수십만 추정.
  에러 하루 5건 가정 시 Max 한도에 무리 없음. 폭주 시 kill switch로 대응.
- **GitHub Actions**: Private repo 분당 요금 발생. 건당 5~10분 × 하루 N건 → 월 수천 원 수준.
- **GitHub API rate limit**: dedup step에서 호출 2~3회/트리거. 문제 없음.
- **Supabase Edge Function**: 무료 티어 내 충분.
- **Vercel Log Drain**: Pro 플랜 포함.

## 6. 실패 모드와 대응

| 실패 모드 | 대응 |
|-----------|------|
| Claude가 잘못된 수정으로 새 에러 유발 | 새 fingerprint로 다시 트리거 가능 → `fp:` 라벨 PR ≤3 제한 |
| Log Drain이 조용히 끊김 | Phase 1 폴링 스크립트를 백업으로 유지 (cron 1h) |
| OAuth 토큰 만료 | Action 실패 → Discord 알림 → 수동 재발급 |
| GitHub API rate limit | dedup 호출을 한 번의 워크플로 안에서 최소화 |
| 한 에러가 여러 파일에 걸쳐 대규모 수정 필요 | Claude가 SKIP → 사람에게 핸드오프 |
| fingerprint 충돌 (서로 다른 에러가 같은 해시) | 해시 길이 12자로 충분히 낮음. 문제 시 라벨 삭제 후 재트리거 |

## 7. 운영 정책 (확정)

| 항목 | 결정 |
|------|------|
| Vercel 플랜 | Pro — Log Drain 방식 사용 |
| 상태 저장소 | GitHub (브랜치/PR/라벨), 별도 DB 없음 |
| Base 브랜치 | `develop` 고정 |
| 머지/배포 | 수동 (Discord 알림 보고 사람이 처리) |
| 리뷰어 자동 지정 | `AGLOP-1354` |
| 야간 PR 생성 | 24시간 항상 허용 |
| 자동 수정 금지 경로 | 아래 금지 리스트 |

### 7.1 자동 수정 금지 경로 (Guarded Paths)

아래 경로에서 발생한 에러는 **감지/Discord 알림만** 수행하고 Claude 수정/PR은 건너뜁니다.

- `app/api/pay/**` — 결제 (토스페이먼츠 연동)
- `app/api/auth/**` — 인증 엔드포인트
- OAuth 콜백 경로 전체
- `libs/services/oauth/**`
- `supabase/migrations/**` — DB 마이그레이션
- `env.ts`, `.env*` — 환경변수 스키마/값

**구현 위치 2곳 (방어 심층화)**:
1. Edge Function `ingest-error`에서 path/stack 기반 1차 필터 — dispatch 자체를 막음
2. Claude 프롬프트의 판단 게이트에서 2차 확인 — 스택트레이스가 금지 경로를 포함하면 `SKIP_REASON=guarded-path` 출력 후 종료

### 7.2 PR 생성 시 설정

```
gh pr create \
  --base develop \
  --reviewer AGLOP-1354 \
  --label "auto-fix,needs-review,fp:<fingerprint>" \
  --draft
```

### 7.3 Discord 알림 이벤트

| 이벤트 | 내용 |
|--------|------|
| 신규 에러 감지 | fingerprint, path, error_type |
| Guarded path 에러 (수정 스킵) | fingerprint, path, "사람 확인 필요" |
| Dedup으로 스킵 | fingerprint, 사유 (브랜치 존재/attempts 초과/쿨다운) |
| Claude SKIP_REASON | 사유 + 에러 요약 |
| PR 생성 성공 | PR URL + 요약 |
| 워크플로 실패 | 실패 스텝 + Actions 로그 링크 |
