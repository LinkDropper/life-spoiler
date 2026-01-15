# CONTEXT.md - 자미두수 알고리즘 모듈

## 개요

자미두수(紫微斗數) 명반 생성 라이브러리입니다. 삼합파(三合派) 기반으로 명반을 계산하고, **AI 모델(solar-pro)**을 활용하여 전문적인 해석을 제공합니다.

## 아키텍처

```
[사용자 입력] → [명반 계산 엔진] → [구조화된 명반 데이터] → [AI 해석 엔진] → [결과]
                 (이 모듈)           (ZiweiChart)            (solar-pro)
```

## 디렉토리 구조

```
libs/zi-wei-dou-shu/
├── index.ts              # Public API exports
├── core.ts               # 메인 진입점 (명반 생성, 해석)
├── types.ts              # 타입 정의 + Zod 스키마
├── errors.ts             # ZiWeiError 클래스
├── constants/            # 상수 테이블
│   ├── index.ts          # 상수 re-export
│   ├── branches.ts       # 천간(10개), 지지(12개)
│   ├── palaces.ts        # 12궁 순서
│   ├── stars.ts          # 14주성, 보조성 정보
│   ├── nayin.ts          # 60갑자 납음 테이블
│   ├── ziwei-table.ts    # 자미성 위치 테이블
│   ├── brightness-table.ts # 별 밝기 테이블
│   └── sihua-table.ts    # 사화성 테이블
├── lunar/                # 음력 변환
│   ├── index.ts
│   └── converter.ts      # korean-lunar-calendar 래핑
├── calculators/          # 계산 로직
│   ├── index.ts
│   ├── time.ts           # 시진 변환
│   ├── palace.ts         # 명궁/신궁/12궁 계산
│   ├── wuxing.ts         # 오행국 계산
│   ├── main-stars.ts     # 14주성 배치
│   ├── minor-stars.ts    # 보조성/살성 배치
│   ├── sihua.ts          # 사화성 적용
│   └── brightness.ts     # 별 밝기 조회
└── interpreter/          # 해석 로직 (AI 연동 준비)
    ├── index.ts
    ├── templates.ts      # AI 폴백용 기본 템플릿
    ├── analyzer.ts       # AI 요청 데이터 생성
    └── summary.ts        # AI 요청 데이터 생성
```

**참고:** 실제 해석은 `solar-pro` AI 모델을 통해 생성됩니다.
interpreter 모듈은 AI 요청에 필요한 구조화된 데이터를 생성하고,
AI 서비스 장애 시 폴백 응답을 제공합니다.

## 핵심 개념

### 명반 생성 9단계

1. **음력 변환**: 양력 → 음력 (korean-lunar-calendar)
2. **시진 계산**: 출생 시간 → 12지지 인덱스 (0-11)
3. **명궁 계산**: 월 + 시진으로 명궁 위치 결정
4. **12궁 배치**: 명궁에서 반시계 방향으로 12궁 배치
5. **오행국 결정**: 천간/지지/명궁으로 오행국(2-6) 결정
6. **자미성 배치**: 오행국 + 일자로 자미성 위치 조회
7. **14주성 배치**: 자미성 기준으로 나머지 주성 배치
8. **보조성 배치**: 15종 보조성/살성 배치
9. **사화성 적용**: 연간 기준 화록/화권/화과/화기 적용

### 주요 타입

```typescript
// 입력
interface ZiweiInput {
  name: string;
  birthDate: string;      // "YYYY-MM-DD"
  birthTime: string;      // "HH:mm"
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
  isLeapMonth?: boolean;
}

// 명반
interface ZiweiChart {
  input: ZiweiInput;
  lunarDate: LunarDate;
  mingGong: BranchIndex;  // 0-11
  wuxingJu: WuxingJu;     // 2, 3, 4, 5, 6
  palaces: Palace[];      // 12궁
  sihua: SihuaResult;     // 사화 배치
}

// 결과
interface FortuneResult {
  summary: string;        // 전체 요약
  preview: { summary, description };  // 미리보기
  wealth: FortuneSection;     // 재물운
  career: FortuneSection;     // 직업운
  relationship: FortuneSection; // 인연운
  health: FortuneSection;     // 건강운
}
```

## 사용법

### 1. 명반 생성

```typescript
import { generateZiweiChart } from "@/libs/zi-wei-dou-shu";

// 명반 계산 (알고리즘 기반)
const chart = generateZiweiChart({
  name: "홍길동",
  birthDate: "1990-05-15",
  birthTime: "12:00",
  gender: "male",
  calendarType: "solar",
});

// chart 객체를 AI 서비스로 전달하여 해석 생성
```

### 2. AI 해석 요청 (별도 서비스)

```typescript
// libs/services/ai/ziwei-interpreter.ts 에서 처리
import { interpretChartWithAI } from "@/libs/services/ai";

// 명반 데이터를 AI로 전달
const result = await interpretChartWithAI(chart, {
  requestType: "wealth", // "preview" | "wealth" | "career" | "relationship" | "health" | "summary"
});
```

### 3. 폴백 해석 (AI 장애 시)

```typescript
import { generateFortuneResult } from "@/libs/zi-wei-dou-shu";

// 기본 템플릿 기반 해석 (AI 실패 시 폴백)
const fallbackResult = generateFortuneResult(chart);
```

## 의존성

- `korean-lunar-calendar`: 양력 ↔ 음력 변환
- `zod`: 입력 검증

## 참고 문서

- 알고리즘 명세서: `require/ziwei-algorithm.md`
- 유파: 삼합파(三合派)
- 분석 범위: 평생 운세 (대운/소운 제외)

## 테스트

```bash
pnpm test libs/zi-wei-dou-shu
```

## AI 해석 시스템

이 모듈은 명반 **계산**만 담당합니다. 실제 해석은 AI 모델을 통해 생성됩니다.

- **AI 모델:** Upstage solar-pro
- **시스템 프롬프트:** `require/ziwei-algorithm.md` 6.3절 참조
- **AI 서비스 구현:** `libs/services/ai/ziwei-interpreter.ts` (별도 구현 필요)

### AI에게 전달되는 데이터

```typescript
// ZiweiChart 객체를 AI 친화적 형식으로 변환
{
  user: { name, gender, lunarBirthInfo },
  chart: { wuxingJu, mingGongPosition, sihua },
  targetPalace: { name, mainStars, minorStars },
  oppositePalace: { ... }
}
```

## 제한사항

- 대운(大運), 소운(小運) 계산은 포함되지 않음
- 유년운(流年運) 분석은 향후 추가 예정
- 밝기 테이블은 14주성만 지원 (보조성은 기본 "평")
- AI 해석 서비스는 별도 모듈로 구현 필요
