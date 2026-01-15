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

## 6. 결과 해석 알고리즘

### 6.1. 해석 원칙

1. **주성 우선:** 각 궁의 주성이 가장 중요
2. **밝기 고려:** 묘/왕은 긍정적, 함/평은 부정적
3. **사화 영향:** 화록/화권/화과는 긍정, 화기는 주의
4. **살성 영향:** 화성/영성/양인/타라 등은 부정적 요소
5. **보좌성 영향:** 좌보/우필/문창/문곡 등은 긍정적 요소

### 6.2. 궁별 해석 데이터

```typescript
interface PalaceInterpretation {
  palace: string;
  mainStarTexts: Record<string, StarInterpretation>;
}

interface StarInterpretation {
  base: string; // 기본 해석
  bright: string; // 묘/왕일 때 추가
  dark: string; // 함/평일 때 추가
  withHualu: string; // 화록 붙었을 때
  withHuaji: string; // 화기 붙었을 때
  withSha: string; // 살성과 동궁일 때
}
```

### 6.3. 명궁 해석 예시

```typescript
const MING_GONG_INTERPRETATIONS: Record<string, Record<Brightness, string>> = {
  자미: {
    묘: "당신은 타고난 황제 기질! 리더십이 넘치고 카리스마가 철철 흘러요. 남 눈치 볼 필요 없이 당당하게 밀어붙이면 다 따라와요.",
    왕: "리더 기질이 확실해요. 조직에서 자연스럽게 높은 자리로 올라가는 타입이에요.",
    득: "나름 존재감 있고, 주변에서 인정받는 편이에요. 단, 너무 잘난 척하면 역효과!",
    리: "리더 기질은 있는데 좀 부족해요. 겸손하게 실력 쌓으면 빛을 볼 수 있어요.",
    평: "평범한 성격이지만, 묵묵히 자기 할 일 하는 타입이에요.",
    함: "욕심은 많은데 실행력이 부족할 수 있어요. 작은 것부터 차근차근!",
  },
  천기: {
    묘: "머리가 비상해요! 두뇌 회전이 빨라서 뭘 해도 금방 익혀요. 전략가, 참모형 인재!",
    왕: "똑똑하고 눈치도 빨라요. 복잡한 상황에서 최적의 해결책을 찾아내는 능력자.",
    // ... 계속
  },
  태양: {
    묘: "에너지가 넘쳐요! 밝고 활동적이라 어딜 가든 분위기 메이커. 사람들이 당신 주변으로 모여요.",
    왕: "긍정 에너지 뿜뿜! 어려운 일도 웃으면서 해결하는 낙천가예요.",
    // ... 계속
  },
  // ... 14주성 모두 정의
};
```

### 6.4. 재백궁(재물운) 해석 예시

```typescript
const CAIBAI_INTERPRETATIONS: Record<string, Record<Brightness, string>> = {
  무곡: {
    묘: "금융/재테크의 달인이 될 팔자! 돈 냄새 잘 맡고, 투자하면 대박 칠 확률 높아요. 부동산, 주식 적극 고려해 보세요.",
    왕: "재물 복이 확실해요. 열심히 일하면 돈이 따라와요. 저축보다 투자가 맞는 스타일!",
    함: "돈은 들어오는데 새는 구멍도 많아요. 재테크보단 본업에 집중하는 게 나을 수도.",
    // ...
  },
  태음: {
    묘: "부동산 복이 대박! 땅, 건물 관련해서 큰 재물이 들어올 수 있어요. 현금보다 자산을 모으세요.",
    함: "돈 관리에 신경 써야 해요. 충동 구매 주의! 부동산은 신중하게 접근.",
    // ...
  },
  탐랑: {
    묘: "재물운이 좋지만 욕심 부리면 탈나요. 예술/엔터/유흥업 쪽에서 돈 벌 기회 많아요.",
    // ...
  },
  // ... 14주성 모두 정의
};
```

### 6.5. 부처궁(연애/결혼운) 해석 예시

```typescript
const FUQI_INTERPRETATIONS: Record<string, Record<Brightness, string>> = {
  천부: {
    묘: "배우자 복 터졌어요! 능력 있고 자상한 짝 만나요. 안정적이고 화목한 가정 보장!",
    함: "배우자가 잔소리꾼일 수 있어요. 서로 간섭 줄이면 원만해져요.",
    // ...
  },
  태음: {
    묘: "로맨틱한 연애 후 결혼! 배우자가 당신을 아껴주고 내조/외조 잘해요.",
    // ...
  },
  염정: {
    묘: "연애는 불같이 뜨겁고 결혼 생활은 파란만장할 수 있어요. 질투와 집착 주의!",
    함: "연애 복이 좀 꼬여있어요. 급하게 결혼하면 후회할 수도. 신중하게!",
    // ...
  },
  // ... 14주성 모두 정의
};
```

### 6.6. 관록궁(직업운) 해석 예시

```typescript
const GUANLU_INTERPRETATIONS: Record<string, Record<Brightness, string>> = {
  자미: {
    묘: "사장님 팔자! CEO, 임원급으로 올라갈 운명이에요. 남 밑에서 일하면 답답해서 못 버텨요.",
    왕: "조직에서 리더 역할이 딱이에요. 관리직, 공무원 고위직도 잘 맞아요.",
    // ...
  },
  태양: {
    묘: "공직, 정치, 교육계에서 크게 빛날 수 있어요. 대중 앞에 서는 일이 천직!",
    // ...
  },
  거문: {
    묘: "말로 먹고 사는 직업 추천! 변호사, 강사, 컨설턴트, 방송인 등이 딱이에요.",
    // ...
  },
  // ... 14주성 모두 정의
};
```

### 6.7. 질액궁(건강운) 해석 예시

```typescript
const JIYE_INTERPRETATIONS: Record<string, Record<Brightness, string>> = {
  천동: {
    묘: "기본 체력은 좋은 편! 다만 게으름 피우면 살찌기 쉬워요. 규칙적인 운동 필수!",
    함: "비뇨기, 생식기 쪽 주의. 스트레스 받으면 몸이 먼저 반응해요.",
    // ...
  },
  염정: {
    함: "심장, 혈관 쪽 조심! 화나면 혈압 팍 올라가는 타입. 화 다스리는 연습 필요.",
    // ...
  },
  파군: {
    함: "사고나 수술 암시가 있어요. 위험한 레저, 과격한 운동은 피하세요.",
    // ...
  },
  // ... 14주성 모두 정의
};
```

---

## 7. 결과 생성 로직

### 7.1. 최종 결과 생성

```typescript
interface FortuneResult {
  summary: string; // 총평 한 줄 요약
  preview: {
    summary: string; // 미리보기용 명궁 요약
    description: string; // 미리보기용 명궁 상세
  };
  wealth: FortuneSection;
  career: FortuneSection;
  relationship: FortuneSection;
  health: FortuneSection;
}

interface FortuneSection {
  title: string;
  content: string;
  highlights: string[];
}

const generateFortuneResult = (chart: ZiweiChart): FortuneResult => {
  // 1. 명궁 분석 (미리보기 + 본성)
  const mingAnalysis = analyzePalace(chart, "명궁");

  // 2. 재백궁 분석 (재물운)
  const wealthAnalysis = analyzePalace(chart, "재백궁");

  // 3. 관록궁 분석 (직업운)
  const careerAnalysis = analyzePalace(chart, "관록궁");

  // 4. 부처궁 분석 (연애/결혼운)
  const relationshipAnalysis = analyzePalace(chart, "부처궁");

  // 5. 질액궁 분석 (건강운)
  const healthAnalysis = analyzePalace(chart, "질액궁");

  // 6. 총평 생성
  const summary = generateSummary(chart, {
    ming: mingAnalysis,
    wealth: wealthAnalysis,
    career: careerAnalysis,
  });

  return {
    summary,
    preview: {
      summary: mingAnalysis.headline,
      description: mingAnalysis.shortDescription,
    },
    wealth: {
      title: "재물운",
      content: wealthAnalysis.fullText,
      highlights: wealthAnalysis.highlights,
    },
    career: {
      title: "직업운",
      content: careerAnalysis.fullText,
      highlights: careerAnalysis.highlights,
    },
    relationship: {
      title: "연애/결혼운",
      content: relationshipAnalysis.fullText,
      highlights: relationshipAnalysis.highlights,
    },
    health: {
      title: "건강/기타",
      content: healthAnalysis.fullText,
      highlights: healthAnalysis.highlights,
    },
  };
};
```

### 7.2. 총평 생성 로직

```typescript
const generateSummary = (
  chart: ZiweiChart,
  analyses: AnalysisResults
): string => {
  const patterns: string[] = [];

  // 패턴 1: 초년고생 말년안락
  if (isEarlyStruggleLateSuccess(chart)) {
    patterns.push("초년엔 고생하나 말년엔 건물주 될 팔자");
  }

  // 패턴 2: 재물복
  if (hasStrongWealthLuck(chart)) {
    patterns.push("평생 돈 걱정 없이 살 팔자");
  }

  // 패턴 3: 리더형
  if (isLeaderType(chart)) {
    patterns.push("남 밑에서 일 못 하는 사장님 팔자");
  }

  // 패턴 4: 예술가형
  if (isArtisticType(chart)) {
    patterns.push("예술적 감각으로 먹고 살 팔자");
  }

  // 여러 패턴 조합
  return patterns.length > 0
    ? patterns.join(", ")
    : "평범해 보이지만 숨은 복이 있는 팔자";
};
```

---

## 8. 미리보기 데이터 생성

### 8.1. 무료 공개 부분 (명궁 분석)

```typescript
const generatePreview = (chart: ZiweiChart): PreviewData => {
  const mingPalace = chart.palaces.find((p) => p.name === "명궁");
  const mainStar = mingPalace?.mainStars[0];

  if (!mainStar) {
    return {
      summary: "복잡한 내면을 가진 당신",
      description:
        "여러 성향이 섞여 있어 단순히 정의하기 어려워요. 상황에 따라 다양한 모습을 보여주는 타입!",
    };
  }

  const interpretation =
    MING_GONG_INTERPRETATIONS[mainStar.name]?.[mainStar.brightness];

  // 이모지 추가
  const emoji = getStarEmoji(mainStar.name);

  return {
    summary: `${emoji} ${getHeadline(mainStar.name, mainStar.brightness)}`,
    description: interpretation,
  };
};

const getStarEmoji = (star: string): string => {
  const emojis: Record<string, string> = {
    자미: "👑",
    천기: "🧠",
    태양: "☀️",
    무곡: "💰",
    천동: "😊",
    염정: "🔥",
    천부: "🏦",
    태음: "🌙",
    탐랑: "🎭",
    거문: "👄",
    천상: "🎀",
    천량: "📚",
    칠살: "⚔️",
    파군: "💥",
  };
  return emojis[star] || "✨";
};
```

### 8.2. 블러 처리 티저

```typescript
const generateLockedTeaser = (chart: ZiweiChart): LockedQuestion[] => {
  return [
    {
      question: "평생 만질 돈의 그릇은?",
      teaser: `당신의 재물 창고에는 💰 [잠겨있음] 정도가 들어있습니다.`,
    },
    {
      question: "인생 최대의 전성기는?",
      teaser: `지금 힘들다면 버티세요. [잠겨있음]세 부터 인생 역전이 시작됩니다.`,
    },
  ];
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
- 일부 해석 텍스트는 성별 맞춤 필요

### 10.4. 결과 캐싱

- 동일 생년월일시 + 성별의 명반은 항상 동일
- 명반 계산 결과 캐싱으로 성능 최적화 가능

---

## 11. 라이브러리 의존성

```json
{
  "dependencies": {
    "korean-lunar-calendar": "^0.3.x",
    "dayjs": "^1.11.x"
  }
}
```

---

## 12. 추후 확장 고려사항

- [ ] 대운/유년 분석 추가
- [ ] 궁합 분석 기능
- [ ] 명반 시각화 (차트 이미지 생성)
- [ ] 더 세밀한 해석 텍스트 DB 구축
- [ ] A/B 테스트를 통한 해석 문구 최적화
