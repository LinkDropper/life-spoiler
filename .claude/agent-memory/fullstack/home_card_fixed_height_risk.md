---
name: home-card-fixed-height-risk
description: Home 운세 카드(.content height 164px 고정)는 EN 타이틀에서 오버플로우 위험이 있다 — 신규 카드 추가 시 계산으로 끝내지 말고 실제 렌더 확인 필요
metadata:
  type: project
---

`components/home/*Card.module.css`의 `.content`는 `height: 164px; overflow: hidden` 고정이며, `.title`은 `font-family: "SB AggroOTF"`(28px)를 쓴다. 이 폰트는 한글 전용으로 보이며 라틴 문자에는 브라우저가 시스템 폰트로 폴백한다.

**Why:** `NextYearFortuneCard` 작업(2026-08-11) 중 EN 타이틀 "Next Year's Fortune"의 추정 폭(~293~300px)이 375px 뷰포트 가용폭(~295px)과 거의 같아, 폴백 폰트 메트릭에 따라 2줄로 감길 위험을 계산만으로는 배제할 수 없었다. 2줄 타이틀 + 2줄 서브타이틀이 겹치면 164px를 넘어 `overflow:hidden`에 잘린다. 브라우저 렌더 도구가 없어 계산 검증만 하고 designer/team-lead에게 실측을 넘겼다.

**How to apply:** 이 154~164px 고정 높이 카드 그룹(YearlyFortuneCard, NextYearFortuneCard 등)에 신규 카드를 추가하거나 카피를 바꿀 때, KO뿐 아니라 **EN 타이틀의 실제 브라우저 렌더**(375px 뷰포트)를 반드시 확인한다. 브라우저 도구가 없으면 계산 결과와 함께 "미검증" 상태임을 명시적으로 보고하고, 넘칠 가능성이 있으면 CSS 소유자(designer)에게 `min-height` 전환을 제안한다.
