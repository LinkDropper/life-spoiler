---
description: 콘텐츠 발행 승인 프로세스 - 수동 호출과 자동 스케줄러 두 경로 지원
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 포스트 승인 규칙

## 원칙

콘텐츠 발행 경로는 두 가지이며, 각 경로의 승인 방식이 다르다.

| 경로 | 승인 방식 | 발행 주체 |
|------|----------|----------|
| 수동 호출 (로컬 CMO) | 사용자 최종 승인 | 사람 |
| 자동 스케줄러 (원격 트리거) | AI 자체 체크리스트 통과 시 자동 발행 | 스케줄러 |

## 경로 A: 수동 호출 (로컬 CMO)

### 1. 초안 작성

콘텐츠 라이터 또는 소셜 미디어 마케터가 초안을 작성한다.
- social-tracker.csv에 status=draft로 기록
- 초안 내용을 `docs/posts/drafts/`에 저장

### 2. 에이전트 팀 리뷰

CMO가 다른 마케팅 에이전트들에게 리뷰를 요청한다.
모든 마케터가 다음을 검토:

- 브랜드 보이스 준수 여부
- 금지 표현 포함 여부
- UTM 파라미터 정확성
- 콘텐츠 품질 및 정확성
- 중복 여부

### 3. 승인 기준

에이전트 전원 동의 시 사용자에게 최종 컨펌 요청. 사용자 승인 후 발행.

하나라도 반대가 있으면:
1. 반대 사유를 명시
2. 수정 후 재리뷰
3. 전원 동의 → 사용자 컨펌 → 발행

### 4. 발행

사용자 승인 완료 시:
1. social-tracker.csv status를 approved로 변경
2. 자동 발행 스크립트 실행 (X API)
3. 발행 후 status를 posted로 변경
4. Discord 알림은 `marketing-proxy.yml`의 `post-to-x` 작업이 자동으로 발송

## 경로 B: 자동 스케줄러 (원격 트리거)

원격 CCR 스케줄러는 사용자 승인을 받을 수 없으므로, AI가 **자체 체크리스트**를 통과시킨 후 자동 발행한다. 사용자 개입 없음.

### AI 자체 승인 체크리스트

아래 11개 항목을 **전부 통과**해야 발행한다. 하나라도 실패하면 발행을 건너뛰고 실패 사유를 social-tracker.csv에 `status=failed`, 메모에 기록한다.

**브랜드 보이스**
1. 존댓말 사용 (`~요`, `~습니다`) — 반말 금지
2. 금지 표현 미포함: "뼈 때리는", "소름 돋는", "충격적인", "대박", "인생역전", "운명을 바꿔라", "럭키 컬러", "99% 적중", "충격!", 느낌표/물음표 연속
3. 이모지 0~1개 (맥락 있을 때만)

**내용 품질**
4. 근거 기반 (자미두수 이론, 통계, 트렌드 등 출처 있는 정보). "감"으로 쓴 무지성 글 아님
5. CTA/행동 유도 문장에 자미두수 전문 용어 없음 (일반인 언어로 번역)
6. 의료/법률/투자 조언으로 오해될 표현 없음

**형식**
7. X 포스트: 280자 이내 (한국어 기준 140자 권장)
8. 링크 포함 시 UTM 파라미터 완비 (`utm_source`, `utm_medium`, `utm_campaign` 모두 있음, 값은 소문자/하이픈)
9. 해시태그 2~4개

**중복/일관성**
10. `docs/social-tracker.csv` 최근 7일 기록 확인, 유사 주제/동일 문구 없음
11. `docs/strategy/weekly-plan.md`의 해당 시간대 업무와 일치

### 발행 절차

1. 초안 작성 후 11개 체크리스트 자체 검증
2. 전부 통과 → social-tracker.csv에 `status=approved` 기록
3. `node scripts/marketing/post-to-x.js --text "내용"` 실행 (via-github)
4. `marketing-proxy.yml`의 `post-to-x`가 발행 + Discord 알림 자동 처리
5. social-tracker.csv status를 posted로 업데이트
6. 체크리스트 실패 항목이 있으면 `status=failed`, notes 컬럼에 실패 사유 기록

### 자동 발행 안전 장치

- **동시 실행 금지**: 같은 시간대(T1~T6)에 이미 posted 기록이 있으면 작성 중단
- **일일 상한**: 하루 X 포스트 4건 초과 금지 (weekly-plan 기준)
- **Kill switch**: `docs/strategy/auto-post-disabled` 파일이 존재하면 모든 자동 발행을 건너뛰고 Discord로 알림만 발송

## 승인 기록 (경로 A 전용)

초안 파일에 승인 이력을 남긴다:

```markdown
## 승인
- content-writer: approved
- social-media-marketer: approved
- performance-analyst: approved
- 사용자: approved -> 발행
```

경로 B는 social-tracker.csv의 `status` 및 `notes` 컬럼에 체크리스트 통과 여부를 기록한다.
