# 올해 운세(유년/流年) 구현 계획

## 1. 개요

### 1.1 유년(流年) 운세란?
- 특정 연도의 천간(年干)에 따라 결정되는 1년간의 운세
- 명반(본명반)의 별들에 해당 연도의 사화성(四化星)이 작용하여 길흉을 판단
- 대운(10년 주기)보다 세밀한 연도별 변화를 분석

### 1.2 인생 운세와의 차이점

| 항목 | 인생 운세(본명반) | 올해 운세(유년) |
|------|------------------|----------------|
| 사화성 | 출생년 천간 (고정) | 분석 연도 천간 (동적) |
| 범위 | 평생 | 1년 |
| 분석 대상 | 14주성 위치, 밝기, 궁 특성 | 유년 사화가 어느 별에 작용하는지 |
| 해석 내용 | 성격, 재능, 평생 테마 | 그해의 기회/위험, 월별 흐름 |
| 대운 연계 | 10년 주기 흐름 | 현재 대운 + 유년 상호작용 |

---

## 2. 데이터 구조

### 2.1 유년 계산 결과 타입

```typescript
// libs/zi-wei-dou-shu/types.ts

interface YearlyFortuneInput {
  chart: ZiweiChart;       // 본명반
  targetYear: number;      // 분석 대상 연도 (예: 2025)
}

interface YearlySihua {
  yearStem: StemIndex;     // 연간 천간 (예: 을=1)
  yearBranch: BranchIndex; // 연간 지지 (예: 사=5)
  hualu: { star: string; palace: string; effect: string };
  huaquan: { star: string; palace: string; effect: string };
  huake: { star: string; palace: string; effect: string };
  huaji: { star: string; palace: string; effect: string };
}

interface MonthlyFortune {
  month: number;           // 1-12
  monthStem: StemIndex;    // 월간 천간
  monthBranch: BranchIndex;// 월간 지지
  score: number;           // 0-100
  highlights: string[];    // 주요 포인트
}

interface YearlyFortuneResult {
  year: number;
  sihua: YearlySihua;
  currentDayun: {
    period: string;        // "32-41세"
    palaceName: string;    // 대운궁 이름
    interaction: string;   // 대운과 유년의 상호작용 설명
  };
  monthlyFortunes: MonthlyFortune[];
  overallScore: number;    // 연간 종합 점수
}
```

### 2.2 AI 해석 결과 타입

```typescript
// libs/services/ai/types.ts

interface YearlyInterpretation {
  preview: {
    headline: string;      // "2025년, 변화와 기회의 해"
    description: string;   // 한 줄 요약
  };
  overview: {
    summary: string;       // 연간 총평 (300-400자)
    keywords: string[];    // 핵심 키워드 3-5개
    luckyMonths: number[]; // 좋은 달 (1-12)
    cautionMonths: number[];// 주의할 달 (1-12)
  };
  categories: {
    wealth: YearlyCategoryResponse;
    career: YearlyCategoryResponse;
    relationship: YearlyCategoryResponse;
    health: YearlyCategoryResponse;
  };
  monthlyGuide: MonthlyGuideResponse[];
}

interface YearlyCategoryResponse {
  score: number;           // 0-100
  title: string;           // "재물운: 안정 속 기회"
  content: string;         // 해석 (200-300자)
  advice: string;          // 조언 (1-2문장)
}

interface MonthlyGuideResponse {
  month: number;
  theme: string;           // "새로운 시작"
  score: number;           // 0-100
  advice: string;          // 월별 조언 (1문장)
}
```

---

## 3. 유년 계산 로직

### 3.1 연간 천간/지지 계산

```typescript
// libs/zi-wei-dou-shu/calculators/yearly.ts

/**
 * 양력 연도에서 천간/지지 계산
 * 예: 2025년 = 을사년 (천간: 을=1, 지지: 사=5)
 */
const getYearStemBranch = (year: number): { stem: StemIndex; branch: BranchIndex } => {
  // 기준: 1984년 = 갑자년 (천간: 0, 지지: 0)
  const baseYear = 1984;
  const diff = year - baseYear;

  const stem = ((diff % 10) + 10) % 10 as StemIndex;
  const branch = ((diff % 12) + 12) % 12 as BranchIndex;

  return { stem, branch };
};
```

### 3.2 유년 사화 배치

```typescript
/**
 * 유년 사화가 명반의 어느 별/궁에 작용하는지 분석
 */
const calculateYearlySihua = (
  chart: ZiweiChart,
  targetYear: number
): YearlySihua => {
  const { stem, branch } = getYearStemBranch(targetYear);
  const sihua = calculateSihua(stem); // 기존 함수 활용

  // 각 사화가 작용하는 별과 궁 찾기
  const findStarPalace = (starName: string) => {
    for (const palace of chart.palaces) {
      const found = palace.mainStars.find(s => s.name === starName) ||
                   palace.minorStars.find(s => s.name === starName);
      if (found) return palace.name;
    }
    return "불명";
  };

  return {
    yearStem: stem,
    yearBranch: branch,
    hualu: {
      star: sihua.hualu,
      palace: findStarPalace(sihua.hualu),
      effect: getHualuEffect(sihua.hualu, findStarPalace(sihua.hualu)),
    },
    // ... huaquan, huake, huaji
  };
};
```

### 3.3 월간 천간 계산

```typescript
/**
 * 연간 천간과 월(1-12)로 월간 천간 계산
 * 오호둔갑법(五虎遁甲法) 기반
 */
const getMonthStem = (yearStem: StemIndex, month: number): StemIndex => {
  // 연간 천간별 정월(1월) 시작 천간
  const monthStartStems: Record<number, StemIndex> = {
    0: 2, 1: 4, 2: 6, 3: 8, 4: 0,  // 갑/기 → 병인월, 을/경 → 무인월...
    5: 2, 6: 4, 7: 6, 8: 8, 9: 0,
  };

  const startStem = monthStartStems[yearStem];
  return ((startStem + (month - 1)) % 10) as StemIndex;
};
```

### 3.4 현재 대운과의 상호작용

```typescript
/**
 * 현재 나이 기준 대운 정보와 유년의 상호작용 분석
 */
const analyzeYearlyDayunInteraction = (
  dayunResult: DayunResult,
  currentAge: number,
  yearlySihua: YearlySihua
): string => {
  const currentPeriod = dayunResult.periods.find(
    p => currentAge >= p.startAge && currentAge <= p.endAge
  );

  if (!currentPeriod) return "";

  // 대운궁과 유년 사화의 상호작용 분석
  // 예: 대운이 재백궁인데 유년 화록이 재백궁에 있으면 → 재물운 상승
  // ...
};
```

---

## 4. API 설계

### 4.1 엔드포인트

```
POST /api/interpret/yearly
```

### 4.2 요청 본문

```typescript
interface YearlyFortuneRequest {
  // ZiweiInput 필드들
  name: string;
  birthDate: string;
  birthTime: string;
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  isLeapMonth?: boolean;
  relationshipStatus?: string;
  occupationStatus?: string;

  // 유년 전용 필드
  targetYear: number;        // 분석 대상 연도
  profileId?: string;        // fortunes 저장용
}
```

### 4.3 응답 본문

```typescript
interface YearlyFortuneResponse {
  success: boolean;
  data: {
    year: number;
    chart: { ... };          // 기본 명반 정보
    yearlySihua: YearlySihua;
    currentDayun: { ... };
    interpretation: YearlyInterpretation;
  };
}
```

---

## 5. AI 프롬프트 설계

### 5.1 시스템 프롬프트

```
당신은 자미두수 전문가이면서 MZ세대 감성의 친근한 운세 상담사예요.

## 핵심 지침
- 유년(流年) 사화성이 명반의 어느 별에 작용하는지 정확히 분석
- 대운(현재 10년 운)과 유년의 상호작용 해석
- 월별 흐름을 구체적으로 안내

## 유년 해석 원칙
- 화록이 작용하는 궁: 그해 복과 기회가 집중되는 영역
- 화권이 작용하는 궁: 권한과 주도권이 강해지는 영역
- 화과가 작용하는 궁: 명예와 인정을 받는 영역
- 화기가 작용하는 궁: 주의와 신중함이 필요한 영역

## 말투
- 친구처럼: "~해요", "~거든요" 사용
- 구체적인 시기와 조언 제공
- 긍정적이되 현실적인 조언
```

### 5.2 사용자 프롬프트 (연간 총평)

```
## 사용자 정보
- 성별: {gender}
- 현재 나이: {age}세
- 분석 연도: {targetYear}년

## 유년 사화 정보
- 연간: {yearStemName}{yearBranchName}년
- 화록: {hualu.star} → {hualu.palace}궁
- 화권: {huaquan.star} → {huaquan.palace}궁
- 화과: {huake.star} → {huake.palace}궁
- 화기: {huaji.star} → {huaji.palace}궁

## 현재 대운 정보
- 대운 기간: {dayun.period}
- 대운궁: {dayun.palaceName}

---

{targetYear}년 연간 운세를 분석해주세요.
유년 사화가 명반에 어떻게 작용하는지, 대운과의 상호작용을 고려하여 해석해주세요.

응답 형식:
{
  "summary": "연간 총평 (300-400자)",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "luckyMonths": [3, 7, 11],
  "cautionMonths": [5, 9]
}
```

### 5.3 사용자 프롬프트 (분야별)

```
{targetYear}년 {category}운을 분석해주세요.
화록/화권/화과/화기가 {category} 관련 궁(재백궁, 관록궁 등)에 어떤 영향을 주는지 해석해주세요.

응답 형식:
{
  "score": 75,
  "title": "재물운: 안정 속 기회",
  "content": "해석 내용 (200-300자)",
  "advice": "구체적인 조언 (1-2문장)"
}
```

### 5.4 사용자 프롬프트 (월별 가이드)

```
{targetYear}년 월별 운세 흐름을 분석해주세요.
각 월의 월간 천간과 유년 사화의 상호작용을 고려하여 간단히 해석해주세요.

응답 형식:
{
  "monthlyGuide": [
    { "month": 1, "theme": "새로운 시작", "score": 70, "advice": "조언" },
    { "month": 2, "theme": "관계 확장", "score": 80, "advice": "조언" },
    ...
  ]
}
```

---

## 6. DB 저장

### 6.1 fortunes 테이블 활용

```sql
-- 기존 테이블 구조 그대로 사용
INSERT INTO fortunes (
  profile_id,
  fortune_type,  -- 'yearly'
  year,          -- 2025
  result         -- YearlyInterpretation JSON
) VALUES (...);
```

### 6.2 캐시 키

```typescript
// interpretation_cache 저장 시
const cacheKey = `yearly-${targetYear}`;
const chartHash = generateChartHash({
  ...input,
  targetYear,  // 연도 추가
});
```

---

## 7. 구현 순서

### Phase 1: 유년 계산 로직
- [ ] `libs/zi-wei-dou-shu/calculators/yearly.ts` 생성
- [ ] 연간 천간/지지 계산 함수
- [ ] 월간 천간 계산 함수
- [ ] 유년 사화 배치 분석 함수
- [ ] 대운-유년 상호작용 분석 함수

### Phase 2: 타입 정의
- [ ] `libs/zi-wei-dou-shu/types.ts`에 유년 관련 타입 추가
- [ ] `libs/services/ai/types.ts`에 YearlyInterpretation 타입 추가

### Phase 3: AI 프롬프트
- [ ] `libs/services/ai/prompts.ts`에 유년 프롬프트 추가
- [ ] `libs/services/ai/yearly-interpreter.ts` 생성

### Phase 4: API 구현
- [ ] `app/api/interpret/yearly/route.ts` 생성
- [ ] 캐시 로직 적용
- [ ] fortunes 저장 로직 적용

### Phase 5: 프론트엔드
- [ ] `app/fortune/yearly/[profileId]/page.tsx` 생성
- [ ] 월별 운세 차트/그래프 컴포넌트
- [ ] 분야별 운세 카드 컴포넌트

---

## 8. 예상 UI 구조

```
올해 운세 페이지
├── 헤더: "2025년 을사년 운세"
├── 연간 총평 카드
│   ├── 헤드라인 + 한 줄 요약
│   ├── 핵심 키워드 태그
│   └── 좋은 달 / 주의할 달 표시
├── 유년 사화 분석 섹션
│   └── 화록/화권/화과/화기가 어느 궁에 작용하는지 시각화
├── 분야별 운세 (탭 또는 아코디언)
│   ├── 재물운 (점수 + 해석 + 조언)
│   ├── 직업운
│   ├── 연애운
│   └── 건강운
└── 월별 운세 차트
    └── 12개월 점수 그래프 + 각 월 클릭 시 상세
```

---

## 9. 참고 사항

### 9.1 기존 코드 재활용
- `calculateSihua()` - 사화 계산
- `calculateDayun()` - 대운 계산
- `findPalaceByBranch()` - 궁 검색
- `generateChartHash()` - 캐시 해시

### 9.2 고려 사항
- 유년 운세는 매년 바뀌므로 캐시 키에 연도 포함 필수
- 월별 운세는 선택적 기능 (MVP에서는 연간 총평만 구현 가능)
- AI 토큰 최적화: 월별 가이드는 별도 요청으로 분리

### 9.3 명세서 보완 필요
- `/require/ziwei-algorithm.md`에 유년 계산 알고리즘 추가 권장
- 유년궁 위치 결정 방식 명확화 필요
