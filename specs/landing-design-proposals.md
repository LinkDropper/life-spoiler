# 랜딩 페이지 디자인 제안서 - 궁합 섹션 UI/UX 설계 및 기존 페이지 개선

## 1. 현재 디자인 시스템 분석

### 1.1 레이아웃

- **모바일 퍼스트**: `max-width: 480px`, `margin: 0 auto`
- **전체 배경**: `linear-gradient(180deg, #0c1220 0%, #2e1431 100%)` (다크 남색 → 다크 퍼플)
- **섹션 간 구분**: `border-top/bottom: 1px solid #ffccd9` 또는 단순 간격
- **고정 CTA**: 하단 고정, `z-index: 100`, 그라데이션 페이드 배경

### 1.2 컬러 팔레트

| 역할 | 색상 | 용도 |
|------|------|------|
| **Primary Pink** | `#ffccd9` | 제목 하이라이트, 아이콘, 테두리, CTA 버튼 배경 |
| **Accent Pink** | `#fb7194` / `#ff6b9d` | 배지 배경, 언더라인, 그라데이션 |
| **Soft Pink** | `#ffdde6` | 이벤트 제목, 타이머 하이라이트 |
| **Accent Green** | `#deff7c` | 보조 하이라이트 (체크마크, 연간운세 제목) |
| **White 100%** | `#ffffff` | 제목, 질문 텍스트, 버튼 텍스트 |
| **White 80%** | `rgba(255,255,255,0.8)` | 리스트 아이템, 부제목 |
| **White 70%** | `rgba(255,255,255,0.7)` | 프로모션 설명, 타이머 |
| **White 60%** | `rgba(255,255,255,0.6)` | 본문 설명, FAQ 답변 |
| **White 50%** | `rgba(255,255,255,0.5)` | 푸터 텍스트, 삭선 가격 |
| **White 40%** | `rgba(255,255,255,0.4)` | 원래 가격 |
| **Dark Purple** | `#2d1b4e` | CTA 버튼 텍스트 |
| **Dark BG** | `#0c1220` | 헤더 배경, 그라데이션 시작 |

### 1.3 타이포그래피

| 용도 | 크기 | 굵기 | 줄높이 |
|------|------|------|--------|
| 이벤트 대제목 | 40px | 700 | 1.05 |
| 가격 | 32px | 800 | - |
| 히어로 제목 | 28px | 900 | 1.4 |
| 이벤트 뱃지 | 22px | 800 | 1.19 |
| 섹션 제목 | 20px | 700 | 1.3~1.4 |
| CTA 버튼 | 19px | 700 | 1.4 |
| 원래 가격 | 18px | 500 | - |
| 서브 제목 | 17px | 500~600 | 1.4~1.5 |
| 본문/설명 | 16~17px | 400~500 | 1.5~1.7 |
| FAQ 답변 | 15px | 400 | 1.7 |
| 보조 텍스트 | 14px | 400~500 | 1.4 |
| 배지 텍스트 | 13px | 700 | - |

- **폰트 패밀리**: `var(--font-pretendard), sans-serif`

### 1.4 카드 & 컨테이너 스타일

| 패턴 | 배경 | 테두리 | 둥글기 |
|------|------|--------|--------|
| **서브타이틀 카드** | `rgba(255,255,255,0.03)` | `1px solid rgba(255,204,217,0.3)` | 16px |
| **프로모션 배너** | `rgba(255,204,217,0.08)` | `1px solid #ffccd9` | 16px |
| **상품 프리뷰** | `rgba(255,255,255,0.03)` | `1px solid rgba(255,204,217,0.3)` | 16px |
| **FAQ 아이템** | `rgba(255,255,255,0.03)` | `1px solid rgba(255,204,217,0.15)` | 12px |
| **타이머 박스** | `rgba(255,255,255,0.08)` | 없음 | 4px |
| **안내 박스** | `rgba(255,255,255,0.08)` | 없음 | 20px |
| **하이라이트 뱃지** | `rgba(222,255,124,0.1)` | 없음 | 20px |
| **핑크 뱃지** | `linear-gradient(135deg, #ff6b9d, #ff8fab)` | 없음 | 20px |

### 1.5 간격 체계

- **섹션 내부 패딩**: `24px` 좌우 (375px 이하에서 `16px`)
- **섹션 간 패딩**: `40px ~ 80px`
- **카드 내부 패딩**: `24px ~ 40px`
- **요소 간 간격(gap)**: `8px`, `12px`, `24px`, `32px`

### 1.6 특수 효과

- **이미지 드롭 섀도우**: `drop-shadow(0px 0px 40px rgba(255, 204, 217, 0.4))`
- **전환**: `transition: 0.2s~0.3s ease`
- **safe area 대응**: `env(safe-area-inset-bottom)`

---

## 2. 궁합 섹션 UI 제안

### 2.1 배치 위치

**FeatureSection 바로 다음, PromotionBanner 앞에 배치**

이유:
- FeatureSection이 개인 운세 기능을 소개한 직후, 궁합이라는 새로운 가치 제안을 이어서 보여주는 것이 자연스러움
- PromotionBanner에서 가격을 제시하기 전에 "이 가격에 궁합까지" 라는 느낌을 줄 수 있음
- 기능 소개(Feature) → 궁합(Compatibility) → 가격(Promotion) → 상품목록(Preview) 순서가 설득 흐름에 적합

### 2.2 섹션 구성: `CompatibilitySection`

하나의 섹션으로 궁합의 핵심 가치를 시각적으로 전달합니다.

#### ASCII 목업

```
┌─────────────────────────────────┐
│                                 │
│     "우리 사이, 몇 점일까?"      │  ← 섹션 제목 (20px, 700, #fff)
│                                 │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    ╭─────────────────╮    │  │
│  │    │                 │    │  │
│  │    │     87 점       │    │  │  ← 궁합 점수 (대형, 시각적 임팩트)
│  │    │   ○○○○○○○●      │    │  │  ← 원형 프로그레스 바 or 링
│  │    │                 │    │  │
│  │    ╰─────────────────╯    │  │
│  │                           │  │
│  │  소통    ████████░░  78    │  │  ← 4대 지표 미니 바
│  │  성장    █████████░  85    │  │
│  │  신뢰    ███████░░░  72    │  │
│  │  극복    ██████████  92    │  │
│  │                           │  │
│  └───────────────────────────┘  │  ← 카드 스타일 (서브타이틀 카드 패턴)
│                                 │
│  ┌───────────────────────────┐  │
│  │ #찰떡궁합  #밀당마스터     │  │  ← 태그 표시 (핑크 뱃지 스타일)
│  │ #서로의_거울               │  │
│  └───────────────────────────┘  │
│                                 │
│   "두 사람의 별이 만나면        │  ← 스포일러 텍스트
│    어떤 이야기가 펼쳐질까요?"   │     (16px, 400, white 60%)
│                                 │
│   ╭──────────────────────────╮  │
│   │ ✓ 8가지 궁합 인사이트    │  │  ← 하이라이트 기능 리스트
│   │ ✓ 실전 시나리오 분석     │  │     (체크 아이콘 + 텍스트)
│   │ ✓ 4대 카테고리 심층 분석 │  │
│   │ ✓ 맞춤 조언              │  │
│   ╰──────────────────────────╯  │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### 2.3 상세 디자인 스펙

#### 2.3.1 섹션 컨테이너

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 24px;
  border-top: 1px solid rgba(255, 204, 217, 0.3);
}
```

- FeatureSection과 동일한 `padding: 80px 24px` 사용
- 상단에 미약한 핑크 보더로 섹션 구분 (전체 핑크 보더 `#ffccd9`보다 연하게)

#### 2.3.2 섹션 제목

```css
.title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  color: #ffffff;
  text-align: center;
  margin: 0 0 32px;
}
```

- 기존 섹션 제목 패턴과 동일

#### 2.3.3 점수 카드 (Score Card)

```css
.scoreCard {
  width: 100%;
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 204, 217, 0.3);
  border-radius: 16px;
  text-align: center;
}
```

- 기존 `subtitleCard` / `ProductPreview` 카드 패턴과 동일

**점수 표시 방식**: 큰 숫자 + 원형 프로그레스 인디케이터
- 점수 숫자: `48px`, `font-weight: 800`, `color: #ffccd9`
- "점" 텍스트: `16px`, `font-weight: 500`, `color: rgba(255,255,255,0.6)`
- 원형 프로그레스: SVG 기반, stroke color `#ffccd9`, 트랙 `rgba(255,255,255,0.1)`
- 원형 프로그레스 크기: `120px x 120px`

**4대 지표 미니 바**:
```css
.subScoreBar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.subScoreLabel {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  width: 40px;
  flex-shrink: 0;
}

.subScoreTrack {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.subScoreFill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #ffccd9);
  border-radius: 3px;
}

.subScoreValue {
  font-size: 14px;
  font-weight: 600;
  color: #ffccd9;
  width: 28px;
  text-align: right;
}
```

- 4개 바가 `gap: 10px`로 수직 나열
- 라벨: 소통, 성장, 신뢰, 극복
- 바: 핑크 그라데이션 fill

#### 2.3.4 태그 영역

```css
.tagList {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.tag {
  padding: 6px 14px;
  background: rgba(255, 204, 217, 0.1);
  border: 1px solid rgba(255, 204, 217, 0.3);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffccd9;
}
```

- 기존 `highlight` 뱃지 스타일에서 핑크 톤으로 변형
- 태그 앞에 `#` 기호 포함

#### 2.3.5 스포일러 텍스트

```css
.spoilerText {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-top: 24px;
}
```

- 기존 `description` 텍스트 스타일과 동일

#### 2.3.6 기능 하이라이트 리스트

```css
.featureHighlight {
  width: 100%;
  margin-top: 24px;
  padding: 20px;
  background: rgba(222, 255, 124, 0.06);
  border-radius: 16px;
}
```

- 기존 `highlight` 뱃지의 초록 톤을 활용하되, 리스트 형태로 확장
- 체크 아이콘: `color: #deff7c`, 텍스트: `rgba(255,255,255,0.8)`
- 궁합에서만 제공되는 고유 기능들을 강조

### 2.4 데이터 전략 (예시 vs 실제)

점수 카드에 표시되는 데이터는 **예시 데이터**를 사용합니다.

- 이유: 비로그인 사용자에게 실제 결과를 보여줄 수 없음
- 방식: 하드코딩된 예시 점수로 "이런 결과를 받을 수 있다"를 시각적으로 전달
- 예시 값: 종합 87점, 소통 78, 성장 85, 신뢰 72, 극복 92
- 별도 표기: "예시 결과입니다" 텍스트를 작은 글씨로 하단에 표시

### 2.5 컴포넌트 구조 제안

```
components/landing/
├── CompatibilitySection.tsx        ← 전체 섹션 (서버 컴포넌트)
├── CompatibilitySection.module.css
```

내부 구조:
- 섹션 제목
- 점수 카드 (종합 점수 + 원형 프로그레스 + 4대 지표 바)
- 태그 리스트
- 스포일러 텍스트
- 기능 하이라이트 리스트

복잡한 인터랙션이 없으므로 단일 서버 컴포넌트로 충분합니다.
원형 프로그레스 바는 순수 SVG + CSS로 구현 가능합니다 (JS 불필요).

---

## 3. 기존 섹션 UI/UX 개선 제안

### 3.1 MainHero 개선

**현재 문제점:**
- 이미지가 상단에 위치하지만, 이미지의 상단이 잘려있는 구조 (`margin-top: calc(164.182px - 137px)`)로 의도가 불분명
- 제목과 부제목 사이 시각적 위계가 명확하지 않음

**개선 제안:**
- 부제목 리스트의 체크 아이콘(`✓`)을 Lucide React의 `Check` 아이콘으로 교체하여 시각적 일관성 확보
- 하이라이트 뱃지(`#deff7c`)의 배경 대비를 약간 높여 가독성 개선: `rgba(222, 255, 124, 0.1)` → `rgba(222, 255, 124, 0.15)`

### 3.2 FeatureSection 개선

**현재 문제점:**
- 이미지가 `position: absolute`로 배치되어 텍스트와 겹칠 가능성
- 140px의 gap이 크게 느껴질 수 있음

**개선 제안:**
- 각 피처 카드에 미약한 배경 카드를 추가하여 시각적 구분 강화:
  ```css
  .feature {
    padding: 24px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
  }
  ```
- gap을 `100px`으로 줄여 스크롤 부담 감소

### 3.3 PromotionBanner 개선

**현재 상태:** 양호. 가격 정보가 명확하게 전달됨.

**개선 제안:**
- "커피 한 잔 값으로" 부분을 더 강조하기 위해 약간의 시각적 분리:
  ```css
  .text {
    margin-top: 4px; /* 0 → 4px, 가격과 설명 사이 약간의 여백 */
  }
  ```
- 궁합 추가 후, 설명 텍스트에 궁합도 포함된다는 암시 추가 가능 (카피 영역)

### 3.4 ProductPreview 개선

**현재 문제점:**
- 궁합 항목이 아직 없음
- "올해 운세도 함께 확인 가능" 구분이 `divider + yearlyTitle`로 되어 있는데, 궁합까지 추가되면 3단 구성 필요

**개선 제안:**
- 궁합 항목 추가 시, 동일한 `divider + title` 패턴으로 3단 구성:
  1. 평생 운세 (기존 7항목)
  2. 올해 운세 (기존 2항목)
  3. 궁합 운세 (신규 항목들)
- 궁합 섹션 타이틀 색상: `#ffccd9` (핑크) - 각 운세 종류별로 다른 포인트 컬러 사용
- 궁합 아이콘: `Users` (lucide-react) 또는 `Heart` 재활용

### 3.5 FAQSection 개선

**개선 제안:**
- 궁합 관련 FAQ 1~2개 추가:
  - "궁합 분석은 어떤 관계까지 가능한가요?" (연인, 친구, 가족, 비즈니스 등)
  - "두 사람의 생년월일만 있으면 되나요?"

### 3.6 CTAButton 개선

**현재 상태:** 단일 CTA ("990원으로 내 운세 확인하기")

**개선 제안:**
- CTA 텍스트에 궁합도 포함된다는 느낌 반영 (카피 영역)
- 버튼 아래 subtext 활성화: "평생운세 + 올해운세 + 궁합" 세 가지 포함된다는 보조 텍스트

---

## 4. 전체 페이지 흐름 개선 제안

### 현재 흐름
```
Header → Hero → Feature(3개) → Promotion → ProductPreview → Event → FAQ → Disclaimer → Footer
```

### 제안 흐름
```
Header → Hero → Feature(3개) → [궁합 섹션] → Promotion → ProductPreview(궁합 추가) → Event → FAQ(궁합 추가) → Disclaimer → Footer
```

변경 포인트:
1. **궁합 섹션 삽입**: Feature와 Promotion 사이에 자연스럽게 배치
2. **ProductPreview 확장**: 궁합 상품 항목 추가
3. **FAQ 확장**: 궁합 관련 질문 추가
4. **CTA subtext 활성화**: 세 가지 상품 포함 안내

### 전체 시각적 리듬

```
[Hero]           ── 핑크 보더 ──
[Feature]        ── 없음 ──
[Compatibility]  ── 핑크 보더(연) ──
[Promotion]      ── 없음 ──
[ProductPreview] ── 없음 ──
[Event]          ── 핑크 보더(진) ──
[FAQ]            ── 없음 ──
[Disclaimer]     ── 핑크 보더(진) ──
[Footer]         ── 없음 ──
```

---

## 5. 반응형 고려사항

### 480px (기본 모바일)
- 위 목업 기준 그대로 적용

### 375px 이하 (소형 모바일)
- 섹션 좌우 패딩: `24px` → `16px` (기존 패턴 유지)
- 점수 카드 내부 패딩: `32px 24px` → `24px 16px`
- 원형 프로그레스 크기: `120px` → `100px`
- 점수 숫자 크기: `48px` → `40px`

### 태그 영역
- `flex-wrap: wrap`으로 자연스럽게 줄바꿈
- 태그 수가 4개까지이므로 2줄 이내로 배치 가능

---

## 6. 접근성 고려

- 점수 바의 progress 역할: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- 원형 프로그레스: 스크린 리더를 위한 `aria-label="궁합 점수 87점"`
- 색상 대비: `#ffccd9` on `#0c1220` 배경 → WCAG AA 충족 (대비율 약 8:1)
- 예시 데이터 표기: 스크린 리더에서도 "예시 결과" 문구 인식 가능하도록 구성
