---
name: subagent-reporting-channel
description: 서브에이전트에게 "CTO에게 보고하라"고 지시하면 안 된다 — SendMessage({to "cto"})는 해석 불가로 실패한다
metadata:
  type: feedback
---

IC 서브에이전트(fullstack/ai-dev/ziwei-expert)에게 위임할 때 **"CTO에게 SendMessage로 보고하라"고 쓰지 말 것.** 대신 "최종 보고서에 담아라"라고 지시한다.

**Why:** `SendMessage`는 *인스턴스 이름*을 해석하는데 `"cto"`는 `.claude/agents/`의 *에이전트 타입* 이름일 뿐이라 절대 해석되지 않는다. 실제로 `No agent named 'cto' is reachable` 오류가 발생해 ui-2027이 i18n 키 요청을 전달하지 못했고, 코디네이터(main)를 경유해 우회 전달되면서 왕복이 한 번 더 늘었다. CTO 자신은 `ListAgents` 툴이 없어 자기 식별자를 알려줄 수도 없다.

**How to apply:** 위임 프롬프트의 보고 지시는 이 순서로 쓴다.
1. 기본값 — **최종 보고서에 담아라.** 서브에이전트의 final report는 부모(CTO)에게 자동 전달되므로 SendMessage가 아예 불필요하다. 추가 i18n 키 요청, 스펙-코드 불일치, 판단 필요 이슈 전부 여기에 담게 한다.
2. 작업 중간에 꼭 알려야 하면 — 먼저 `ListAgents`로 정확한 name(+`[ref]`)을 확인하고 보내라. 이름을 추측하지 말라.
3. 그래도 못 찾으면 `to: "main"` + 첫 줄에 `[CTO 전달 요망]`.

관련: 같은 파일을 두 트랙이 건드릴 때는 [[parallel-track-file-ownership]] 참조.
