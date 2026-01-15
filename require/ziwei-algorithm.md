# 자미두수(紫微斗數) 알고리즘 명세서

## 1. 개요

- **유파:** 삼합파(三合派) - 한국에서 가장 널리 사용되는 전통 방식
- **분석 범위:** 평생 운세 (대운/유년 제외)
- **결과 스타일:** 구어체, 친근하고 직관적인 표현

---

## 2. 자미두수 기본 개념

### 2.1. 명반(命盤)이란?

자미두수 명반은 12개의 궁(宮)으로 구성된 사각형 차트입니다. 각 궁에 별(星)들이 배치되어 그 사람의 운명을 나타냅니다.

```
┌─────────┬─────────┬─────────┬─────────┐
│   巳    │   午    │   未    │   申    │
│  (사)   │  (오)   │  (미)   │  (신)   │
├─────────┼─────────┴─────────┼─────────┤
│   辰    │                   │   酉    │
│  (진)   │     명반 중앙      │  (유)   │
├─────────┤    (정보 표시)     ├─────────┤
│   卯    │                   │   戌    │
│  (묘)   │                   │  (술)   │
├─────────┼─────────┬─────────┼─────────┤
│   寅    │   丑    │   子    │   亥    │
│  (인)   │  (축)   │  (자)   │  (해)   │
└─────────┴─────────┴─────────┴─────────┘
```

### 2.2. 12궁(十二宮)

| 궁 이름 | 한자   | 의미                      |
| ------- | ------ | ------------------------- |
| 명궁    | 命宮   | 타고난 성격, 외모, 기질   |
| 형제궁  | 兄弟宮 | 형제자매 관계, 동료 관계  |
| 부처궁  | 夫妻宮 | 배우자, 연애, 결혼        |
| 자녀궁  | 子女宮 | 자녀 복, 성 생활          |
| 재백궁  | 財帛宮 | 재물, 돈 버는 방식        |
| 질액궁  | 疾厄宮 | 건강, 질병                |
| 천이궁  | 遷移宮 | 외부 활동, 여행, 타향 운  |
| 교우궁  | 交友宮 | 친구, 부하, 인간관계      |
| 관록궁  | 官祿宮 | 직업, 사업, 사회적 성취   |
| 전택궁  | 田宅宮 | 부동산, 가정환경          |
| 복덕궁  | 福德宮 | 정신적 만족, 취미, 행복도 |
| 부모궁  | 父母宮 | 부모 관계, 윗사람, 학업   |

---

## 3. 계산 순서

```
1. 음력 변환 (양력인 경우)
2. 명궁 위치 계산
3. 12궁 배치
4. 오행국(五行局) 결정
5. 자미성 위치 계산
6. 14주성 배치
7. 보좌성/살성 배치
8. 사화성(四化星) 배치
9. 각 궁 해석 및 결과 생성
```

---

## 4. 상세 알고리즘

### 4.1. 지지(地支) 기본 데이터

```typescript
// 12지지
const EARTHLY_BRANCHES = [
  "자",
  "축",
  "인",
  "묘",
  "진",
  "사",
  "오",
  "미",
  "신",
  "유",
  "술",
  "해",
] as const;

// 지지 인덱스 (자=0, 축=1, ..., 해=11)
type BranchIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// 10천간
const HEAVENLY_STEMS = [
  "갑",
  "을",
  "병",
  "정",
  "무",
  "기",
  "경",
  "신",
  "임",
  "계",
] as const;

// 천간 인덱스 (갑=0, 을=1, ..., 계=9)
type StemIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
```

### 4.2. 음력 변환

양력 → 음력 변환이 필요한 경우:

```typescript
interface LunarDate {
  year: number; // 음력 연도
  month: number; // 음력 월 (1-12)
  day: number; // 음력 일
  isLeapMonth: boolean; // 윤달 여부
  yearStem: StemIndex; // 연간(年干) 인덱스
  yearBranch: BranchIndex; // 연지(年支) 인덱스
}

// 음력 변환 라이브러리 사용 권장
// - korean-lunar-calendar
// - lunar-javascript
```

**연간/연지 계산:**

```typescript
// 연도로부터 천간 계산 (갑자년 = 서기 4년 기준)
const getYearStem = (lunarYear: number): StemIndex => {
  return ((((lunarYear - 4) % 10) + 10) % 10) as StemIndex;
};

// 연도로부터 지지 계산
const getYearBranch = (lunarYear: number): BranchIndex => {
  return ((((lunarYear - 4) % 12) + 12) % 12) as BranchIndex;
};
```

### 4.3. 시간 → 시진(時辰) 변환

```typescript
// 시간을 12시진으로 변환
const getTimeBranch = (hour: number, minute: number): BranchIndex => {
  // 23:00-00:59 → 자시(0)
  // 01:00-02:59 → 축시(1)
  // ...
  // 21:00-22:59 → 해시(11)

  const totalMinutes = hour * 60 + minute;

  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) return 0; // 자
  if (totalMinutes < 3 * 60) return 1; // 축
  if (totalMinutes < 5 * 60) return 2; // 인
  if (totalMinutes < 7 * 60) return 3; // 묘
  if (totalMinutes < 9 * 60) return 4; // 진
  if (totalMinutes < 11 * 60) return 5; // 사
  if (totalMinutes < 13 * 60) return 6; // 오
  if (totalMinutes < 15 * 60) return 7; // 미
  if (totalMinutes < 17 * 60) return 8; // 신
  if (totalMinutes < 19 * 60) return 9; // 유
  if (totalMinutes < 21 * 60) return 10; // 술
  return 11; // 해
};
```

### 4.4. 명궁(命宮) 위치 계산

**핵심 공식:** 명궁 = 인(寅)궁에서 시작하여 월수만큼 순행, 시진만큼 역행

```typescript
/**
 * 명궁 위치 계산
 * @param lunarMonth 음력 월 (1-12)
 * @param timeBranch 시진 인덱스 (0-11)
 * @returns 명궁이 위치한 지지 인덱스
 */
const calculateMingGong = (
  lunarMonth: number,
  timeBranch: BranchIndex
): BranchIndex => {
  // 인(寅)궁 = 인덱스 2
  // 월수만큼 순행(+), 시진만큼 역행(-)
  // 공식: (2 + lunarMonth - 1 - timeBranch + 12) % 12

  const position = (2 + lunarMonth - 1 - timeBranch + 12) % 12;
  return position as BranchIndex;
};
```

**예시:**

- 음력 3월생, 오시(午時, 인덱스 6) 태생
- 명궁 = (2 + 3 - 1 - 6 + 12) % 12 = 10 = 술(戌)궁

### 4.5. 신궁(身宮) 위치 계산

**공식:** 신궁 = 인(寅)궁에서 시작하여 월수만큼 순행, 시진만큼 순행

```typescript
const calculateShenGong = (
  lunarMonth: number,
  timeBranch: BranchIndex
): BranchIndex => {
  // 공식: (2 + lunarMonth - 1 + timeBranch) % 12
  const position = (2 + lunarMonth - 1 + timeBranch) % 12;
  return position as BranchIndex;
};
```

### 4.6. 12궁 배치

명궁 위치가 결정되면 나머지 11궁은 반시계 방향으로 순서대로 배치:

```typescript
const PALACE_ORDER = [
  "명궁",
  "형제궁",
  "부처궁",
  "자녀궁",
  "재백궁",
  "질액궁",
  "천이궁",
  "교우궁",
  "관록궁",
  "전택궁",
  "복덕궁",
  "부모궁",
] as const;

const arrangePalaces = (
  mingGongBranch: BranchIndex
): Map<string, BranchIndex> => {
  const palaces = new Map<string, BranchIndex>();

  PALACE_ORDER.forEach((palace, index) => {
    // 반시계 방향 = 지지 인덱스 감소
    const branch = ((((mingGongBranch - index) % 12) + 12) % 12) as BranchIndex;
    palaces.set(palace, branch);
  });

  return palaces;
};
```

### 4.7. 오행국(五行局) 결정

오행국은 명궁의 납음오행(納音五行)으로 결정됩니다.

```typescript
// 명궁 천간 계산 (연간 기준)
const getPalaceStem = (
  yearStem: StemIndex,
  palaceBranch: BranchIndex
): StemIndex => {
  // 연간에 따른 인(寅)궁의 천간
  // 갑/기년 → 인궁이 병(丙)
  // 을/경년 → 인궁이 무(戊)
  // 병/신년 → 인궁이 경(庚)
  // 정/임년 → 인궁이 임(壬)
  // 무/계년 → 인궁이 갑(甲)

  const yinStemByYearStem: Record<number, StemIndex> = {
    0: 2,
    5: 2, // 갑/기 → 병
    1: 4,
    6: 4, // 을/경 → 무
    2: 6,
    7: 6, // 병/신 → 경
    3: 8,
    8: 8, // 정/임 → 임
    4: 0,
    9: 0, // 무/계 → 갑
  };

  const yinStem = yinStemByYearStem[yearStem];
  // 인(寅)궁부터 순행하며 천간 배치
  const offset = (palaceBranch - 2 + 12) % 12;
  return ((yinStem + offset) % 10) as StemIndex;
};

// 오행국 결정 (명궁의 천간+지지로 납음 계산)
const WUXING_JU: Record<string, number> = {
  // 납음오행에 따른 국수
  // 수이국(水二局), 목삼국(木三局), 금사국(金四局),
  // 토오국(土五局), 화육국(火六局)
  수: 2,
  목: 3,
  금: 4,
  토: 5,
  화: 6,
};

// 60갑자 납음 테이블
const NAYIN_TABLE: Record<string, string> = {
  갑자: "금",
  을축: "금", // 해중금
  병인: "화",
  정묘: "화", // 노중화
  무진: "목",
  기사: "목", // 대림목
  경오: "토",
  신미: "토", // 노방토
  임신: "금",
  계유: "금", // 검봉금
  갑술: "화",
  을해: "화", // 산두화
  병자: "수",
  정축: "수", // 간하수
  무인: "토",
  기묘: "토", // 성두토
  경진: "금",
  신사: "금", // 백랍금
  임오: "목",
  계미: "목", // 양류목
  갑신: "수",
  을유: "수", // 정천수
  병술: "토",
  정해: "토", // 옥상토
  무자: "화",
  기축: "화", // 벽력화
  경인: "목",
  신묘: "목", // 송백목
  임진: "수",
  계사: "수", // 장류수
  갑오: "금",
  을미: "금", // 사중금
  병신: "화",
  정유: "화", // 산하화
  무술: "목",
  기해: "목", // 평지목
  경자: "토",
  신축: "토", // 벽상토
  임인: "금",
  계묘: "금", // 금박금
  갑진: "화",
  을사: "화", // 복등화
  병오: "수",
  정미: "수", // 천하수
  무신: "토",
  기유: "토", // 대역토
  경술: "금",
  신해: "금", // 차천금
  임자: "목",
  계축: "목", // 상자목
  갑인: "수",
  을묘: "수", // 대계수
  병진: "토",
  정사: "토", // 사중토
  무오: "화",
  기미: "화", // 천상화
  경신: "목",
  신유: "목", // 석류목
  임술: "수",
  계해: "수", // 대해수
};

const calculateWuxingJu = (
  yearStem: StemIndex,
  mingGongBranch: BranchIndex
): number => {
  const palaceStem = getPalaceStem(yearStem, mingGongBranch);
  const ganZhi = HEAVENLY_STEMS[palaceStem] + EARTHLY_BRANCHES[mingGongBranch];
  const nayin = NAYIN_TABLE[ganZhi];
  return WUXING_JU[nayin];
};
```

### 4.8. 자미성(紫微星) 위치 계산

자미성 위치는 **음력 일(日)**과 **오행국 수**로 결정됩니다.

```typescript
/**
 * 자미성 위치 계산
 * @param lunarDay 음력 일 (1-30)
 * @param wuxingJu 오행국 수 (2, 3, 4, 5, 6)
 * @returns 자미성이 위치한 지지 인덱스
 */
const calculateZiweiPosition = (
  lunarDay: number,
  wuxingJu: number
): BranchIndex => {
  // 자미성 위치 테이블
  // [오행국][음력일] = 지지 인덱스

  const ZIWEI_TABLE: Record<number, Record<number, BranchIndex>> = {
    2: {
      // 수이국
      1: 1,
      2: 2, // 1일→축, 2일→인
      3: 2,
      4: 3, // 3일→인, 4일→묘
      5: 3,
      6: 4, // ...
      7: 4,
      8: 5,
      9: 5,
      10: 6,
      11: 6,
      12: 7,
      13: 7,
      14: 8,
      15: 8,
      16: 9,
      17: 9,
      18: 10,
      19: 10,
      20: 11,
      21: 11,
      22: 0,
      23: 0,
      24: 1,
      25: 1,
      26: 2,
      27: 2,
      28: 3,
      29: 3,
      30: 4,
    },
    3: {
      // 목삼국
      1: 4,
      2: 1,
      3: 2,
      4: 4,
      5: 2,
      6: 3,
      7: 4,
      8: 3,
      9: 4,
      10: 5,
      11: 4,
      12: 5,
      13: 5,
      14: 5,
      15: 6,
      16: 6,
      17: 6,
      18: 7,
      19: 7,
      20: 7,
      21: 8,
      22: 8,
      23: 8,
      24: 9,
      25: 9,
      26: 9,
      27: 10,
      28: 10,
      29: 10,
      30: 11,
    },
    4: {
      // 금사국
      1: 2,
      2: 6,
      3: 1,
      4: 2,
      5: 6,
      6: 2,
      7: 3,
      8: 6,
      9: 3,
      10: 4,
      11: 6,
      12: 4,
      13: 5,
      14: 7,
      15: 5,
      16: 6,
      17: 7,
      18: 6,
      19: 7,
      20: 7,
      21: 7,
      22: 8,
      23: 8,
      24: 8,
      25: 9,
      26: 9,
      27: 9,
      28: 10,
      29: 10,
      30: 10,
    },
    5: {
      // 토오국
      1: 2,
      2: 7,
      3: 7,
      4: 1,
      5: 2,
      6: 7,
      7: 7,
      8: 2,
      9: 3,
      10: 7,
      11: 7,
      12: 3,
      13: 4,
      14: 8,
      15: 8,
      16: 4,
      17: 5,
      18: 8,
      19: 8,
      20: 5,
      21: 6,
      22: 8,
      23: 8,
      24: 6,
      25: 7,
      26: 9,
      27: 9,
      28: 7,
      29: 8,
      30: 9,
    },
    6: {
      // 화육국
      1: 2,
      2: 8,
      3: 8,
      4: 8,
      5: 1,
      6: 2,
      7: 8,
      8: 8,
      9: 8,
      10: 2,
      11: 3,
      12: 8,
      13: 8,
      14: 8,
      15: 3,
      16: 4,
      17: 9,
      18: 9,
      19: 9,
      20: 4,
      21: 5,
      22: 9,
      23: 9,
      24: 9,
      25: 5,
      26: 6,
      27: 9,
      28: 9,
      29: 9,
      30: 6,
    },
  };

  return ZIWEI_TABLE[wuxingJu][lunarDay];
};
```

### 4.9. 14주성(主星) 배치

자미성 위치가 결정되면 나머지 13개 주성의 위치가 결정됩니다.

```typescript
interface Star {
  name: string;
  position: BranchIndex;
  brightness: "묘" | "왕" | "득" | "리" | "평" | "함";
}

// 자미성 기준 주성 배치 (자미 계열)
const ZIWEI_GROUP_OFFSETS: Record<string, number> = {
  자미: 0,
  천기: -1, // 자미에서 역행 1궁
  태양: -2,
  무곡: -3,
  천동: -4,
  염정: -5, // 자미에서 역행 5궁 (= 순행 7궁)
};

// 천부성 위치 계산 (자미성 기준)
const calculateTianfuPosition = (ziweiPos: BranchIndex): BranchIndex => {
  // 천부성은 자미성과 인(寅)-신(申) 축 대칭
  // 공식: (4 - ziweiPos + 12) % 12 + 4) % 12
  // 또는 간단히: 자미가 자(0)이면 천부는 진(4)
  //              자미가 축(1)이면 천부는 묘(3)...

  const TIANFU_FROM_ZIWEI: Record<BranchIndex, BranchIndex> = {
    0: 4, // 자 → 진
    1: 3, // 축 → 묘
    2: 2, // 인 → 인
    3: 1, // 묘 → 축
    4: 0, // 진 → 자
    5: 11, // 사 → 해
    6: 10, // 오 → 술
    7: 9, // 미 → 유
    8: 8, // 신 → 신
    9: 7, // 유 → 미
    10: 6, // 술 → 오
    11: 5, // 해 → 사
  };

  return TIANFU_FROM_ZIWEI[ziweiPos];
};

// 천부성 기준 주성 배치 (천부 계열)
const TIANFU_GROUP_OFFSETS: Record<string, number> = {
  천부: 0,
  태음: 1, // 천부에서 순행 1궁
  탐랑: 2,
  거문: 3,
  천상: 4,
  천량: 5,
  칠살: 6,
  파군: 10, // 천부에서 순행 10궁 (= 역행 2궁)
};

// 14주성 전체 배치
const arrangeMainStars = (ziweiPos: BranchIndex): Map<string, BranchIndex> => {
  const stars = new Map<string, BranchIndex>();
  const tianfuPos = calculateTianfuPosition(ziweiPos);

  // 자미 계열 배치
  Object.entries(ZIWEI_GROUP_OFFSETS).forEach(([star, offset]) => {
    const pos = ((((ziweiPos + offset) % 12) + 12) % 12) as BranchIndex;
    stars.set(star, pos);
  });

  // 천부 계열 배치
  Object.entries(TIANFU_GROUP_OFFSETS).forEach(([star, offset]) => {
    const pos = ((tianfuPos + offset) % 12) as BranchIndex;
    stars.set(star, pos);
  });

  return stars;
};
```

### 4.10. 주성 밝기(廟旺得利平陷) 계산

각 주성은 위치한 궁에 따라 밝기가 달라집니다.

```typescript
type Brightness = "묘" | "왕" | "득" | "리" | "평" | "함";

// 밝기 점수 (해석 시 활용)
const BRIGHTNESS_SCORE: Record<Brightness, number> = {
  묘: 100, // 최고
  왕: 80,
  득: 60,
  리: 40,
  평: 20,
  함: 0, // 최저
};

// 주성별 밝기 테이블 (지지별)
// 형식: [자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해]
const STAR_BRIGHTNESS: Record<string, Brightness[]> = {
  자미: [
    "왕",
    "함",
    "묘",
    "리",
    "묘",
    "득",
    "왕",
    "묘",
    "득",
    "평",
    "묘",
    "득",
  ],
  천기: [
    "득",
    "왕",
    "리",
    "묘",
    "평",
    "함",
    "함",
    "평",
    "묘",
    "묘",
    "리",
    "왕",
  ],
  태양: [
    "함",
    "함",
    "왕",
    "묘",
    "왕",
    "묘",
    "왕",
    "득",
    "득",
    "함",
    "함",
    "함",
  ],
  무곡: [
    "왕",
    "묘",
    "리",
    "묘",
    "득",
    "평",
    "왕",
    "득",
    "묘",
    "묘",
    "리",
    "평",
  ],
  천동: [
    "왕",
    "리",
    "함",
    "평",
    "함",
    "묘",
    "평",
    "함",
    "묘",
    "왕",
    "함",
    "득",
  ],
  염정: [
    "평",
    "함",
    "묘",
    "리",
    "함",
    "왕",
    "함",
    "함",
    "왕",
    "득",
    "묘",
    "묘",
  ],
  천부: [
    "묘",
    "득",
    "묘",
    "득",
    "왕",
    "평",
    "묘",
    "왕",
    "득",
    "묘",
    "리",
    "평",
  ],
  태음: [
    "묘",
    "왕",
    "함",
    "함",
    "함",
    "함",
    "함",
    "득",
    "리",
    "묘",
    "왕",
    "묘",
  ],
  탐랑: [
    "왕",
    "평",
    "묘",
    "함",
    "왕",
    "득",
    "리",
    "묘",
    "왕",
    "평",
    "리",
    "함",
  ],
  거문: [
    "왕",
    "리",
    "묘",
    "함",
    "함",
    "왕",
    "득",
    "묘",
    "묘",
    "평",
    "함",
    "평",
  ],
  천상: [
    "묘",
    "평",
    "득",
    "리",
    "왕",
    "함",
    "왕",
    "묘",
    "리",
    "묘",
    "득",
    "함",
  ],
  천량: [
    "묘",
    "왕",
    "함",
    "함",
    "함",
    "묘",
    "함",
    "함",
    "묘",
    "왕",
    "득",
    "리",
  ],
  칠살: [
    "묘",
    "왕",
    "평",
    "함",
    "리",
    "왕",
    "묘",
    "득",
    "함",
    "묘",
    "평",
    "리",
  ],
  파군: [
    "평",
    "함",
    "묘",
    "왕",
    "함",
    "리",
    "왕",
    "리",
    "왕",
    "왕",
    "함",
    "득",
  ],
};

const getStarBrightness = (star: string, branch: BranchIndex): Brightness => {
  return STAR_BRIGHTNESS[star]?.[branch] ?? "평";
};
```

### 4.11. 보좌성(輔助星) 배치

#### 좌보(左輔) / 우필(右弼)

```typescript
// 좌보: 월 기준 순행
const calculateZuofu = (lunarMonth: number): BranchIndex => {
  // 진(辰)에서 시작, 월수만큼 순행
  return ((4 + lunarMonth - 1) % 12) as BranchIndex;
};

// 우필: 월 기준 역행
const calculateYoubi = (lunarMonth: number): BranchIndex => {
  // 술(戌)에서 시작, 월수만큼 역행
  return ((10 - lunarMonth + 1 + 12) % 12) as BranchIndex;
};
```

#### 문창(文昌) / 문곡(文曲)

```typescript
// 문창: 시 기준 역행
const calculateWenchang = (timeBranch: BranchIndex): BranchIndex => {
  // 술(戌)에서 시작, 시진만큼 역행
  return ((10 - timeBranch + 12) % 12) as BranchIndex;
};

// 문곡: 시 기준 순행
const calculateWenqu = (timeBranch: BranchIndex): BranchIndex => {
  // 진(辰)에서 시작, 시진만큼 순행
  return ((4 + timeBranch) % 12) as BranchIndex;
};
```

#### 천괴(天魁) / 천월(天鉞)

```typescript
// 연간에 따른 천괴/천월 위치
const TIANKUI_TABLE: Record<StemIndex, BranchIndex> = {
  0: 1,
  4: 1, // 갑/무 → 축
  1: 0,
  5: 0, // 을/기 → 자
  2: 11,
  3: 11, // 병/정 → 해
  6: 6,
  7: 6, // 경/신 → 오
  8: 3,
  9: 3, // 임/계 → 묘
};

const TIANYUE_TABLE: Record<StemIndex, BranchIndex> = {
  0: 7,
  4: 7, // 갑/무 → 미
  1: 8,
  5: 8, // 을/기 → 신
  2: 9,
  3: 9, // 병/정 → 유
  6: 4,
  7: 4, // 경/신 → 진
  8: 5,
  9: 5, // 임/계 → 사
};
```

### 4.12. 살성(煞星) 배치

#### 화성(火星) / 영성(鈴星)

```typescript
// 화성: 연지와 시에 따라 결정
const calculateHuoxing = (
  yearBranch: BranchIndex,
  timeBranch: BranchIndex
): BranchIndex => {
  // 인오술년(寅午戌年): 축(丑)에서 시작
  // 신자진년(申子辰年): 인(寅)에서 시작
  // 사유축년(巳酉丑年): 묘(卯)에서 시작
  // 해묘미년(亥卯未年): 유(酉)에서 시작

  let start: BranchIndex;
  if ([2, 6, 10].includes(yearBranch))
    start = 1; // 인오술 → 축
  else if ([8, 0, 4].includes(yearBranch))
    start = 2; // 신자진 → 인
  else if ([5, 9, 1].includes(yearBranch))
    start = 3; // 사유축 → 묘
  else start = 9; // 해묘미 → 유

  return ((start + timeBranch) % 12) as BranchIndex;
};

// 영성: 화성과 유사하나 시작점 다름
const calculateLingxing = (
  yearBranch: BranchIndex,
  timeBranch: BranchIndex
): BranchIndex => {
  let start: BranchIndex;
  if ([2, 6, 10].includes(yearBranch))
    start = 3; // 인오술 → 묘
  else if ([8, 0, 4].includes(yearBranch))
    start = 10; // 신자진 → 술
  else if ([5, 9, 1].includes(yearBranch))
    start = 10; // 사유축 → 술
  else start = 3; // 해묘미 → 묘

  return ((start + timeBranch) % 12) as BranchIndex;
};
```

#### 양인(擎羊) / 타라(陀羅)

```typescript
// 연간에 따른 양인/타라 위치
const QINGYANG_TABLE: Record<StemIndex, BranchIndex> = {
  0: 3,
  1: 4, // 갑→묘, 을→진
  2: 6,
  3: 7, // 병→오, 정→미
  4: 6,
  5: 7, // 무→오, 기→미
  6: 9,
  7: 10, // 경→유, 신→술
  8: 0,
  9: 1, // 임→자, 계→축
};

const TUOLUO_TABLE: Record<StemIndex, BranchIndex> = {
  0: 1,
  1: 2, // 갑→축, 을→인
  2: 4,
  3: 5, // 병→진, 정→사
  4: 4,
  5: 5, // 무→진, 기→사
  6: 7,
  7: 8, // 경→미, 신→신
  8: 10,
  9: 11, // 임→술, 계→해
};
```

#### 지겁(地劫) / 지공(地空)

```typescript
// 지겁: 시 기준
const calculateDijie = (timeBranch: BranchIndex): BranchIndex => {
  // 해(亥)에서 시작, 시진만큼 순행
  return ((11 + timeBranch) % 12) as BranchIndex;
};

// 지공: 시 기준
const calculateDikong = (timeBranch: BranchIndex): BranchIndex => {
  // 해(亥)에서 시작, 시진만큼 역행
  return ((11 - timeBranch + 12) % 12) as BranchIndex;
};
```

### 4.13. 기타 중요 별

#### 천마(天馬)

```typescript
const TIANMA_TABLE: Record<BranchIndex, BranchIndex> = {
  // 연지에 따른 천마 위치
  0: 2,
  4: 2,
  8: 2, // 자진신년 → 인
  1: 11,
  5: 11,
  9: 11, // 축사유년 → 해
  2: 8,
  6: 8,
  10: 8, // 인오술년 → 신
  3: 5,
  7: 5,
  11: 5, // 묘미해년 → 사
};
```

#### 홍란(紅鸞) / 천희(天喜)

```typescript
// 홍란: 연지 기준
const calculateHongluan = (yearBranch: BranchIndex): BranchIndex => {
  // 묘(卯)에서 시작, 연지만큼 역행
  return ((3 - yearBranch + 12) % 12) as BranchIndex;
};

// 천희: 홍란 대충
const calculateTianxi = (yearBranch: BranchIndex): BranchIndex => {
  // 유(酉)에서 시작, 연지만큼 역행
  return ((9 - yearBranch + 12) % 12) as BranchIndex;
};
```

### 4.14. 사화성(四化星) 배치

사화성은 **연간(年干)**에 따라 특정 주성에 붙습니다.

```typescript
interface SihuaResult {
  hualu: string; // 화록이 붙는 별
  huaquan: string; // 화권이 붙는 별
  huake: string; // 화과가 붙는 별
  huaji: string; // 화기가 붙는 별
}

const SIHUA_TABLE: Record<StemIndex, SihuaResult> = {
  0: { hualu: "염정", huaquan: "파군", huake: "무곡", huaji: "태양" }, // 갑
  1: { hualu: "천기", huaquan: "천량", huake: "자미", huaji: "태음" }, // 을
  2: { hualu: "천동", huaquan: "천기", huake: "문창", huaji: "염정" }, // 병
  3: { hualu: "태음", huaquan: "천동", huake: "천기", huaji: "거문" }, // 정
  4: { hualu: "탐랑", huaquan: "태음", huake: "우필", huaji: "천기" }, // 무
  5: { hualu: "무곡", huaquan: "탐랑", huake: "천량", huaji: "문곡" }, // 기
  6: { hualu: "태양", huaquan: "무곡", huake: "태음", huaji: "천동" }, // 경
  7: { hualu: "거문", huaquan: "태양", huake: "문곡", huaji: "문창" }, // 신
  8: { hualu: "천량", huaquan: "자미", huake: "좌보", huaji: "무곡" }, // 임
  9: { hualu: "파군", huaquan: "거문", huake: "태음", huaji: "탐랑" }, // 계
};

const calculateSihua = (yearStem: StemIndex): SihuaResult => {
  return SIHUA_TABLE[yearStem];
};
```

---

## 5. 명반 데이터 구조

### 5.1. 전체 명반 타입

```typescript
interface Palace {
  name: string; // 궁 이름 (명궁, 형제궁 등)
  branch: BranchIndex; // 지지
  stem: StemIndex; // 천간
  mainStars: StarInfo[]; // 주성 목록
  minorStars: StarInfo[]; // 보조성 목록
  sihua: string[]; // 사화성 목록 (화록, 화권 등)
}

interface StarInfo {
  name: string;
  brightness: Brightness;
  sihua?: "화록" | "화권" | "화과" | "화기";
}

interface ZiweiChart {
  // 기본 정보
  name: string;
  gender: "male" | "female";
  lunarBirthDate: LunarDate;
  timeBranch: BranchIndex;

  // 계산된 기본값
  mingGong: BranchIndex; // 명궁 위치
  shenGong: BranchIndex; // 신궁 위치
  wuxingJu: number; // 오행국 (2,3,4,5,6)

  // 12궁 정보
  palaces: Palace[];

  // 사화성 정보
  sihua: SihuaResult;
}
```

### 5.2. 명반 생성 메인 함수

```typescript
const generateZiweiChart = (input: {
  name: string;
  birthDate: string; // "YYYY-MM-DD"
  birthTime: string; // "HH:mm"
  gender: "male" | "female";
  calendarType: "solar" | "lunar";
}): ZiweiChart => {
  // 1. 음력 변환
  const lunarDate =
    input.calendarType === "solar"
      ? convertToLunar(input.birthDate)
      : parseLunarDate(input.birthDate);

  // 2. 시진 계산
  const [hour, minute] = input.birthTime.split(":").map(Number);
  const timeBranch = getTimeBranch(hour, minute);

  // 3. 명궁/신궁 계산
  const mingGong = calculateMingGong(lunarDate.month, timeBranch);
  const shenGong = calculateShenGong(lunarDate.month, timeBranch);

  // 4. 오행국 계산
  const wuxingJu = calculateWuxingJu(lunarDate.yearStem, mingGong);

  // 5. 자미성 위치 계산
  const ziweiPos = calculateZiweiPosition(lunarDate.day, wuxingJu);

  // 6. 주성 배치
  const mainStars = arrangeMainStars(ziweiPos);

  // 7. 보좌성/살성 배치
  const minorStars = arrangeMinorStars(lunarDate, timeBranch);

  // 8. 사화성 계산
  const sihua = calculateSihua(lunarDate.yearStem);

  // 9. 12궁 조합
  const palaces = buildPalaces(
    mingGong,
    lunarDate.yearStem,
    mainStars,
    minorStars,
    sihua
  );

  return {
    name: input.name,
    gender: input.gender,
    lunarBirthDate: lunarDate,
    timeBranch,
    mingGong,
    shenGong,
    wuxingJu,
    palaces,
    sihua,
  };
};
```

---

## 6. AI 기반 해석 시스템

명반 계산 후 결과 해석은 **AI 모델(solar-pro)**을 활용하여 전문적이고 개인화된 해석을 제공합니다.

### 6.1. 시스템 아키텍처

```
[사용자 입력] → [명반 계산 엔진] → [구조화된 명반 데이터] → [AI 해석 엔진] → [결과]
                 (알고리즘)           (JSON)                  (solar-pro)
```

### 6.2. AI 모델 설정

- **모델:** solar-pro (Upstage)
- **역할:** 자미두수 전문 해석가
- **온도:** 0.7 (창의성과 일관성의 균형)
- **최대 토큰:** 2000

### 6.3. 시스템 프롬프트 (System Prompt)

```
당신은 40년 경력의 자미두수(紫微斗數) 대가입니다. 삼합파(三合派) 정통 이론에 정통하며, 수천 명의 명반을 분석한 경험이 있습니다.

## 핵심 역할
- 주어진 명반 데이터를 정확하게 해석합니다
- 별의 위치, 밝기, 사화, 동궁 관계를 종합적으로 분석합니다
- 전문적이면서도 이해하기 쉬운 언어로 설명합니다

## 해석 원칙

### 1. 주성(主星) 해석 우선순위
각 궁의 주성이 가장 중요합니다. 주성의 본질적 특성을 먼저 파악하세요.

**자미성(紫微星) - 황제의 별**
- 본질: 권위, 리더십, 자존심, 품위
- 묘/왕: 타고난 통솔력, 높은 지위에 오를 운명
- 함/평: 권위욕은 있으나 실현이 어려움, 겸손이 필요

**천기성(天機星) - 지혜의 별**
- 본질: 지능, 기획력, 변화, 민첩성
- 묘/왕: 뛰어난 두뇌, 참모형 인재, 전략가
- 함/평: 생각만 많고 실행력 부족, 우유부단

**태양성(太陽星) - 빛의 별**
- 본질: 활력, 명예, 봉사, 남성성
- 묘/왕: 에너지 넘침, 사회적 성공, 명예로운 삶
- 함/평: 에너지 분산, 빛을 발하기 어려움

**무곡성(武曲星) - 재물의 별**
- 본질: 재물, 결단력, 강직함, 무인 기질
- 묘/왕: 재물 복이 강함, 투자 감각, 사업 수완
- 함/평: 돈은 벌지만 모으기 어려움, 고집으로 손해

**천동성(天同星) - 복의 별**
- 본질: 복덕, 쾌락, 게으름, 낙천성
- 묘/왕: 타고난 복, 큰 고생 없는 삶, 인덕
- 함/평: 안일함, 노력 부족, 의지박약

**염정성(廉貞星) - 정치의 별**
- 본질: 정치력, 교활함, 질투, 관료성
- 묘/왕: 정치적 수완, 조직 내 승진, 처세술
- 함/평: 관재구설, 시기질투, 인간관계 갈등

**천부성(天府星) - 재고의 별**
- 본질: 재물 저장, 보수성, 안정, 관리 능력
- 묘/왕: 안정적 재물운, 자산 축적, 든든한 기반
- 함/평: 보수적 고집, 변화 거부, 기회 상실

**태음성(太陰星) - 달의 별**
- 본질: 부동산, 여성성, 감성, 예술성
- 묘/왕: 부동산 복, 감성 풍부, 예술적 재능
- 함/평: 감정 기복, 우울 경향, 재물 불안정

**탐랑성(貪狼星) - 욕망의 별**
- 본질: 욕망, 다재다능, 예술, 화려함
- 묘/왕: 다방면 재능, 예술/연예 성공, 매력 넘침
- 함/평: 욕심 과다, 색정 문제, 본업 소홀

**거문성(巨門星) - 말의 별**
- 본질: 언변, 시비, 분석력, 비판성
- 묘/왕: 뛰어난 언변, 변호사/강사/방송인 적합
- 함/평: 구설수, 논쟁 휘말림, 비판만 하고 대안 없음

**천상성(天相星) - 인(印)의 별**
- 본질: 인장, 보좌, 조화, 외교력
- 묘/왕: 2인자로서 성공, 조율 능력, 공무원 적합
- 함/평: 우유부단, 남의 눈치, 주체성 부족

**천량성(天梁星) - 수명의 별**
- 본질: 장수, 해결사, 어른 역할, 학문
- 묘/왕: 위기 모면, 귀인 덕, 학자/교육자 적합
- 함/평: 잔소리, 고리타분, 시대에 뒤처짐

**칠살성(七殺星) - 장군의 별**
- 본질: 결단, 개척, 고독, 파괴와 창조
- 묘/왕: 강한 추진력, 개척자, 사업 성공
- 함/평: 충동적, 인간관계 파탄, 고독한 말년

**파군성(破軍星) - 선봉의 별**
- 본질: 파괴, 변화, 모험, 개혁
- 묘/왕: 변화 속 성공, 새로운 분야 개척, 과감한 도전
- 함/평: 파괴만 있고 건설 없음, 불안정, 변덕

### 2. 밝기(廟旺得利平陷) 해석

밝기는 별의 힘이 얼마나 발휘되는지를 나타냅니다:

| 밝기 | 의미 | 점수 |
|------|------|------|
| 묘(廟) | 최고 상태, 완전히 발휘 | 100 |
| 왕(旺) | 좋은 상태, 잘 발휘 | 80 |
| 득(得) | 양호, 적당히 발휘 | 60 |
| 리(利) | 보통, 약간 발휘 | 40 |
| 평(平) | 미미, 거의 발휘 안 됨 | 20 |
| 함(陷) | 최저 상태, 오히려 해로움 | 0 |

### 3. 사화성(四化星) 해석

사화는 별에 붙어 그 성질을 강화하거나 약화시킵니다:

- **화록(化祿):** 재물, 인연, 복이 들어옴. 해당 별의 좋은 면이 강화됨
- **화권(化權):** 권력, 통제력, 주도권. 해당 영역에서 힘을 발휘
- **화과(化科):** 명예, 학업, 시험운. 인정받고 빛나는 기회
- **화기(化忌):** 막힘, 집착, 손실. 해당 영역에서 문제 발생 가능

### 4. 보조성/살성 영향

**길성(吉星) - 긍정적 영향:**
- 좌보/우필: 귀인의 도움, 협력자 운
- 천괴/천월: 귀인 등장, 고난 중 구원
- 문창/문곡: 학업, 시험, 문서 관련 행운

**살성(煞星) - 주의 필요:**
- 화성/영성: 급한 성격, 충동, 사고 주의
- 양인/타라: 형액, 수술, 인간관계 갈등
- 지겁/지공: 공허함, 허무, 돈이 새는 구멍

### 5. 동궁(同宮) 및 상호작용

여러 별이 같은 궁에 있을 때의 조합 효과:
- 자미+천부: 재부쌍미격, 부귀 겸전
- 태양+태음: 일월동궁, 밝은 인생
- 탐랑+염정: 도화 과다, 이성 문제 주의
- 칠살+파군+탐랑: 살파탐, 파란만장한 인생

## 해석 스타일 가이드

1. **전문적이면서 친근하게**: 학술적 용어도 사용하되, 일반인이 이해할 수 있게 풀어서 설명
2. **구체적인 조언 포함**: 추상적 해석에 그치지 않고 실생활에 적용 가능한 조언 제공
3. **균형 잡힌 시각**: 좋은 점과 주의할 점을 모두 언급하되, 희망적 메시지로 마무리
4. **성별 고려**: 남성/여성에 따른 미묘한 해석 차이 반영
5. **맥락 연결**: 각 궁의 해석을 개별적으로 하지 않고, 전체적인 인생 흐름으로 연결

## 금기사항

- 절대적인 예언처럼 말하지 않기 (확률과 경향으로 표현)
- 지나치게 부정적이거나 절망적인 표현 금지
- 미신적이거나 비과학적인 표현 자제
- "~할 수 있습니다", "~경향이 있습니다" 등 열린 표현 사용
```

### 6.4. AI 요청 데이터 구조

명반 계산 후 AI에게 전달할 데이터 구조:

```typescript
interface AIInterpretationRequest {
  // 사용자 정보
  user: {
    name: string;
    gender: "male" | "female";
    lunarBirthInfo: string; // "음력 1990년 4월 21일 오시생"
  };

  // 명반 핵심 정보
  chart: {
    wuxingJu: string; // "수이국", "목삼국" 등
    mingGongPosition: string; // "해궁" 등
    shenGongPosition: string; // "인궁" 등

    // 사화 정보
    sihua: {
      hualu: { star: string; palace: string };
      huaquan: { star: string; palace: string };
      huake: { star: string; palace: string };
      huaji: { star: string; palace: string };
    };
  };

  // 분석 대상 궁 정보
  targetPalace: {
    name: string; // "명궁", "재백궁" 등
    branch: string; // "자", "축" 등
    mainStars: Array<{
      name: string;
      brightness: string;
      sihua?: string;
    }>;
    minorStars: string[];
    hasNoMainStar: boolean;
  };

  // 대궁 정보 (반드시 포함)
  oppositePalace: {
    name: string;
    mainStars: Array<{
      name: string;
      brightness: string;
    }>;
  };

  // 요청 유형
  requestType:
    | "preview"
    | "wealth"
    | "career"
    | "relationship"
    | "health"
    | "summary";
}
```

### 6.5. 궁별 해석 요청 프롬프트

#### 미리보기 (명궁 요약)

```
주어진 명반 데이터를 분석하여 이 사람의 핵심 성격과 인생 테마를 2-3문장으로 요약해주세요.

응답 형식:
{
  "headline": "한 줄 요약 (이모지 포함, 20자 내외)",
  "description": "핵심 설명 (100자 내외)"
}
```

#### 재물운 (재백궁)

```
주어진 재백궁 데이터를 분석하여 이 사람의 재물운을 상세히 해석해주세요.

다음을 포함하세요:
1. 돈을 버는 방식과 적합한 분야
2. 재물 관리 성향
3. 투자/재테크 조언
4. 주의해야 할 점
5. 재물운이 좋아지는 시기나 조건

응답 형식:
{
  "title": "재물운",
  "content": "상세 해석 (300-500자)",
  "highlights": ["핵심 포인트 3-5개"]
}
```

#### 직업운 (관록궁)

```
주어진 관록궁 데이터를 분석하여 이 사람의 직업운을 상세히 해석해주세요.

다음을 포함하세요:
1. 적합한 직업/업종
2. 사회적 성취 가능성
3. 직장생활 vs 사업 적합성
4. 승진/성공 시기
5. 주의해야 할 점

응답 형식:
{
  "title": "직업운",
  "content": "상세 해석 (300-500자)",
  "highlights": ["핵심 포인트 3-5개"]
}
```

#### 인연운 (부처궁)

```
주어진 부처궁 데이터를 분석하여 이 사람의 인연운을 상세히 해석해주세요.

다음을 포함하세요:
1. 이상형과 만날 배우자의 특징
2. 연애 스타일
3. 결혼 시기와 조건
4. 결혼 생활 전망
5. 주의해야 할 점

응답 형식:
{
  "title": "인연운",
  "content": "상세 해석 (300-500자)",
  "highlights": ["핵심 포인트 3-5개"]
}
```

#### 건강운 (질액궁)

```
주어진 질액궁 데이터를 분석하여 이 사람의 건강운을 상세히 해석해주세요.

다음을 포함하세요:
1. 체질적 특성
2. 주의해야 할 신체 부위/질병
3. 건강 관리 조언
4. 스트레스 관리법
5. 장수/단명 여부 (완곡하게)

응답 형식:
{
  "title": "건강운",
  "content": "상세 해석 (300-500자)",
  "highlights": ["핵심 포인트 3-5개"]
}
```

#### 종합 총평

```
주어진 명반 전체 데이터를 종합하여 이 사람의 인생 총평을 작성해주세요.

다음을 포함하세요:
1. 타고난 팔자의 핵심 특징
2. 인생의 주요 흐름
3. 가장 큰 복과 가장 큰 시련
4. 인생에서 가장 중요한 조언

응답 형식:
{
  "summary": "종합 총평 (500-700자)"
}
```

---

## 7. AI 응답 처리

### 7.1. 응답 스키마 검증

```typescript
import { z } from "zod";

const PreviewResponseSchema = z.object({
  headline: z.string().max(30),
  description: z.string().max(150),
});

const SectionResponseSchema = z.object({
  title: z.string(),
  content: z.string().min(200).max(800),
  highlights: z.array(z.string()).min(3).max(5),
});

const SummaryResponseSchema = z.object({
  summary: z.string().min(400).max(1000),
});
```

### 7.2. 에러 핸들링

```typescript
const handleAIError = async (error: Error): Promise<FallbackResponse> => {
  // AI 응답 실패 시 기본 템플릿 응답 사용
  console.error("AI interpretation failed:", error);

  return {
    content: "현재 상세 분석을 준비 중입니다. 잠시 후 다시 시도해주세요.",
    highlights: ["분석 준비 중"],
    isFallback: true,
  };
};
```

### 7.3. 캐싱 전략

```typescript
// 동일한 명반 구조의 해석은 캐싱하여 비용 절감
const cacheKey = generateCacheKey({
  palaceName: targetPalace.name,
  mainStars: targetPalace.mainStars,
  sihua: chart.sihua,
});

const cachedResult = await cache.get(cacheKey);
if (cachedResult) {
  return cachedResult;
}
```

---

## 8. 최종 결과 구조

### 8.1. 결과 타입

```typescript
interface FortuneResult {
  // 미리보기 (무료)
  preview: {
    headline: string; // "👑 타고난 리더의 운명"
    description: string; // 명궁 핵심 설명
  };

  // 상세 분석 (유료)
  details: {
    summary: string; // 종합 총평
    wealth: FortuneSection;
    career: FortuneSection;
    relationship: FortuneSection;
    health: FortuneSection;
  };

  // 메타 정보
  meta: {
    generatedAt: string;
    modelVersion: string;
    confidence: number; // AI 응답 신뢰도
  };
}

interface FortuneSection {
  title: string;
  content: string;
  highlights: string[];
}
```

### 8.2. 미리보기 vs 유료 결과 분리

```typescript
const generateFortuneResult = async (
  chart: ZiweiChart,
  isPaid: boolean
): Promise<FortuneResult> => {
  // 미리보기는 항상 생성
  const preview = await generatePreview(chart);

  if (!isPaid) {
    return {
      preview,
      details: null, // 유료 결제 후 열람 가능
      meta: { ... },
    };
  }

  // 유료 결제 시 전체 분석
  const [wealth, career, relationship, health, summary] = await Promise.all([
    analyzeWealth(chart),
    analyzeCareer(chart),
    analyzeRelationship(chart),
    analyzeHealth(chart),
    generateSummary(chart),
  ]);

  return {
    preview,
    details: { summary, wealth, career, relationship, health },
    meta: { ... },
  };
};
```

---

## 9. 테스트 케이스

### 9.1. 명반 계산 검증

```typescript
describe("자미두수 명반 계산", () => {
  it("1990년 5월 15일 오시생 남성 명반 검증", () => {
    const chart = generateZiweiChart({
      name: "테스트",
      birthDate: "1990-05-15",
      birthTime: "12:00",
      gender: "male",
      calendarType: "solar",
    });

    // 음력 변환 확인 (1990-04-21)
    expect(chart.lunarBirthDate.month).toBe(4);
    expect(chart.lunarBirthDate.day).toBe(21);

    // 명궁 위치 확인
    // 월=4, 시=오(6) → (2+4-1-6+12)%12 = 11 = 해
    expect(chart.mingGong).toBe(11);

    // 오행국 확인
    expect([2, 3, 4, 5, 6]).toContain(chart.wuxingJu);
  });

  it("자시생과 해시생 구분 검증", () => {
    // 23:30 → 자시(0)
    expect(getTimeBranch(23, 30)).toBe(0);

    // 00:30 → 자시(0)
    expect(getTimeBranch(0, 30)).toBe(0);

    // 21:30 → 해시(11)
    expect(getTimeBranch(21, 30)).toBe(11);
  });
});
```

### 9.2. AI 해석 응답 검증

```typescript
describe("AI 해석 응답", () => {
  it("미리보기 응답 스키마 검증", async () => {
    const response = await generatePreview(mockChart);

    expect(response.headline).toBeDefined();
    expect(response.headline.length).toBeLessThanOrEqual(30);
    expect(response.description).toBeDefined();
    expect(response.description.length).toBeLessThanOrEqual(150);
  });

  it("섹션 응답 스키마 검증", async () => {
    const response = await analyzeWealth(mockChart);

    expect(response.title).toBe("재물운");
    expect(response.content.length).toBeGreaterThanOrEqual(200);
    expect(response.highlights).toHaveLength(expect.any(Number));
    expect(response.highlights.length).toBeGreaterThanOrEqual(3);
  });

  it("AI 오류 시 폴백 응답 확인", async () => {
    // AI 서비스 모킹
    jest
      .spyOn(aiService, "interpret")
      .mockRejectedValue(new Error("API Error"));

    const response = await analyzeWealth(mockChart);

    expect(response.isFallback).toBe(true);
    expect(response.content).toContain("준비 중");
  });
});
```

---

## 10. 구현 시 주의사항

### 10.1. 음력 변환 정확성

- 검증된 음력 변환 라이브러리 사용 필수
- 윤달 처리 정확히 할 것
- 테스트 데이터로 교차 검증

### 10.2. 시간 경계 처리

- 자시(子時)는 23:00~00:59
- 조자시(早子時, 23:00~23:59)와 야자시(夜子時, 00:00~00:59) 구분이 필요한 유파도 있으나, 삼합파에서는 통합 처리

### 10.3. 성별에 따른 차이

- 대운 순행/역행이 성별에 따라 다름 (본 서비스에서는 대운 미사용)
- AI 해석 시 성별 정보를 포함하여 맞춤형 해석 제공

### 10.4. AI 응답 품질 관리

- 응답 스키마 검증 필수
- JSON 파싱 실패 시 재시도 로직 구현
- 부적절한 내용 필터링 (비속어, 지나친 부정적 표현)
- 응답 일관성을 위한 temperature 조절 (0.7 권장)

### 10.5. 비용 최적화

- 동일 명반 구조의 해석은 캐싱 (24시간)
- 미리보기와 상세 분석 분리하여 필요 시에만 상세 분석 호출
- 토큰 사용량 모니터링

### 10.6. 에러 핸들링

- AI 서비스 장애 시 기본 템플릿 응답 제공
- 타임아웃 설정 (10초)
- 재시도 로직 (최대 2회)

---

## 11. 라이브러리 의존성

```json
{
  "dependencies": {
    "korean-lunar-calendar": "^0.3.x",
    "dayjs": "^1.11.x",
    "zod": "^3.x"
  }
}
```

### AI 서비스 설정 (Upstage solar-pro)

```typescript
// libs/services/ai/upstage.ts
const UPSTAGE_CONFIG = {
  baseUrl: "https://api.upstage.ai/v1/solar",
  model: "solar-pro",
  maxTokens: 2000,
  temperature: 0.7,
  timeout: 10000,
};
```

---

## 12. 추후 확장 고려사항

- [ ] 대운/유년 분석 추가
- [ ] 궁합 분석 기능
- [ ] 명반 시각화 (차트 이미지 생성)
- [ ] AI 모델 파인튜닝 (자미두수 전용)
- [ ] 사용자 피드백 기반 해석 품질 개선
- [ ] A/B 테스트를 통한 프롬프트 최적화
- [ ] 다국어 지원 (영어, 중국어)
