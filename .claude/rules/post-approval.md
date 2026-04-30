---
description: 콘텐츠 발행 승인 프로세스 - AI 자체 체크리스트 기반 완전 자동화
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 포스트 승인 규칙

## 원칙

**모든 콘텐츠는 AI 자체 체크리스트를 통과하면 자동 발행한다.** 사용자 승인 단계는 없다. 수동 호출이든 스케줄러든 동일한 기준을 적용한다.

## ⚠️ 계정 안전 게이트 (최우선, 기존 11개 체크리스트보다 먼저 실행)

X 계정 재정지 방지를 위한 사전 게이트. 하나라도 실패하면 발행 즉시 중단하고 `status=failed`로 기록한다.

### G1. Kill switch 확인
- `docs/strategy/auto-post-disabled` 파일이 존재하면 발행 중단. Discord 알림만 발송, social-tracker.csv 기록 없음

### G2. Phase별 발행 상한 준수 (`docs/strategy/weekly-plan.md`의 Phase 표 참조)
- **Phase 1** (~2026-05-10): 일 1건. 같은 날 이미 `posted` 기록 있으면 중단
- **Phase 2** (2026-05-11~2026-05-26): 일 2건
- **Phase 3** (2026-05-27~): 일 3건

### G3. 같은 자연시(hour) 다중 발행 금지
- 직전 60분 이내 `posted` 기록 있으면 다음 슬롯으로 미룸 (3분할 운세 같은 봇 시그니처 차단)

### G4. 시각 jitter 적용
- 슬롯 시각 그대로 발행 금지. 슬롯 시작 시각 + 랜덤(8~52)분 사이에 발행
- 직전 7일 발행 시각의 분(minute)과 동일한 분에 발행하지 않음 (충돌 시 재추첨)

### G5. 외부 링크 비율 (Phase별)
- **Phase 1**: UTM 파라미터 포함 링크 0건. CTA형 카테고리 자체 금지
- **Phase 2**: 주 2건 이내 + 전체 발행의 25% 이내. 직전 7일 링크 포함 발행 ≥ 2건이면 중단
- **Phase 3**: 30% 이내

### G6. 콘텐츠 템플릿 반복 금지
- 직전 7일 동안 같은 별 이름(예: 탐랑성, 자미성) 또는 같은 궁 이름(예: 재물궁, 명궁)이 3회 이상 등장했으면 해당 키워드 사용 중단
- 일일 운세 형식("오늘의 운세 N/3") 같은 분할 포스트는 Phase 1·2에서 금지. Phase 3 진입 시 단일 포스트(분할 없음)로만 재도입 가능

### G7. Shadow ban 의심 자동 차단
- 직전 5건의 `posted` 평균 impressions < 30이면 발행 중단 + Discord 경고
- 동시에 `docs/strategy/auto-post-disabled` 파일 자동 생성 (사용자가 수동 검토 후 삭제)

## AI 자체 승인 체크리스트

위 G1~G7 게이트를 통과한 후, 아래 11개 항목을 **전부 통과**해야 발행한다. 하나라도 실패하면 발행을 건너뛰고 실패 사유를 social-tracker.csv에 `status=failed`, notes 컬럼에 기록한다.

**브랜드 보이스**
1. 존댓말 사용 (`~요`, `~습니다`) — 반말 금지
2. 금지 표현 미포함: "뼈 때리는", "소름 돋는", "충격적인", "대박", "인생역전", "운명을 바꿔라", "럭키 컬러", "99% 적중", "충격!", 느낌표/물음표 연속
3. 이모지 0~1개 (맥락 있을 때만)

**내용 품질**
4. 근거 기반 (자미두수 이론, 통계, 트렌드 등 출처 있는 정보). "감"으로 쓴 무지성 글 아님
5. CTA/행동 유도 문장에 자미두수 전문 용어 없음 (일반인 언어로 번역)
6. 의료/법률/투자 조언으로 오해될 표현 없음

**형식**
7. X 포스트: 단일 포스트 280자 이내 (스레드는 포스트당 280자)
8. 링크 포함 시 UTM 파라미터 완비 (`utm_source`, `utm_medium`, `utm_campaign` 모두 있음, 값은 소문자/하이픈)
9. 해시태그 2~4개

**중복/일관성**
10. `docs/social-tracker.csv` 최근 7일 기록 확인, 유사 주제/동일 문구 없음
11. `docs/strategy/weekly-plan.md`의 해당 시간대 업무와 일치

**학습 반영 (일반 포스트만 해당 — 실험 포스트는 면제)**
12. `docs/insights/learned-playbook.md`의 검증된 전술을 최대한 반영
13. 기각된 가설(`hypothesis-backlog.md` rejected 섹션)에 해당하는 패턴 사용 금지

## 발행 절차

1. 초안 작성 후 11개 체크리스트 자체 검증
2. 전부 통과 → social-tracker.csv에 `status=approved` 기록
3. `node scripts/marketing/post-to-x.js --text "내용" --via-github` 실행
4. `marketing-proxy.yml`의 `post-to-x`가 발행 + Discord 알림 자동 처리
5. social-tracker.csv status를 posted로 업데이트
6. 체크리스트 실패 항목이 있으면 `status=failed`, notes 컬럼에 실패 사유 기록 (Discord 알림 발송 안 함 — 노이즈 방지)

## 자동 발행 안전 장치 (요약)

위 G1~G7 게이트가 정식 안전 장치다. 아래는 운영 시 자주 참조하는 요약:

- **동시 실행 금지**: 같은 자연시(60분 window) 안에 이미 posted 기록이 있으면 작성 중단 (G3)
- **일일 상한**: Phase별 동적 (Phase 1: 1건, Phase 2: 2건, Phase 3: 3건). 정지 이전의 4건 상한은 폐기 (G2)
- **Kill switch**: `docs/strategy/auto-post-disabled` 파일이 존재하면 모든 자동 발행을 건너뛰고 Discord로 알림만 발송 (G1)
- **Shadow ban 자동 감지**: 평균 impressions < 30이면 자동 kill switch 활성화 (G7)

## 기록

social-tracker.csv에 한 행씩 기록:

| status | 의미 |
|--------|------|
| draft | 작성 중 |
| approved | 체크리스트 통과, 발행 직전 |
| posted | 발행 성공 |
| failed | 체크리스트 실패 또는 발행 실패 (notes에 사유) |
