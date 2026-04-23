# 신규 리포트 구조 — v3 스키마 제안

## 전체 섹션 목록 (5개로 슬림화)

```
1. signature        — 한 줄 인상 정의 + 핵심 키워드 + 동물상 칩
2. overallScore     — 종합 점수 + 종합 인상 본문
3. regionScores     — 부위별 점수표 (8개)
4. interestAreas    — 관심사별 디테일 (연애 / 재물 / 직장)
5. closing          — 캐릭터 별명 + 한 줄 압축 + SNS 공유 카피
```

---

## 1. signature — 시그니처 (히어로 영역)

```typescript
interface SignatureSection {
  /** 25~40자. 한 줄 인상 정의. reference 톤. 마침표 없음.
   *  예: "차분하고 단정한 정석형 인상" */
  oneLineDefinition: string;

  /** 60~90자. 정의를 한 줄 더 풀어주는 부연.
   *  예: "첫인상에서 튀기보다는, 볼수록 신뢰감이 생기는 타입으로 보여요." */
  subDefinition: string;

  /** 정확히 5개. 짧은 한 단어 키워드.
   *  예: ["신뢰감", "안정감", "신중함", "꾸준함", "후반상승"] */
  coreKeywords: string[];

  /** 30~50자. "이 인상이 자주 듣는 말 1개" — 자기인식 트리거.
   *  마지막은 "~ 들어보셨죠?", "~ 들으시지 않나요?" 등 가벼운 의문형으로.
   *  예: "'조용한데 은근 강하다'는 말, 한 번쯤 들어보셨죠?" */
  commonlyHeardPhrase: string;

  /** 30~50자. "이 인상이 자주 받는 오해 1개" — 반전 호기심 트리거.
   *  실제 기질과 거리가 멀다는 뉘앙스로 마무리.
   *  예: "'차가워 보인다'는 오해, 실제와 가장 거리가 먼 부분이에요." */
  commonMisread: string;

  /** 보조 라벨. 동물상 분류 결과를 작은 칩으로만 노출.
   *  히어로의 메인이 아님. */
  animalChip: {
    type: AnimalType;        // 12종 enum 그대로 재사용
    label: string;            // "강아지상" 같은 한국어 라벨
  };
}
```

**프롬프트 가이드:**
- `oneLineDefinition`은 reference의 "차분하고 단정한 정석형 인상", "조용한 강자형 관상" 같은 **명사구 + 형 패턴** 위주
- 외모 평가 어휘 금지 ("매력적인", "예쁜" 등)
- `coreKeywords`는 명사형, 4자 이내, 정확히 5개 (reference의 "신뢰감/안정감/신중함/꾸준함/후반상승" 패턴 그대로)
- `commonlyHeardPhrase`는 **자기인식 폭발 트리거**가 핵심. 따옴표 안의 말은 사용자가 실제로 들어봤음직한 일상 표현. 너무 칭찬·자랑 어조 금지 ("천재라는 말" ❌). 인상의 핵심 특성을 1인칭 주변인 시점으로
- `commonMisread`는 인상에서 자주 빚어지는 오해. 부위 조합 근거에서 도출되어야 하며, 모욕·부정 단정이 아닌 **"실제와는 다르다"의 환기**로 작성

---

## 2. overallScore — 종합 점수 + 종합 인상

```typescript
interface OverallScoreSection {
  /** 0~10. 소수점 1자리. 7.5~9.5 구간 강제. */
  totalScore: number;

  /** 20~30자. 종합 점수에 붙는 한 줄 평.
   *  예: "강렬한 한 방보다, 전체 밸런스로 이기는 상" */
  scoreOneLiner: string;

  /** 200~280자, 2단락. reference의 overall.md "전체 인상" 단락 수준.
   *  사용자의 핵심 인상을 서사로 풀어냄. */
  summary: string;

  /** 6~10개. 종합 인상의 핵심 특성을 글머리표로.
   *  각 항목 15~30자. 평서문, 어미 "~예요" 통일.
   *  예:
   *  - "신중하다 — 일단 보고 판단하는 편이에요"
   *  - "허세가 적고 묵직하게 가는 분위기가 있어요"
   */
  highlights: Array<{
    title: string;     // 5~10자, 핵심 단어 (예: "신중함")
    body: string;      // 15~30자, 부연 (예: "일단 보고 판단하는 편이에요")
  }>;
}
```

**점수 캘리브레이션 규칙 (필수):**
- `totalScore`는 항상 7.5 이상 9.5 이하
- 분포: 8.0~9.0 구간이 80%, 7.5~8.0 / 9.0~9.5는 20%
- "이 부위가 인상에 얼마나 또렷하게 기여하는가"의 척도이지 미추 점수가 아님 — 프롬프트에 명시
- 점수 산출 근거: `face-shape-analyzer.ts`의 `FaceMetrics` 수치를 입력으로 받아 결정적 매핑 + LLM 미세 조정

---

## 3. regionScores — 부위별 점수표 (8개 고정)

```typescript
interface RegionScore {
  /** 8개 부위 enum 중 하나 */
  region: "forehead" | "eye" | "brow" | "nose" | "mouth" | "chin" | "cheekbone" | "balance";

  /** 한국어 라벨. 예: "이마", "눈", "전체 균형감" */
  label: string;

  /** 0~10. 소수점 1자리. 7.0~9.5 구간 강제. */
  score: number;

  /** 80~140자, 2~3 문장. 점수의 근거 + 관상학적 해석.
   *  reference의 "관상에서는 ~ 쪽으로 보기도 해요" 패턴 활용. */
  interpretation: string;

  /** 정확히 3개. 글머리표로 표시할 부위별 특성.
   *  각 12~25자, 어미 "~편이에요" 통일.
   *  예:
   *  - "사람을 처음 볼 때 한 번 보고 판단하는 편이에요"
   *  - "감정에 휩쓸리기보다 상황 파악을 먼저 하는 편이에요"
   */
  bullets: string[];

  /** 18~30자. 따옴표로 감쌀 한 줄 평. 마침표로 끝냄.
   *  reference 시그니처: "말은 적어도, 보고 있는 건 많은 눈." */
  oneLiner: string;
}

interface RegionScoresSection {
  /** 정확히 8개. 위 순서 고정. */
  regions: RegionScore[];
}
```

**프롬프트 가이드:**
- 8개 부위는 **순서·갯수 고정** — 누락·추가 금지 (UI 일관성)
- `label`은 한자 금지, 일상 표현 ("이마", "눈", "전체 균형감")
- `interpretation`은 `face-shape-analyzer`의 measurement를 근거로 — 부위별 특정 수치가 어느 방향이면 어떻게 해석되는지 prompt에 룩업 테이블 제공
- `oneLiner`는 **인용·캡처 가능한 카피** — reference 톤 ("강렬한 한 방보다, 전체 밸런스로 이기는 상") 직접 모방

---

## 4. interestAreas — 관심사별 디테일 (3개 고정)

```typescript
interface InterestArea {
  /** 3개 분야 enum */
  domain: "love" | "money" | "career";

  /** 한국어 라벨 + 이모지. 예: "💕 연애운", "💰 재물운", "💼 직장운" */
  label: string;

  /** 25~40자. 분야 인상의 한 줄 정의.
   *  예: "불꽃형 연애보다, 오래 가는 신뢰형 연애운" */
  oneLineDefinition: string;

  /** 280~360자, 3~4단락.
   *  분야 안에서 사용자의 기질이 어떻게 작동하는지 시뮬레이션.
   *  reference detail.md의 "연애 스타일 관상 해석" + "강점·주의점 도입부" 분량. */
  body: string;

  /** 정확히 3개. 강점 글머리표. 각 12~25자. */
  strengths: string[];

  /** 정확히 3개. 주의점 글머리표. 각 12~25자. */
  cautions: string[];

  /** 25~40자. 한 줄 총평. 따옴표로 감쌀 카피.
   *  예: "벼락부자형보다, 알짜배기 실속형 재물운." */
  oneLineVerdict: string;

  /** 10~20자. 캐릭터 별명.
   *  예: "무심한 듯 다정한 타입" */
  characterNickname: string;

  /** 30~50자. 캐릭터 별명에 붙는 부연.
   *  예: "겉은 담백, 속은 은근 깊은 쪽이에요." */
  nicknameSubtext: string;
}

interface InterestAreasSection {
  /** 정확히 3개. love → money → career 순서 고정. */
  areas: InterestArea[];
}
```

**프롬프트 가이드:**
- 3개 분야는 **순서·갯수 고정** — 사용자가 가장 궁금해하는 핵심
- `body`는 reference detail.md 톤 그대로 — "관상가 인용 + 비유 + 시뮬레이션"
- `strengths`와 `cautions`는 **개수 정확히 3개** — 균형감
- `cautions`는 비난조 금지, "~할 수도 있어요" 톤 — 사용자 보호
- `characterNickname`은 인스타·X에 그대로 캡처할 수 있는 단위로 ("무심한 듯 다정한 타입", "꾸준한 적금왕 타입", "조용한 일잘러 타입" 등 분야별로 변주)

---

## 5. closing — 마무리 + 공유

```typescript
interface ClosingSection {
  /** 25~40자. 사용자 전체 인상의 캐릭터 별명 (분야별과 다름, 종합).
   *  예: "조용한 강자형" */
  finalNickname: string;

  /** 60~100자. 별명을 풀어주는 한 단락.
   *  예: "처음엔 조용해 보여도 시간이 갈수록
   *      '이 사람 괜찮다'는 말 듣는 얼굴이에요." */
  finalNote: string;

  /** 35~55자. SNS 공유용 한 줄. 동물상 라벨 자연스럽게 포함.
   *  예: "조용한 강자형 강아지상이래요. 볼수록 진가 드러나는 타입." */
  shareLine: string;
}
```

---

## v3 루트 인터페이스

```typescript
export interface FaceReportDataV3 {
  /** 스키마 버전 */
  version: 3;

  signature: SignatureSection;
  overallScore: OverallScoreSection;
  regionScores: RegionScoresSection;
  interestAreas: InterestAreasSection;
  closing: ClosingSection;
}

/** v3 가드 */
export const isV3Report = (value: unknown): value is FaceReportDataV3 => {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  if (r.version !== 3) return false;
  return ["signature", "overallScore", "regionScores", "interestAreas", "closing"]
    .every((k) => r[k] !== undefined);
};
```

## 길이·개수 강제 표 (한눈에)

| 필드 | 길이/개수 |
|---|---|
| `signature.oneLineDefinition` | 25~40자 |
| `signature.subDefinition` | 60~90자 |
| `signature.coreKeywords` | 정확히 5개, 각 4자 이내 |
| `signature.commonlyHeardPhrase` | 30~50자 |
| `signature.commonMisread` | 30~50자 |
| `overallScore.totalScore` | 7.5~9.5 |
| `overallScore.scoreOneLiner` | 20~30자 |
| `overallScore.summary` | 200~280자, 2단락 |
| `overallScore.highlights` | 6~10개 |
| `regionScores.regions` | 정확히 8개 |
| `regionScores.regions[].score` | 7.0~9.5 |
| `regionScores.regions[].interpretation` | 80~140자 |
| `regionScores.regions[].bullets` | 정확히 3개 |
| `regionScores.regions[].oneLiner` | 18~30자 |
| `interestAreas.areas` | 정확히 3개 (love/money/career 순) |
| `interestAreas.areas[].body` | 280~360자, 3~4단락 |
| `interestAreas.areas[].strengths/cautions` | 각 정확히 3개 |
| `interestAreas.areas[].oneLineVerdict` | 25~40자 |
| `interestAreas.areas[].characterNickname` | 10~20자 |
| `closing.finalNickname` | 25~40자 |
| `closing.shareLine` | 35~55자 |

## 분량 비교

| | 현재 v2 | v3 (제안) |
|---|---|---|
| 섹션 수 | 9개 | 5개 |
| 본편 총 글자 | 약 1,800~2,400자 | 약 2,400~3,200자 |
| 정량 지표 | intensity 3단계 | 점수 9개 (종합 + 8개 부위) |
| 공유 카피 단위 | 2개 (shareLine, shareableQuote) | **18개** (region oneLiner ×8 + verdict ×3 + nickname ×3 + scoreOneLiner + finalNickname + shareLine + 1) |

→ **공유 자산 9배 증가**, 990원의 가치 체감 상승.
