# Phase 3 — v3 프롬프트 설계 (3단계 파이프라인)

**상태**: ✅ 완료
**작업일**: 2026-04-20

## 목적

v3 리포트를 생성할 3단계 파이프라인 프롬프트 + responseSchema 작성.
각 단계는 독립적으로 호출되고 응답 길이·개수 강제가 단일 호출보다 엄격하다.

## 변경된 파일

| 파일 | 동작 | 내용 |
|---|---|---|
| `libs/face-spoiler/prompts/text-report.v3.ts` | 신설 | Stage A/B/C 시스템 프롬프트 빌더 + 유저 프롬프트 + responseSchema + 응답 타입 |
| `libs/face-spoiler/__tests__/prompts-v3.test.ts` | 신설 | 프롬프트 구성·스키마 구조 12 테스트 |

## 3단계 파이프라인 구조

```
Stage A) signature + overallScore
         → 한 줄 인상 정의 + 자기인식 훅 2개 + 종합 인상 본문/highlights
Stage B) regionScores (8개 부위)
         → 부위별 interpretation / bullets / oneLiner
Stage C) interestAreas + closing
         → 연애/재물/직장 디테일 + 종합 캐릭터 별명 + shareLine
```

### 각 단계 입력 (공통)
- 사진 (inlineData)
- `AnimalMatch` (primary, confidence, matchedRegions, rationale)
- `RegionRawScore[]` (8개 부위 hint — **점수는 프롬프트에 노출하지 않음**, hint만)

### 각 단계 시스템 프롬프트 공통 헤더
1. 친근한 관상 상담가 역할 선언
2. `FORBIDDEN_RULES` (윤리·한자·수치·성별·단정 가드)
3. `TONE_V3_RULES` (존댓말·상담가 인용·A보다 B·따옴표 한 줄 평)
4. 동물상 컨텍스트 (동물상은 보조 칩, 과도한 강조 금지)
5. 부위별 hint 리스트 (LLM 해석의 출발점)

### 단계별 특화 지시
- **Stage A**: 5개 signature 필드 + 3개 overallScore 필드. `commonlyHeardPhrase`·`commonMisread`의 훅 패턴 예시 명시.
- **Stage B**: 8개 부위 **정확한 순서**(ReGION_SCORE_KEYS) + 각 항목 3필드. 상담가 인용 화법 최소 4섹션 이상 강제. oneLiner는 마침표 완결 문장.
- **Stage C**: love→money→career **순서 고정** + 각 분야 9필드 + closing 3필드. `shareLine`에 동물상 라벨(예: "강아지상") 자연 삽입. 분야별 별명 변주 가이드(연애=타입, 재물=~왕, 직장=~플레이어).

### 톤 규칙 핵심
- 존댓말 필수, "~합니다" 격식체 금지
- "관상에서는 ~ 쪽으로 보기도 해요" 인용 화법을 섹션마다 1회 이상
- "A보다 B" 대조 패턴을 oneLiner/oneLineVerdict/scoreOneLiner 중 30~40%에 사용
- 유형 라벨("츤데레형", "INTJ") 금지, 대신 "조용한 강자형" 같은 형용+형용 충돌 네이밍

## 설계상 주의

### 점수는 프롬프트에 노출하지 않는다
- LLM이 "8.7점" 같은 숫자를 본문에 섞어쓰면 reference 톤 붕괴
- 대신 `rationaleHint` (예: "눈매가 안정적으로 정돈되어 상대를 보고 판단하는 쪽")만 전달
- FORBIDDEN_RULES 12번: "점수 자체를 텍스트로 다시 쓰지 말 것"

### 동물상의 강등
- 기존 v2는 히어로 영역 전체가 동물상
- v3는 signature.oneLineDefinition이 메인, 동물상은 chip/shareLine만
- 프롬프트 톤: "동물상은 보조 칩. 텍스트에서 과하게 강조 금지. shareLine 같은 특정 필드에서만 자연스럽게 참조."

### responseSchema 강제
- `SIGNATURE_OVERALL_SCHEMA`, `REGION_SCORES_SCHEMA`, `INTEREST_AREAS_SCHEMA` 3개
- Gemini `generationConfig.responseSchema` 주입용
- `domain` enum: `["love", "money", "career"]`
- 모든 필수 필드 `required` 지정

## 검증 결과

### 테스트
```
Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Time:        0.19 s
```

12개 테스트 커버:
- Stage A/B/C 각각 동물상 이름 주입 + 핵심 지시 포함
- Stage A: `commonlyHeardPhrase`/`commonMisread` 훅 규칙 명시
- Stage B: 8개 부위 순서 정확 주입
- Stage B: 상담가 인용 화법 규칙 포함
- Stage B: 8개 rationaleHint 모두 포함
- Stage C: love→money→career 순서 + 3개 이모지 라벨
- Stage C: shareLine용 "강아지상" 주입
- 모든 스테이지: FORBIDDEN_RULES 핵심 규칙 포함
- 스키마: required 필드, domain enum 검증

### 회귀 + 타입
```
Test Suites: 7 passed, 7 total
Tests:       60 passed, 60 total
```
`tsc --noEmit` 에러 0건.

## 다음 단계

Phase 4: `gemini.ts`에 `generateFaceReportV3` 추가.
- Stage A/B/C 호출 순서 + 실패 시 재시도 + 길이·개수 사후검증
- 부분 실패 시 해당 단계만 재호출
- 최종 응답을 `FaceTextReportV3` 형태로 합성
