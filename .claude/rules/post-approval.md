---
description: 콘텐츠 발행 승인 프로세스 - AI 자체 체크리스트 기반 완전 자동화
globs:
  - "docs/**"
  - "scripts/marketing/**"
---

# 포스트 승인 규칙

## 원칙

**모든 콘텐츠는 AI 자체 체크리스트를 통과하면 자동 발행한다.** 사용자 승인 단계는 없다. 수동 호출이든 스케줄러든 동일한 기준을 적용한다.

## AI 자체 승인 체크리스트

아래 11개 항목을 **전부 통과**해야 발행한다. 하나라도 실패하면 발행을 건너뛰고 실패 사유를 social-tracker.csv에 `status=failed`, notes 컬럼에 기록한다.

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

## 발행 절차

1. 초안 작성 후 11개 체크리스트 자체 검증
2. 전부 통과 → social-tracker.csv에 `status=approved` 기록
3. `node scripts/marketing/post-to-x.js --text "내용" --via-github` 실행
4. `marketing-proxy.yml`의 `post-to-x`가 발행 + Discord 알림 자동 처리
5. social-tracker.csv status를 posted로 업데이트
6. 체크리스트 실패 항목이 있으면 `status=failed`, notes 컬럼에 실패 사유 기록 (Discord 알림 발송 안 함 — 노이즈 방지)

## 자동 발행 안전 장치

- **동시 실행 금지**: 같은 시간대(T1~T6)에 이미 posted 기록이 있으면 작성 중단
- **일일 상한**: 하루 X 포스트 4건 초과 금지 (weekly-plan 기준)
- **Kill switch**: `docs/strategy/auto-post-disabled` 파일이 존재하면 모든 자동 발행을 건너뛰고 Discord로 알림만 발송

## 기록

social-tracker.csv에 한 행씩 기록:

| status | 의미 |
|--------|------|
| draft | 작성 중 |
| approved | 체크리스트 통과, 발행 직전 |
| posted | 발행 성공 |
| failed | 체크리스트 실패 또는 발행 실패 (notes에 사유) |
