# 랜딩 페이지 궁합 섹션 추가 및 전환율 개선

> 한 줄 요약: 랜딩 페이지에 궁합(궁합 운세) 컨텐츠 섹션을 추가하고, 기존 섹션들의 전환율을 개선한다.

## 개요

### 배경

현재 랜딩 페이지는 인생 운세(평생 운세)와 올해 운세만 소개하고 있다. 그러나 실제 서비스에는 궁합 운세 기능이 존재하며, 홈 페이지에서도 3번째 카드로 노출 중이다. 궁합은 바이럴 잠재력이 높은 컨텐츠(2인 이상 참여, 공유 욕구)이므로 랜딩에서도 충분히 어필해야 한다.

### 목표

1. 궁합 운세의 존재를 랜딩에서 인지시켜 전환율 향상
2. 기존 섹션의 카피/구조를 최적화하여 스크롤 이탈 감소
3. 새 섹션 추가 시 기존 디자인 톤 유지 (어두운 그라디언트 배경, 흰색 텍스트, 미니멀 카드 스타일)

---

## 현재 랜딩 페이지 구조 분석

| 순서 | 섹션              | 역할                     | 비고                                    |
| ---- | ----------------- | ------------------------ | --------------------------------------- |
| 1    | HeaderClient      | 네비게이션               | 로고 + 메뉴 + 언어 선택                |
| 2    | MainHero          | 히어로 (첫인상)          | 타이틀 + 서브타이틀 + 이미지            |
| 3    | FeatureSection    | 핵심 기능 3개            | 대운/4영역/월별운세 카드                |
| 4    | PromotionBanner   | 가격 제시                | 90% 할인 배너                           |
| 5    | ProductPreview    | 제공 항목 리스트         | 인생운세 7항목 + 올해운세 2항목         |
| 6    | EventSection      | 인스타 이벤트            | 카운트다운 (만료 시 미노출)             |
| 7    | FAQSection        | FAQ 4개                  | 아코디언 UI                             |
| 8    | DisclaimerSection | FBI WARNING              | 유머러스한 면책                         |
| 9    | FooterInfo        | 사업자 정보              | 로고 + 사업자 + 약관 + SNS              |
| 10   | CTAButton         | 플로팅 CTA               | "990원에 내 인생 스포 받기"             |

---

## 궁합 AI 결과 구조 (실제 데이터 기반)

**반드시 아래 실제 결과 데이터에 있는 내용만 활용한다. 없는 기능을 만들어내지 않는다.**

```
CompatibilityResult {
  score: number (0-100)           // 종합 궁합 점수
  subScores: {
    communication: number         // 소통 점수
    growthSynergy: number         // 성장 시너지
    trustIndex: number            // 신뢰 지수
    crisisResilience: number      // 위기 극복력
  }
  interpretation: {
    headline: string              // 한 줄 요약
    tags: string[] (2-4개)        // 관계 태그
    spoiler: string               // 스포일러 텍스트
    insights: {                   // 8개 인사이트 항목
      overall, zodiac, fiveElement, chemistry,
      communication, growthSynergy, trustIndex, crisisResilience
      -> 각 { score, label, headline, content }
    }
    coreScenarios: [{title, content}]  // 2-4개 핵심 시나리오
    categories: {                      // 4개 상세 카테고리
      communication: {headline, content, tags}
      growth: {headline, content, tags}
      emotion: {headline, content, tags}
      crisis: {headline, content, tags}
    }
    advice: string                     // 종합 조언
  }
}
```

---

## 기획: 새 궁합 섹션

### 섹션명: CompatibilitySection

### 배치 위치

FeatureSection(기존 3개 기능 카드) 바로 아래, PromotionBanner 바로 위에 배치한다.

**변경 후 순서:**

```
1. HeaderClient
2. MainHero
3. FeatureSection (기존 3개 기능)
4. CompatibilitySection  ← NEW
5. PromotionBanner
6. ProductPreview (궁합 항목 추가)
7. EventSection
8. FAQSection (궁합 FAQ 추가)
9. DisclaimerSection
10. FooterInfo
11. CTAButton
```

### 배치 근거

- FeatureSection에서 "이런 분석을 해준다"를 본 직후, 궁합이라는 추가 가치를 제시하여 관심 유지
- PromotionBanner(가격)보다 앞에 놓아 "이것까지 990원에?"라는 인식 유도
- 기존 3개 기능 카드와 분리하여 궁합은 별도 섹션으로 차별화

### 구성 요소

궁합 섹션은 **1개의 컴팩트 소개 카드** 형태로 구성한다.

```
┌─────────────────────────────────┐
│  "두 사람의 궁합, 별로 분석하다" │  ← 타이틀
│                                 │
│  ┌─ 궁합 미리보기 카드 ────────┐│
│  │  [이름A] X [이름B]          ││
│  │  궁합 점수: 85점            ││
│  │  ─────────────────────────  ││
│  │  소통 78  |  성장 시너지 91 ││
│  │  신뢰 82  |  위기 극복력 76 ││
│  │  ─────────────────────────  ││
│  │  #운명적케미 #서로의약점보완 ││
│  └─────────────────────────────┘│
│                                 │
│  "연인, 친구, 부모, 동료까지    │  ← 서브 설명
│   모든 관계의 궁합을 분석합니다" │
│                                 │
└─────────────────────────────────┘
```

### 표시할 데이터 (실제 결과 구조 기반)

| 데이터                | 출처                              | 용도                     |
| --------------------- | --------------------------------- | ------------------------ |
| 궁합 점수 (0-100)     | `result.score`                    | 메인 점수 표시           |
| 서브 점수 4개          | `result.subScores.*`              | 4대 지표 미리보기        |
| 관계 태그              | `interpretation.tags`             | 해시태그 스타일 표시     |
| 관계 유형              | `relationshipType`                | 다양한 관계 분석 가능 어필 |

**주의**: 이 섹션에서 표시하는 데이터는 모두 더미/예시 데이터이다. 실제 결과가 아니라 "이런 형태의 결과를 받을 수 있다"는 미리보기(목업)용이다.

### 미리보기 더미 데이터

```typescript
const DEMO_COMPATIBILITY = {
  nameA: "지민",
  nameB: "수현",
  score: 85,
  subScores: {
    communication: 78,
    growthSynergy: 91,
    trustIndex: 82,
    crisisResilience: 76,
  },
  tags: ["#운명적케미", "#서로의약점보완"],
};
```

---

## 기획: 기존 섹션 개선

### 1. ProductPreview - 궁합 항목 추가

현재 ProductPreview는 인생 운세 7항목 + 올해 운세 2항목을 보여준다. 여기에 궁합 운세 항목을 추가한다.

**추가할 궁합 항목:**

```
궁합 운세도 확인 가능       ← 새 서브 타이틀
─────────────────────
♥ 궁합 종합 점수 & 4대 지표
🔍 8가지 궁합 인사이트 분석
📋 핵심 시나리오 & 종합 조언
```

실제 결과 데이터 매핑:
- "궁합 종합 점수 & 4대 지표" → `result.score` + `result.subScores` (4개)
- "8가지 궁합 인사이트 분석" → `interpretation.insights` (8개 항목)
- "핵심 시나리오 & 종합 조언" → `interpretation.coreScenarios` + `interpretation.advice`

### 2. FAQSection - 궁합 FAQ 추가

기존 4개 FAQ에 궁합 관련 1개 추가 (총 5개):

```
Q: 궁합은 어떤 관계까지 볼 수 있나요?
A: 연인, 부부, 친구, 부모-자녀, 직장 동료 등 모든 인간관계의 궁합을
   분석할 수 있습니다. 두 사람의 자미두수 명반을 교차 분석하여
   소통, 성장 시너지, 신뢰, 위기 극복력 4가지 지표로 평가합니다.
```

### 3. MainHero - 궁합 언급 추가 (선택)

현재 서브타이틀 리스트 3개에 궁합 관련 1줄 추가를 **선택적으로 검토**:

현재:
```
- 114개 별로 읽는 당신의 타이밍
- 12궁에 펼쳐진 별이 말하는 운의 타이밍
- 나에게 맞는 돈·직업·인연 패턴
```

옵션 A (추가): 4번째 줄로 "두 사람 사이의 궁합까지" 추가
옵션 B (수정): 3번째 줄을 "나에게 맞는 돈·직업·인연·궁합 패턴"으로 수정
옵션 C (유지): 히어로는 개인 운세에 집중, 궁합은 별도 섹션에서 소개

**권장: 옵션 C** - 히어로는 개인 운세의 핵심 가치에 집중하고, 궁합은 CompatibilitySection에서 별도 소개하는 것이 메시지가 선명하다.

---

## 구현 가이드

### 구현 위치

```
신규 컴포넌트:
└── components/landing/
    ├── CompatibilitySection.tsx          # 궁합 소개 섹션
    └── CompatibilitySection.module.css   # 스타일

수정 파일:
├── app/page.tsx                          # 새 섹션 추가
├── components/landing/index.ts           # export 추가
├── components/landing/ProductPreview.tsx  # 궁합 항목 추가
└── messages/translations.json            # 번역 키 추가
```

### 기존 코드 활용

| 모듈                                        | 용도                     | 참고                     |
| ------------------------------------------- | ------------------------ | ------------------------ |
| `components/landing/FeatureSection`         | 디자인 패턴 참고         | 카드 레이아웃 스타일     |
| `components/compatibility/CompatibilityCard`| 궁합 카드 UI 참고        | 이름 X 이름 + 점수 패턴  |
| `libs/hooks/compatibility/types.ts`         | 결과 타입 정의           | CompatibilityResult      |

### 신규 의존성

없음. 기존 의존성만으로 구현 가능.

---

## i18n 번역 키

### landing.compatibility (신규)

```json
{
  "landing": {
    "compatibility": {
      "title": "두 사람의 궁합, 별로 분석하다",
      "demoNameA": "지민",
      "demoNameB": "수현",
      "scoreLabel": "궁합 점수",
      "scoreUnit": "점",
      "communication": "소통",
      "growthSynergy": "성장 시너지",
      "trustIndex": "신뢰",
      "crisisResilience": "위기 극복력",
      "description": "연인, 친구, 부모, 동료까지\n모든 관계의 궁합을 분석합니다"
    }
  }
}
```

### landing.productPreview (추가)

```json
{
  "compatibilityTitle": "궁합 운세도 확인 가능",
  "compatibilityItems": {
    "score": "궁합 종합 점수 & 4대 지표",
    "insights": "8가지 궁합 인사이트 분석",
    "scenarios": "핵심 시나리오 & 종합 조언"
  }
}
```

### landing.faq (추가)

```json
{
  "q5": {
    "question": "궁합은 어떤 관계까지 볼 수 있나요?",
    "answer": "연인, 부부, 친구, 부모-자녀, 직장 동료 등 모든 인간관계의 궁합을 분석할 수 있습니다. 두 사람의 자미두수 명반을 교차 분석하여 소통, 성장 시너지, 신뢰, 위기 극복력 4가지 지표로 평가합니다."
  }
}
```

---

## 전환율 개선 포인트 (기존 섹션)

### 이슈 1: EventSection 만료 문제

현재 EventSection의 DEADLINE은 `2026-02-05T12:00:00+09:00`으로 **이미 만료**되었다. `isExpired` 시 `null`을 반환하므로 현재 이 섹션은 보이지 않는다. 이벤트를 갱신하거나, 만료된 이벤트 섹션을 제거/대체하는 판단이 필요하다.

**권장**: 이벤트가 만료되었으므로 해당 섹션 자리에 궁합 또는 다른 프로모션 컨텐츠를 넣는 것을 검토한다. 단, 이벤트 갱신 여부는 사업 판단이므로 이번 기획 범위에서는 건드리지 않는다.

### 이슈 2: CTA 메시지 최적화

현재 CTA: "990원에 내 인생 스포 받기"
- 인생 운세만 언급하여 궁합이 포함된 가치를 전달하지 못함
- **제안**: CTA 문구는 마케터(marketer) 팀원의 제안을 반영하여 결정

### 이슈 3: PromotionBanner 추가 가치 전달

현재: "노력은 하는데 왜 안 풀릴까? 타이밍을 확인해보세요"
- 궁합이 추가되면 "인생 운세 + 궁합까지" 같은 번들 가치를 전달할 수 있음
- **제안**: 마케터(marketer) 팀원의 카피 제안을 반영

---

## 요구사항 정리

### 기능 요구사항

우선순위: 필수 | 권장 | 선택

- [ ] 필수: CompatibilitySection 신규 컴포넌트 생성
- [ ] 필수: app/page.tsx에 CompatibilitySection 추가 (FeatureSection 아래, PromotionBanner 위)
- [ ] 필수: ProductPreview에 궁합 항목 3개 추가
- [ ] 필수: FAQSection에 궁합 FAQ 1개 추가
- [ ] 필수: 번역 키 추가 (ko, en, ja)
- [ ] 권장: CompatibilitySection에 더미 데이터로 궁합 결과 미리보기 카드 표시
- [ ] 권장: 서브 점수 4개를 가로 2x2 그리드로 표시
- [ ] 선택: 관계 태그(해시태그) 표시

### 비기능 요구사항

- **디자인 일관성**: 기존 FeatureSection과 동일한 디자인 톤 유지 (어두운 배경, 흰색 텍스트, 미니멀 카드)
- **서버 컴포넌트**: CompatibilitySection은 서버 컴포넌트로 구현 (더미 데이터만 사용, 클라이언트 상호작용 없음)
- **i18n**: 모든 텍스트는 next-intl 번역 키 사용
- **반응형**: max-width 480px 기준 (기존과 동일)

---

## 성공 기준

### 완료 조건

- [ ] CompatibilitySection이 랜딩 페이지에 노출됨
- [ ] ProductPreview에 궁합 항목이 추가됨
- [ ] FAQ에 궁합 관련 질문이 추가됨
- [ ] 타입 체크 통과 (`pnpm build`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 한국어/영어/일본어 번역 키 모두 추가됨

---

## 제약사항

- 궁합 섹션의 데이터는 더미(목업)이다. 실제 API 호출은 하지 않는다.
- 실제 궁합 결과에 존재하지 않는 기능은 절대 추가하지 않는다.
- 기존 디자인 스타일을 유지한다 (새로운 컬러/폰트 도입 금지).
- 커밋/푸시는 하지 않는다.
