---
name: daily-fortune-ko-dictionary-review
description: 오늘의 운세 KO 사전 3단계 검수에서 확정한 문구 정책(hl은 level과 독립), 검수 도구 구성, 남은 리스크
metadata:
  type: project
---

KO 사전은 `libs/daily/dictionary/ko.ts`, 검수 테스트는 `libs/daily/__tests__/dictionary-quality.test.ts`.

- 엔진이 hl(주성 한 줄)을 총운 level과 독립으로 고른다. 3000건 실측: bright인데 총운 1~2가 약 23%, dark인데 4~5가 약 20%. 그래서 hl bright는 "기질이 기준점이 된다"(결과 단정 금지), dark는 "그 힘을 다른 곳에 쓰자"는 전환 제안으로 쓴다. 브레이크 톤(늦추고/쉬어/묵혀)은 테스트로 금지.
- hx(시간 미상)는 level 2~4만 나오므로 level 충돌이 없다.
- 어미 평탄화: 끝 2글자 기준 최빈 어미를 10% 안팎으로 눌러야 한 화면 3연속 동일 어미가 12% -> 4~5%로 준다. "충분해요/편해요"로 몰리지 않게 주의.

**Why:** 엔진 슬롯 전략이 바뀌면(CPO 회신 대기) 이 전제가 달라질 수 있다.
**How to apply:** 문구를 고칠 때 수정 스크립트 방식(슬러그->문구 JSON 패치 후 prettier)이 636개 편집에 효율적이었다. 스크래치 렌더 스크립트는 세션 스크래치패드에 있었고 저장소에는 없다.
