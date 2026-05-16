---
description: 콘텐츠 발행 승인 프로세스 - AI 자체 체크리스트 기반 완전 자동화
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 포스트 승인 규칙

## 원칙

**모든 콘텐츠는 AI 자체 체크리스트를 통과하면 자동 발행한다.** 사용자 승인 단계는 없다. 수동 호출이든 스케줄러든 동일한 기준을 적용한다.

## 발행 사전 게이트

발행 전 아래 게이트를 통과해야 한다. 실패 시 발행 중단 + `status=failed`로 기록.

### G2. 일일 발행 상한

- **1건/일**. 같은 날 X 플랫폼에 `status=posted` 기록이 이미 있으면 중단.
- `scripts/marketing/lib/safety-gate.js`의 `checkDailyLimit`이 강제.

### G4. 시각 jitter

- 슬롯 시각 그대로 발행 금지. 슬롯 시작 시각 + 랜덤(8~52)분 사이에 발행.
- 직전 7일 발행 시각의 분(minute)과 동일한 분에 발행하지 않음 (충돌 시 재추첨).
- `safety-gate.js`의 `computeJitterDelaySeconds`가 계산하고, GitHub Actions가 `sleep`으로 적용.

## AI 자체 승인 체크리스트

위 게이트를 통과한 후, 아래 14개 항목을 **전부 통과**해야 발행한다. 하나라도 실패하면 발행을 건너뛰고 실패 사유를 social-tracker.csv에 `status=failed`, notes 컬럼에 기록한다.

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
14. **본문 URL은 CTA형(`--type cta`)에서만 허용**. 그 외 유형(질문/지식/스토리/트렌드/공감)에는 어떤 URL도 포함하지 않는다. `safety-gate.js`의 `checkUrlPolicy`가 차단.

**중복/일관성**
10. `docs/social-tracker.csv` 최근 7일 기록 확인, 유사 주제/동일 문구 없음
11. `docs/strategy/weekly-plan.md`의 해당 시간대 업무와 일치

**학습 반영 (일반 포스트만 해당 — 실험 포스트는 면제)**
12. `docs/insights/learned-playbook.md`의 검증된 전술을 최대한 반영
13. 기각된 가설(`hypothesis-backlog.md` rejected 섹션)에 해당하는 패턴 사용 금지

## 발행 절차

1. 초안 작성 후 14개 체크리스트 자체 검증
2. 전부 통과 → social-tracker.csv에 `status=approved` 기록
3. `node scripts/marketing/post-to-x.js --text "내용" --summary "한 줄 요약" --type {cta|knowledge|question|story|trend|empathy} --via-github` 실행 (summary·type 필수)
4. `marketing-proxy.yml`의 `post-to-x`가 발행 + Discord 알림 자동 처리
5. social-tracker.csv status를 posted로 업데이트
6. 체크리스트 실패 항목이 있으면 `status=failed`, notes 컬럼에 실패 사유 기록 (Discord 알림 발송 안 함 — 노이즈 방지)

## 기록

social-tracker.csv에 한 행씩 기록:

| status | 의미 |
|--------|------|
| draft | 작성 중 |
| approved | 체크리스트 통과, 발행 직전 |
| posted | 발행 성공 |
| failed | 체크리스트 실패 또는 발행 실패 (notes에 사유) |
