# 관상 리포트 생성 파이프라인 — 전체 과정

**문서 생성일**: 2026-04-23
**대상 코드 기준**: Phase 20.3/20.4 반영 상태
**독자**: 신규 합류 엔지니어·QA·기획자

---

## 1. 한눈에 보는 흐름

```
[브라우저]
   ↓ 사진 업로드 (FormData)
[POST /api/face-spoiler/upload]                ── 단계 A. 업로드·저장·캐시 체크
   ├─ 인증 가드
   ├─ Storage 저장 (face-images 버킷)
   ├─ SHA-256 image_hash 계산
   └─ 프로필 × 해시 캐시 hit → shareId 반환 (끝)
   ↓ 캐시 miss
[내부 호출: POST /api/face-spoiler/report/generate]  ── 단계 B. LLM 파이프라인
   ├─ Storage에서 이미지 base64 로드
   ├─ MediaPipe로 FaceMetrics 측정 (결정적)
   ├─ 동물상 분류 (animal-scorer, 코드 결정적)
   ├─ 동물상 rationale 생성 (animal-classifier, Gemini 호출)
   ├─ 8개 부위 점수 산출 (region-scorer, 코드 결정적)
   ├─ 텍스트 리포트 3 Stage 병렬 호출
   │    · Stage A: signature + overallScore
   │    · Stage B: regionScores (8부위)
   │    · Stage C: interestAreas + closing
   │    · Provider 스위칭: Gemini 2.5 Flash (기본) / GPT-5.4 mini (실험)
   └─ 코드 결정 필드 + LLM 응답 합성 → face_reports.result 저장
   ↓ shareId 반환
[브라우저 redirect]
   ↓
[/face-spoiler/payment/[shareId]]              ── 단계 C. 결제
   ├─ Toss 결제 위젯
   └─ paid_at 업데이트
   ↓
[/face-spoiler/r/[shareId]]                    ── 단계 D. 리포트 렌더
   ├─ AnimalHero (히어로)
   ├─ ReportViewV3 (전체 컨텐츠)
   └─ OG 이미지·공유 액션
```

결정적 레이어(코드)와 창작 레이어(LLM)가 **명확히 분리**돼 있는 것이 핵심. 같은 얼굴이면 점수·분류는 항상 같고, 텍스트만 LLM에서 창작된다.

---

## 2. 단계 A — 사진 업로드 (`app/api/face-spoiler/upload/route.ts`)

### 2.1 인증 가드
- `createAuthClient().auth.getUser()`로 Supabase 유저 확인
- 미로그인이면 401

### 2.2 파일 검증
- `FormData`에서 `image` 필드 추출
- MIME 타입 검사 (`image/jpeg` / `image/png` / `image/webp`)
- 크기 상한 (대략 10MB, 코드로 확인 가능)

### 2.3 Storage 업로드
- 버킷: `face-images`
- 경로: `user_{userId}/{uuid}.{ext}`
- 업로드 실패 시 Storage에서 삭제 + 401/500 반환

### 2.4 image_hash 계산
```typescript
const deterministicHash = await computeImageHash(buffer);  // SHA-256
const imageHash = makeEffectiveImageHash(deterministicHash);
```
- **production**: 결정적 해시 그대로. 같은 사진 재업로드 시 캐시 히트 가능.
- **development**: 해시 뒤에 `nanoid(8)` 붙여 매번 다른 값. 프롬프트 변경 후 같은 사진으로 반복 테스트 시 새 리포트가 생성되도록.

### 2.5 프로필 × 해시 캐시 체크
- `face_reports` 테이블에서 `(user_id, image_hash)` 유니크 조회
- 이미 있고 `result.version === 3`이면 **기존 shareId 즉시 반환** — LLM 호출 없이 종료

### 2.6 캐시 miss → generate 라우트 내부 호출
- `fetch("/api/face-spoiler/report/generate")` 동기 호출
- `base64` 이미지 + `imageHash` + `imagePath` + `faceMetrics` 전달

---

## 3. 단계 B — 리포트 생성 (`app/api/face-spoiler/report/generate/route.ts`)

### 3.1 글로벌 v3 캐시 체크
- `image_hash` 기준 **다른 유저가 이미 생성한 v3 리포트**가 있으면 재사용
- 유명인 사진 등 자주 업로드되는 이미지에 대한 LLM 호출 절약
- dev 환경에서는 이 단계도 스킵 (항상 새 생성)

### 3.2 FaceMetrics 측정 — MediaPipe 468 랜드마크
**파일**: `libs/face-spoiler/face-shape-analyzer.ts`
- 브라우저에서 MediaPipe Face Landmarker 모델이 468개 얼굴 랜드마크 좌표 추출
- 추출된 좌표로 파생 지표 계산:
  - `faceRatio` — 얼굴 세로/가로 비율 (표준 1.05)
  - `jawWidthRatio` — 턱 폭 / 광대 폭
  - `jawAngularity` — 턱선 각진 정도 (0~1)
  - `foreheadWidthRatio` — 이마 폭 / 광대 폭
  - `eyeAspectRatio` — 눈 가로/세로비
  - `eyeCornerAngle` — 눈꼬리 각도 (± 도)
  - `eyeSizeRatio` — 눈 크기 / 얼굴 크기
  - `eyeSpacingRatio` — 양눈 간격
  - `noseLengthRatio` — 코 길이 / 얼굴 세로
  - `mouthWidthRatio` — 입 폭 / 얼굴 가로
  - `philtrumRatio` — 인중 길이 / 코 길이
  - `samjeong` — 상삼정·중삼정·하삼정 비율 (각 약 1/3)
- **결정성**: 같은 사진 → 같은 FaceMetrics. 이후 모든 결정적 레이어의 입력.

### 3.3 동물상 분류 — 2단계 구조

#### (1) 코드 결정적 분류 (`libs/face-spoiler/animal-scorer.ts`)
**왜 코드로**: 이전 LLM 분류기가 대부분 고양이상으로 회귀하는 편향이 있어 폐기.

12종 동물상(`fox`, `dog`, `cat`, `deer`, `tiger`, `rabbit`, `bear`, `wolf`, `hamster`, `dinosaur`, `horse`, `turtle`)마다 `scoringRules` 정의:
- `must` — 필수 매칭 룰 (불만족 시 1위여도 confidence low)
- `supporting` — 가점 룰
- `never` — 매칭되면 감점

각 룰은 `{ metric, operator, threshold, weight }` 구조. `readScoringMetric()`이 FaceMetrics에서 값을 뽑아 연산자로 비교해 가중치 합산.

결과: `primary`(1위 동물상) + `confidence`(high/medium/low) + `allScores`(12종 전체).

#### (2) LLM rationale 생성 (`libs/face-spoiler/animal-classifier.ts`)
분류는 이미 끝났다는 전제로 **Gemini 2.5 Flash-Lite**에 사진 + primary를 전달:
- `rationale` (120~180자): 일상 표현으로 분위기 묘사
- `matchedRegions` (2~4개): 근거 부위 한글 표현

**Phase 17.2 안정성 개선**:
- 한자 관상용어(`와잠`·`산근` 등), 숫자, 내부 변수명이 나오면 위반으로 간주
- 최대 5회 재시도 + 매 재시도마다 **위반 상세를 피드백 블록으로 주입** (LLM이 교정 가능하도록)
- 6회 모두 실패하면 catalog의 `impressionKeywords` 기반 Fallback rationale로 대체
- 사용자가 결제 후 분류 실패로 막히는 일이 없도록 안전망 확보

### 3.4 부위별 점수 산출 (`libs/face-spoiler/region-scorer.ts`)
8개 부위(`forehead`, `eye`, `brow`, `nose`, `mouth`, `chin`, `cheekbone`, `balance`)마다 결정적 계산.

#### 구조 (모든 부위 동일 패턴)
```typescript
const scoreForehead = (m: FaceMetrics) => {
  const widthFit = gaussianFit(m.foreheadWidthRatio, 0.9, 0.048);
  const samjeongFit = gaussianFit(m.samjeong.upper, 0.33, 0.02);
  const fit = (widthFit + samjeongFit) / 2;   // 0~1

  let hint: string;
  if (m.foreheadWidthRatio > 1.0) hint = "...상부형 인상";
  else if (...) hint = "...";
  // ... 6~8개 구간

  return { score: fitToBaseScore(fit), hint };
};
```

- **`gaussianFit(x, center, width)`** — 중심에서 멀어질수록 0에 수렴 (0~1)
- **`fitToBaseScore(fit)`** (Phase 17.3):
  ```
  expanded = clamp((fit - 0.5) × 3.0 + 0.5, 0, 1)
  score = 7.0 + expanded × 2.7   → 7.0~9.7 구간
  ```
  평균대였던 fit을 양극으로 펼쳐 점수 편차 확보.
- **`hint`** — LLM 프롬프트의 방향성 힌트. 6~8개 구간 분기로 인물마다 다른 문구.

#### balance (전체 균형감) — Phase 20.4 다변화
기존 2요소(`balanceFit`, `faceBalanceFit`)가 3명 모두 fit 0.4 근처로 수렴 → 7.0 고착.
현재는 3요소 가중 평균:
1. `balanceFit` (45%) — 삼정 고른 정도
2. `faceShapeFit` (35%) — 얼굴형 극단(세로/둥근)에서도 가점
3. `biasFit` (20%) — 상/하 편향 강도

#### 각 부위에 `numericHint` 자동 생성
`buildNumericHint(key, metrics)`가 원시 수치 요약 문자열 반환:
- 이마: `"상부 폭 비율 0.89 · 상삼정 0.34"`
- 균형감: `"삼정 상 0.34 / 중 0.34 / 하 0.32 · 얼굴 비율 1.05"`

이 `numericHint`는 **Stage A 프롬프트에서만** 사용 — LLM이 문장형 힌트를 재포장하는 동질화를 방지.

#### `deriveTotalScore` (Phase 17)
```
othersAvg = 7부위(balance 제외) 점수 평균
balanceWeight = 0.15   // 과거 0.35 → 축소
raw = othersAvg × 0.85 + balance × 0.15
total = clamp(round1(raw), 7.0, 9.7)
```

### 3.5 텍스트 리포트 3 Stage 병렬 호출

#### Provider 스위칭 (Phase 20)
```typescript
const provider = env.FACE_SPOILER_LLM_PROVIDER;  // "gemini" | "openai"
const generate = provider === "openai"
  ? generateFaceReportV3OpenAI
  : generateFaceReportV3;
```
- **Gemini 구현** (`libs/face-spoiler/gemini.v3.ts`) — Gemini 2.5 Flash
- **OpenAI 구현** (`libs/face-spoiler/openai.v3.ts`) — GPT-5.4 mini
- 두 구현이 **프롬프트·validator·재시도 정책을 공유**. API 호출 레이어만 분리.

#### Stage A — Signature + OverallScore
**목적**: 히어로 한 줄 정의 + 종합 인상 본문

**반환 필드**:
```typescript
signature: {
  oneLineDefinition: string;      // 25~40자, 동물상 해시 기반 lane 할당
  subDefinition: string;          // 60~90자
  coreKeywords: string[];         // 5개, 각 4자 이내
  commonlyHeardPhrase: string;    // "~한다는 말, 익숙하시죠?"
  commonMisread: string;          // 오해 반전 트리거
}
overallScore: {
  scoreOneLiner: string;          // 20~30자 한 줄
  summary: string;                // 200~280자, 2단락
  highlights: Array<{ title, body }>;  // 6~10개
}
```

**프롬프트 주입 요소**:
- Animal 이름 **숨김** (Phase 17) — "강아지상"이라는 단어 언급 시 관상학 관용어로 수렴하는 편향 차단
- **원시 수치 hint** (Phase 16.2) — 문장형 hint 대신 `"상부 폭 비율 0.89"` 같은 수치만
- **부위 조합 강제** (Phase 18) — 점수 상위 2 + 하위 1을 지정해 "이 조합으로 해석하라"
- `ONE_LINE_DEFINITION_LANES` 5종 톤 중 1개 결정적 할당 (현대 비유형 / 의인화형 / 감각 체험형 / 속담 유머형 / 대사 인용형)

#### Stage B — RegionScores (8부위 해석)
**반환 필드**:
```typescript
regions: Array<{
  interpretation: string;   // 80~140자, 부위 해석
  bullets: string[];        // 3개, 각 12~25자, 일상 상황 묘사
  oneLiner: string;         // 18~30자, 부위별 문법 패턴 강제
}>
```

**부위별 oneLiner 문법 패턴** — `REGION_ONE_LINER_PATTERNS`:
- forehead, chin → **A보다 B 대조형**
- eye, cheekbone → **명사구 결말형**
- brow, balance → **역설·반전형**
- nose → **관점·시간형**
- mouth → **일상 어미형**

같은 패턴이 전체에서 과반을 넘으면 수렴이라 패턴 고정으로 강제 다양화.

#### Stage C — InterestAreas + Closing
**반환 필드**:
```typescript
interestAreas: {
  areas: Array<{
    domain: "love" | "money" | "career";    // 순서 고정
    label: "💕 연애운" | "💰 재물운" | "💼 직장운";
    oneLineDefinition: string;              // 25~40자
    body: string;                           // 280~360자, 3~4단락
    strengths: string[];                    // 3개
    cautions: string[];                     // 3개
    oneLineVerdict: string;                 // 25~40자
    characterNickname: string;              // "~타입" / "~왕" / "~러"
    nicknameSubtext: string;                // 30~50자
  }>
}
closing: {
  finalNickname: string;
  finalNote: string;
  shareLine: string;    // SNS 공유 문구, 동물상 이름 포함
}
```

**Phase 20.3 분야별 부위 조합 강제**:
- 연애운 핵심 부위: 입·눈·눈썹·광대 중 점수 상위 2
- 재물운 핵심 부위: 코·입·턱 중 점수 상위 2
- 직장운 핵심 부위: 이마·코·턱·눈 중 점수 상위 2
- 각 분야 body 첫 문장에 강점 1 부위 직접 등장 강제

### 3.6 공통 프롬프트 시스템
**`libs/face-spoiler/prompts/text-report.v3.ts`**

#### `FORBIDDEN_RULES` — 금지 규칙
- 외모 평가, 인종·나이·체중 언급 금지
- 한자 관상용어 금지
- 측정 수치·변수명 출력 금지
- 단정("반드시") 금지 → "~쪽으로 보여요" 톤 유지
- 성별 추정 금지
- 특수문자(`→`, `⇒`, 마크다운) 금지 (Phase 20.5)

#### `TONE_V3_RULES` — 톤 규칙
- 모든 문장 존댓말 (`~요`, `~예요`, `~이에요`)
- `"관상에서는 ~ 보기도 해요"` 상담가 화법 일부 섹션 필수
- `"A보다 B"` 대조 패턴 30~40%에 채택
- 따옴표 한 줄 평 시그니처 패턴

### 3.7 Validator + 재시도
**Soft validator (품질)** — 경고만, 최종 시도에서도 통과:
- 블랙리스트 어휘 상한 (`묵직`, `안정`, `조화`, `부드럽`, `단정`, `은근`, `판단력` 등)
- 지성 축 통합 상한 (관찰력·판단력·분석·명석·통찰 등 합계 3회)
- 상담가 화법 섹션별 상한 (A 2회, B 4회, C 3회)
- 시간·축적 은유 상한 (6회)
- 긴 구문(8자 이상) 반복

**Hard validator (구조)** — 최종 실패 시 throw:
- 배열 개수 (highlights 6~10, bullets 정확히 3, areas 정확히 3)
- domain 순서 (love → money → career)

**재시도 정책**:
- Soft 1회, Hard 3회
- 재시도 시 **위반 사유를 프롬프트에 feedback으로 주입** (`buildRetryFeedback`)
- 같은 프롬프트로 재시도하지 않고 LLM이 교정 방향을 알 수 있도록

### 3.8 응답 합성 + DB 저장
```typescript
const reportData: FaceReportDataV3 = {
  version: 3,
  signature: { ...textReport.signature, animalChip: { type, label } },
  overallScore: { ...textReport.overallScore, totalScore },
  regionScores: { regions: [...zipWithScores...] },
  interestAreas: textReport.interestAreas,
  closing: textReport.closing,
};
```
- 코드 결정 필드(`animalChip`, `totalScore`, 각 region `score`)를 LLM 응답과 합성
- `face_reports` 테이블에 UPSERT (`(user_id, image_hash)` 유니크 제약 처리)
- `shareId` 반환

---

## 4. 단계 C — 결제 (`app/face-spoiler/payment/[shareId]/page.tsx`)

- Toss 결제 위젯 (기본결제 + 해외 PayPal 옵션)
- 쿠폰 자동 검증 (production에서만, dev는 수동 테스트)
- 결제 완료 시 `face_reports.paid_at` 업데이트
- production: `paid_at` 존재 시 자동으로 리포트 페이지 redirect
- dev: redirect 비활성화 (반복 테스트용)

---

## 5. 단계 D — 리포트 렌더 (`app/face-spoiler/r/[shareId]/page.tsx`)

### 5.1 데이터 조회
- `shareId`로 `face_reports` 조회
- `result.version === 3` 확인 (v2 리포트는 이 경로 미지원)
- 로그인 유저와 `user_id` 비교 → `isOwner` 플래그

### 5.2 렌더 구조
```
<AnimalHero
  animalMatch={heroAnimalMatch}          // primary, matchedRegions, rationale=""
  characterImageUrl={...}
  showFullContext
  showDownloadSlot={isOwner}
/>
<ReportViewV3 report={report} />
<FaceReportActions / GuestFaceActions />
```

- **Phase 20.1 버그 수정**: AnimalHero의 `rationale`에 `subDefinition`을 재활용하던 로직 제거. SignatureHero가 같은 문단을 또 그려 히어로 영역 중복 문단이 두 번 노출되던 문제 해소. 지금은 `rationale: ""`이고 AnimalHero가 falsy면 렌더 skip.

### 5.3 SignatureHero 구성
- `oneLineDefinition` (h1)
- `subDefinition` (부연 설명)
- `animalChip` (동물상 칩)
- `coreKeywords` (해시태그 5개)
- `commonlyHeardPhrase` + `commonMisread` (카드 2개)
- `ScoreGauge` (totalScore) + `scoreOneLiner`

### 5.4 ReportViewV3 구성
v3 섹션을 순서대로 렌더:
1. **OverallScoreSection** — `summary` + `highlights` 리스트
2. **RegionScoresSection** — 8개 `RegionScoreCard`
3. **InterestAreasSection** — 3개 `InterestAreaCard` (연애·재물·직장)
4. **ClosingSection** — finalNickname + finalNote + shareLine

### 5.5 OG 이미지
- `app/face-spoiler/r/[shareId]/opengraph-image.tsx` — Next.js 메타데이터 동적 생성
- SNS 공유 시 shareLine + 동물상 캐릭터 이미지 노출

---

## 6. 결정적 레이어 vs 창작 레이어 — 역할 분리 정리

| 항목 | 결정 주체 | 파일 |
|---|---|---|
| FaceMetrics (468 랜드마크 → 파생 지표) | 코드 (MediaPipe) | `face-shape-analyzer.ts` |
| 동물상 분류 (primary) | 코드 | `animal-scorer.ts` |
| 동물상 rationale (일상 언어 설명) | LLM (Gemini Flash-Lite) | `animal-classifier.ts` |
| 8개 부위 점수 (7.0~9.7) | 코드 | `region-scorer.ts` |
| 부위 hint (방향성 문구) | 코드 (구간 분기) | `region-scorer.ts` |
| Stage A signature/overall 텍스트 | LLM | `openai.v3.ts` or `gemini.v3.ts` |
| Stage B 부위별 interpretation/bullets/oneLiner | LLM | 〃 |
| Stage C 분야별 body/strengths/cautions/nickname | LLM | 〃 |
| 총점 (`totalScore`) | 코드 (balance 15% 가중 평균) | `region-scorer.ts` |

**철학**: 숫자·분류는 결정적(같은 사진 = 같은 결과)이어야 사용자가 "왜 점수가 바뀌냐" 의심하지 않음. 반면 텍스트는 매번 조금씩 다른 게 콘텐츠 재미에 유리해 LLM에게 창작 자율성 부여. 단, validator·프롬프트로 톤·금기어는 강하게 묶음.

---

## 7. Provider 스위칭 — Gemini vs OpenAI

### 환경변수
```env
# 필수
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-...

# 선택 (default: gemini)
FACE_SPOILER_LLM_PROVIDER=openai
OPENAI_FACE_MODEL=gpt-5.4-mini-2026-03-17
```

### 공유 자산
- 프롬프트 빌더 (`buildSignatureOverallSystemPrompt` 등)
- JSON 구조 (`SignatureOverallResponse` 등 TS 타입)
- Validator 3종 (`validateSignatureOverall` 등)
- 블랙리스트·상담가 화법·지성 축 상한
- 재시도 feedback 템플릿

### 분리 자산
- API 호출 레이어 (`callStage`) — 엔드포인트·요청 포맷만 다름
- JSON Schema — Gemini용 / OpenAI strict 용 (`additionalProperties: false` 등)

### 영향 범위
**교체 대상**: Stage A/B/C 텍스트 리포트 생성
**유지 (Gemini)**: 동물상 rationale 생성 (`animal-classifier.ts`)

---

## 8. 캐시 전략

| 상황 | 캐시 동작 | 코드 |
|---|---|---|
| 같은 유저, 같은 사진 | `(user_id, image_hash)` unique hit → 기존 shareId 즉시 반환 | upload route |
| 다른 유저, 같은 사진 | 글로벌 v3 hit → 다른 사람 결과 복사 후 저장 | generate route |
| dev 환경 (default) | `image_hash`에 nanoid 붙여 매번 새 생성 | `makeEffectiveImageHash` |
| dev 환경 (옵션) | `FACE_SPOILER_FORCE_CACHE=true`로 production 동작 시뮬레이션 | 〃 |

캐시가 있으면 LLM 호출 비용 0원. 없으면 Gemini 3 Stage × 재시도 최대 4회 = 최대 12회 호출 가능.

---

## 9. 실패·복원력

| 시나리오 | 처리 | 코드 |
|---|---|---|
| 얼굴 미검출 | 400 반환, 다시 업로드 안내 | upload route |
| 동물상 rationale Gemini 실패 (6회 재시도 초과) | Fallback rationale 생성, 리포트 계속 | animal-classifier |
| Stage A/B/C Hard validator 최종 실패 | 500 반환 + Storage 이미지 삭제 | generate route |
| Stage A/B/C Soft validator 최종 실패 | 경고 로그 + 통과 | gemini.v3 / openai.v3 |
| OpenAI finish_reason=length | 재시도 + maxOutputTokens 증설 필요 로그 | openai.v3 |
| OpenAI content_filter | 명시 에러 | openai.v3 |

---

## 10. 주요 파라미터 요약 (튜닝 포인트)

| 파라미터 | 현재값 | 위치 | 의미 |
|---|---|---|---|
| fit 비선형 계수 | 3.0 | region-scorer `fitToBaseScore` | 클수록 점수 양극 분산 |
| fit 점수 대역 | 7.0~9.7 | 〃 | 최종 점수 범위 |
| balance 가중치 | 0.15 | region-scorer `deriveTotalScore` | 클수록 총점이 balance로 수렴 |
| MAX_HARD_RETRIES | 3 | gemini.v3 / openai.v3 | 구조 실패 재시도 |
| MAX_SOFT_RETRIES | 1 | 〃 | 품질 실패 재시도 |
| temperature | 0.85 | 〃 | 창의성 정도 |
| maxOutputTokens | 8192 | 〃 | Stage별 응답 길이 상한 |
| 지성 축 상한 | 3회 | gemini.v3 `INTELLECT_AXIS_LIMIT` | 관찰·판단·분석 합계 상한 |
| 상담가 화법 상한 | A 2 / B 4 / C 3 | 〃 | 섹션별 "관상에서는 ~" 상한 |

---

## 11. 파일 맵 (핵심만)

```
app/
├── api/face-spoiler/
│   ├── upload/route.ts                 ── 업로드 엔트리
│   ├── report/generate/route.ts        ── LLM 파이프라인
│   └── character-image/route.ts        ── OG 캐릭터 이미지
├── face-spoiler/
│   ├── payment/[shareId]/page.tsx      ── 결제 페이지
│   └── r/[shareId]/
│       ├── page.tsx                    ── 리포트 페이지
│       └── opengraph-image.tsx         ── OG 이미지
components/face-spoiler/
├── SignatureHero.tsx, SignatureHookCard.tsx, ScoreGauge.tsx
├── ReportViewV3.tsx, RegionScoreCard.tsx, InterestAreaCard.tsx
└── AnimalHero.tsx
libs/face-spoiler/
├── constants/animals.ts                ── 12종 카탈로그 + scoringRules
├── face-shape-analyzer.ts              ── MediaPipe 측정
├── animal-scorer.ts                    ── 분류 (결정적)
├── animal-classifier.ts                ── rationale LLM (Gemini Flash-Lite)
├── region-scorer.ts                    ── 8부위 점수·hint (결정적)
├── types.ts, types.v3.ts               ── 타입·스키마 가드
├── gemini.v3.ts                        ── Stage A/B/C Gemini 호출
├── openai.v3.ts                        ── Stage A/B/C OpenAI 호출
└── prompts/
    ├── text-report.v3.ts               ── 프롬프트 빌더 + Gemini 스키마
    └── text-report.v3.openai-schemas.ts ── OpenAI strict 스키마
env.ts                                   ── API 키·provider 스위칭
```
