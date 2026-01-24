# AI 서비스 모듈

Gemini 2.0 Flash 모델을 사용한 자미두수(紫微斗數) 해석 서비스입니다.

## 아키텍처

```
libs/services/ai/
├── index.ts              # Public exports
├── types.ts              # 타입 정의 + Zod 스키마
├── errors.ts             # AIError 클래스
├── gemini.ts             # Gemini API 클라이언트
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
- `GeminiMessage`, `GeminiRequest`, `GeminiResponse`: API 통신 타입
- `ZiweiInterpretationRequest`: 인생 운세 해석 요청 데이터
- `YearlyInterpretationRequest`: 올해 운세 해석 요청 데이터
- Zod 응답 스키마 (LifeSpoilerResponseSchema, LifetimeCategoryResponseSchema 등)
- `FortuneInterpretation`, `YearlyFortuneInterpretation`: 최종 해석 결과 타입

### upstage.ts (Gemini 클라이언트)
- `chatCompletion()`: Gemini API 호출 (재시도 로직 포함)
- `parseJsonResponse()`: AI 응답 JSON 파싱 (마크다운 코드블록 처리, truncation 복구)
- 설정: temperature 0.7, maxTokens 4000, timeout 30초, 최대 2회 재시도
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
GEMINI_API_KEY=your-api-key
```

## 의존성

- `zod/v4`: 응답 스키마 검증
- `@/env`: 환경 변수 접근
