# AI 서비스 모듈

Upstage solar-pro 모델을 사용한 자미두수(紫微斗數) 해석 서비스입니다.

## 아키텍처

```
libs/services/ai/
├── index.ts              # Public exports
├── types.ts              # 타입 정의 + Zod 스키마
├── errors.ts             # AIError 클래스
├── upstage.ts            # Upstage API 클라이언트
├── prompts.ts            # 시스템/유저 프롬프트
└── ziwei-interpreter.ts  # 자미두수 해석 서비스
```

## 주요 파일

### types.ts
- `UpstageMessage`, `UpstageRequest`, `UpstageResponse`: API 통신 타입
- `ZiweiInterpretationRequest`: 해석 요청 데이터
- `PreviewResponseSchema`, `SectionResponseSchema`, `SummaryResponseSchema`: Zod 응답 스키마
- `FortuneInterpretation`: 최종 해석 결과 타입

### upstage.ts
- `chatCompletion()`: Upstage API 호출 (재시도 로직 포함)
- `parseJsonResponse()`: AI 응답 JSON 파싱 (마크다운 코드블록 처리)
- 설정: temperature 0.7, maxTokens 2000, timeout 30초, 최대 2회 재시도

### prompts.ts
- `ZIWEI_SYSTEM_PROMPT`: 40년 경력 자미두수 대가 역할 설정
  - 14주성 해석 가이드 (자미/천기/태양/무곡/천동/염정/천부/태음/탐랑/거문/천상/천량/칠살/파군)
  - 밝기(묘/왕/득/리/평/함) 해석 가이드
  - 사화성(화록/화권/화과/화기) 해석 가이드
  - 동궁 조합 효과 가이드
- `USER_PROMPTS`: 해석 유형별 프롬프트 (preview/wealth/career/relationship/health/summary)
- `PALACE_NAME_MAP`: 해석 유형 → 궁 이름 매핑

### ziwei-interpreter.ts
- `interpretPreview()`: 미리보기 해석 (1-2문장 요약)
- `interpretWealth()`: 재물운 상세 해석
- `interpretCareer()`: 직업운 상세 해석
- `interpretRelationship()`: 인연운 상세 해석
- `interpretHealth()`: 건강운 상세 해석
- `interpretSummary()`: 종합 총평
- `generateFullInterpretation()`: 전체 운세 생성 (preview만 또는 상세 포함)
- `createFallbackInterpretation()`: 오류 시 폴백 응답

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
UPSTAGE_API_KEY=your-api-key
```

## 의존성

- `zod/v4`: 응답 스키마 검증
- `@/env`: 환경 변수 접근
