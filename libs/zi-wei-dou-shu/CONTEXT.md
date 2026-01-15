# CONTEXT.md - 자미두수 알고리즘 모듈

## 개요

자미두수(紫微斗數) 명반 생성 라이브러리입니다. 삼합파(三合派) 기반으로 명반을 계산하고, **AI 모델(solar-pro)**을 활용하여 전문적인 해석을 제공합니다.

## 아키텍처

```
[사용자 입력] → [명반 계산 엔진] → [구조화된 명반 데이터] → [AI 해석 엔진] → [결과]
                 (이 모듈)           (ZiweiChart)            (solar-pro)
                                          ↓
                               [대운 계산 엔진] → [시각화 컴포넌트]
                                 (10년 주기)      (명반 차트 + 그래프)
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

- ~~대운(大運), 소운(小運) 계산은 포함되지 않음~~ → v2에서 대운 추가됨
- 유년운(流年運) 분석은 향후 추가 예정
- 밝기 테이블은 14주성만 지원 (보조성은 기본 "평")
- AI 해석 서비스는 별도 모듈로 구현 필요

---

## 🆕 Phase 2: 시각화 & 대운 시스템

### 개요

사용자에게 자미두수의 핵심인 **명반 시각화**와 **인생 주기별 운세 그래프**를 제공합니다.

### 새로운 기능

#### 1. 명반 차트 시각화 (12궁 사각형)

전통적인 자미두수 명반을 CSS로 구현합니다.

```
┌─────────┬─────────┬─────────┬─────────┐
│   사묘궁  │   오묘궁  │   미묘궁  │   신묘궁  │
│  (巳宮)  │  (午宮)  │  (未宮)  │  (申宮)  │
├─────────┼─────────┴─────────┼─────────┤
│   진묘궁  │                   │   유묘궁  │
│  (辰宮)  │    [기본 정보]     │  (酉宮)  │
│         │   이름, 생년월일    │         │
│         │   오행국, 명주     │         │
├─────────┤                   ├─────────┤
│   묘묘궁  │                   │   술묘궁  │
│  (卯宮)  │   💰 재물  💼 직업  │  (戌宮)  │
│         │   💕 인연  🏃 건강  │         │
├─────────┼─────────┬─────────┼─────────┤
│   인묘궁  │   축묘궁  │   자묘궁  │   해묘궁  │
│  (寅宮)  │  (丑宮)  │  (子宮)  │  (亥宮)  │
└─────────┴─────────┴─────────┴─────────┘
```

**각 궁에 표시할 정보:**
- 궁 이름 (명궁, 부모궁, 재백궁 등)
- 12지지 (子丑寅卯...)
- 주성 (이모지 + 이름 + 밝기)
- 보조성/살성
- 사화 표시 (화록🔴, 화권🟠, 화과🟢, 화기⚫)

#### 2. 대운(大運) 계산 시스템

10년 단위로 인생의 운세 흐름을 계산합니다.

**대운 계산 원리:**
- 명궁에서 시작하여 순행/역행으로 10년마다 이동
- 남자 양년생/여자 음년생: 순행 (시계방향)
- 남자 음년생/여자 양년생: 역행 (반시계방향)
- 오행국 숫자가 대운 시작 나이 결정 (예: 수이국=2세, 화육국=6세)

**대운 데이터 구조:**
```typescript
interface DayunPeriod {
  startAge: number;      // 시작 나이 (예: 2, 12, 22...)
  endAge: number;        // 종료 나이 (예: 11, 21, 31...)
  palace: Palace;        // 해당 기간의 대운궁
  mainStars: Star[];     // 대운궁의 주성들
  dayunSihua: SihuaResult; // 대운 사화
  score: {               // AI가 계산한 운세 점수 (0-100)
    overall: number;
    wealth: number;
    career: number;
    health: number;
  };
}
```

#### 3. 운세 그래프 시각화

나이(X축) vs 운세점수(Y축) 그래프로 인생 흐름을 시각화합니다.

**그래프 종류:**
1. **💰 재물운 그래프**: 나이별 재물/자산 흐름
2. **💼 직업운 그래프**: 커리어 성장 곡선
3. **🏃 건강운 그래프**: 건강 주의 시기 표시
4. **📊 종합운 그래프**: 전체 인생 운세 흐름

**그래프 특징:**
- 10년 단위 구간으로 표시
- 현재 나이 위치 하이라이트
- 주요 전환점(기회/주의) 마커 표시
- 터치/클릭 시 해당 시기 상세 설명

### 디렉토리 구조 (추가)

```
libs/zi-wei-dou-shu/
├── ...기존 파일들...
├── calculators/
│   ├── ...기존 파일들...
│   └── dayun.ts          # 🆕 대운 계산
└── visualization/        # 🆕 시각화 관련
    ├── index.ts
    ├── types.ts          # 시각화용 타입
    └── chart-data.ts     # 차트/그래프 데이터 변환

app/components/
├── ZiweiChart/           # 🆕 명반 차트 컴포넌트
│   ├── index.tsx
│   ├── Palace.tsx        # 개별 궁 컴포넌트
│   ├── CenterInfo.tsx    # 중앙 정보 영역
│   └── styles.module.css
└── FortuneGraph/         # 🆕 운세 그래프 컴포넌트
    ├── index.tsx
    ├── LineChart.tsx     # 꺾은선 그래프
    ├── types.ts
    └── styles.module.css
```

### 결과 화면 구성

```
┌────────────────────────────────────────┐
│          🔮 자미두수 명반              │  ← 명반 차트 (12궁)
│  ┌─────┬─────┬─────┬─────┐           │
│  │     │     │     │     │           │
│  ├─────┼─────┴─────┼─────┤           │
│  │     │  기본정보  │     │           │
│  ├─────┤           ├─────┤           │
│  │     │           │     │           │
│  ├─────┼─────┬─────┼─────┤           │
│  │     │     │     │     │           │
│  └─────┴─────┴─────┴─────┘           │
├────────────────────────────────────────┤
│          📊 인생 운세 그래프           │  ← 종합운 그래프
│  100 ┤      ╭──╮                      │
│   50 ┤  ╭──╯    ╰──╮  ╭──            │
│    0 ┼──┴──────────┴──╯              │
│      0   20   40   60   80  (나이)    │
├────────────────────────────────────────┤
│          💰 재물운                     │  ← 상세 해석 (기존)
│  친근한 해석 텍스트...                  │
├────────────────────────────────────────┤
│          💼 직업운                     │
│  ...                                  │
└────────────────────────────────────────┘
```

### 구현 우선순위

1. **Phase 2.1**: 대운 계산 알고리즘 (`calculators/dayun.ts`)
2. **Phase 2.2**: 명반 차트 컴포넌트 (`ZiweiChart/`)
3. **Phase 2.3**: 운세 그래프 컴포넌트 (`FortuneGraph/`)
4. **Phase 2.4**: AI 프롬프트에 대운 데이터 통합

### AI 해석 통합

대운 데이터를 AI 프롬프트에 전달하여 나이별 맞춤 해석을 생성합니다.

```typescript
// 예시: 재물운 해석 요청 시 대운 데이터 포함
{
  chart: ZiweiChart,
  dayunPeriods: DayunPeriod[],  // 모든 대운 기간
  currentAge: 25,               // 현재 나이
  requestType: "wealth"
}
```

**AI 응답 예시:**
```json
{
  "title": "💰 재물운",
  "content": "현재 20대 대운은 재백궁에 무곡성이 있어서...",
  "timeline": [
    { "age": "20-30", "score": 70, "description": "종잣돈 모으는 시기" },
    { "age": "30-40", "score": 85, "description": "본격 자산 증식기" },
    { "age": "40-50", "score": 95, "description": "인생 재물운 최고조!" }
  ],
  "highlights": ["30대 중반 투자 기회", "40대 부동산 운 좋음"]
}
```
