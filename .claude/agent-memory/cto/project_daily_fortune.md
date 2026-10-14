---
name: project-daily-fortune
description: 오늘의 운세(무료·AI 없음·결정론) 대표 확정 범위와 구현 대기 상태
metadata:
  type: project
---

2026-10-13 기술 검토 완료, 대표 결정 확정. PRD(`specs/daily-fortune.md`) 확정 후 리더의 착수 지시가 오기 전까지 구현 대기.

대표 확정 사항:
1. 1차는 로그인+기존 profiles 기반만 (비로그인 입력 없음)
2. KO 먼저, EN/JA는 진입점 숨김
3. 결과 문구: 개발 중 AI로 초안 1회 생성 → ziwei-expert 검수 → 코드 상수로 고정 (런타임 LLM 호출 없음)
4. 내일 미리보기 제외, 공유 포함
5. `yearly.ts` 양력연도 문제는 별도 이슈
6. 流日 명궁 = 流月 명궁 + (음력일-1) (CPO 초안의 일지 대응안 대신 CTO/ziwei-expert안 채택)

기술 기준: 순수 함수 엔진 + 슬러그 append-only 문구 풀, DB 저장 없음, 간지는 korean-lunar-calendar `getChineseGapja()`(설날 경계), KST 자정 기준.

referrals RLS 비활성·마이그레이션 불일치(원격 월간구독 테이블 vs 로컬 007까지)는 대표 보고됨 — 승인 전 손대지 말 것.

**Why:** 재개 시 범위 재논의 없이 바로 위임하기 위해.
**How to apply:** 착수 지시가 오면 키 스키마 합의 → ziwei-expert(규칙·엔진·컷 시뮬레이션, 문구 검수) / fullstack(resolve·페이지·계측) 병렬 위임. [[project-friend-universe]] 선례 참조.

2026-10-13 CPO 회신으로 추가 확정: 엔진은 ziwei-expert안 전부 채택(분포 10/25/30/25/10, 시간 미상 12시진 평균×0.6). 등급명 5 빛나는 날 ~ 1 살펴 가는 날, 키워드 "오늘의 예고 키워드" 4종(색/소품/숫자/시간대, 방향은 Phase 2). 경로: /fortune/daily/[profileId](noindex), /daily/share, /daily(ko만 sitemap). 공유 토큰은 서명 없이 슬러그 화이트리스트 검증(보상 연계 시 서명 재검토). 문구 규모 확정: Phase 1 KO 목표 약 350, 상한 600(1,100안 기각), 슬롯 재설계는 ziwei-expert. CPO-CTO 미합의 항목 없음.

2026-10-14 Phase 1 구현 완료(feature/daily-fortune, 미커밋). build 통과, test는 기존 time.test.ts 1건만 실패, lint 에러는 전부 미수정 기존 파일. 엔진 상수로 되돌릴 수 있는 결정: DAILY_SLOT_VARIANT_STRATEGY(hl/ob/cb-exact cycle), DAILY_HL_ALIGN, DAILY_CAUTION.healthMaxLevel=1(건강 주의 7.3%), DAILY_ESTIMATED_LEVEL_MODE=own-cuts-compress. 미검증: 로그인 세션 실브라우저 375px, 카카오 템플릿 name 표시. ob 28일·hx 29일 미달은 CPO 수용(Phase 2 V 증설).
