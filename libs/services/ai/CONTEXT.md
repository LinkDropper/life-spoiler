# AI 서비스 모듈

자미두수(紫微斗數) 해석 서비스입니다. 텍스트 해석 LLM은 `LIFE_SPOILER_LLM_PROVIDER`
env var로 OpenAI(default)/Gemini 전환 가능합니다.

## 아키텍처

```
libs/services/ai/
├── index.ts              # Public exports
├── types.ts              # 타입 정의 + Zod 스키마
├── errors.ts             # AIError 클래스
├── provider.ts           # gemini.ts/openai.ts 디스패처 (LIFE_SPOILER_LLM_PROVIDER)
├── gemini.ts             # Gemini API 클라이언트 (롤백용)
├── openai.ts             # OpenAI API 클라이언트 (기본 제공자)
├── prompts/              # 다국어 프롬프트
│   ├── index.ts          # 프롬프트 export
│   ├── ko.ts             # 한국어 프롬프트
│   ├── en.ts             # 영어 프롬프트
│   └── ja.ts             # 일본어 프롬프트
├── ziwei-interpreter.ts  # 인생 운세 해석 서비스
└── yearly-interpreter.ts # 올해 운세 해석 서비스
```

## 주요 파일

### types.ts
- `GeminiMessage`, `GeminiRequest`, `GeminiResponse`: API 통신 타입 (이름은 Gemini 기준이지만 OpenAI 호출에도 그대로 재사용됨)
- `ZiweiInterpretationRequest`: 인생 운세 해석 요청 데이터
- `YearlyInterpretationRequest`: 올해 운세 해석 요청 데이터
- Zod 응답 스키마 (LifeSpoilerResponseSchema, LifetimeCategoryResponseSchema 등)
- `FortuneInterpretation`, `YearlyFortuneInterpretation`: 최종 해석 결과 타입

### provider.ts (LLM 디스패처)
- 인터프리터들은 이 파일에서 `chatCompletion`/`parseJsonResponse`/`CURRENT_MODEL_NAME`을 import한다 (gemini.ts/openai.ts를 직접 import하지 않음)
- `env.LIFE_SPOILER_LLM_PROVIDER`가 `"openai"`(default)면 openai.ts, `"gemini"`면 gemini.ts로 라우팅

### openai.ts (OpenAI 클라이언트, 기본 제공자)
- `chatCompletion()`: `/v1/chat/completions` 호출 (재시도 로직 포함), gemini.ts와 동일한 시그니처
- `responseSchema`(Gemini 느슨한 스키마)를 OpenAI Structured Outputs strict 모드 스키마로 자동 변환 (`toStrictJsonSchema`) — 원래 optional이던 필드는 nullable 타입으로 표현
- 설정: temperature 0.8, maxTokens 12000, timeout 60초, 최대 3회 재시도
- 모델: `env.OPENAI_FACE_MODEL` (face-spoiler와 공유)

### gemini.ts (Gemini 클라이언트, 롤백용)
- `chatCompletion()`: Gemini API 호출 (재시도 로직 포함)
- `parseJsonResponse()`: AI 응답 JSON 파싱 (마크다운 코드블록 처리, truncation 복구) — provider 공용 유틸이라 openai.ts 경로에서도 이 함수를 그대로 사용
- 설정: temperature 0.8, maxTokens 12000, timeout 30초, 최대 3회 재시도
- JSON 응답 모드 사용 (`responseMimeType: "application/json"`)

### prompts/
- 다국어 프롬프트 지원 (ko, en, ja)
- 시스템 프롬프트: MZ세대 감성의 친근한 운세 상담사 역할
- 전문 용어 사용 금지 규칙 (궁 이름, 별 이름, 사화 등)
- 해석 유형별 유저 프롬프트 (life_spoiler, lifetime_core, yearly_overview 등)

### ziwei-interpreter.ts
- `interpretLifeSpoiler()`: 인생 스포일러 해석
- `interpretLifetimeCore()`: 핵심 시나리오 해석
- `interpretLifetimeWealth/Career/Relationship/Health()`: 카테고리별 해석
- `interpretAgeScenarios()`: 나이대별 시나리오 해석
- `generateFullInterpretation()`: 전체 인생 운세 생성
- `createFallbackInterpretation()`: 오류 시 폴백 응답

### yearly-interpreter.ts
- `interpretYearlyOverview()`: 올해 스포일러 해석
- `interpretYearlyWealth/Career/Relationship/Health()`: 카테고리별 해석
- `interpretYearlyMonthly()`: 월별 운세 해석
- `generateYearlyInterpretation()`: 전체 올해 운세 생성

## 사용 예시

```typescript
import {
  generateFullInterpretation,
  createFallbackInterpretation,
} from "@/libs/services/ai";

// 미리보기만 요청
const previewOnly = await generateFullInterpretation(request);

// 상세 해석 포함
const withDetails = await generateFullInterpretation(request, {
  includeDetails: true,
});

// 오류 시 폴백
try {
  const result = await generateFullInterpretation(request);
} catch (error) {
  const fallback = createFallbackInterpretation(error);
}
```

## 환경 변수

```env
LIFE_SPOILER_LLM_PROVIDER=openai   # openai(default) | gemini
OPENAI_API_KEY=your-openai-api-key
OPENAI_FACE_MODEL=gpt-5.4-mini-2026-03-17
GEMINI_API_KEY=your-gemini-api-key # gemini 롤백 시에만 필요
```

## 의존성

- `zod/v4`: 응답 스키마 검증
- `@/env`: 환경 변수 접근
