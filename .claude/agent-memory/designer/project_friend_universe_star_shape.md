---
name: project-friend-universe-star-shape
description: 친구 우주 궁합 별 UI의 형태(별 모양) 구현 방식과 관련 제약 — CPO 승인, 2026-08-19 완료
metadata:
  type: project
---

`components/universe/UniverseStar.tsx`/`.module.css`,
`components/universe/UniverseVisualization.tsx`/`.module.css`의 별 형태를
"그냥 동그라미"라는 QA 피드백에 따라 재작업했다(2026-08-19, CPO 승인 하 진행).

**구조**: 버튼(44px 히트 영역, 위치/애니메이션)은 그대로 두고, 시각 레이어를
`<span className={styles.core} aria-hidden="true" />` 실제 DOM 요소로 분리했다
(기존엔 `button::before` 하나였음). `.core` 자신이 원(코어+글로우, 기존 로직 그대로)이고,
`.core::before`(8방향 sparkle clip-path 파셋) + `.core::after`(두 겹 linear-gradient로 만든
십자 플레어)를 얹어 "별처럼 보이는 형태"를 만든다. 오너 별도 동일 구조
(`.ownerCore` + `::before`/`::after`)이지만 강도는 friend 최대치보다 진한 고정값을 써서
"형태 계열은 같되 중심성이 더 뚜렷한" 위계를 만든다.

**크기별 강도 스케일**: `libs/universe/star-visual.ts`의 `getStarVisual`(점수→직경 10~32px
매핑)은 건드리지 않는다 — CPO가 재논의 대상 아님이라고 명시. 대신 `UniverseStar.tsx`에서
`visual.diameterPx`를 소비해 `shapeIntensity = (diameterPx - 10) / 22`(0~1 정규화)를
계산하고 `--star-shape-intensity` CSS 커스텀 프로퍼티로 내려, 스파이크/플레어 opacity를
`calc(var(--star-shape-intensity) * 0.8)` 식으로 스케일한다. **CSS `calc()`의
길이÷길이 나눗셈(`calc((var(--star-size) - 10px) / 22px)`, CSS Values Level 4)은
쓰지 않기로 했다** — 구형 WebKit 등 지원이 불확실해서 TS에서 직접 정규화값을 계산해
내려주는 쪽이 더 안전하다는 판단. 10px(최소 직경) 별은 강도 0이라 사실상 "빛나는 점"으로만
보이고, 32px(최대 직경)에서만 파셋/플레어가 온전히 드러난다 — "작은 별에서 clip-path가
뭉개져 지저분해진다"는 CPO 우려에 대한 해법.

**겹침 처리**: 새 pseudo-element 오버레이(`::before`/`::after`)는 `.core`(position:relative)
기준 절대 위치로 자기 박스보다 크게(2.3배/3.4배) 그려 코어 밖으로 삐져나온다. 이웃 별의
히트 영역을 가리지 않도록 반드시 `pointer-events: none`을 붙여야 한다(붙이지 않으면 겹치는
플레어가 인접 버튼의 클릭을 가로챌 위험 — 실제로 이 이슈 때문에 명시적으로 추가함).
경계는 clip-path여도 `filter: drop-shadow(...)`로 흐려 "성운처럼" 감쇠시킨다
(box-shadow는 clip-path에 함께 잘려서 이 용도로 못 씀 — drop-shadow만 가능).

**포커스**: `.star:focus-visible`에 `z-index: 2`를 추가해, 포커스된 별이 이웃 별의
겹치는 플레어에 가려지지 않게 했다. 이전에는 `:hover` 상태 스타일이 전혀 없었는데
(CPO가 명시적으로 요구해서) `.star:hover .core`(brightness 상승)를 새로 추가했다.

**배치 로직과의 경계**: `getStarPlacement`/좌표 관련 코드는 이 작업에서 건드리지 않았다
— CTO 쪽이 동시에 배치(랜덤+영구저장) 로직을 별도로 바꾸는 중이라 충돌 방지 목적.
다음에 이 영역을 다시 건드릴 땐 먼저 `getStarPlacement`가 그 사이 바뀌었는지 확인할 것.

**실행 검증 못함**: 이 세션엔 Bash 도구가 없어 `pnpm lint`/`pnpm test`를 직접 못 돌렸다.
CSS/마크업만 수정했고 `star-visual.ts`(테스트 대상)는 안 건드렸으므로 회귀 가능성은 낮지만,
반영 전 `pnpm lint`·`pnpm test` 결과는 별도로 확인 필요.
