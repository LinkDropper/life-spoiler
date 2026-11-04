import {
  NORMAL_AMOUNT_KRW,
  NORMAL_AMOUNT_USD,
} from "@/libs/services/payment/first-payment-event";
import { ORGANIZATION, SITE_URL, buildLocalizedUrl } from "@/libs/seo/site";

/**
 * /llms.txt — LLM·AI 에이전트용 사이트 요약 (llmstxt.org 제안 형식).
 *
 * Google은 이 파일을 쓰지 않는다고 밝혔고 주요 AI 봇 문서도 언급하지 않는다.
 * 사용자 대행 페처(ChatGPT-User, Claude-User 등)가 사이트 맥락을 한 번에 읽을 수 있게
 * 두는 저비용 보조 수단이다. 내용은 실제 페이지에 보이는 정보와 일치해야 하므로
 * 랜딩·FAQ·가격이 바뀌면 함께 갱신한다.
 */
export const dynamic = "force-static";

const formatKrw = (amount: number): string =>
  `${amount.toLocaleString("ko-KR")}원`;

const { address } = ORGANIZATION;

const BODY = `# 인생스포 (Life Spoiler)

> 자미두수(紫微斗數)로 인생의 흐름을 미리 보여주는 운세 서비스입니다.
> 생년월일, 태어난 시간, 성별로 명반(12궁에 별을 배치한 차트)을 만들고 AI가 해석합니다.
> 재미로 보는 운세이며 의료·법률·투자 판단을 대신하지 않습니다.

## 서비스 요약

- 서비스명: 인생스포 (영문 Life Spoiler, 일문 ライフスポイラー)
- 분석 체계: 자미두수. 12개 궁에 14개 주성과 보조성을 배치해 분석하며, 같은 생년월일이어도 태어난 시간에 따라 결과가 달라집니다.
- 입력값: 생년월일(양력·음력), 태어난 시간(몰라도 이용 가능), 성별
- 지원 언어: 한국어, English, 日本語
- 로그인: Google, Kakao

## 서비스와 가격

- 인생 운세: 명반과 예고편은 무료로 먼저 볼 수 있고, 본편은 ${formatKrw(NORMAL_AMOUNT_KRW)}(해외 결제 $${NORMAL_AMOUNT_USD})입니다. 본편에는 타고난 기질과 인생의 큰 줄거리를 정리한 총평, 12궁 명반 풀이, 재물·직업·인연·건강 패턴, 99세까지 10년 단위 대운 시나리오가 담깁니다.
- 올해 운세: 올해의 핵심 시나리오와 재물·커리어·인간관계·건강 점수를 보여줍니다.
- 궁합: 두 사람의 소통 방식, 성장 시너지, 신뢰 지수, 위기 극복력 4가지 지표로 분석합니다.
- 오늘의 운세(한국어): 내 명반과 오늘의 일진으로 매일 달라지는 운세를 무료로 보여줍니다. 한국 시간 자정에 바뀝니다.
- 나만의 별자리 만들기: 로그인 없이 무료로 내 우주를 만들고, 링크로 친구를 초대해 별자리 궁합을 봅니다.
- 관상스포: 정면 사진 한 장으로 받는 AI 관상 리포트입니다. 부위별 관상과 동물상 예고편은 무료, 본편 리포트는 ${formatKrw(NORMAL_AMOUNT_KRW)}입니다. 업로드한 사진은 분석 직후 삭제되며 서버에 저장되지 않습니다.

## 자주 묻는 질문

- 자미두수와 사주는 무엇이 다른가요? 사주는 여덟 글자로 분석하고, 자미두수는 12개 궁에 배치된 별의 조합으로 분석합니다. 그래서 태어난 시간이 결과에 크게 영향을 줍니다.
- 태어난 시간을 모르면? 이용할 수 있습니다. 시간 정보가 있으면 별의 배치가 더 정확해집니다.
- 결과를 믿어도 되나요? 전통 이론과 AI 해석을 결합한 참고용 콘텐츠입니다. 중요한 결정은 본인의 판단을 우선해 주세요.
- 환불이 되나요? 디지털 콘텐츠 특성상 결과 확인 후에는 환불이 어렵습니다. 시스템 오류로 결과가 생성되지 않으면 전액 환불됩니다.

## 주요 페이지

- [홈](${buildLocalizedUrl("/", "ko")}): 서비스 소개, 예시 명반, 가격, FAQ
- [자미두수란?](${buildLocalizedUrl("/ziwei-doushu", "ko")}): 자미두수의 뜻, 역사, 명반 구조, 사주와의 차이
- [오늘의 운세](${buildLocalizedUrl("/daily", "ko")}): 무료 오늘의 운세 안내
- [관상스포](${buildLocalizedUrl("/face-spoiler", "ko")}): AI 관상 리포트
- [나만의 별자리 만들기](${buildLocalizedUrl("/universe/create", "ko")})
- [이용약관](${buildLocalizedUrl("/policy/terms", "ko")})
- [개인정보 처리방침](${buildLocalizedUrl("/policy/privacy", "ko")})

## 운영사

- 상호: ${ORGANIZATION.legalName}
- 소재지: ${address.addressRegion} ${address.addressLocality} ${address.streetAddress}
- 문의: ${ORGANIZATION.email}

## English

Life Spoiler (인생스포) is a fortune-telling web service based on Zi Wei Dou Shu (紫微斗數), a traditional East Asian astrology system. From your birth date, birth time and gender it builds a chart that places stars across 12 palaces, and an AI writes the reading. The chart and a preview are free; the full lifetime reading is $${NORMAL_AMOUNT_USD} and covers your innate temperament, all 12 palaces, wealth, career, relationships, health, and 10-year luck cycles up to age 99. Yearly readings, compatibility, a free friend-constellation feature and Face Spoiler (an AI face reading from one photo) are also available. Readings are for entertainment, not medical, legal or financial advice.

- English site: ${buildLocalizedUrl("/", "en")}
- What is Zi Wei Dou Shu: ${buildLocalizedUrl("/ziwei-doushu", "en")}
- Face Spoiler: ${buildLocalizedUrl("/face-spoiler", "en")}
- Japanese site: ${buildLocalizedUrl("/", "ja")}
- Main site: ${SITE_URL}
`;

export const GET = (): Response =>
  new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
