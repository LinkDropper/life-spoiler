---
name: parallel-track-file-ownership
description: 병렬 IC 트랙을 띄울 때 공유 파일(translations.json 등)은 단일 소유자를 지정하고 나머지는 명시적으로 접근 금지시킨다
metadata:
  type: feedback
---

IC 에이전트를 병렬로 띄울 때 **파일 소유권을 프롬프트에 명시적으로 못박는다.** 각 트랙에 "당신이 건드려도 되는 파일은 이것뿐, 나머지는 다른 트랙이 작업 중이니 금지(읽기는 자유)"를 적는다.

**Why:** `messages/translations.json`은 거의 모든 기능 작업에서 건드리게 되는 공유 파일이라 병렬 트랙 간 충돌 1순위다. 소유자를 ui 트랙 하나로 고정하고 core 트랙은 "키 이름만 참조하고 json은 건드리지 말라"고 지시하니, 나중에 추가 키가 필요해졌을 때도 충돌 없이 소유자에게 몰아서 처리할 수 있었다.

**How to apply:**
- 분할 기준은 Phase가 아니라 **파일 집합의 서로소 여부**. 겹치면 분할하지 말고 순차 실행한다.
- 공유 파일(`messages/translations.json`, `components/*/index.ts` barrel, `app/home/page.tsx`)은 소유자 1명 지정.
- 비소유 트랙에는 "추가 키가 필요하면 직접 넣지 말고 최종 보고서로 알려라"를 넣는다 (보고 경로는 [[subagent-reporting-channel]]).
- `messages/translations.json`에는 로케일당 `profiles` 블록이 **2개**(최상위 / `faceSpoiler.profiles`) 있다. 키 추가 지시할 때 어느 쪽인지 라인 앵커로 못박지 않으면 오배치가 난다.
