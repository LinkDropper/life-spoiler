---
name: daily-fortune-engine-calibration
description: 오늘의 운세 엔진(1단계) 실측 결과 - 재등장 간격이 카탈로그 크기로 상한이 걸리는 이유, 시간 미상 수축의 함정, 실행법
metadata:
  type: project
---

오늘의 운세 엔진은 `libs/zi-wei-dou-shu/calculators/daily-fortune.ts`, 시뮬레이션은 `scripts/daily-fortune/simulate.ts`.
실행: `pnpm exec ts-node -r tsconfig-paths/register -O '{"module":"commonjs","moduleResolution":"node"}' --transpile-only scripts/daily-fortune/simulate.ts [--calibrate] [--strategy cycle]` (tsx 미설치, zsh는 `$var` 단어분리 안 함 주의).

- 슬러그 636개, 상한 650이라 V를 늘릴 여지가 사실상 없다. 동일 슬러그 재등장 간격 중앙값 ≈ 0.69 x 사람당 실효 슬러그 수라서 hl 29 / ob 28 / hx 29가 이론 상한 부근이고 cb·ca·kr·vr·tp는 구조적으로 30 미달.
- 시간 미상: 12시진 평균 자체가 표준편차를 0.48배로 줄인다(8.5 -> 4.1). 거기에 0.6을 더 곱하면 0.29배라 시간 확정 컷에서 84%가 3등급이 된다. 수축은 0이 아니라 모집단 중심(5.6)으로 해야 한쪽 쏠림이 없다.
- 流日 명궁은 월건 간이법이라 지지 위치가 전원 동일하다. 사람별 차이는 그 위치에 앉은 본명 별뿐이고, 건강(R-5)은 삼방이 다른 카테고리와 겹치지 않아 주의 포인트 31%를 차지한다.

**Why:** 다음에 V 증설이나 기준 완화 논의가 나오면 이 수치가 근거다.
**How to apply:** 엔진 상수(가중치, 컷)를 바꾸면 --calibrate로 컷을 다시 도출하고 DAILY_POINT_CENTER도 같이 갱신한다.

## 2단계 재조정 결과 (2026-10-14)
- 슬롯별 전략표 `DAILY_SLOT_VARIANT_STRATEGY`(calculator 안): hl/ob/cb=cycle, hx/vr/ca/tp/kr=hash. hx는 cycle이 hash보다 나쁨(23일 vs 29일). 시뮬 `--strategy slot|hash|cycle`, `--hx`.
- cycle의 부작용: cb 중앙값 16->27일이지만 7일내 재등장률 27%->43%(시간 미상 cb는 중앙값 12->6일). 같은 12일 블록 안에서 level+삼방 조합이 같으면 같은 슬러그이기 때문.
- ob는 cycle/hash 모두 28일로 30 미달(V=2, 구조 한계). hl 정렬은 고유 hl 64.7->90.6(cycle 효과 포함), 위반 0%.
- 건강 주의 포인트: level<=2 제한만으로 31.6->25.2%. 동률 순서를 바꿔도 변화 없음(점수 tie-break가 지배). `healthMaxLevel`=1이면 약 7%.
