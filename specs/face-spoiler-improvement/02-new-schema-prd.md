# Phase 2 — FaceReportData v2 재설계 + 결과 페이지 PRD

> 작성자: planner (시니어 서비스 기획자)
> 선행 문서: `specs/face-spoiler-improvement/01-prompt-validation-and-animal-mapping.md` (gwansang-expert)
> 목적: 관상스포(Face Spoiler) 결과 리포트의 정보 구조·유저 훅·공유 친화성을 전면 재설계한다. 본 문서는 Phase 3(ai-dev / fullstack) 구현의 유일한 기준 문서다.
>
> **핵심 결정 요약**
> - 섹션 8개 → 7개 재구성, `career + wealth → fortune` 통합
> - `animalMatch` 필드 신설 (primary/secondary/confidence/matchedRegions/rationale)
> - `observation.features[]` 구조화 배열 신설
> - **score 시스템 전면 제거**, `intensity` 3단계(strong/balanced/subtle)로 대체
> - `relationship.shareableQuote` 신설 (OG 카드용)
> - 자미두수 12궁(`Palace`)과 혼동 금지 — face-spoiler는 `PhysiognomyRegion` 유지

---

## A. 유저 니즈 가설

### A-1. "관상 본다"의 핵심 욕구 우선순위

유저가 얼굴 사진을 올리고 AI 관상을 받는 행동의 근본 동기를 분해하면, "**자기 인식 + 공유 가능한 라벨 + 약간의 판타지**"의 세 축으로 정리된다. 이 중 **공유 가능한 라벨**이 바이럴·재방문의 최대 지렛대이며, 그 정점에 동물상이 있다.

| 순위 | 욕구 | 설명 | 전환/공유 기여 |
|---|---|---|---|
| 1 | **동물상** | "나는 무슨 상인가?" 가장 즉각적·시각적 라벨 | **공유 트리거 최상위** (짧고 이미지화 쉬움) |
| 2 | **첫인상 + 매력 포인트** | "남들이 나를 어떻게 보는가?" 사회적 거울 | 티저에서 호기심 유발 |
| 3 | **어울리는 사람 유형 (연애)** | "나랑 맞는 사람은 누구?" 가장 강한 공유 욕구 유발 | **OG 카드 1순위 후보** |
| 4 | **숨겨진 면 / 반전** | "내가 모르는 내 모습" — 자기 발견의 스릴 | 결제 후 본편에 배치해 "그 값어치" 체감 제공 |
| 5 | **재능·커리어 + 재물 흐름** | 현실적 관심사이나 구체 수치 기대는 낮음 | 본편 중단 섹션, 통합 제공으로 밀도 확보 |
| 6 | **단점·약점 + 개운법 (행동)** | 약점만 노출하면 거부감, 행동으로 착지시키면 수용 | 본편 하단, 3개로 압축 |

### A-2. 설계 원칙 (가설)

1. **상위 3개(동물상·첫인상·어울리는 사람)는 결제 전 티저에 반드시 녹인다.** 단, 어울리는 사람은 "유형 이름만" 노출하고 해설은 유료로.
2. **하위 3개(숨겨진 면·일/재물·행동)는 본편 전용.** "돈 주고도 더 볼 값어치가 있다"는 체감을 만드는 구역.
3. **단점은 단독 섹션으로 두지 않는다.** `traits`(성향) 섹션 안에서 "강점 → 매력 → 숨겨진 면(약점 포함)"의 한 호흡으로 흐르게 배치. 공격성 완화.
4. **숫자 점수는 공유 욕구를 만들지 않는다.** (예: "당신의 연애운은 82점" → 바이럴 기여 낮음, 불만 유발 높음) 숫자 대신 **동물상 라벨 + 한 줄 카피**가 공유 자원.
5. **마케터 스폰 없이 직접 가설 수립** (사이클 속도 우선). 이 가설은 Phase 3 구현 후 초기 샘플에서 전환율·공유율로 검증되어야 하며, PRD에 명시된 관찰 KPI에 따라 추후 조정한다.

### A-3. KPI (추후 검증용)

Phase 3 배포 후 다음 지표를 관찰한다.

- **티저 → 결제 전환율**: 기존 대비 ±
- **결과 페이지 → 공유 버튼 CTR**: 기존 대비 ±
- **OG 카드 클릭률 (외부 유입)**: 신규 지표
- **동물상 분포 균등도**: primary 동물상이 특정 1~2종에 70%+ 쏠리면 프롬프트 편향으로 간주하고 Phase 3 회귀에서 조정

---

## B. FaceReportData v2 스키마 설계

### B-1. 섹션 재구성 결정 (기존 8 → 신규 7)

| 기존 섹션 | 처리 | 신규 섹션 | 비고 |
|---|---|---|---|
| `profile` | 리네이밍 + 용도 명확화 | `firstImpression` | "첫인상"이라는 유저 언어에 맞춤 |
| `observation` | 유지 + 구조화 | `observation` | `features[]` 배열 신설, 본문은 사실 묘사만 (해석 금지) |
| `personality` | 확장 재설계 | `traits` | 강점·매력·숨겨진 면(약점)을 한 섹션에 통합 |
| `career` | **합병** | `fortune` | "일·재물의 흐름" 단일 섹션 |
| `wealth` | **합병** | `fortune` | ↑ |
| `relationship` | 유지 + 확장 | `relationship` | `idealType`(어울리는 사람 유형) + `shareableQuote` 추가 |
| `actions` | 축소 | `actions` | 5개 → **3개**. 과잉 정보 회피 |
| `shareLine` | 유지 | `shareLine` | — |
| — | **신설** | `animalMatch` | 최상위 필드(섹션이 아닌 루트 필드). UI 히어로 영역 전담 |

총 7개 섹션: `firstImpression`, `observation`, `traits`, `fortune`, `relationship`, `actions`, `shareLine` + 루트 필드 `animalMatch`.

### B-2. 각 섹션별 필드 정의

#### 1) `animalMatch` (루트 필드, 신설, 필수)

유저가 가장 먼저·가장 크게 보는 요소. UI 상단 히어로 영역(프로필 이미지 좌측 세로 배치).

| 필드 | 타입 | 설명 |
|---|---|---|
| `primary` | `AnimalType` | 대표 동물상 1종 (3부위 이상 일치 필수) |
| `secondary` | `AnimalType` | 보조 동물상 1종 (2부위 이상 일치) |
| `confidence` | `MatchConfidence` | `high`/`medium`/`low`. Phase 1 §2 매칭 확신도 규칙 준수 |
| `matchedRegions` | `string[]` | 매칭 근거가 된 부위 2~4개. 일상 표현만 (예: `["둥근 얼굴", "올라간 입꼬리", "둥근 코끝"]`) |
| `rationale` | `string` | 120~180자 내외. "왜 이 동물상인지" 부위 조합으로 설명. 한자 용어·인종 연상 어휘 금지 |

**윤리 가드 (프롬프트·UI 양쪽 반영)**
- 동물상은 시각적 은유. 인종·민족·국적·외모 등급과 무관.
- `rationale` 안에 "야생적·이국적·서양적·동양적·섹시한·귀엽다·예쁘다" 금지어 포함 금지.
- `confidence === "low"` 일 때 UI 하단에 "~상과의 경계에 있어요" 힌트 노출 (Phase 1 §3-3-3 권고).

#### 2) `firstImpression` (리네임)

"첫인상" — 결제 전 티저의 메인 콘텐츠.

| 필드 | 타입 | 설명 |
|---|---|---|
| `headline` | `string` | 20~30자. 동물상과 중복되지 않는 인상 카피 |
| `description` | `string` | 60~100자. 첫 3초에 느껴지는 분위기 한 문장 |
| `summary` | `string` | 200~300자, 2~3단락. 첫인상의 상세 묘사. **Phase 1 §1-2-E-1 권고 반영**: 최소 1단락은 조건 없는 순수 긍정 허용 |
| `vibeTags` | `string[]` (2~4개) | 한 단어 태그. 예: `["따뜻함", "단정함", "여유"]` |
| `intensity` | `Intensity` | `strong`/`balanced`/`subtle`. 첫인상이 얼마나 뚜렷한가 |

#### 3) `observation` (구조화 확장)

"관찰 포인트" — AI가 뭘 보고 해석했는지 유저가 확인하는 신뢰 섹션. Phase 1 §3-3-2 권고 반영.

| 필드 | 타입 | 설명 |
|---|---|---|
| `headline` | `string` | 20~30자 |
| `content` | `string` | 250~400자. **사실 묘사만**. 해석·기질 추론 금지 (다른 섹션과 중복 방지, Phase 1 §1-2-E-3) |
| `features` | `ObservationFeature[]` | 12~18개. 구조화된 부위 관찰 결과 |

`ObservationFeature` 구조:

| 필드 | 타입 | 설명 |
|---|---|---|
| `region` | `PhysiognomyRegion` | 부위 코드 (enum-like 유니온) |
| `axis` | `string` | 관찰 축 (예: `"shape"`, `"width"`, `"density"`) |
| `value` | `string` | 일상 표현 값 (예: `"둥근 편"`, `"넓은 편"`). 한자 금지 |
| `intensity` | `Intensity` | 관찰된 특징의 뚜렷함 정도 |

UI에서는 이 배열을 "관찰된 특징" 배지 리스트로 렌더링해 "AI가 뭘 보고 이렇게 해석했는지" 시각화한다.

#### 4) `traits` (신규 — personality 확장 재설계)

"나의 성향과 매력" — 강점·매력·숨겨진 면을 한 호흡으로 풀어내는 섹션. 본편의 핵심 체류 구간.

| 필드 | 타입 | 설명 |
|---|---|---|
| `headline` | `string` | 20~30자 |
| `strengths` | `string` | 150~250자, 1~2단락. 강점·매력 포인트 |
| `hiddenSide` | `string` | 150~250자, 1~2단락. "숨겨진 면" 또는 "반전". 단점을 이 안에 **부드럽게 녹여서** 기술 (공격성 회피) |
| `tags` | `string[]` (2~4개) | Phase 1 §1-4 권고: `[string, string]` 튜플 → `string[]` 완화 |
| `intensity` | `Intensity` | — |

#### 5) `fortune` (신규 — career + wealth 통합)

"일과 재물의 흐름" — Phase 1이 지적한 careful 관상학 근거 부위(관록궁·재백궁·천창·콧방울·이마 중앙)가 상당 부분 겹치므로 통합 서술이 자연스럽다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `headline` | `string` | 20~30자 |
| `workFlow` | `string` | 150~250자, 1~2단락. 일·재능 경향 |
| `wealthFlow` | `string` | 150~250자, 1~2단락. 재물의 **흐름·리듬·경향** (구체 금액·숫자 금지) |
| `tags` | `string[]` (2~4개) | — |
| `intensity` | `Intensity` | — |

**금기**: "돈이 새어나간다", "얼마를 번다" 같은 단정·수치 금지 (Phase 1 §1-3).

#### 6) `relationship` (확장)

"어울리는 사람" — 공유 욕구 최대 섹션. OG 카드 후보 1순위.

| 필드 | 타입 | 설명 |
|---|---|---|
| `headline` | `string` | 20~30자 |
| `content` | `string` | 200~300자. 관계·연애에서 드러나는 기질 |
| `idealType` | `string` | 80~120자. "어떤 기운의 사람이 끌릴까" — **성별·외모 묘사 금지**, 기질·분위기·태도로만 (Phase 1 부록 B) |
| `shareableQuote` | `string` | **신설**. 40~60자의 독립 문장. OG 카드 중앙 텍스트로 사용 가능한 완결 구조 |
| `tags` | `string[]` (2~4개) | — |
| `intensity` | `Intensity` | — |

**금기**: 배우자·연인의 외모·성별·국적 묘사, 결혼·출산 시기 추정 (Phase 1 부록 B).

#### 7) `actions` (축소)

"이번 주 작은 행동" — 개운법·행동 조언. 5개 → **3개**로 압축.

```ts
actions: FaceReportAction[]; // length === 3
```

`FaceReportAction`은 기존 구조 유지: `{ title: string; detail: string }`.

#### 8) `shareLine`

공유용 한 줄 카피. 기존 유지. 단 동물상을 포함하도록 프롬프트 가이드 강화.

```ts
shareLine: string; // 30~50자. primary 동물상 이름을 자연스럽게 포함 권장
```

### B-3. score 시스템 전면 제거

**결정**: 섹션별 0~100 점수 필드 **전면 삭제**. 종합 점수도 신설하지 않는다.

**근거**:
1. Phase 1 §1-2-E-2: flash-lite가 70~85 구간에 쏠리는 경향. 분포 가이드를 프롬프트에 넣어도 모델 편향 완전 제거는 어려움.
2. 숫자 점수는 **공유 욕구를 만들지 않는다** (유저 가설 A-2-4). 오히려 낮은 점수에서 불만 유발.
3. `animalMatch.confidence` + 섹션별 `intensity`(strong/balanced/subtle)로 **질적 표현**이 충분히 가능.

**대체 신호 체계**:
- **`intensity` 3단계**: 각 섹션의 기운이 얼마나 뚜렷한가를 3단계로 표현. strong=명확한 방향, balanced=균형적, subtle=은은/복합
- **`animalMatch.confidence` 3단계**: 동물상 매칭의 확신도

### B-4. 전체 TypeScript 인터페이스 (v2)

```ts
// libs/face-spoiler/types.ts

// ---------- 보조 타입 ----------

/**
 * 관상 부위 코드.
 *
 * ⚠️ 자미두수 12궁(Palace)과 절대 혼동 금지.
 * face-spoiler는 "얼굴 부위 맵"이고, zi-wei-dou-shu는 "생년월일시 기반 명반 배치"다.
 * 두 모듈은 libs/ 내에서 분리되어 있으며, 네이밍도 분리한다.
 */
export type PhysiognomyRegion =
  | "faceShape" // 얼굴 전체 윤곽
  | "forehead" // 이마
  | "brow" // 눈썹
  | "browSpacing" // 눈썹 사이 간격
  | "eye" // 눈
  | "eyeSpacing" // 눈 사이 간격
  | "eyeCorner" // 눈꼬리
  | "underEye" // 눈 밑
  | "noseRoot" // 콧대가 시작되는 부분
  | "noseBridge" // 콧대
  | "noseTip" // 코끝
  | "nostril" // 콧방울
  | "philtrum" // 코 밑 세로 홈
  | "mouth" // 입
  | "lipThickness" // 입술 두께
  | "mouthCorner" // 입꼬리
  | "cheekbone" // 광대
  | "chin" // 턱 끝
  | "jaw" // 하악 라인
  | "ear"; // 귀

/** 한국 대중문화에서 통용되는 12종 동물상 */
export type AnimalType =
  | "dog"
  | "cat"
  | "fox"
  | "deer"
  | "rabbit"
  | "bear"
  | "tiger"
  | "wolf"
  | "horse"
  | "hamster"
  | "owl"
  | "monkey";

/** 섹션별 기운의 뚜렷함 정도 (점수 시스템 대체) */
export type Intensity = "strong" | "balanced" | "subtle";

/** 동물상 매칭 확신도 */
export type MatchConfidence = "high" | "medium" | "low";

// ---------- 구조화 관찰 ----------

export interface ObservationFeature {
  region: PhysiognomyRegion;
  axis: string; // "shape" | "width" | "density" 등, 프롬프트 내 자유 표기
  value: string; // 일상 표현. 한자 금지
  intensity: Intensity;
}

// ---------- 동물상 매칭 ----------

export interface AnimalMatch {
  primary: AnimalType;
  secondary: AnimalType;
  confidence: MatchConfidence;
  /** 매칭 근거가 된 부위 2~4개. 일상 표현 */
  matchedRegions: string[];
  /** 120~180자. 왜 이 동물상인지 부위 조합 설명 */
  rationale: string;
}

// ---------- 섹션 ----------

export interface FirstImpressionSection {
  headline: string;
  description: string;
  summary: string;
  /** 2~4개 */
  vibeTags: string[];
  intensity: Intensity;
}

export interface ObservationSection {
  headline: string;
  /** 사실 묘사만. 해석 금지 */
  content: string;
  /** 12~18개 구조화 관찰 결과 */
  features: ObservationFeature[];
}

export interface TraitsSection {
  headline: string;
  strengths: string;
  /** 숨겨진 면/반전. 약점을 부드럽게 녹여서 기술 */
  hiddenSide: string;
  /** 2~4개 */
  tags: string[];
  intensity: Intensity;
}

export interface FortuneSection {
  headline: string;
  workFlow: string;
  /** 수치·금액 금지. 흐름·리듬·경향만 */
  wealthFlow: string;
  tags: string[];
  intensity: Intensity;
}

export interface RelationshipSection {
  headline: string;
  content: string;
  /** 어울리는 사람 유형. 성별·외모 금지, 기질·태도만 */
  idealType: string;
  /** 40~60자, OG 카드 중앙 텍스트로 쓰일 완결 문장 */
  shareableQuote: string;
  tags: string[];
  intensity: Intensity;
}

export interface FaceReportAction {
  title: string;
  detail: string;
}

// ---------- 루트 ----------

export interface FaceReportData {
  /** 스키마 버전 — 마이그레이션 분기용 */
  version: 2;

  /** 동물상 매칭 (루트 필드). UI 히어로 영역 전담 */
  animalMatch: AnimalMatch;

  /** 첫인상 — 티저의 메인 콘텐츠 */
  firstImpression: FirstImpressionSection;

  /** 관찰 포인트 — 사실 묘사 + 구조화 features */
  observation: ObservationSection;

  /** 성향과 매력 — 강점·매력·숨겨진 면 통합 */
  traits: TraitsSection;

  /** 일과 재물의 흐름 — career + wealth 통합 */
  fortune: FortuneSection;

  /** 어울리는 사람 — OG 카드 1순위 */
  relationship: RelationshipSection;

  /** 이번 주 작은 행동 — 정확히 3개 */
  actions: FaceReportAction[];

  /** SNS 공유용 한 줄. primary 동물상 이름 자연스럽게 포함 */
  shareLine: string;
}
```

### B-5. v1과의 변경 차이 한눈에

| 필드 | v1 | v2 | 비고 |
|---|---|---|---|
| `version` | ✕ | `2` | 마이그레이션 분기 가능 |
| `animalMatch` | ✕ | ✓ | 신설 루트 필드 |
| `profile` | ✓ | → `firstImpression` | 이름 변경 + `vibeTags`, `intensity` 추가 |
| `observation.content` | string 한 덩어리 | string + `features[]` | 구조화 |
| `personality` | ✓ | → `traits` | `content` → `strengths` + `hiddenSide` 분리 |
| `career` | ✓ | → `fortune.workFlow` | 합병 |
| `wealth` | ✓ | → `fortune.wealthFlow` | 합병 |
| `relationship` | ✓ | + `idealType`, `shareableQuote` | 확장 |
| `actions` (길이) | 5 | **3** | 축소 |
| `shareLine` | ✓ | ✓ | 가이드 강화 |
| `score` (섹션별) | 0~100 숫자 | **삭제** | |
| `tags: [string, string]` | 튜플 | `string[]` (2~4) | 완화 |

---

## C. 결과 페이지 UX PRD

### C-1. 유저 플로우

```
[업로드] → [분석 로딩] → [결제 전 프리뷰 (티저)]
                              ↓
                         [결제 (토스)]
                              ↓
                         [결제 후 본편 (풀 리포트)]
                              ↓
                         [공유 / OG 카드]
```

### C-2. 결제 전 프리뷰 (`/face-spoiler/preview/[shareId]`)

**목표**: "더 보고 싶다"는 호기심을 최대화해서 결제로 넘긴다.

#### 노출 요소 (순서대로)

1. **동물상 히어로 블록** (신설, 최상단)
   - 좌측: primary 동물상 아이콘 + 이름 (세로 배치, hero-image-1.png 참고)
   - 중앙~우측: 캐릭터 이미지 (기존 `CharacterImagePlaceholder`)
   - primary 아래에 secondary를 "+ ○○상의 기운도" 형태로 작게 병기
   - `confidence === "low"` 시 하단에 "~상과의 경계선" 마이크로 힌트
2. **firstImpression.headline + description** (기존 preview 유지)
3. **firstImpression.summary** 2~3단락 (기존 유지)
4. **vibeTags** 배지 3~4개 (신설)
5. **traits 티저**: `traits.strengths`의 첫 한 문장만 블러 처리 없이 노출 + "더 많은 매력 포인트와 숨겨진 면은 결제 후 확인" (결제 유도)
6. **teaser 문구** (기존 유지, 문구 업데이트 필요)
7. **하단 고정 결제 CTA** (기존 `PreviewFooter`)

#### 티저에서 **감추는 것** (본편 전용)

- `observation` 본문 + `features` 배지
- `traits.hiddenSide` 전체
- `fortune` 전체
- `relationship` 전체 (단, 공유 카드를 통해 외부에서 유입된 유저에게는 `shareableQuote`만 먼저 노출되고 본편은 결제 후)
- `actions` 전체

### C-3. 결제 후 본편 (`/face-spoiler/r/[shareId]`)

**섹션 렌더링 순서** (스크롤 깊이별 이탈률 고려):

| # | 블록 | 이유 |
|---|---|---|
| 1 | **동물상 히어로** (animalMatch + 캐릭터 이미지) | 유저가 가장 먼저 확인하고 싶은 요소 |
| 2 | **firstImpression** | 프리뷰와 연속성 확보, "내 인상은 어떻구나" 공감 |
| 3 | **traits** (강점 → 숨겨진 면) | 자기 인식의 정점. 체류 시간 최대 구간 |
| 4 | **relationship** (어울리는 사람 + shareableQuote) | **공유 욕구 정점**. shareableQuote를 눈에 띄는 카드 UI로 강조 |
| 5 | **fortune** (일 + 재물) | 현실 관심사, 중단 배치 |
| 6 | **observation** (사실 묘사 + features 배지) | 신뢰도 근거. 의심 많은 유저를 위한 "AI가 본 것" 시각화 |
| 7 | **actions** (3개 행동 카드) | 떠나기 전 마지막 실행 훅 |
| 8 | **shareLine + 공유 버튼** | 전환 액션 |
| 9 | **윤리 고지 푸터** | 작게 상시 노출 |

#### 동물상 히어로 영역 상세 (hero-image-1.png 참고)

```
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ 🐶 │   [캐릭터 이미지 (1024²)]   │
│  │강아 │                             │
│  │지상 │                             │
│  └────┘                             │
│  + 곰상의 기운도                    │
│                                     │
│  [둥근 얼굴] [올라간 입꼬리]        │  ← matchedRegions 배지
│  [둥근 코끝]                        │
└─────────────────────────────────────┘
```

- **좌측 세로 배치**: `animalMatch.primary` 아이콘 + 라벨을 프로필 이미지 좌측 상단에 세로로 쌓는다.
- **secondary 표기**: "+ ○○상의 기운도" — 작고 부드럽게.
- **matchedRegions 배지**: 히어로 영역 하단 또는 이미지 근처. 유저에게 "왜 이 동물상인가"의 즉각적 근거 제공.

#### intensity 표시

- 섹션 헤드라인 옆에 **3단계 시각 인디케이터**(점 3개 중 몇 개 채움 등).
- 숫자 스코어가 주던 "게임화" 역할을 이 인디케이터가 은은하게 대체. 과하지 않게.

### C-4. 공유 카드 (OG) 가이드라인

#### 1) 메인 공유 카드 (`/face-spoiler/r/[shareId]`의 OG)

- **중앙**: `animalMatch.primary` 동물상 이름 + 캐릭터 이미지
- **상단**: `firstImpression.headline`
- **하단**: `shareLine`
- 다른 메타데이터: `generateMetadata`에서 기존 그대로

#### 2) 관계 전용 공유 카드 (신설)

`relationship.shareableQuote`를 중앙에 크게 올린 별도 OG 이미지. 유저가 "나한테 어울리는 사람 유형" 섹션을 SNS에 공유할 때 쓴다. 이 카드는 **공유 욕구 1순위**이므로 별도 경로 제공:

```
/face-spoiler/r/[shareId]/og-relationship  (Phase 3에서 구현)
```

#### 3) 공유 카드 금기

- 한자 금지 (Phase 1)
- 인종·국적·성별 연상 금지
- 점수·숫자 노출 금지 (score 제거 정책과 일치)

### C-5. 엣지 케이스

| 케이스 | 처리 |
|---|---|
| `animalMatch.confidence === "low"` | primary/secondary 비중 비슷하게 제시, 하단에 경계선 힌트 |
| `observation.features` 가 12개 미만 (모델 이탈) | Phase 3에서 최소 10개 guardrail + 재요청 로직 (ai-dev 결정 사항) |
| 기존 v1 리포트 조회 | §D 마이그레이션 전략 참조 |
| `relationship.shareableQuote` 가 너무 길거나 금기어 포함 | Phase 3에서 길이/금기어 검증 후 fallback 로직 (ai-dev) |

---

## D. 마이그레이션 영향 분석

### D-1. 영향 받는 파일 리스트

#### 필수 수정
- `libs/face-spoiler/types.ts` — v2 인터페이스로 전면 교체 (§B-4)
- `libs/face-spoiler/prompts/text-report.ts` — 섹션 구조·동물상·features 반영
- `libs/face-spoiler/gemini.ts` — v2 스키마 응답 파싱 (zod 등)
- `libs/face-spoiler/prompts/` 하위 i18n 파일 — 섹션 네이밍 업데이트
- `components/face-spoiler/ReportView.tsx` — 7섹션 구조, score 제거, intensity 렌더, features 배지, animalMatch 히어로 렌더 (대규모 수정)
- `components/face-spoiler/ReportView.module.css` — score 관련 스타일 삭제, intensity 인디케이터·features 배지·히어로 좌측 세로 배치 스타일 추가
- `app/face-spoiler/preview/[shareId]/page.tsx` — 프리뷰에 animalMatch 히어로 추가, vibeTags·traits 티저 반영
- `app/face-spoiler/preview/[shareId]/page.module.css` — 동물상 히어로 좌측 세로 배치 레이아웃
- `app/face-spoiler/r/[shareId]/page.tsx` — 섹션 순서 재조정, animalMatch 히어로 노출
- `app/face-spoiler/r/[shareId]/page.module.css` — 좌측 세로 배치 레이아웃
- i18n 번역 키: `faceSpoiler.report.sections.*` — 섹션 이름 변경 (profile → firstImpression, career/wealth → fortune, personality → traits 등), animalMatch 관련 라벨 신설, score 관련 라벨 제거

#### 신규 추가
- `components/face-spoiler/AnimalHero.tsx` — 히어로 영역 전용 컴포넌트
- `components/face-spoiler/FeatureBadges.tsx` — `observation.features` 배지 리스트
- `components/face-spoiler/IntensityIndicator.tsx` — 3단계 인디케이터
- `components/face-spoiler/ShareableQuoteCard.tsx` — `relationship.shareableQuote` 전용 카드
- (선택) `app/face-spoiler/r/[shareId]/og-relationship/route.ts` — 관계 전용 OG 이미지 생성 (Next.js ImageResponse)

#### 동물상 아이콘/이미지 에셋
- `public/face-spoiler/animals/` — 12종 동물상 아이콘 (SVG 권장). Phase 3 배포 전 디자이너 협업 필요

### D-2. 기존 저장 리포트 호환 전략

Supabase `face_reports.result` (jsonb 컬럼)에 v1 스키마로 저장된 리포트가 존재할 가능성이 높다. Phase 3 fullstack이 다음 **두 옵션** 중 선택한다.

#### 옵션 A: 런타임 어댑터 (v1 → v2)

- 장점: 기존 리포트도 신규 UI로 렌더링 가능, 단일 렌더 경로 유지
- 단점: animalMatch 를 만들 수 없음(원본 데이터에 없음) → placeholder 동물상 또는 히어로 숨김 필요. features 배열도 빈 배열로 강제. traits.hiddenSide 공백. 결과적으로 v1 리포트는 "반쪽짜리 v2"로 보임
- 구현: `libs/face-spoiler/adapters/v1-to-v2.ts` 신설, `fetchReport` 이후 버전 감지하여 어댑터 통과

#### 옵션 B: legacy 분기 렌더러

- 장점: v1 원본 그대로 보존, 품질 유지
- 단점: ReportView, preview, r 페이지에 `if (report.version === 2)` 분기 또는 `ReportViewV1` / `ReportViewV2` 별도 컴포넌트 유지. 유지보수 부담
- 구현: `components/face-spoiler/ReportViewLegacy.tsx` 를 기존 ReportView에서 리네임 후 유지, 신규는 `ReportView.tsx` 에 v2 전용으로 작성. 페이지는 버전 감지 분기

#### 권장 (planner 의견)

**옵션 B (legacy 분기)** 를 권장한다. 근거:
1. 어댑터로 만든 v1 리포트는 animalMatch가 비어 있어 신규 UI의 핵심 가치(동물상 히어로)를 전달하지 못하므로 UX 품질이 기대치에 못 미친다.
2. 관상스포 서비스는 최근(2026-04) 런칭되어 **저장된 v1 리포트 수가 많지 않을 것**으로 추정된다 — fullstack이 실제 `face_reports` row count를 확인 후 최종 결정할 것. row가 100건 미만이면 옵션 B가 명백히 유리.
3. 운영 리포트 수가 많다면 옵션 A의 어댑터에 "v1 리포트입니다 — 신규 버전으로 재생성하세요" 고지 + 재생성 버튼을 추가하는 하이브리드도 가능.

**결정 시점**: Phase 3-B 착수 직전에 fullstack이 `face_reports` count 확인 후 최종 결정.

### D-3. DB 스키마 영향

- `face_reports.result` 는 jsonb 컬럼이므로 **DDL 변경 불필요**.
- (선택) `face_reports` 에 `result_version smallint` 컬럼을 신설해 쿼리·필터링을 쉽게 할 수 있다. Phase 3-B fullstack 판단.

### D-4. 프롬프트(Phase 3-A) 사전 확인 포인트

- Phase 3-A (ai-dev) 가 `text-report.ts` 재설계 시 본 문서 §B-4 TypeScript 인터페이스를 **진리의 원천(single source of truth)** 으로 삼는다.
- Phase 1 §3-1의 6개 프롬프트 모듈 구조(FORBIDDEN_RULES / INTERPRETATION_PRINCIPLES / OBSERVATION_PROTOCOL / FACE_PHYSIOGNOMY_GUIDE / COMBINATION_PATTERNS / ANIMAL_MATCHING_RULES / STYLE_GUIDE)를 따른다.
- 동물상 12종 매핑·혼동 쌍 tie-breaker는 Phase 1 §2의 테이블을 그대로 이식한다.
- Zod 스키마는 §B-4의 TypeScript 타입을 그대로 반영 (version: literal 2, animalMatch 필수, actions.length === 3 등).

---

## E. 우선순위 (MoSCoW)

### 🔴 Must (Phase 3 필수 구현)
- `FaceReportData v2` 전체 타입 (§B-4) 정의
- `animalMatch` 루트 필드 + UI 히어로 영역 (좌측 세로 배치)
- `observation.features[]` 구조화 + 배지 UI
- score 필드 전면 제거 + `intensity` 3단계 표시
- `career + wealth → fortune` 통합
- `traits` (강점 + 숨겨진 면)
- `actions` 5 → 3 축소
- `relationship.idealType` + `shareableQuote` 신설
- 프리뷰의 동물상 히어로 노출 (primary만, secondary는 본편에서)
- 기존 v1 리포트 조회 호환 (§D-2 옵션 선택)
- Phase 1 §1-2-F 윤리 가드 4개 추가 (표정/화장/성별/동물상-인종)

### 🟡 Should (Phase 3 권장)
- `relationship` 전용 OG 카드 (`og-relationship` route)
- `confidence === "low"` 시 UI 경계선 힌트
- features 배지의 intensity별 시각 차등
- 동물상 12종 아이콘 에셋 (디자이너 협업)

### 🟢 Could (Phase 4+ 후속)
- 사용자별 동물상 컬렉션 (재방문 유도)
- 동물상 궁합 (두 사람 비교)
- 관상 변화 트래킹 (동일 유저의 다른 사진 비교)

---

## F. 미해결 이슈 / 다음 결정 필요 사항

1. **동물상 아이콘 에셋**: 디자이너 협업 또는 외부 아이콘 라이브러리 사용? Phase 3-B 착수 전 결정 필요.
2. **기존 v1 리포트 마이그레이션 옵션 A vs B**: fullstack이 `face_reports` row count 확인 후 최종 결정.
3. **`relationship` OG 카드**: Phase 3에 포함할지, Phase 4로 미룰지? (Should 레벨이나 공유 효과가 크므로 Phase 3 포함 권장)
4. **i18n**: 섹션 이름 변경에 따른 en/ja 번역 필요. Phase 3-B 스코프.

---

## 최종 요약

- **섹션 8 → 7**: `firstImpression` / `observation` / `traits` / `fortune` / `relationship` / `actions(3)` / `shareLine` + 루트 `animalMatch`
- **score 전면 제거**, `intensity`(strong/balanced/subtle) + `confidence`(high/medium/low)로 질적 대체
- **career + wealth → fortune 통합**
- **동물상 히어로 좌측 세로 배치**, `relationship.shareableQuote` OG 카드용 신설
- **자미두수 Palace와 네이밍 충돌 금지**, `PhysiognomyRegion` 유지
- **마이그레이션**: legacy 분기(옵션 B) 권장, fullstack이 row count 확인 후 최종 결정

Phase 3-A (ai-dev): 본 문서 §B-4 타입을 진리로 삼아 프롬프트·Zod 스키마 재설계.
Phase 3-B (fullstack): 본 문서 §D 영향 파일 리스트를 따라 타입·UI·페이지·i18n·마이그레이션 구현.
