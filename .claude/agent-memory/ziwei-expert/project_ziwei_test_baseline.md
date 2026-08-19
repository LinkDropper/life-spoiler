---
name: ziwei-lib-test-baseline
description: "libs/zi-wei-dou-shu 테스트 기존 실패 baseline — 2026-08-18 기준 1건(time.test.ts)만 남음"
metadata:
  type: project
---

`pnpm test libs/zi-wei-dou-shu`의 **기존 실패 baseline은 1건**이다 (2026-08-18 확인).

- `__tests__/time.test.ts` › "잘못된 형식에 대해 에러를 던진다"
  — `parseTimeToTimeBranch("invalid")`가 throw하지 않아 실패. 라이브러리에 입력 검증이 없다.

**Why:** ziwei-expert 에이전트 정의에는 "time.test.ts, wuxing.test.ts에 기존 실패 9건"이라고
적혀 있으나, `wuxing.test.ts`는 커밋 51af95c("오행국 테스트 기대값 오류 수정")에서 이미 고쳐졌다.
그 숫자를 믿고 "9건은 원래 깨져 있음"으로 넘기면 내가 새로 깨뜨린 테스트를 놓친다.

**How to apply:** 작업 후 전체 스위트를 돌려 `Tests: 1 failed` 초과면 내 변경이 원인이다.
확신이 안 서면 `git stash -u` 후 동일 스위트를 돌려 baseline을 실측한다.
