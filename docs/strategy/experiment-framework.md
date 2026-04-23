# 성장형 실험 프레임워크

CMO 에이전트가 매주 가설을 생성하고 실험을 통해 검증해 콘텐츠 전략을 점진적으로 개선하는 체계.

## North Star

**주간 사이트 활성 사용자 (GA4 `activeUsers`, 최근 7일)**

모든 실험의 성패는 이 지표 기여도로 판단한다. 개별 포스트 engagement(좋아요·리트윗)는 선행 지표로만 사용.

## 핵심 수치

| 항목 | 값 | 비고 |
|------|-----|-----|
| 주간 실험 콘텐츠 비율 상한 | **50%** | 주 X 포스트 16건 기준 최대 8건 |
| 연속 실패 시 escalation | **3주** | 3주 연속 실험 모두 기각되면 Discord 알림 + 자동 실험 일시 중단 |
| 실험 variant 최소 포스트 수 | 2건 | 1건은 노이즈, 최소 2건 |
| 통제군 | 최근 4주 검증된 플레이북 성과 평균 | |
| 채택 기준 | variant가 통제군 대비 activeUsers/post 기여도 **+20%** 이상 | |
| 기각 기준 | variant가 통제군 대비 **-20%** 이하 | |
| 그 사이 | **추가 관찰** (다음 주로 연장, 최대 2주) | |

## 파일 구조

| 파일 | 역할 | 수정 주체 |
|------|------|----------|
| `docs/insights/hypothesis-backlog.md` | 가설 풀. 상태 관리 (pending/running/validated/rejected/observing) | CMO가 일요일 생성·갱신 |
| `docs/insights/experiments.jsonl` | 실험 실행 로그. 실험별 메트릭과 결론 | CMO가 월·목·일 갱신 |
| `docs/insights/learned-playbook.md` | 검증된 전술. 포스트 작성 시 반드시 참조 | CMO가 일요일 갱신 |
| `docs/insights/marketing-insights.md` | 자유 서술 인사이트 (기존 유지) | CMO가 일요일 추가 |
| `docs/social-tracker.csv` | 개별 포스트 실적 (engagement_notes에 메트릭 역기록) | CMO가 월·목·일 갱신 |

## 실행 루프

### 일요일 T6 (21:00 KST) — 주간 리뷰 + 다음 주 설계

전체 절차가 길어 한 세션에서 처리하면 Anthropic API 스트림 idle timeout(2026-04-19 재발 사례) 위험이 크다. 아래 **A·B·C 3단계로 분리**하고 각 단계 종료 시점마다 **git commit + push**를 반드시 수행한다. commit 자체가 스트림 출력 이벤트로 작동해 idle timeout을 예방하며, 중간 실패 시 커밋 기록으로 재진입 지점을 판단한다.

각 단계 시작 전 최근 커밋 메시지(`[마케팅] YYYY-WNN 주간 리뷰 (A|B|C)`)를 확인해 어디까지 완료됐는지 파악하고 미완료 단계만 실행한다.

---

#### A단계 — 지난주 평가 (21:00 시작, 목표 15분 이내)

1. **지난주 실험 평가**
   - `experiments.jsonl`에서 status=running 실험 로드
   - 해당 실험의 variant 포스트별 메트릭 집계 (engagement + GA4 activeUsers per `utm_campaign=exp-*`)
   - 채택/기각/추가 관찰 판정 → `experiments.jsonl` status 갱신
   - 채택된 가설 → `learned-playbook.md`에 전술로 추가 (출처: `exp-YYYYWW-NN`)
   - 기각된 가설 → `hypothesis-backlog.md`에 상태 rejected로 이동 + 사유 기록

1.5. **상위 포스트 패턴 추출 (피드백 루프)**
   - 실험 외 일반 포스트의 GA4 `sessionCampaignName` 집계로 activeUsers/post 랭킹 도출
   - `ga4-metrics.js --type campaigns --days 28` 실행 → 최근 4주 누적 집계
   - **주간 관찰**: 최근 1주 상위 3건은 `marketing-insights.md`에 관찰 메모로만 기록 (전술 확정 안 함)
   - **누적 확정**: 최근 4주 누적 상위 10% 포스트 추출 → `social-tracker.csv`에서 본문·시간대·훅·이모지·CTA 유무 조회
   - 공통 패턴이 N≥3건에서 반복되면 `learned-playbook.md`에 전술로 추가 (출처: `상위 포스트 패턴 (YYYY-WNN~WMM 누적)`)
   - 기존 전술과 중복되는 패턴은 신규 등록 대신 효과 크기·검증일 갱신
   - 누적 포스트 20건 미만이면 "데이터 부족"으로 본 단계 skip
   - 실험 포스트(`utm_campaign=exp-*`)는 분석 대상에서 제외 (실험 경로에서 이미 +20%/-20% 기준 평가됨)

**A단계 체크포인트**: `git commit -m "[마케팅] YYYY-WNN 주간 리뷰 (A) - 실험 판정 + 상위 패턴 반영"` + push

---

#### B단계 — 가설 생성 (21:15 시작, 목표 15분 이내)

2. **연속 실패 체크**
   - 최근 3주 실험이 모두 기각 → Discord escalation 알림 + `docs/strategy/auto-post-disabled` 파일 생성하여 실험 자동 중단 (일반 포스트는 계속)

3. **트렌드 감지**
   - `scripts/marketing/naver-trends.js` 실행 → rising 키워드 추출
   - `x-metrics.js` 또는 X API로 트렌딩 토픽 조회
   - 운세/자미두수/MBTI/성격/연애 관련 키워드 발견 시 가설 후보로 등록

4. **가설 생성 (AI 자동)**
   - 최근 4주 데이터 + B.3 트렌드 기반으로 활성 사용자 기여도 패턴 파악
   - 3~5개 새 가설을 `hypothesis-backlog.md`에 status=pending으로 추가
   - 가설은 반드시 다음 형식:
     - **가정**: "T5 시간대에 질문형 포스트가 CTA형보다 activeUsers 기여 높을 것"
     - **근거**: "최근 4주 T5 질문형 평균 세션 기여 N, CTA형 M"
     - **검증 방법**: "다음 주 T5에 질문형 3건, CTA형 3건 발행 후 utm_campaign으로 세션 분리 측정"
     - **성공 기준**: "질문형이 CTA형 대비 activeUsers/post +20% 이상"

**B단계 체크포인트**: `git commit -m "[마케팅] YYYY-WNN 주간 리뷰 (B) - 가설 N개 등록"` + push

---

#### C단계 — 다음 주 설계 + Discord 종합 (21:30 시작, 목표 15분 이내)

5. **다음 주 실험 선정**
   - backlog에서 우선순위 높은 2~3개 선택 → status=running으로 변경
   - 실험 ID 부여 (`exp-{YYYYWW}-{seq}`, 예: `exp-202617-01`)
   - `experiments.jsonl`에 실험 등록 (실험 ID, variant 명세, 시작일, 평가일)
   - `weekly-plan.md`에 실험 슬롯 배정 (주 최대 8건)

6. **주간 Discord 종합**
   - 아래 "주간 종합 알림" 포맷으로 `scripts/marketing/discord-notify.js --username "CMO" --text "…"` 발송

**C단계 체크포인트**: `git commit -m "[마케팅] YYYY-WNN 주간 리뷰 (C) - 다음 주 실험 등록 + Discord 발송"` + push

---

#### 재진입·복구 규칙

| 상황 | 대응 |
|------|------|
| A단계 실행 중 API 오류 | 파일 변경 원복 없이 종료. 다음 일요일 자동 재시도 또는 수동 재실행. B·C는 스킵. |
| A 완료·B 실행 중 실패 | A의 판정 결과는 commit으로 보존됨. B부터 수동 재개. |
| B 완료·C 실행 중 실패 | 실험 등록(5단계)까지는 수동 완료 권장. Discord 알림(6단계)은 skip 가능(다음 일일 브리핑에 주간 요약 1줄만 포함). |
| 모든 단계 실패 | Discord escalation + 수동 개입. `auto-post-disabled` 생성하여 월요일 포스팅 자동 중단 고려. |

각 단계는 독립적으로 재실행 가능하며, 이미 완료된 단계의 commit을 건너뛰고 미완료 단계부터 이어서 수행한다.

### 월·목 T6 — 중간 메트릭 수집

1. `x-metrics.js`로 최근 7일 트윗 메트릭 조회
2. `social-tracker.csv`의 `engagement_notes` 컬럼에 `impressions=N likes=N rt=N clicks=N` 형식으로 역기록
3. 진행 중 실험의 중간 지표만 `experiments.jsonl`에 부분 업데이트 (최종 판정은 일요일)
4. **Discord 알림 없음** (내부 로그만)

### 매일 T1~T6 포스트 발행

1. `weekly-plan.md` 확인 → 현재 슬롯이 실험 배정 슬롯인지, 일반 슬롯인지 판단
2. 일반 슬롯: `learned-playbook.md` 최신 전술 적용해서 작성 → 기존 UTM 규칙
3. 실험 슬롯: `experiments.jsonl`에서 해당 실험 명세 확인 → variant에 맞춰 작성 → `utm_campaign=exp-{실험ID}-{variant}` 형식 사용
4. AI 자체 체크리스트 11개 검증 (post-approval.md) — 실험·일반 동일
5. 발행 + `social-tracker.csv` 기록 (실험 포스트는 notes에 실험 ID + variant 명시)

## UTM 규칙 확장

- 일반 포스트: `utm_campaign=YYYY-MM-주제` (기존 유지)
- 실험 포스트: `utm_campaign=exp-{실험ID}-{variant}`
  - 예: `utm_campaign=exp-202617-01-question` / `utm_campaign=exp-202617-01-cta`
  - variant 이름은 영문 소문자 하이픈만 사용

GA4에서 `utm_campaign` dimension으로 쿼리하면 실험별 activeUsers 분리 집계 가능.

## 주간 종합 알림 포맷 (일요일 T6 → Discord)

```
[주간 종합] YYYY-MM-DD ~ YYYY-MM-DD

North Star
- activeUsers: N명 (전주 대비 ±N%)
- 세션: N / 신규 사용자: N

지난주 실험 결과
- [exp-202616-01] 가설 요약: 채택 (+34% activeUsers/post vs 통제군)
- [exp-202616-02] 가설 요약: 기각 (-12%)
- [exp-202616-03] 가설 요약: 관찰 연장 (+8%, 유의수준 부족)

이번 주 실험
- [exp-202617-01] 가설 요약 (variant: A vs B)
- [exp-202617-02] 가설 요약

검증된 플레이북 (총 N개)
- 최근 추가: 전술 요약

X 활동
- 총 발행: N건 (실험 N / 일반 N)
- 총 impressions / likes / clicks

다음 주 제안
- 주요 방향
```

## 기각된 가설 재시도 규칙

- 기각 후 4주 내 동일·유사 가설 재시도 금지 (블랙리스트)
- 4주 경과 후엔 조건 바꿔서 재시도 가능 (예: 시간대만 변경)
