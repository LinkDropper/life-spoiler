# 텍스트 리포트 모델 전환 검토 — `gemini-2.5-flash` → `gpt-5.4-mini`

**작성**: 2026-04-21
**대상**: 텍스트 리포트 3단계 파이프라인 (`libs/face-spoiler/gemini.v3.ts`)
**조사 범위**: 한 건당 비용, 콘텐츠 품질, 속도

---

## 0. 모델 사실 확인

"GPT-5.4 mini" 는 **2026-03에 OpenAI가 정식 출시한 멀티모달(text + image) 모델**입니다. 처음에는 오타/혼동 여지가 있어 조사 과정에서 공식 정보·써드파티 benchmark를 교차 확인했습니다.

- 출시일: 2026-03
- 컨텍스트 창: 400K tokens
- 지원 모달리티: **텍스트 + 이미지 입력** (현재 파이프라인이 사용하는 사진 입력 호환 ✅)
- 비교 대상: `gemini-2.5-flash` (2025-06 출시, 1M context, 멀티모달)

---

## 1. 한 건당 비용 비교 (핵심)

### 1.1 리포트 1건의 실제 토큰 사용량 추정

현재 v3 파이프라인 기준:
- 3 Stage 병렬 호출 (signature+overall / regionScores / interestAreas+closing)
- Stage당 입력 ≈ **4,000~6,000 tokens** (system prompt + 이미지 + user prompt)
  - 시스템 프롬프트: 3,000~4,000 토큰
  - 이미지 1장: ~1,280 토큰 (base64 인코딩)
- Stage당 출력 ≈ **1,500~2,500 tokens** (JSON 응답)
- Soft validator 재시도 평균 1회 가정: 전체 호출 수 4회 → 합산

**1 리포트 평균**:
- 총 입력: **16,000 tokens**
- 총 출력: **7,000 tokens**

### 1.2 모델별 토큰 단가 (2026-04 기준)

| 모델 | Input (/1M) | Output (/1M) | 출처 |
|---|---|---|---|
| `gemini-2.5-flash` | **$0.30** | **$2.50** | ai.google.dev, pricepertoken.com |
| `gpt-5-mini` (참고) | $0.25 | $2.00 | openai.com |
| `gpt-5.4-mini` | **$0.75** | **$4.50** | pricepertoken.com, openrouter.ai |

### 1.3 리포트 1건 실효 비용

**Gemini 2.5 Flash (현재)**:
```
입력: 16,000 × $0.30/1M = $0.0048
출력:  7,000 × $2.50/1M = $0.0175
총합                    ≈ $0.0223 (리포트 1건)
```

**GPT-5.4 mini (제안)**:
```
입력: 16,000 × $0.75/1M = $0.012
출력:  7,000 × $4.50/1M = $0.0315
총합                    ≈ $0.0435 (리포트 1건)
```

### 1.4 비용 변화

| 항목 | Gemini 2.5 Flash | GPT-5.4 mini | 배수 |
|---|---|---|---|
| 입력 단가 | $0.30 | $0.75 | **2.5×** |
| 출력 단가 | $2.50 | $4.50 | **1.8×** |
| **리포트 1건** | **$0.022** | **$0.044** | **~2.0×** |

### 1.5 매출 대비 비율

| | 현재 | 전환 후 |
|---|---|---|
| 리포트 1건 Gemini/GPT 비용 | $0.022 (약 31원) | $0.044 (약 62원) |
| 990원 대비 원가 비율 | **3.2%** | **6.3%** |

→ **절대액 증가는 건당 약 31원**. 매출 대비 여전히 **6% 미만**이라 수익성 영향은 제한적.

### 1.6 "재시도 감소 효과" 반영 시

GPT-5.4 mini는 instruction following 개선(공식 자료: "complex, multi-constraint system prompts 를 더 신뢰성 있게 준수") → Soft validator 재시도가 평균 1회 → **0.3~0.5회** 로 감소 예상.

보정 후 실효 입출력 토큰:
- 총 입력 16K → **12K** (재시도 감소)
- 총 출력 7K → **5K**
- 실효 비용: `12K × $0.75 + 5K × $4.50 = $0.009 + $0.0225 = $0.0315`
- **실효 배수 ≈ 1.4×** (순 비용 차이: 건당 약 20원 ↑)

---

## 2. 콘텐츠 품질 비교

### 2.1 종합 지능 (Artificial Analysis Intelligence Index)

| 모델 | 점수 | 비고 |
|---|---|---|
| `gemini-2.5-flash` | **21** | base |
| `gpt-5.4-mini` | **약 54** | GPT-5.4 xhigh(57) 대비 약간 낮음 |
| 차이 | | **약 2.5배** |

### 2.2 구체 벤치마크

| 지표 | Gemini 2.5 Flash | GPT-5.4 mini | 설명 |
|---|---|---|---|
| GPQA (대학원 수준 추론) | ~50 | **60.6** | 추론 능력 |
| Coding (실행 성공률) | ~18 | **25.3** | 프로그래밍 |
| SWE-Bench Pro | 낮음 | 중~높음 | GPT-5.4 수준에 근접 |
| Instruction Following | 중간 | **대폭 개선** | OpenAI 공식 발표 |

### 2.3 현재 파이프라인이 실제로 겪는 문제와의 적합성

현재 `gemini-2.5-flash`로 발생하는 이슈:
- **Soft validator 재시도 빈번** (시간 은유 과다 / A보다 B 편향 / 긴 구문 반복)
- **프롬프트의 복잡한 다층 제약 준수 실패** (레인 할당 / 패턴 분산 / 과거 복붙 금지 리스트)
- Phase 13에서 이미 `flash-lite`에서 `flash`로 상향했지만 여전히 Stage C에서 재시도 발생

**GPT-5.4 mini 예상 개선 포인트**:
1. **레인 할당 엄수** (5종 톤 레인 강제) → 현재 flash가 자주 "감각·체험" 레인 지시를 못 지키고 교과서적 표현으로 회귀하는 문제 완화 기대
2. **긴 금지 리스트 준수** → 과거 복붙 문장을 확실히 피할 확률 상승
3. **"A보다 B 패턴 최대 3개" 같은 카운트 제약** → 명시적 카운팅 지시에 더 강함
4. **분야 격리 (연애↔재물↔직장)** → 분야 간 카피 오염 재발 가능성 감소

### 2.4 잠재적 우려 — 한국어 창작·관상 톤

- Intelligence Index는 **영어 MMLU·GPQA** 중심 → 한국어 창작력과 직결되지 않음
- Gemini는 한국어 말뭉치가 풍부해 자연스러운 한국어 "관상가 말투" 재현이 강함
- GPT-5.4 mini는 영어·코드·논리 최적화가 우선순위 → **한국어 특유의 "옆에 있으면~" 같은 체험형 문장**이 어색해질 위험

**필수 검증**: 모델 전환 전 **동일 사진 10장**으로 양쪽 모델 출력 비교 A/B 테스트 후 판단.

---

## 3. 속도 비교

### 3.1 Raw Throughput

| 모델 | 출력 속도 (tok/s) | TTFT (median) | 출처 |
|---|---|---|---|
| `gemini-2.5-flash` | **179.8** | ~1.0초 | artificialanalysis.ai (Google API 기준) |
| `gpt-5.4-mini` | **173** | **0.60초** | pricepertoken.com |

**순수 속도**는 거의 동등 (flash가 미세하게 빠르나 체감 차이 없음).

### 3.2 TTFT (첫 응답까지)

- Gemini: ~1초
- GPT-5.4 mini: **0.6초** (40% 빠름)

→ 체감 "느린 느낌"이 줄어듦. streaming 쓰는 UI라면 인지 지연 감소.

### 3.3 전체 리포트 완성 시간 (실효)

현재 파이프라인:
```
3 Stage 병렬 호출 × 최대 4회(재시도) = 가장 느린 Stage가 전체 대기 결정
```

**Gemini 2.5 Flash (현재)**:
- 평균 리포트 완성: 4~6초 (Phase 13 기준)
- 최악 (Stage C 4회 재시도): 15~18초

**GPT-5.4 mini (예상)**:
- TTFT 0.4초 단축 + instruction following 개선으로 재시도 감소
- 평균 완성: **3~4초** (30~40% 단축)
- 최악: **7~10초** (재시도가 1회 이하로 줄어 최악 케이스 반감)

### 3.4 속도 측면 결론

- **Raw speed는 거의 동일**
- 체감 속도 이득은 **"재시도가 줄어서 전체가 빨라지는" 효과**가 핵심
- Stage B(부위 해석) 같은 긴 JSON 응답은 두 모델 비슷
- Stage A/C 같이 validator 많은 stage에서 GPT-5.4 mini 이점 큼

---

## 4. 마이그레이션 기술적 고려사항

### 4.1 코드 변경 범위

현재 `gemini.v3.ts`는 Google REST API 직접 호출 (fetch 기반). OpenAI로 전환 시:

| 항목 | 현재 (Gemini) | 변경 (OpenAI) |
|---|---|---|
| SDK | fetch + REST | `openai` npm 패키지 or fetch |
| Endpoint | `generativelanguage.googleapis.com` | `api.openai.com/v1/chat/completions` |
| Request body | `contents: [{role, parts}]` | `messages: [{role, content}]` |
| Response schema | `responseSchema` | `response_format: { type: "json_schema", json_schema: {...} }` |
| 이미지 입력 | `inlineData: {mimeType, data}` | `image_url: "data:image/jpeg;base64,..."` |
| Temperature | 0.85 | 동일 (0~2 범위) |
| Max output | `maxOutputTokens: 8192` | `max_completion_tokens: 8192` |
| API Key | `GEMINI_API_KEY` | `OPENAI_API_KEY` (신규) |

**작업량 추정**: `callStage` 함수 재작성 + 인터페이스 조정 → **약 1.5~2시간**.

### 4.2 Structured Outputs

OpenAI는 JSON Schema 기반 `structured outputs` 지원. 현재 `SIGNATURE_OVERALL_SCHEMA` 등을 거의 그대로 쓸 수 있음.

단, Gemini의 `required` 필드 처리 방식과 약간 다를 수 있어 **스키마 변환 검토** 필요 (`type: "object"` + `properties` + `required` + `additionalProperties: false` 등).

### 4.3 validator 재시도 feedback 주입

현재 `buildRetryFeedback()` 로직은 그대로 유지 가능. OpenAI는 system message에 추가해도 되고, 별도 user message로 넣어도 됨. **변경 없음**.

### 4.4 비용·사용량 모니터링

OpenAI는 응답에 `usage.prompt_tokens`, `usage.completion_tokens` 포함 → **현재 코드에 로깅 추가**로 실제 토큰 소비 추적 권장.

### 4.5 Fallback 구성 (리스크 완화)

OpenAI 장애 시 Gemini로 자동 폴백:
```typescript
const MODEL_PROVIDER = process.env.FACE_SPOILER_MODEL_PROVIDER ?? "openai";
// "openai" / "gemini" / "openai-with-gemini-fallback"
```

---

## 5. 점진적 마이그레이션 권고안

### 5.1 Phase A (검증) — 1~2일
1. Stage C (`interestAreas+closing`) 만 GPT-5.4 mini로 전환
   - 이유: Soft validator 실패가 가장 많은 stage → 효과 측정하기 최적
   - 다른 Stage는 Gemini 유지
2. 10명 분량 A/B 비교:
   - 같은 사진 → 양쪽 출력 비교
   - 한국어 자연스러움·reference 톤 준수도 정성 평가
   - validator 재시도율·총 소요 시간 수치 측정

### 5.2 Phase B (확대) — Phase A 성공 시
- Stage A도 전환 (`signature+overall`)
- Stage B(부위 해석)는 **Gemini 유지 고려** — 긴 JSON 반복 생성은 flash가 충분히 잘하고 비용 효율 유리

### 5.3 Phase C (전체 전환) — 선택적
- 3 Stage 모두 GPT-5.4 mini
- 또는 hybrid 유지 (A·C만 OpenAI, B는 Gemini)

---

## 6. 종합 판단

| 관점 | 평가 | 이유 |
|---|---|---|
| **비용** | 🟡 2배 (건당 31원 → 62원) | 매출 대비 6%로 감내 가능. 재시도 감소로 실효 1.4배 |
| **품질 (지능)** | 🟢 2.5배 상승 | MMLU·GPQA 기준 |
| **품질 (한국어 창작)** | ⚠️ **불확실** | A/B 테스트 필수 |
| **속도 (raw)** | ⚪ 동등 | 두 모델 비슷 |
| **속도 (체감)** | 🟢 30~40% 단축 예상 | TTFT 0.6s + 재시도 감소 |
| **Instruction Following** | 🟢 대폭 개선 | 현재 가장 큰 문제 지점 해소 |
| **마이그레이션 공수** | 🟡 1.5~2시간 | fetch API 재작성 + 환경변수 |

### 권고

**"Phase A 검증 후 판단"** 경로를 추천합니다.

이유:
1. **최대 리스크는 한국어 창작력** — 영어 벤치마크 점수와 한국어 자연스러움은 별개. 양쪽을 실제 사진 10장으로 비교해야 확신 가능
2. Phase A (Stage C만 전환)는 **가역적** — 문제 있으면 즉시 원복
3. 비용·속도 이득은 **분명히 있음** — 검증만 통과하면 전환 가치 있음

### 비추천 시나리오

- 한국어 톤이 **부자연스럽거나** (예: "옆에 있으면 든든한" 같은 체험형 문장이 "You feel comfortable beside this person" 같은 번역체로 나옴)
- A/B 테스트에서 **정성 평가가 Gemini 대비 열세**로 나오는 경우
- 월간 리포트 호출량이 극도로 많아 **6% → 더 높은 비율**로 비용 부담이 커지는 경우

---

## Sources

- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [GPT-5.4 Mini API Pricing – PricePerToken](https://pricepertoken.com/pricing-page/model/openai-gpt-5.4-mini)
- [GPT-5.4 mini and nano: Benchmarks (DataCamp)](https://www.datacamp.com/blog/gpt-5-4-mini-nano)
- [Introducing GPT-5.4 mini and nano – OpenAI](https://openai.com/index/introducing-gpt-5-4-mini-and-nano/)
- [GPT-5.4 mini Model – OpenAI API Docs](https://developers.openai.com/api/docs/models/gpt-5.4-mini)
- [Gemini API Pricing – Google AI for Developers](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini 2.5 Flash – Artificial Analysis](https://artificialanalysis.ai/models/gemini-2-5-flash)
- [GPT-5.4 mini (xhigh) – Artificial Analysis](https://artificialanalysis.ai/models/gpt-5-4-mini)
- [Performance Parity or Efficiency Downgrade? GPT-5.4 Mini Benchmarked – 302.AI (Medium)](https://medium.com/@302.AI/performance-parity-or-efficiency-downgrade-c3227e540e24)
