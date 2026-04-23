# 관상 리포트 LLM 입력 감사 — 이미지 vs 데이터

**작성**: 2026-04-21
**목적**: "관상 전체 리포트를 생성할 때 이미지를 LLM에 전달하는지, 아니면 다른 데이터만 전달하는지" 명확히 확인
**조사 방법**: 코드 추적 (`libs/face-spoiler/gemini.v3.ts`, `animal-classifier.ts`, `prompts/text-report.v3.ts`, API route)

---

## 🔎 결론 (한 문장)

> **이미지와 데이터를 "둘 다" 전달합니다.** 단계별로 비중이 다른데, LLM은 항상 **base64 이미지 + 사전 분석 데이터(동물상 + 부위 hint)** 를 함께 입력받습니다.

---

## 1. 전체 파이프라인

리포트 1건 생성 시 **LLM이 관여하는 호출은 총 4회** (v3 기준):

```
클라이언트 (MediaPipe 468개 랜드마크)
  ├─ FaceMetrics 측정 (얼굴형·눈 비율·코 길이·삼정 분포 등 수치)
  └─ 이미지 파일 + FaceMetrics 업로드

서버 /api/face-spoiler/report/generate
  │
  ├─ [1] 동물상 분류
  │     ├─ scoreAnimals(faceMetrics)        ← 코드 결정적 (LLM 미사용)
  │     └─ generateRationale()              ← LLM 호출 ①
  │        입력: 이미지 ✅ + 분류 결과 + faceShapeHint
  │        출력: rationale, matchedRegions
  │
  ├─ [2] 부위 점수 산출
  │     └─ scoreRegions(faceMetrics)         ← 코드 결정적 (LLM 미사용)
  │        출력: 8개 부위 점수 + rationaleHint 텍스트
  │
  └─ [3] 텍스트 리포트 (v3 3 Stage 병렬)
        ├─ Stage A: signature + overallScore ← LLM 호출 ②
        ├─ Stage B: regionScores (8개 해석)  ← LLM 호출 ③
        └─ Stage C: interestAreas + closing  ← LLM 호출 ④
           입력 (공통): 이미지 ✅ + animalMatch + regionScores hints
```

---

## 2. LLM 호출별 입력 상세

### 2.1 LLM 호출 ① — 동물상 설명 (rationale)

**코드 위치**: `libs/face-spoiler/animal-classifier.ts` > `generateRationale()`

```typescript
const parts: GeminiPart[] = [
  { text: RATIONALE_USER_PROMPT },
  { inlineData: { mimeType, data: imageBase64 } },  // ← 이미지 직접 전달
];
```

**전달되는 것**:
- ✅ **이미지** (`inlineData`, base64)
- ✅ **분류 결과** (`primary` 동물상 enum — 이미 코드가 결정함)
- ✅ **faceShapeHint** (측정값 문자열, optional)

**LLM 역할**: "이 사람이 왜 이 동물상으로 분류됐는지" 시각적 근거를 글로 풀어씀. 분류 자체는 LLM이 하지 않음.

### 2.2 LLM 호출 ②③④ — 텍스트 리포트 3 Stage

**코드 위치**: `libs/face-spoiler/gemini.v3.ts` > `callStage()`

```typescript
const request: GeminiRequest = {
  contents: [
    {
      role: "user",
      parts: [
        { text: userPrompt },
        { inlineData: { mimeType, data: imageBase64 } },  // ← 매 Stage 이미지 전달
      ],
    },
  ],
  systemInstruction: { parts: [{ text: systemPromptForAttempt }] },
  ...
};
```

**`generateFaceReportV3()`에서 3 Stage 병렬 호출**:
```typescript
await Promise.all([
  callStage({ imageBase64, mimeType, systemPrompt: buildSignatureOverallSystemPrompt(animal, regionScores), ... }),
  callStage({ imageBase64, mimeType, systemPrompt: buildRegionScoresSystemPrompt(animal, regionScores), ... }),
  callStage({ imageBase64, mimeType, systemPrompt: buildInterestAreasSystemPrompt(animal, regionScores), ... }),
]);
```

→ **이미지가 3번 중복 전달됨** (Stage별로 독립 호출이라).

---

## 3. 시스템 프롬프트에 주입되는 "데이터" 내용

`buildCommonSystemHeader()` 를 통해 3 Stage 모두에 공통으로 삽입 (`libs/face-spoiler/prompts/text-report.v3.ts:285`):

### 3.1 동물상 컨텍스트 블록

```markdown
## 🦊 사용자의 동물상 (이미 결정됨 — 변경 금지)

이 사람의 동물상은 **강아지상**로 확정되었어요.

- 인상 키워드: 친근함 · 신뢰 · 충실
- 결정 근거 부위: 둥근 얼굴, 올라간 입꼬리
- 결정 사유: 둥근 얼굴 윤곽에 입꼬리가 자연스럽게 올라가 있어 친근한 기운이 강하게 잡혀요.
...
```

→ `animalMatch.primary`, `rationale`, `matchedRegions` 를 그대로 프롬프트에 삽입.

### 3.2 부위별 hint 블록

```markdown
## 📊 부위별 관찰 hint (코드 결정적 산출물)

각 부위의 인상 기여 방향이 아래와 같이 코드로 판정되어 있어요.
LLM은 이 hint를 해석의 **출발점**으로 사용하고, 구체적 문장은 창작하세요.

- **이마**: 이마 비율이 안정적으로 잡혀 있어 생각의 정리력이 또렷한 쪽
- **눈**: 눈꼬리가 또렷하게 올라간 편이라 추진과 경쟁의 기운이 잡히는 쪽
- **눈썹**: 눈썹 결이 정돈된 편이라 자기 기준과 매너가 읽히는 쪽
...

규칙:
- hint의 방향성을 거스르지 말 것
- hint의 단어를 **그대로 복사하지 말 것**
- 점수 숫자는 프롬프트에 제공되지 않습니다
```

→ `regionScores[].rationaleHint` (코드가 `FaceMetrics`에서 결정적으로 산출한 텍스트).

### 3.3 추가 프롬프트 규칙

- `FORBIDDEN_RULES` (윤리·금지)
- `TONE_V3_RULES` (reference 톤)
- Stage별 상세 지시 (레인 할당, 패턴 할당, 분야 격리 등)

**실제 점수 숫자(8.6 등)와 FaceMetrics 측정값(0.35, 3.7° 등)은 프롬프트에 없음** — 프롬프트는 "의미적 hint"만 전달.

---

## 4. 이미지와 데이터의 역할 분리

| 입력 유형 | 제공자 | LLM이 쓰는 용도 |
|---|---|---|
| **이미지 (base64)** | 클라이언트 업로드 원본 | 눈꼬리 각도, 턱선 곡률 등 **시각적 관찰**을 직접 하고 자연스러운 "보여서" 문장 생성 |
| **animalMatch** | `scoreAnimals()` 코드 결정 | 동물상을 **고정 입력**으로 두고, LLM이 일관된 이야기를 쌓게 함 |
| **regionScores hints** | `scoreRegions()` 코드 결정 | 부위별 해석 방향을 **코드가 먼저 정해주고**, LLM은 그 방향으로 창작 |

### 왜 이렇게 설계됐나 (의도)

1. **결정적 + 창작적 분리**
   - 분류·점수는 **항상 같은 결과** (같은 사진 = 같은 점수)
   - 말투·스토리는 **자연스러운 변주** (LLM 창작)
2. **LLM 자의적 분류 방지**
   - 과거 경험: LLM에게 "동물상을 분류해달라" 하면 한국인 대부분을 "고양이상"으로 회귀
   - → 분류는 코드가, 설명만 LLM이 담당
3. **이미지도 유지하는 이유**
   - Hint만으로는 구체 관찰이 부족해 "옆에 있으면 편안한" 같은 **시각 체험형 문장** 이 힘듦
   - 이미지를 함께 주면 LLM이 "차분한 눈매" 같은 직접 관찰 문장을 생성 가능

---

## 5. 토큰 관점 — 이미지 비중

각 Stage 입력 토큰 구성 (평균):
- 시스템 프롬프트(공통 + Stage별): **3,000~4,000 tokens**
- 사용자 프롬프트: ~50 tokens
- **이미지 1장 (base64 → inlineData)**: 약 **1,280 tokens**

→ 이미지는 1 Stage당 입력의 **약 25~30%** 를 차지.
→ 3 Stage 모두 이미지를 받으므로 **1 리포트에 이미지 토큰이 ~3,840 tokens 중복** 소비.

### 최적화 여지 (별도 과제)

- 이미지를 한 번만 분석해 텍스트 요약 후 공유 → 3 Stage 모두 이미지 없이 호출
  - 장점: 토큰 30% 감축
  - 단점: 체험형 문장 약화 가능성 → 검증 필요

---

## 6. 정리

### Q1. 이미지 기반인가?
**네, 부분적으로.** 이미지는 모든 LLM 호출에 첨부되어 **시각적 관찰**이 가능합니다.

### Q2. 다른 데이터만 기반인가?
**아니요, 이미지만도 아닙니다.** 사전에 코드가 **동물상 + 부위 점수 hint** 를 결정해 프롬프트에 주입하고, LLM은 이 방향성 안에서 창작합니다.

### Q3. LLM이 "관상"을 해석하는 주체는 누구인가?
- **분류·점수**: 코드 결정적 (`scoreAnimals`, `scoreRegions`) — MediaPipe 측정값 기반
- **서술·스토리**: LLM (이미지 + 코드 hint 조합) — Gemini/OpenAI가 담당
- **최종 관상가 말투·분야 스토리**: LLM 전담

### Q4. LLM이 이미지 없이 동작할 수 있는가?
**가능하지만 품질 저하**. 현재 구조에서 이미지를 빼면:
- 수치 + hint 텍스트만으로 "보이는 느낌" 표현이 추상화됨
- reference 톤의 "옆에 있으면 편안한" 같은 문장이 약해짐
- 다만 비용·속도는 개선됨

---

## 7. OpenAI GPT-5.4 mini 전환 시 함의

(이전 보고서 `02-gpt-5-4-mini-migration.md` 에 대한 보완)

- 현재 파이프라인은 **이미지 입력 필수** → vision 지원 모델이어야 함
- GPT-5.4 mini는 text + image 멀티모달 ✅ 호환 가능
- 이미지 토큰 계산 방식이 Google과 다름 → 비용 재추정 필요
  - OpenAI 이미지: `detail: "low"` → ~85 tokens, `"high"` → 최대 1,445 tokens
  - Gemini 이미지: 해상도 무관 ~1,280 tokens
  - 만약 `detail: "low"` 로 설정 가능하다면 **이미지 토큰 -90%** → GPT 전환 시 비용이 오히려 Gemini 대비 유리할 수 있음 (재검토 가치 있음)

---

## 부록 — 코드 추적 레퍼런스

| 관심 지점 | 파일:라인 |
|---|---|
| `callStage` 이미지 inlineData | `libs/face-spoiler/gemini.v3.ts:186` |
| `generateFaceReportV3` 3 Stage 병렬 | `libs/face-spoiler/gemini.v3.ts:663` |
| `generateRationale` 이미지 전달 | `libs/face-spoiler/animal-classifier.ts:176-179` |
| 분류 단계 서버 호출 | `app/api/face-spoiler/report/generate/route.ts:223` |
| 점수 단계 서버 호출 | `app/api/face-spoiler/report/generate/route.ts:231` |
| 리포트 단계 서버 호출 | `app/api/face-spoiler/report/generate/route.ts:234` |
| 동물상 프롬프트 블록 | `libs/face-spoiler/prompts/text-report.v3.ts:241-255` |
| 부위 hint 프롬프트 블록 | `libs/face-spoiler/prompts/text-report.v3.ts:257-272` |
| 공통 system header | `libs/face-spoiler/prompts/text-report.v3.ts:285-299` |
