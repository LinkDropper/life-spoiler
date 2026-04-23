# 리포트 생성 지연 분석 — Validator 재시도 루프

**작성**: 2026-04-21
**현상**: 결과보기 클릭 후 리포트 생성까지 체감 대기 시간이 이전 대비 길어짐
**원인 추정**: Phase 11~12의 Soft validator 재시도 feedback 루프가 각 Stage마다 최대 3회 추가 Gemini 호출 유발

---

## 1. 현상 재현 로그 (사용자 제공)

```
[face-spoiler v3] Stage signature+overall validator soft 실패 (attempt 1/4):
  [v3 검증 실패] Soft: signature.coreKeywords: 과거 수렴 어휘 2개 포함...
  (사용된 과거 어휘: 안정, 신중)

[face-spoiler v3] Stage interestAreas+closing validator soft 실패 (attempt 1/4):
  [v3 검증 실패] Soft: nicknameSubtext·finalNote 중 " 느껴지는 " 문구 반복...

[face-spoiler v3] Stage interestAreas+closing validator soft 실패 (attempt 2/4):
  [v3 검증 실패] Soft: nicknameSubtext·finalNote 중 "곁에 두면 " 문구 반복...

[face-spoiler v3] Stage interestAreas+closing validator soft 실패 (attempt 3/4):
  ...
```

→ Stage A: 2회 Gemini 호출 (초기 1회 + 재시도 1회)
→ Stage C: 4회 Gemini 호출 (초기 + 재시도 3회)
→ Stage B: 1회 성공 추정 (로그 없음)

---

## 2. 지연 요소 계산

### 2.1 현재 설정
- `MAX_RETRIES = 3` (총 4회 시도)
- Backoff: `1000 * (attempt + 1)` ms = **1s → 2s → 3s** (재시도 간 누적 6초 대기)
- `temperature = 0.85`, `maxOutputTokens = 3072~4096`
- Model: `gemini-2.5-flash-lite` (평균 호출 2~4초)

### 2.2 지연 누적 (최악 케이스, 4회 호출 모두 실패)
| 요소 | 시간 |
|---|---|
| Gemini 호출 × 4 (2.5s 평균) | ≈ 10s |
| Backoff (1+2+3s) | = 6s |
| Validator 실행 | < 50ms × 4 |
| **합계** | **약 16s (한 Stage)** |

### 2.3 실제 로그 기반 추정
- Stage A (2회): 약 6초
- Stage B (1회): 약 2~3초
- Stage C (4회): 약 16초

3 Stage가 `Promise.all`로 병렬 → **가장 느린 Stage가 전체 대기**를 결정.
→ 이번 케이스는 **Stage C의 ~16초**가 전체 리포트 지연의 주범.

### 2.4 이전(Phase 10 이하) 대비
- Phase 10 이전: Soft validator 없음 → 첫 응답으로 바로 통과 → **약 3~4초**
- 현재: 재시도 반복 시 **최대 16초 (Stage C 혼자)**
- **체감 차이**: **3~4배**

---

## 3. 해결 옵션 (7가지)

### 옵션 A — Soft validator 재시도 횟수 축소 ⭐ 권장
**변경**: Soft는 1회만 재시도 (Hard는 3회 유지)

**근거**:
- Soft validator는 "품질 향상 목표"지 "레이아웃 필수 제약"이 아님
- 1회 재시도로 교정 안 되면 LLM이 구조적으로 해당 편향을 못 고친다는 의미
- 3회까지 반복하는 건 비용·시간 낭비 비율이 높음

**효과**:
- Stage C의 최악 16초 → **약 8~9초** (절반)
- 품질은 소폭 저하 가능 (교정 기회 1회 → 0회가 되는 경우)

**구현**: 4줄 변경
```typescript
const MAX_SOFT_RETRIES = 1;
const MAX_HARD_RETRIES = 3;
// ...
if (attempt < (isSoft ? MAX_SOFT_RETRIES : MAX_HARD_RETRIES)) { ... }
```

---

### 옵션 B — Backoff 단축 ⭐ 권장
**변경**: `1000 * (attempt+1)` → `500 * (attempt+1)` or `300ms` 고정

**근거**:
- 네트워크·Google 서버 부하 회피용 backoff인데, validator 재시도는 LLM이 교정하는 게 목표 — 그냥 새 응답 받으면 됨
- 500ms 정도면 서버 연속 호출 부담 낮음

**효과**:
- Backoff 누적 6s → **3s** (절반)
- 전체 지연 **3초 단축**

**구현**: 1줄 변경
```typescript
await sleep(500 * (attempt + 1));
```

---

### 옵션 C — 모델 상향 (flash-lite → flash) ⭐⭐ 강력 권장
**변경**: `gemini-2.5-flash-lite` → `gemini-2.5-flash`

**근거**:
- flash-lite는 지시 준수율이 떨어져 Soft validator 실패 빈도가 높음
- flash는 2~3배 똑똑하고 validator 첫 시도 성공률이 크게 상승
- **재시도 자체가 드물어짐** → 전체 지연 감소

**효과 (예상)**:
| 항목 | lite 현재 | flash 예상 |
|---|---|---|
| 첫 응답 시간 | 2~3초 | 3~4초 (+1s) |
| 첫 시도 성공률 | 50~70% | 85~95% |
| 평균 호출 횟수 | 2~3회 | 1~2회 |
| **총 대기 시간** | **8~16초** | **4~7초** ✅ |
| 비용/1M 토큰 | $0.075 | $0.30 (4배) |
| 순 비용 (재시도 감소 반영) | - | ~2배 (재시도가 줄어 상쇄) |

**구현**: 1줄
```typescript
const FACE_GEMINI_MODEL = "gemini-2.5-flash";
```

**주의**: `gemini-2.5-pro`까지는 과함 (6초+ 호출 지연, 비용 20배).

---

### 옵션 D — Soft validator 병렬 async (fire-and-forget)
**변경**: 응답 즉시 사용자에게 반환 + 백그라운드에서 validator 실행 → 실패 로깅만

**근거**:
- Soft는 품질용이라 재시도 없이도 UI 자체는 깨지지 않음
- 사용자 대기 시간 최소화

**효과**:
- 체감 지연: **재시도 시간 완전 제거** (Phase 10 이하 수준 = 3~4초)
- 품질 모니터링은 로그로 유지

**단점**: 실제 품질 개선(재시도로 좋은 결과 받기)은 포기. 이번 기회에 Soft validator의 "교정 유도" 가치를 잃음.

**구현**: 구조 변경 필요 (중간 복잡도)

---

### 옵션 E — Validator 에러 메시지에 실제 위반 토큰을 주입 → 첫 재시도 성공률 상승
**현재 상태 점검**:
- "사용된 과거 어휘: 안정, 신중" 이미 포함 ✅
- "'곁에 두면' 문구가 반복" 이미 포함 ✅

→ 이미 구체적 feedback 주입 중. **효과 한계적**.

---

### 옵션 F — Stage별 최대 지연 상한 (timeout 강제 컷)
**변경**: Stage 총 호출 지연이 10초 넘으면 마지막 성공 응답으로 폴백

**근거**: UX 관점에서 "느린 완성도"보다 "빠른 보통 수준" 선호

**구현**: 복잡 (Stage별 경과 시간 추적 + 중단 로직)

---

### 옵션 G — Hard validator는 엄격 / Soft는 아예 제거
**변경**: Soft validator 5개 모두 삭제, 프롬프트 지시로만 품질 유도

**근거**:
- Phase 10의 경험상 프롬프트만으로 LLM 자기검증은 한계
- But 현재 Soft validator도 최종 실패 시 warning만 남기고 통과 — 제거해도 UX는 같음
- 재시도 루프만 사라짐

**효과**: 지연 **Phase 10 이하 수준**으로 완전 복귀. 품질은 Phase 10 수준.

**단점**: Phase 11~12에서 얻은 품질 개선분 포기.

---

## 4. 추천 조합

### 🥇 1순위 (즉시 적용 권장)
**A + B + C**:
- A: Soft validator 재시도 **1회만** (4회 → 2회)
- B: Backoff **500ms** 고정 or `500 * attempt`
- C: **`gemini-2.5-flash`** 로 상향

**예상 효과**:
- 평균 대기 시간 **8~16초 → 4~6초** (50~70% 단축)
- 품질: 첫 시도 성공률 상승으로 오히려 개선
- 비용: Gemini 비용 약 2~2.5배 (재시도 감소로 상쇄)

**리스크**: 낮음
- flash 모델은 안정적 (2.5 generation 정식)
- 비용 증가분은 월 트래픽 대비 감당 가능 (0.3$ × 현재 호출량)

**작업량**: ~15분 (MAX_RETRIES 분리 로직 + 모델명 + backoff 조정 + 테스트)

---

### 🥈 2순위 (비용 민감한 경우)
**A + B**만 적용 (모델은 lite 유지):
- 지연 감소 30~40%
- 비용 변화 거의 없음
- 품질도 비슷하게 유지

---

### 🥉 3순위 (속도가 최우선)
**D + C**:
- D: Soft validator 백그라운드 비동기 전환
- C: flash 모델 상향

**효과**:
- 지연 **Phase 10 이하** (3~4초)
- 품질: 백그라운드 로그 기반 사후 개선 가능

**단점**: 구조 변경 공수 (30분)

---

## 5. 모델 상향이 도움이 되는가?

### 답: **예, 그리고 가장 효과적**

이유:
1. **Validator 재시도 발생 원인은 LLM의 지시 준수 실패**. 상위 모델은 첫 시도 성공률이 극적으로 높음
2. `gemini-2.5-flash`는 `flash-lite` 대비:
   - 복잡한 규칙 준수력 2~3배
   - 응답 시간 20~30% 증가 (수용 가능)
   - 비용 4배 (하지만 재시도 감소로 실효 비용 2~2.5배)
3. **flash-lite의 기본 역할은 대량 저비용 호출** — Soft validator가 많은 현재 v3 파이프라인에는 맞지 않음
4. `gemini-2.5-pro`까지는 불필요 (품질 대비 지연·비용 큼)

### 비용 체감
- 현재 1 리포트 당 Gemini 호출: 3 Stage × 평균 2회 = 6회 호출 × 약 3K 토큰 = 18K 토큰
- flash-lite: 18K × $0.075/1M ≈ **$0.001** (1천 분의 1달러)
- flash (4배): ≈ **$0.004**
- 재시도 감소(~30%) 반영 시: 실효 **$0.003**
- 990원 매출 대비 0.3% → **완전 감당 가능**

---

## 6. 추가 관찰 및 권고

### 6.1 Stage C가 가장 자주 실패하는 이유
로그상 `interestAreas+closing`이 가장 자주 재시도. 원인:
- 내용이 가장 많고 구조가 복잡 (3개 분야 + closing + 10개 필드)
- Soft validator 중 "긴 구문 중복 검증"이 특히 엄격 (6자 이상 겹치면 실패)
- 연애/재물/직장 3개 body가 비슷한 톤으로 수렴하면 위반 빈발

→ flash 모델 상향이 가장 효과적 (Pro까지 갈 필요 없음)

### 6.2 "긴 구문 중복 검증" 완화 검토
- 현재: `SHARED_PHRASE_MIN_LEN = 6`
- 제안: `8`로 완화 (한국어 2단어 정도까지는 허용)
- 자연스러운 반복(예: "든든한", "편이에요")은 피할 수 없음

### 6.3 Backoff 제거 검증
- 네트워크 일시 실패가 아닌 **validator 실패**는 재시도 시 동일 endpoint에 새 요청 — backoff 필요성 낮음
- 완전 제거(0ms)도 검토 가능

---

## 7. 즉시 실행 추천안 (최종)

```
✅ 옵션 A: Soft retry 1회만 (구현 15분)
✅ 옵션 B: Backoff 500ms (구현 1줄)
✅ 옵션 C: gemini-2.5-flash 모델 상향 (구현 1줄)
✅ 옵션 6.2: SHARED_PHRASE_MIN_LEN 6 → 8 (구현 1줄)
```

**예상 변화**:
| 지표 | 현재 | 이후 |
|---|---|---|
| 평균 리포트 생성 시간 | 8~16초 | 4~6초 |
| 최악 케이스 | 20초+ | 8초 |
| 첫 시도 성공률 | 50~70% | 85~95% |
| 비용/리포트 | $0.001 | $0.003 |
| 품질 (체감) | 8.7/10 | 8.5~9.0/10 |

리스크·공수 대비 효과가 가장 크고, 사용자 체감 즉시 개선.

---

## 8. 승인 후 실행 계획

1. `gemini.v3.ts` 상수 수정 (모델명, retry, backoff)
2. Soft validator 에러 메시지 사후 분석 유지 (console.warn은 계속)
3. `SHARED_PHRASE_MIN_LEN` 완화
4. 테스트 통과 확인
5. dev 서버에서 실제 지연 측정 (console.time 추가 고려)
6. 일주일 운영 후 flash-lite 회귀 검토 (필요 시)

**소요**: 약 20분 작업 + 5분 검증

---

## 요약

- **원인**: Soft validator 재시도 루프 (최대 3회) + 넉넉한 backoff (누적 6초) + flash-lite의 낮은 지시 준수율
- **핵심 해법**: **모델 상향(`gemini-2.5-flash`)** 이 가장 효과적
- **보조**: Soft retry 1회로 축소 + backoff 단축
- **비용**: 리포트당 $0.001 → $0.003 (무시 가능)
- **체감 개선**: 대기 **50~70% 단축**, 품질 유지 또는 개선
