# 전생 운세 (Past Life Fortune)

> 한 줄 요약: 자미두수 명반의 복덕궁/부모궁/전택궁을 재해석하여 "전생의 삶"을 AI 이미지와 함께 제공하는 신규 운세 상품

## 개요

### 배경

- 기존 인생운세("당신은 이런 사람이다")와 올해운세("올해는 이렇다")는 **현재/미래** 중심
- "왜 나는 이렇게 태어났는가?"라는 과거 지향 질문에 대한 콘텐츠가 없음
- 자미두수 명반에서 복덕궁(전생 본질), 부모궁(전생 인연), 전택궁(전생 환경)은 이미 계산되지만 인생운세에서는 부차적으로만 활용
- "전생 MBTI" 느낌의 가벼운 엔터테인먼트로 SNS 공유성과 바이럴 잠재력이 높음

### 목표

- 기존 명반 데이터(`generateZiweiChart()`)를 그대로 활용하여 추가 알고리즘 없이 전생 운세 제공
- **AI 이미지 생성**으로 전생 모습을 시각화 (핵심 차별화 요소)
- 전생은 **사람에 국한되지 않음** — 동물, 식물, 곤충, 자연물 등 다양한 존재 가능
- **탄생부터 죽음까지** 전생의 전체 생애를 서사적으로 제공
- 인생운세와 동일한 결제 흐름(990원)으로 수익화
- KO/EN/JA 3개 언어 지원

### 핵심 가치

| 항목 | 인생운세 | 전생운세 |
| --- | --- | --- |
| 핵심 질문 | "나는 어떤 사람인가" | "왜 태어났고, 어떻게 살았고, 어떻게 죽었는가" |
| 주요 궁 | 명궁, 관록궁, 재백궁 | 복덕궁, 부모궁, 전택궁 |
| 시점 | 현재 → 미래 | 과거(전생) → 현재 |
| 톤 | 진지한 인생 가이드 | 가벼운 엔터테인먼트 ("전생 MBTI") |
| 특별 요소 | 텍스트 중심 | **AI 생성 이미지** + 텍스트 |
| 전생의 범위 | - | 사람, 동물, 식물, 곤충, 자연물 등 **모든 존재** |

### 타겟 유저

- 인생운세를 이미 구매한 기존 유저 (추가 구매 유도)
- SNS에서 "전생 테스트" 류 콘텐츠에 관심 있는 20~30대
- 자미두수에 호기심은 있지만 진지한 운세보다 가벼운 콘텐츠를 선호하는 유저
- **AI 이미지 공유**로 바이럴 유도 — "내 전생은 산딸기였대ㅋㅋ" 같은 공유 포인트

---

## 사용자 시나리오

### 시나리오 1: 전생 운세 미리보기 → 결제 → 전체 보기

```
1. 사용자가 홈(프로필 목록)에서 프로필 선택
2. 운세 유형 선택 화면에서 "전생 운세" 선택
3. 미리보기 페이지: 명반 + 전생 스포일러(한 줄 요약) 표시
4. "전생 확인하기" CTA 버튼 클릭 → 결제 페이지 이동
5. 990원 결제 완료
6. 전체 결과 페이지: 6개 섹션 모두 표시
```

### 시나리오 2: 이미 구매한 전생 운세 재조회

```
1. 사용자가 프로필 선택
2. 운세 유형 선택에서 "전생 운세" 선택
3. 이미 결제된 경우 → 바로 전체 결과 페이지로 이동
```

### 시나리오 3: 공유 링크를 통한 접근

```
1. 다른 사용자가 공유한 전생 스포일러 링크 클릭
2. 공유 페이지: 전생 스포일러(한 줄 요약)만 표시
3. CTA: "내 전생도 확인하기" → 회원가입/로그인 유도
```

---

## 전생 존재 유형

### 사람에 국한되지 않는 전생

전생은 **반드시 사람일 필요가 없다**. 명반 데이터의 조합에 따라 다양한 존재로 결정된다.

#### 존재 유형 분류

| 카테고리 | 예시 | 결정 기준 |
| --- | --- | --- |
| **인간** | 왕족, 시인, 상인, 농부, 무인 | 복덕궁 주성이 자미/천부/태양/무곡 계열 + 밝기 높음 |
| **동물** | 늑대, 고래, 매, 고양이, 물고기 | 복덕궁 주성이 칠살/파군/탐랑 계열 (본능/야생 에너지) |
| **식물** | 산딸기, 대나무, 연꽃, 고목나무 | 복덕궁 주성이 천동/태음 계열 (고요/수용 에너지) + 오행 목(木) |
| **곤충/소동물** | 반딧불이, 벌, 나비, 개미 | 복덕궁 주성이 천기/천량 계열 + 밝기 낮음 |
| **자연물/현상** | 산 위의 바람, 강줄기, 모닥불 | 복덕궁 주성 없음(빈 궁) → 형체 없는 존재 |

> 위 매핑은 AI 프롬프트의 참고 가이드이며, 최종 결정은 복덕궁 주성 + 밝기 + 오행국 + 사화 조합을 종합하여 AI가 창의적으로 판단한다.

#### 존재 유형별 생애 서사 톤

- **인간**: 역사적 시대 배경 + 사회적 역할 + 관계 중심 서사
- **동물**: 서식지 + 본능/습성 + 자연 속 생존 서사
- **식물**: 자라난 장소 + 계절 순환 + 고요한 관찰자 시점 서사
- **곤충**: 짧지만 강렬한 삶 + 미시 세계의 드라마
- **자연물**: 추상적/시적 서사 + 순환과 흐름 중심

---

## 콘텐츠 구조

### 6개 섹션 상세 정의

#### 섹션 1: 전생 스포일러 + 이미지 (Past Life Spoiler & Portrait)

- **역할**: 전생의 모습을 한 줄 + AI 이미지로 강렬하게 각인
- **형태**: headline + description + summary + **AI 생성 이미지**
- **예시**:
  - headline: "깊은 산속 산딸기", image: (산비탈에서 햇살을 받는 야생 산딸기 일러스트)
  - headline: "조선시대 방랑 시인", image: (달빛 아래 산길을 걷는 선비 일러스트)
  - headline: "태평양의 혹등고래", image: (깊은 바다를 유영하는 고래 일러스트)
- **무료/유료**: 무료 (미리보기에서 노출) — 이미지가 공유/바이럴의 핵심
- **글자 수**: headline 15자 이내, description 30자 이내, summary 200~300자
- **주요 데이터**: 복덕궁 주성 + 밝기 → 전생 존재 유형 결정, 오행국 → 배경/분위기
- **이미지 생성**: AI가 텍스트 해석과 함께 이미지 프롬프트를 생성 → 이미지 생성 API 호출

#### 섹션 2: 전생 스토리 — 탄생 (Past Life Birth)

- **역할**: 전생에 왜 그 존재로 태어나게 되었는지
- **형태**: headline + content
- **무료/유료**: 유료
- **글자 수**: headline 20자 이내, content 500~700자
- **서사 포인트**:
  - 어떤 세계/환경에 태어났는가 (시대/장소/자연환경의 구체적 묘사)
  - 왜 그 존재로 태어나게 되었는가 (이전 생의 업/에너지 흐름)
  - 타고난 기질/에너지는 어떠했는가
  - 태어난 직후의 상황 — 주변에 누가/무엇이 있었는가
- **주요 데이터**: 복덕궁 주성 + 오행국 → 탄생 배경, 사화 화록 위치 → 타고난 복

#### 섹션 3: 전생 스토리 — 삶 (Past Life Journey)

- **역할**: 전생에서 어떤 삶을 살았는가 (핵심 서사)
- **형태**: headline + events (타임라인) + content
- **무료/유료**: 유료
- **글자 수**: headline 20자 이내, content 600~800자, events 3~5개 (각 60~100자)
- **서사 포인트**:
  - 삶의 전성기/터닝포인트는 언제였는가
  - 어떤 관계를 맺었는가 (인간이면 사람, 동물이면 무리/짝, 식물이면 주변 존재)
  - 가장 빛났던 순간과 가장 힘들었던 순간
  - **핵심 사건 타임라인**: 전생의 주요 사건 3~5개를 시간순으로 나열
    - 각 이벤트: { period, event } (예: "봄 첫날", "산비탈에서 첫 꽃을 피우다")
    - 인간이면 연대/나이 기준, 동물이면 계절/성장 기준, 식물이면 계절 순환 기준
- **주요 데이터**:
  - 복덕궁 보조성 → 삶의 디테일
  - 전택궁 → 생활 환경/터전
  - 사화 위치 → 핵심 사건 (화록=풍요, 화권=성장, 화과=인정, 화기=시련)

#### 섹션 4: 전생 스토리 — 죽음과 카르마 (Past Life End & Karma)

- **역할**: 전생이 어떻게 끝났으며, 무엇이 현생으로 이어졌는가
- **형태**: headline + content (죽음 서사 + 카르마 연결)
- **무료/유료**: 유료
- **글자 수**: headline 20자 이내, content 500~700자
- **서사 포인트**:
  - 어떻게 생을 마감했는가 (평화로운/극적인/자연스러운)
  - 마지막 순간 남긴 에너지/미련은 무엇인가
  - 그 에너지가 현생의 어떤 성향/재능/과제로 이어졌는가
  - 현생에서 풀어야 할 영혼의 숙제
  - **마지막 한마디**: 전생의 존재가 현생의 자신에게 남기는 메시지 (1~2문장)
- **주요 데이터**:
  - 전택궁 상태 (길성=평화로운 마지막, 살성=파란만장한 마지막)
  - 사화 화기 위치 → 미완의 과제
  - 명궁 vs 복덕궁 비교 → 전생→현생 변화
  - 신궁 → 현생의 성장 방향

#### 섹션 5: 전생 인연 (Past Life Connections)

- **역할**: 현재 주요 관계(가족, 연인)와 전생에서의 관계 유추
- **형태**: headline + content
- **무료/유료**: 유료
- **글자 수**: headline 20자 이내, content 400~500자
- **서사 포인트**:
  - 전생에서 인연이 있었던 존재는 누구/무엇이었는가
  - 그 인연이 현생에서 어떤 관계로 다시 만났는가
  - (인간이 아닌 전생의 경우) 전생의 존재와 교감했던 다른 존재와의 인연
- **주요 데이터**:
  - 부모궁 → 전생의 인연 패턴
  - 부처궁 → 전생의 동반자 관계
  - 부모궁 사화 → 인연의 질적 특성

#### 섹션 6: 전생 프로필 카드 (Past Life Profile Card)

- **역할**: 전생의 정체성을 한눈에 보여주는 프로필 카드 (공유/바이럴 핵심)
- **형태**: 구조화된 데이터 (태그 + 스펙트럼 + 한 줄 묘비명)
- **무료/유료**: 유료
- **서사 포인트**:
  - **해시태그 3개**: 전생의 정체성을 압축한 키워드 (예: `#산속의_은둔자`, `#고요한_관찰자`, `#불꽃같은_삶`)
  - **능력치 스펙트럼 4개**: 전생 존재의 핵심 특성을 대비되는 양극 스케일로 표현
    - 각 스펙트럼: { label, leftLabel, rightLabel, score (0~100) }
    - 예시 스펙트럼:
      - 고독 ←→ 교감 (관계 성향)
      - 본능 ←→ 이성 (행동 기반)
      - 안주 ←→ 방랑 (삶의 방식)
      - 순응 ←→ 저항 (운명 대응)
    - AI가 전생 존재 유형에 맞게 스펙트럼 라벨을 자유롭게 결정
  - **한 줄 묘비명**: 전생의 삶을 한 문장으로 요약 (20~40자)
    - 예: "깊은 산에서 가장 달콤한 여름을 보냈다"
    - 예: "모든 바람의 방향을 기억하는 존재였다"
    - 공유 시 이미지와 함께 표시되는 핵심 카피
- **주요 데이터**:
  - 섹션 1~5의 해석 결과를 종합하여 생성 (Stage 3에서 전체 맥락 기반)
  - 복덕궁 주성 → 핵심 키워드, 사화 분포 → 스펙트럼 점수

### 무료/유료 구분

| 섹션 | 미리보기 (무료) | 전체 보기 (유료) |
| --- | --- | --- |
| 전생 스포일러 + 이미지 | O (전체 노출) | O |
| 전생 스토리 — 탄생 | X (블러 처리) | O |
| 전생 스토리 — 삶 + 타임라인 | X (블러 처리) | O |
| 전생 스토리 — 죽음과 카르마 | X (블러 처리) | O |
| 전생 인연 | X (블러 처리) | O |
| 전생 프로필 카드 | X (블러 처리) | O |

---

## 데이터 흐름

### 전체 플로우

```
[클라이언트]                          [서버 API]                        [AI / DB]
    │                                     │                                │
    ├─ POST /api/interpret/past-life ────►│                                │
    │   { profileId, ...ZiweiInput }      │                                │
    │                                     ├─ getFortune("past_life") ─────►│
    │                                     │  (캐시 확인)                    │
    │                                     │◄─ 없음 ─────────────────────────┤
    │                                     │                                │
    │                                     ├─ generateZiweiChart() ────────►│
    │                                     │  (명반 생성 — 기존 로직)         │
    │                                     │                                │
    │                                     ├─ convertChartToRequest()       │
    │                                     │  (복덕궁/부모궁/전택궁 추출)     │
    │                                     │                                │
    │                                     ├─ generatePastLifeInterpretation()
    │                                     │  (AI 해석 — 스테이지별 병렬)     │
    │                                     │                                │
    │                                     ├─ saveFortune("past_life") ────►│
    │                                     │  (결과 저장)                    │
    │                                     │                                │
    │◄─ { success, data, isPaid } ────────┤                                │
```

### 명반 데이터 → AI 해석 요청 매핑

기존 `convertChartToRequest()` 함수의 결과를 그대로 사용한다. 전생 운세에서 특별히 추출이 필요한 궁은 아래와 같다:

| 궁 | AI 프롬프트에서의 역할 |
| --- | --- |
| 복덕궁 | 전생의 본질 (직업/신분, 복/업) |
| 부모궁 | 전생의 인연 관계 |
| 전택궁 | 전생의 환경/터전 |
| 명궁 | 현생의 본질 (카르마 리포트에서 비교용) |
| 신궁 | 후천적 변화 (카르마 리포트에서 비교용) |

오행국(五行局)은 전생의 시대적 배경/원소적 기질을 결정하는 데 활용한다.

---

## AI 해석 파이프라인

기존 인생운세(`generateFullInterpretation`)의 스테이지별 병렬 처리 패턴을 따른다.

### 스테이지 구성

```
Stage 1 (병렬):
  ├─ 전생 스포일러 + 이미지 프롬프트 (past_life_spoiler)
  └─ 전생 스토리 — 탄생 (past_life_birth)

Stage 2 (병렬, Stage 1 맥락 전달):
  ├─ 전생 스토리 — 삶 (past_life_journey)
  └─ 전생 스토리 — 죽음과 카르마 (past_life_end)

Stage 3 (병렬, Stage 1~2 맥락 전달):
  ├─ 전생 인연 (past_life_connections)
  ├─ 전생 프로필 카드 (past_life_profile_card) — 전체 맥락 종합
  └─ 이미지 생성 (past_life_image) — Stage 1의 이미지 프롬프트 사용
```

> Stage 3의 이미지 생성은 텍스트 해석과 독립적으로 진행 가능하므로 Stage 1 완료 직후 시작할 수 있다.

### 이미지 생성 파이프라인

```
[Stage 1 완료]
    │
    ├─ spoiler.headline: "깊은 산속 산딸기"
    ├─ spoiler.imagePrompt: "A wild strawberry growing on a misty mountain slope..."
    │
    ▼
[이미지 생성 API 호출]
    │
    ├─ 후보 API: Gemini Imagen / DALL-E / Stable Diffusion
    ├─ 스타일: 동양적 수채화/일러스트 톤 (브랜드 톤 통일)
    ├─ 출력: 1:1 정사각형 (512x512 또는 1024x1024)
    │
    ▼
[Supabase Storage 업로드]
    │
    └─ 결과 URL을 fortune 결과에 포함
```

### InterpretationType 확장

```typescript
// 기존
export type InterpretationType =
  | "life_spoiler"
  | "lifetime_core"
  | ...

// 신규 추가
export type PastLifeInterpretationType =
  | "past_life_spoiler"
  | "past_life_birth"
  | "past_life_journey"
  | "past_life_end"
  | "past_life_connections"
  | "past_life_profile_card";
```

### 응답 스키마 (신규)

```typescript
// 전생 스포일러 + 이미지 프롬프트
export const PastLifeSpoilerResponseSchema = z.object({
  headline: z.string(),       // "깊은 산속 산딸기"
  existenceType: z.enum(["human", "animal", "plant", "insect", "nature"]),
  description: z.string(),    // 부가 설명
  summary: z.string(),        // 200~300자 요약
  imagePrompt: z.string(),    // 이미지 생성용 영문 프롬프트
});

// 전생 스토리 — 탄생
export const PastLifeBirthResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),        // 500~700자
});

// 전생 스토리 — 삶
export const PastLifeJourneyResponseSchema = z.object({
  headline: z.string(),
  events: z.array(z.object({  // 주요 사건 타임라인 3~5개
    period: z.string(),       // "봄 첫날", "스물 셋 가을"
    event: z.string(),        // 60~100자
  })).min(3).max(5),
  content: z.string(),        // 600~800자
});

// 전생 스토리 — 죽음과 카르마
export const PastLifeEndResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),        // 500~700자
  lastWords: z.string(),      // 전생이 현생에게 남기는 한마디 (1~2문장)
});

// 전생 인연
export const PastLifeConnectionsResponseSchema = z.object({
  headline: z.string(),
  content: z.string(),        // 400~500자
});

// 전생 프로필 카드
export const PastLifeProfileCardResponseSchema = z.object({
  hashtags: z.array(z.string()).length(3),  // ["#산속의_은둔자", "#고요한_관찰자", "#불꽃같은_삶"]
  spectrums: z.array(z.object({
    label: z.string(),        // 스펙트럼 이름
    leftLabel: z.string(),    // 왼쪽 극단 (0)
    rightLabel: z.string(),   // 오른쪽 극단 (100)
    score: z.number(),        // 0~100
  })).length(4),
  epitaph: z.string(),        // 한 줄 묘비명 (20~40자)
});

// 최종 결과
export interface PastLifeFortuneInterpretation {
  spoiler: PastLifeSpoilerResponse;
  birth: PastLifeBirthResponse;
  journey: PastLifeJourneyResponse;
  end: PastLifeEndResponse;
  connections: PastLifeConnectionsResponse;
  profileCard: PastLifeProfileCardResponse;
  imageUrl: string | null;    // AI 생성 이미지 URL (Supabase Storage)
  meta: {
    generatedAt: string;
    model: string;
    isFallback: boolean;
  };
}
```

### AI 프롬프트 핵심 요소

- **복덕궁 주성 14개 × 밝기별 전생 존재 유형 테이블**을 시스템 프롬프트에 내장
  - 밝기(묘/왕/득지/평/함/낙함)에 따라 같은 별이라도 전생 존재 유형이 달라짐
  - **사람에 국한하지 않고** 동물/식물/곤충/자연물도 가능
  - AI는 테이블을 참고하되 창의적으로 최종 결정
- **사화 위치** → 전생의 핵심 사건 및 죽음 방식 결정
  - 화록이 복덕궁에 → 풍요로운 삶, 평화로운 죽음
  - 화기가 복덕궁에 → 시련이 많은 삶, 미완의 과제를 남긴 죽음
  - 화기가 질액궁에 → 건강/사고와 관련된 극적인 죽음
- **오행국** → 전생의 세계관/배경
  - 수(水) → 물가/바다/강 근처의 삶
  - 목(木) → 숲/산/농촌의 삶
  - 금(金) → 도시/문명/기술의 삶
  - 토(土) → 평야/대지/안정적 환경
  - 화(火) → 격변/전쟁/열정의 시대
- **이미지 프롬프트 생성**: AI가 전생 해석과 함께 영문 이미지 프롬프트를 생성
  - 스타일 지시: "watercolor illustration, ethereal, Eastern aesthetic, soft lighting"
  - 존재 유형에 맞는 장면 묘사 포함
- **생애 전체 서사**: 탄생 → 삶의 전성기/시련 → 죽음 → 현생으로의 연결
  - 죽음 묘사는 무겁지 않고 서정적으로 (예: "가을 바람에 마지막 잎을 떨구듯 고요히")
  - 현생과의 연결을 반드시 포함 ("그때의 에너지가 지금의 당신을 만들었습니다")
- **면책 문구**: "전생 해석은 자미두수 명반의 창의적 재해석이며, 학술적 정설이 아닌 엔터테인먼트 콘텐츠입니다."
- **톤**: 무겁지 않은 스토리텔링, 흥미 위주, "전생 MBTI" 느낌

---

## 결제

### 기존 결제 흐름 재사용

현재 결제 시스템(`app/payment/[type]/[profileId]`)은 `FortuneType`으로 운세 유형을 구분한다.

- **가격**: 990원 (KRW) / $0.99 (USD)
- **FortuneType 확장**: `"past_life"` 추가

```typescript
// libs/supabase/types.ts
export type FortuneType = "lifetime" | "yearly" | "compatibility" | "past_life";

// app/payment/[type]/[profileId]/page.tsx
type FortuneType = "yearly" | "lifetime" | "compatibility" | "past_life";
```

### 결제 페이지 수정사항

- `getProductName()`에 `past_life` 케이스 추가
- `orderName` 생성 로직에 전생 운세용 i18n 키 추가
- 프로모 코드도 기존 로직 그대로 적용 가능 (`PromoFortuneType`에 `"past_life"` 또는 `"all"`)

---

## 엣지 케이스

### 시간 모름 (birth_time_unknown)

- 시간 미입력 시 복덕궁/부모궁/전택궁의 위치가 부정확할 수 있음
- **처리**: 인생운세와 동일하게 기본 시간(자시)으로 계산 후, "출생 시간 미입력으로 결과가 달라질 수 있습니다" 안내 문구 표시

### 빈 궁 (주성 없음)

- 복덕궁에 주성이 없는 경우 존재 (자미두수에서 일부 궁은 주성이 비어 있을 수 있음)
- **처리**: AI 프롬프트에서 "주성이 없는 궁은 보조성과 삼방사정의 영향으로 해석" 지시 포함

### AI 해석 실패

- **처리**: 기존 `createFallbackInterpretation` 패턴과 동일하게 `createPastLifeFallbackInterpretation` 구현
- 폴백 결과는 빈 문자열 + `isFallback: true`로 반환

### 동일 프로필 재요청

- 기존 `getFortune(profileId, "past_life", 0)` 호출로 캐시된 결과 반환
- chartHash 기반 결과 캐시도 기존 패턴과 동일 (키: `full-past_life-${language}`)

### 언어 변경 후 재요청

- 캐시 키에 언어 포함 → 다른 언어로 요청 시 새로 생성
- 기존 인생운세의 `cacheKey = full-${language}` 패턴과 동일

---

## 다국어 (i18n)

### 지원 범위

| 항목 | KO | EN | JA |
| --- | --- | --- | --- |
| UI 텍스트 (버튼, 안내문) | O | O | O |
| AI 프롬프트 | O | O | O |
| AI 응답 | O | O | O |
| 결제 페이지 | O (기존 재사용) | O (기존 재사용) | O (기존 재사용) |

### 신규 i18n 키 (예시)

```json
{
  "fortune.pastLife.title": "전생 운세",
  "fortune.pastLife.subtitle": "당신의 전생은?",
  "fortune.pastLife.spoilerTitle": "전생 스포일러",
  "fortune.pastLife.storyTitle": "전생 스토리",
  "fortune.pastLife.karmaTitle": "카르마 리포트",
  "fortune.pastLife.connectionsTitle": "전생 인연",
  "fortune.pastLife.disclaimer": "전생 해석은 자미두수 명반의 창의적 재해석이며, 학술적 정설이 아닌 엔터테인먼트 콘텐츠입니다.",
  "fortune.pastLife.interpretError": "전생 운세 생성에 실패했어요.",
  "payment.productNamePastLife": "전생 운세",
  "payment.orderNamePastLife": "{name}님의 전생 운세"
}
```

### 프롬프트 파일 구조

```
libs/services/ai/prompts/
├── past-life-ko.ts    # 신규
├── past-life-en.ts    # 신규
├── past-life-ja.ts    # 신규
└── index.ts           # getPastLifePrompts() 추가
```

---

## 기존 아키텍처와의 통합 방안

### 신규 생성 파일

| 파일 | 역할 |
| --- | --- |
| `app/api/interpret/past-life/route.ts` | 전생 운세 API 엔드포인트 |
| `app/fortune/past-life/[profileId]/page.tsx` | 전체 결과 페이지 |
| `app/fortune/past-life/[profileId]/page.module.css` | 결과 페이지 스타일 |
| `app/fortune/past-life/preview/[profileId]/page.tsx` | 미리보기 페이지 |
| `app/fortune/past-life/preview/[profileId]/page.module.css` | 미리보기 스타일 |
| `app/fortune/past-life/share/[profileId]/page.tsx` | 공유 페이지 |
| `app/fortune/past-life/share/[profileId]/layout.tsx` | 공유 OG 메타 |
| `libs/services/ai/past-life-interpreter.ts` | 전생 운세 AI 해석 서비스 |
| `libs/services/ai/prompts/past-life-ko.ts` | KO 프롬프트 |
| `libs/services/ai/prompts/past-life-en.ts` | EN 프롬프트 |
| `libs/services/ai/prompts/past-life-ja.ts` | JA 프롬프트 |
| `libs/hooks/fortune/use-past-life-preview.ts` | 미리보기 커스텀 훅 |
| `libs/hooks/fortune/use-past-life-fortune.ts` | 전체 보기 커스텀 훅 |

### 기존 수정 파일

| 파일 | 변경 내용 |
| --- | --- |
| `libs/services/ai/types.ts` | `PastLifeInterpretationType`, 응답 스키마 추가 |
| `libs/services/ai/index.ts` | 전생 해석 서비스 export 추가 |
| `libs/services/ai/prompts/index.ts` | `getPastLifePrompts()` 함수 추가 |
| `libs/supabase/types.ts` | `FortuneType`에 `"past_life"` 추가, `PromoFortuneType`에 `"past_life"` 추가 |
| `libs/supabase/fortune.ts` | `PastLifeFortuneData` 인터페이스 추가, `FortuneResultType` 유니온 확장 |
| `libs/supabase/index.ts` | 신규 타입/함수 export 추가 |
| `app/payment/[type]/[profileId]/page.tsx` | `FortuneType`에 `"past_life"` 추가, 상품명/주문명 로직 추가 |
| i18n 메시지 파일 (ko/en/ja) | 전생 운세 관련 UI 텍스트 추가 |
| 홈/프로필 선택 페이지 | 전생 운세 선택지 추가 (운세 유형 목록) |

### 데이터베이스

- `fortunes` 테이블: 스키마 변경 없음 (`fortune_type = 'past_life'`로 저장)
- `profile_free_access` 테이블: 스키마 변경 없음 (`fortune_type = 'past_life'` 사용)
- Supabase migration: `FortuneType` enum에 `'past_life'` 값 추가 필요 (DB enum 사용 시)

---

## 요구사항

### 기능 요구사항

우선순위: 🔴 필수 | 🟡 권장 | 🟢 선택

- [ ] 🔴 전생 운세 API 엔드포인트 (`POST /api/interpret/past-life`)
- [ ] 🔴 AI 프롬프트 작성 (복덕궁 주성×밝기 아키타입 테이블 포함)
- [ ] 🔴 4개 섹션 응답 스키마 정의 및 Zod 검증
- [ ] 🔴 미리보기 페이지 (전생 스포일러 무료 노출)
- [ ] 🔴 전체 결과 페이지 (4개 섹션)
- [ ] 🔴 결제 흐름 통합 (`FortuneType` 확장)
- [ ] 🔴 결과 저장/캐싱 (기존 fortune 테이블 활용)
- [ ] 🔴 면책 문구 표시
- [ ] 🟡 KO 프롬프트 작성 (MVP)
- [ ] 🟡 EN/JA 프롬프트 작성
- [ ] 🟡 공유 페이지 + OG 메타
- [ ] 🟡 폴백 해석 (AI 실패 시)
- [ ] 🟢 전생 아키타입 이미지/일러스트 (디자인 별도 진행)
- [ ] 🟢 전생 운세 기반 SNS 공유 카드

### 비기능 요구사항

- **성능**: AI 해석 전체 완료 15초 이내 (2스테이지 병렬, 인생운세 4스테이지 대비 빠름)
- **에러율**: AI 해석 실패 시 폴백으로 100% 응답 보장
- **보안**: 인증 필요 (기존 auth 미들웨어 재사용)

---

## 에러 처리

### 예상 에러 케이스

| 에러 상황 | 에러 코드 | 사용자 메시지 | 처리 방법 |
| --- | --- | --- | --- |
| 입력값 유효하지 않음 | `VALIDATION_ERROR` | "입력값이 유효하지 않습니다." | 400 응답 |
| 프로필 없음 | `PROFILE_NOT_FOUND` | "프로필을 찾을 수 없습니다." | 프로필 목록으로 이동 |
| AI 해석 실패 | `AI_ERROR` | "전생 운세 생성에 실패했어요." | 폴백 결과 반환 + 재시도 안내 |
| 명반 생성 실패 | `CHART_ERROR` | "명반 생성에 실패했습니다." | 500 응답 |
| 결제 실패 | (토스 SDK 처리) | "결제에 실패했어요." | 결제 재시도 안내 |

### 에러 복구 전략

- **AI 실패**: `createPastLifeFallbackInterpretation()` → 빈 결과 + `isFallback: true`
- **네트워크**: 클라이언트 측 새로고침 버튼 (기존 인생운세 패턴)

---

## 구현 단계

### Phase 1: MVP (핵심 기능)

- [ ] 타입/스키마 정의 (`types.ts` 확장)
- [ ] KO 프롬프트 작성 (`past-life-ko.ts`)
- [ ] AI 해석 서비스 (`past-life-interpreter.ts`)
- [ ] API 엔드포인트 (`app/api/interpret/past-life/route.ts`)
- [ ] 미리보기 페이지
- [ ] 전체 결과 페이지
- [ ] 결제 통합
- [ ] DB migration (`fortune_type` enum 확장)

### Phase 2: 다국어 + 공유

- [ ] EN/JA 프롬프트 작성
- [ ] 공유 페이지 + OG 메타
- [ ] SNS 공유 기능

### Phase 3: 고도화 (선택)

- [ ] 전생 아키타입 일러스트/이미지
- [ ] 전생 운세 기반 궁합 ("전생에서도 만난 인연")
- [ ] A/B 테스트 (프롬프트 톤/스타일 최적화)

---

## 제약사항

- 전생 해석은 자미두수의 학술적 정설이 아님 → 면책 문구 필수
- 추가 알고리즘 개발 없음 → 기존 `generateZiweiChart()` 결과만 활용
- 디자인 시안 별도 필요 (전생이라는 테마에 맞는 비주얼 톤)
- Supabase DB에 `fortune_type` enum이 있는 경우 migration 필요

---

## 성공 기준

### 완료 조건

- [ ] 모든 기능 요구사항(🔴) 구현
- [ ] 타입 체크 통과 (`pnpm build`)
- [ ] 린트 통과 (`pnpm lint`)
- [ ] 에러 케이스 처리 완료
- [ ] 면책 문구 표시 확인

### 검증 방법

```bash
# 1. 타입 체크
pnpm build

# 2. 린트
pnpm lint

# 3. 수동 테스트
# - 미리보기: 전생 스포일러가 무료로 노출되는지
# - 결제: 990원 결제 후 전체 결과 노출되는지
# - 캐시: 동일 프로필 재요청 시 저장된 결과 반환되는지
# - 에러: AI 실패 시 폴백 결과 표시되는지
# - 면책: 면책 문구가 결과 페이지에 표시되는지
```

---

## 참고자료

- 기존 인생운세 API: `app/api/interpret/route.ts`
- 기존 AI 해석 파이프라인: `libs/services/ai/ziwei-interpreter.ts`
- 기존 프롬프트 구조: `libs/services/ai/prompts/ko.ts`
- 기존 결제 흐름: `app/payment/[type]/[profileId]/page.tsx`
- 기존 타입 정의: `libs/services/ai/types.ts`
