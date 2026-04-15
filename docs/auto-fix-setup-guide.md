# Auto-Fix 파이프라인 셋업 가이드 (Phase 1: 관측)

본 문서는 `docs/auto-fix-pipeline-plan.md` Phase 1을 실제로 가동하기 위해
사람이 수동으로 해야 할 작업을 정리합니다.

## 0. 준비물 요약

| 항목 | 어디서 | 등록 위치 |
|------|--------|-----------|
| Discord 운영 채널 웹훅 | Discord 신규 채널 → Integrations → Webhook | Supabase + GitHub Secrets |
| Supabase Access Token | supabase.com → Account → Access Tokens | GitHub Secrets |
| Supabase Project Ref | Supabase 대시보드 → Project Settings → General | GitHub Secrets |
| Vercel Log Drain Secret | 자동 생성 | Supabase Function secret |

## 1. Discord 운영 채널 + 웹훅 생성

1. Discord 서버에서 신규 채널 생성 (예: `#ops-alerts`)
2. 채널 설정 → Integrations → Webhooks → New Webhook
3. 이름: `Error Watch`
4. Webhook URL 복사 → 아래 두 곳에 등록:
   - **Supabase Edge Function secret**: `DISCORD_OPS_WEBHOOK`
   - **GitHub Repository Secrets**: `DISCORD_OPS_WEBHOOK`

## 2. Supabase Edge Function 배포

### 2.1 로컬에서 배포

```bash
supabase functions deploy ingest-error --project-ref <PROJECT_REF>
```

### 2.2 환경변수(Secret) 등록

```bash
supabase secrets set \
  VERCEL_LOG_DRAIN_SECRET=<아래 3번에서 복사> \
  DISCORD_OPS_WEBHOOK=<1번에서 복사> \
  PHASE=observe \
  --project-ref <PROJECT_REF>
```

> `PHASE=observe`는 Phase 1 관측 모드(Discord 알림만). Phase 2 전환 시
> `PHASE=dispatch`로 변경하고 `GITHUB_DISPATCH_TOKEN`, `GITHUB_REPO` 추가.

### 2.3 엔드포인트 URL 확인

배포 완료 시 출력되는 URL을 기록:
```
https://<PROJECT_REF>.supabase.co/functions/v1/ingest-error
```

## 3. Vercel Log Drain 연결

1. Vercel Dashboard → 프로젝트 선택 → **Settings** → **Log Drains**
2. **Add Log Drain** 클릭
3. 설정:
   - Delivery: **HTTPS JSON**
   - Endpoint URL: 2.3의 Supabase Function URL
   - Sources: **Functions** + **Edge Functions** 2개 체크
     (Static Files / Rewrites / Redirects / Firewall / Builds는 체크 안 함)
   - Environments: Production + Preview (선택)
4. 생성 후 **Secret** 값 복사 → Supabase secret의 `VERCEL_LOG_DRAIN_SECRET`
   에 동일 값 등록 (2.2의 placeholder 교체)
5. "Send Test Event" 버튼으로 연결 테스트 (Discord 채널에 메시지 오는지 확인)

## 4. Supabase 에러 폴링용 GitHub Secrets 등록

Repo → Settings → Secrets and variables → Actions → **New repository secret**

| 이름 | 값 |
|------|-----|
| `SUPABASE_ACCESS_TOKEN` | supabase.com Account → Access Tokens에서 생성 |
| `SUPABASE_PROJECT_REF` | Supabase 대시보드 Project Settings → General → Reference ID |
| `DISCORD_OPS_WEBHOOK` | 1번 웹훅 URL |

## 5. 동작 확인

### 5.1 Vercel 로그 드레인 경로
- 앱에서 의도적으로 500 에러 발생시키기 (예: 임시 throw)
- 몇 초 내 Discord `#ops-alerts` 채널에 🚨 알림 도착 확인

### 5.2 Supabase 폴링 경로
- Actions 탭 → **Poll Supabase Errors** 워크플로 → `Run workflow` 수동 실행
- 실행 완료 후 Discord 확인 (최근 1시간 에러 요약)

### 5.3 Guarded path 필터 확인
- `app/api/pay/*` 경로에서 에러 발생 시 🛡️ Guarded 태그로 와야 함 (🚨 아님)

## 5.5 Phase 2 전환 (Draft PR 자동화)

Phase 1로 1주 관측 후 fingerprint 품질과 노이즈가 허용 범위라고 판단되면 Phase 2로 전환합니다.

### 5.5.1 Claude OAuth 토큰 발급

로컬에서:
```bash
claude setup-token
```
출력된 토큰 복사.

### 5.5.2 GitHub Secrets 추가 등록

Repo → Settings → Secrets and variables → Actions:

| 이름 | 값 |
|------|-----|
| `CLAUDE_CODE_OAUTH_TOKEN` | 5.5.1에서 복사한 토큰 |

### 5.5.3 Supabase Secrets 추가/변경

```bash
# Phase 2 전환 (MCP 또는 Supabase Studio에서 등록)
PHASE=dispatch
GITHUB_DISPATCH_TOKEN=<GitHub fine-grained PAT (repo contents/actions write 권한)>
GITHUB_REPO=LinkDropper/life-spoiler
```

GitHub PAT 발급:
- GitHub Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
- Repository access: `LinkDropper/life-spoiler` 선택
- Permissions: **Actions: Read and write**, **Contents: Read** (dispatch는 Actions write 권한)
- 만료일 설정 (권장 6개월)

### 5.5.4 동작 확인

1. **수동 트리거**: Actions → Auto Fix from Logs → Run workflow
   - `fingerprint`: 임의값 `test-manual-01`
   - `error_type`: `ManualTrigger`
   - `message`: `수동 테스트`
2. 기대 결과: Claude가 실행되어 SKIP_REASON 출력 (실제 에러 아니므로) → Discord에 `🤔 Auto-Fix 커밋 없음` 알림

3. **실제 에러 재현**: 개발 환경에서 의도적 TypeError 발생 → 수 초 내 Discord에 `✅ Auto-Fix PR 생성됨` 알림 + PR URL

### 5.5.5 Phase 2 안전 장치 재확인

- AUTO_FIX_DISABLED 파일로 즉시 비활성화 가능
- Guarded path는 Edge Function + 워크플로 + Claude 프롬프트 3중 필터
- 같은 fingerprint PR 3회 제한 + 24시간 쿨다운
- 모든 PR은 **Draft**로 생성, 리뷰어 `AGLOP-1354` 자동 지정
- Auto-merge 금지 (정책)

## 6. Phase 1 운영 기간 (권장 1주)

- Discord 알림 빈도/품질 관찰
- Fingerprint가 의미 있게 묶이는지, 노이즈는 어느 정도인지 기록
- 필요 시 `poll-supabase-errors.js`의 필터 조건 조정
- 1주 뒤 평가 → Phase 2(Draft PR 자동화) 착수 여부 결정

## 7. Kill Switch (전체 비활성화)

**Vercel → Supabase 경로 차단**: Vercel Log Drain을 일시 비활성화

**Supabase 폴링 차단**: GitHub Actions → Poll Supabase Errors → 비활성화

**Phase 2 이후 GitHub Actions 자동 수정 차단**: repo 루트에 빈 파일 생성
```bash
touch AUTO_FIX_DISABLED && git commit -am "kill switch: auto-fix disabled"
```

## 8. 트러블슈팅

| 증상 | 원인/대응 |
|------|-----------|
| Discord에 아무 알림도 안 옴 | Vercel Log Drain의 "Send Test Event" 실행. 401이면 `VERCEL_LOG_DRAIN_SECRET` 불일치 |
| `invalid signature` 로그 | Supabase secret의 secret 값이 Vercel Log Drain과 다름 |
| Supabase 폴링이 401 | `SUPABASE_ACCESS_TOKEN` 만료. 재발급 후 secret 교체 |
| 알림이 폭주 | `PHASE=observe` 유지한 채 필터 범위 축소 (5xx만, 특정 환경만) |
| 같은 에러가 폴링 시마다 다시 알림 | Phase 1은 의도된 동작. Phase 2의 GitHub 라벨 dedup에서 해결 |
