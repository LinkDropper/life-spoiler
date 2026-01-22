# Google Analytics 설정 가이드

## 개요

이 프로젝트는 Google Analytics 4(GA4)를 사용하여 다음 두 가지만 측정합니다:

1. **페이지뷰**: 서비스에 접속한 사용자
2. **결제 완료**: 결제를 완료한 사용자

이를 통해 **전환율(방문자 대비 결제율)**을 측정할 수 있습니다.

## 설정 방법

### 1. Google Analytics 4 계정 생성

1. [Google Analytics](https://analytics.google.com/) 접속
2. "측정 시작" 클릭
3. 계정 이름 입력 (예: "인생스포")
4. 속성 생성
   - 속성 이름: "인생스포 웹사이트"
   - 시간대: "대한민국"
   - 통화: "대한민국 원(₩)"
5. 비즈니스 정보 입력
6. 데이터 스트림 생성
   - 플랫폼: "웹"
   - 웹사이트 URL: `https://life-spoiler.com`
   - 스트림 이름: "Life Spoiler Web"
7. **측정 ID(G-XXXXXXXXXX)** 복사

### 2. 환경 변수 설정

`.env.local` 파일에 측정 ID 추가:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. 배포

환경 변수를 설정한 후 프로덕션에 배포하면 자동으로 활성화됩니다.

**참고**: 개발 환경(`NODE_ENV=development`)에서는 GA가 비활성화되며, 콘솔에 디버그 메시지만 표시됩니다.

## 측정 이벤트

### 1. 페이지뷰 (자동)

모든 페이지 방문이 자동으로 추적됩니다.

```typescript
// 자동으로 실행됨 (수동 호출 불필요)
gtag('config', 'G-XXXXXXXXXX', {
  page_path: '/current-page'
});
```

### 2. 결제 완료 (수동)

결제 성공 페이지(`/payment/success`)에서 자동으로 전송됩니다.

```typescript
trackPurchase({
  transaction_id: "order_123",
  value: 990,
  currency: "KRW",
  items: [
    {
      item_id: "yearly" | "lifetime",
      item_name: "올해 운세 스포일러" | "인생 운세 스포일러",
      price: 990,
      quantity: 1,
    },
  ],
});
```

## GA4 대시보드에서 확인하기

### 전환율 확인

1. GA4 대시보드 → **보고서** → **수익 창출** → **전자상거래 구매**
2. 주요 지표:
   - **세션 수**: 전체 방문자
   - **구매 이벤트 수**: 결제 완료 수
   - **전환율**: (구매 / 세션) × 100%
   - **총 수익**: 결제 금액 합계

### 맞춤 보고서 만들기

1. **탐색** 메뉴 → **자유 형식**
2. 측정기준 추가:
   - `item_id` (yearly/lifetime 구분)
   - `페이지 경로`
3. 측정항목 추가:
   - `세션 수`
   - `구매 수`
   - `총 수익`

## 디버깅

### 개발 환경에서 테스트

개발 환경에서는 실제 GA로 전송되지 않고 콘솔에만 출력됩니다:

```bash
# 브라우저 콘솔
[GA Debug] Page view: /payment/yearly/123
[GA Debug] Purchase event: { transaction_id: "...", value: 990, ... }
```

### 프로덕션 환경에서 확인

1. **GA4 실시간 보고서** 확인
   - GA4 대시보드 → **보고서** → **실시간**
2. **DebugView 사용**
   - Chrome 확장 프로그램: "Google Analytics Debugger" 설치
   - 확장 프로그램 활성화 후 사이트 방문
   - GA4 → **관리** → **DebugView**에서 이벤트 실시간 확인

## 파일 구조

```
libs/analytics/
  ├── google-analytics.ts    # GA 유틸리티 함수
  ├── index.ts               # Export
  └── README.md              # 이 문서

components/
  └── GoogleAnalytics.tsx    # GA 스크립트 컴포넌트

app/
  ├── layout.tsx             # GA 스크립트 로드
  └── payment/success/page.tsx  # 결제 이벤트 전송
```

## API

### `trackPageView(url: string)`

페이지뷰를 수동으로 추적합니다. (일반적으로 자동 추적되므로 호출 불필요)

### `trackPurchase(params: PurchaseParams)`

결제 완료 이벤트를 전송합니다.

**Parameters:**

```typescript
interface PurchaseParams {
  transaction_id: string;    // 주문 번호
  value: number;             // 결제 금액
  currency: string;          // 통화 (KRW)
  items: Array<{
    item_id: string;         // 상품 ID (yearly/lifetime)
    item_name: string;       // 상품명
    price: number;           // 가격
    quantity: number;        // 수량
  }>;
}
```

### `isGAEnabled(): boolean`

GA가 활성화되어 있는지 확인합니다.

- ✅ 프로덕션 환경
- ✅ `NEXT_PUBLIC_GA_MEASUREMENT_ID` 설정됨
- ✅ 브라우저 환경
- ✅ `gtag` 함수 로드됨

## 주의사항

1. **프라이버시**: 최소한의 데이터만 수집 (페이지뷰 + 결제)
2. **개인정보 보호**: 사용자 이름, 이메일 등 개인정보는 전송하지 않음
3. **GDPR/개인정보보호법**: 필요시 쿠키 동의 배너 추가 권장

## 문제 해결

### GA 데이터가 표시되지 않음

1. 환경 변수 확인: `NEXT_PUBLIC_GA_MEASUREMENT_ID`가 올바른지 확인
2. 프로덕션 배포 확인: 개발 환경에서는 GA가 비활성화됨
3. 실시간 보고서 확인: 데이터가 대시보드에 표시되기까지 24-48시간 소요
4. 광고 차단기 확인: 광고 차단 확장 프로그램이 GA를 차단할 수 있음

### 결제 이벤트가 전송되지 않음

1. 결제 성공 페이지 확인: `/payment/success`에서만 전송됨
2. URL 파라미터 확인: `orderId`, `amount`, `fortuneType`이 필요
3. 콘솔 확인: 개발 환경에서 디버그 메시지 확인
4. Network 탭 확인: `google-analytics.com/g/collect` 요청 확인

## 참고 자료

- [Google Analytics 4 공식 문서](https://support.google.com/analytics/answer/10089681)
- [GA4 전자상거래 이벤트](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Next.js Google Analytics 가이드](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
