# Supabase 클라이언트 모듈

Supabase 데이터베이스 연동 및 AI 해석 결과 캐싱 서비스입니다.

## 아키텍처

```
libs/supabase/
├── index.ts           # Public exports
├── client.ts          # Supabase 클라이언트 생성
├── types.ts           # Database 타입 정의
└── analysis-cache.ts  # 분석 결과 캐싱 서비스
```

## 주요 파일

### client.ts
- `createBrowserClient()`: 클라이언트 사이드용 (anon key)
- `createServerClient()`: 서버 사이드용 (service role key, RLS 우회)

### analysis-cache.ts
- `generateChartHash()`: 명반 데이터로부터 고유 해시 생성
- `getCachedResult()`: 캐시된 분석 결과 조회
- `setCachedResult()`: 분석 결과 캐시에 저장
- `getOrCreateCachedResult()`: 캐시 miss 시 생성 함수 실행 및 저장

## 데이터베이스 스키마

### interpretation_cache 테이블

AI 해석 결과를 캐싱하기 위한 테이블입니다. 서비스 역할 키로만 접근 가능합니다.

```sql
CREATE TABLE interpretation_cache (
  id UUID PRIMARY KEY,
  chart_hash TEXT NOT NULL,           -- 명반 고유 해시
  interpretation_type TEXT NOT NULL,  -- 해석 유형
  result JSONB NOT NULL,              -- AI 해석 결과
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(chart_hash, interpretation_type)
);
```

마이그레이션: `supabase/migrations/001_create_interpretation_cache.sql`

## 사용 예시

```typescript
import {
  generateChartHash,
  getOrCreateCachedResult,
} from "@/libs/supabase";
import { generateFullInterpretation } from "@/libs/services/ai";

// 해시 생성
const hash = generateChartHash({
  birthDate: "1990-05-15",
  birthTime: "12:00",
  gender: "male",
  calendarType: "solar",
});

// 캐시 조회 또는 생성
const result = await getOrCreateCachedResult(
  hash,
  "full",
  () => generateFullInterpretation(request, { includeDetails: true })
);
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 캐싱 전략

1. **키 구조**: `chart_hash` + `interpretation_type`
2. **해시 생성**: 생년월일 + 시간 + 성별 + 역법 + 윤달여부
3. **캐시 유효기간**: 무기한 (동일 입력은 항상 같은 결과)
4. **오류 처리**: 캐시 실패해도 서비스 중단 없음
