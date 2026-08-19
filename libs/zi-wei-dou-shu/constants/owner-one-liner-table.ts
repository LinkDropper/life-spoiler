import type { BranchIndex, StemIndex, WuxingJu } from "../types";

import type { BrightnessGroup } from "./star-traits";
import { MAIN_STAR_NAMES, type MainStarName } from "./stars";

/**
 * 우주 주인(owner) 1인 운세 한줄평 — 결정론적 매트릭스
 *
 * `app/universe/[publicId]` 최상단(섹션 1)에 노출되는, owner 1인의 명반에서만
 * 파생되는 불변 한줄평이다. 2인 궁합 매트릭스(`friend-compatibility-table.ts`)와는
 * 축이 완전히 다른 별개 테이블이다.
 *
 * @설계원칙
 * 1. LLM 호출 없음. 모든 값은 이 파일의 상수 테이블에서만 나온다.
 * 2. 날짜 의존 금지. owner의 명반(생년월일시)에서만 파생되며, 조회 시점(오늘 날짜)은
 *    계산에 전혀 관여하지 않는다 — 링크 공유·스크린샷 시나리오상 불변이어야 한다.
 * 3. 생시를 역산 가능하게 하는 표현 금지 — 어떤 축도 시각(새벽/밤 등)을 언급하지 않는다.
 * 4. 자미두수 전문 용어(명궁, 주성 이름, 오행국, 화록 등)는 `ko` 표면 문구에 노출하지 않는다.
 *    내부 카테고리 키(별 이름, "wood/fire", "wj2" 등)는 문구 조합용 식별자일 뿐 화면에
 *    노출되지 않는다.
 * 5. owner 문구는 **독립된 2문장, 전체 45자 이내 헤드라인체**를 유지한다(실측
 *    최대 43자 — 기존 45자 상한을 그대로 지킨다). 같은 화면 섹션 4의 친구
 *    한줄평(2문장 50~70자 대화체)과는 여전히 톤이 다르지만(짧고 단정적),
 *    문장 "개수"는 대표 피드백에 따라 1문장에서 2문장으로 조정했다 —
 *    `@인과연결_제거_2026` 참고.
 *
 * @인과연결_제거_2026 도입절(페이스/오행)과 종결절(별 성격/띠)은 서로 다른 독립 축이라
 * full cartesian으로 조합되는데, 최초 버전(oo-1.1.0)은 두 절을 쉼표로 이어 "1문장"으로
 * 만들었다. 대표가 두 차례 반려했다:
 *   1차: 어미가 "-어서/-라서/-니"(인과)라 "실력이 늘어서, 겉은 잠잠해도 속마음은
 *        따뜻하네요"처럼 원인 없는 결과가 대량 생겼다 → "-는데"(배경/약한 대조)로 교체.
 *   2차: "-는데"로도 대표가 재반려했다 — "~했는데 이래보여도 ~해요"처럼 종결절이
 *        이미 자체 대조 구문("겉은 X해도")을 품고 있으면 도입절의 "-는데"와 겹쳐
 *        대조/양보가 한 문장에 두 겹으로 쌓여 문법적으로도 어색했고, 근본적으로는
 *        **어떤 연결어미를 골라도** 무관한 두 절을 이으면 "그래서 무슨 상관이지?"를
 *        피할 수 없다는 지적이었다. 단어 교체가 아니라 구조 자체의 문제였다.
 * 결론: 두 절 사이의 연결어미(쉼표+어미)를 완전히 없애고 **마침표로 문장을
 * 분리**했다 — 도입절이 그 자체로 완결된 문장(...요./...어요.)이 되어 종결절에
 * 아무 것도 "빚지지" 않는다. 마침표는 어떤 관계도 문법적으로 약속하지 않으므로
 * (쉼표+연결어미는 아무리 중립적인 것을 골라도 약한 관계 기대를 유발한다),
 * "두 개의 독립된 관찰을 나란히 진술한다"는 의도를 코드가 아니라 문장부호로
 * 강제한다. 문장 "개수"는 1개에서 2개로 바뀌었지만, 전체 글자수 상한(45자)은
 * 그대로 지켰다(실측 최대 43자) — 두 절 다 짧게 눌러 써서 헤드라인 성격을
 * 잃지 않았다. 문장 수 정책 변경은 CPO/CTO에 사후 보고 대상이다(`oo-1.1.0`에서
 * 문구만 바뀐 것이 아니라 "1문장" 원칙 자체가 바뀌었으므로).
 *
 * @2개의_독립_경로
 * - **exact** (생시 확정): 명궁 주성(14) × 그 별의 밝기군(3) × 오행국 페이스 키(6) = 252가지.
 *   묘왕득리평함(밝기) → bright/neutral/dark 3군으로 접어 `star-traits.ts`가 이미 검증한
 *   성격 뉘앙스를 그대로 재사용한다. 오행국(대운 시작 나이)은 "인생이 풀리는 속도"라는
 *   삼합파의 전통적 해석을 실제 오행국 값(2·3·4·5·6)에 대응하는 이미지로 번역했다.
 *   금4국(4)만 유일하게 실제 값이 하나뿐이라 페이스 도입절이 2종으로 갈라지지 않는데,
 *   연간(年干)의 음양(홀짝)이라는 **실제로 존재하는 또 다른 독립 정보**로 wj4a/wj4b
 *   두 갈래를 나눴다 — 임의의 동전 던지기가 아니라 이미 명반에 있는 값을 재사용한 것.
 *   별×밝기군×페이스는 서로 다른 계산 체인에서 나오는 독립 축이라(오행국이 어떤 값이든
 *   이론상 어느 별이든 명궁에 올 수 있다) 전체 조합을 그대로 다 채운다(full cartesian).
 *
 *   주의: **wj4a/wj4b는 wj2·wj3·wj5·wj6까지 확대하지 말 것.** 이 분할은 금4국에만
 *   해당하는 국소 예외다 — 실제 오행국 값이 4 하나뿐이라 도입절을 채울 다른 수가
 *   없어서 쓴 것이지, "오행국을 음양으로 갈라 쓰는" 일반 원칙이 아니다. wj2·wj3·
 *   wj5·wj6은 이미 각자 고유한 실제값이 있어 이 처방이 필요 없다.
 *   "그럼 나머지 4개도 똑같이 음양으로 갈라 fallback처럼 10종으로 만들면 대칭도
 *   맞고 다양성도 느니 좋지 않나"라는 제안이 실제로 나왔었다(2026-08 CPO 재검수).
 *   결론은 기각이었고 근거는 이렇다.
 *     1. **오행국은 연간 음양과 무관계다(독립을 넘어선다).** `getPalaceStem`의
 *        五虎遁 표가 연간을 mod5로만 그룹화한다(갑기→丙, 을경→戊, 병신→庚,
 *        정임→壬, 무계→甲) — 이 표 자체가 음간/양간을 구분하지 않으므로,
 *        같은 mod5 짝(예: 갑↔기)은 어떤 월·시진 조합이든 오행국이 항상 완전히
 *        같다. 실측: 월(12)×시진(12)×연간 mod5쌍(5) = 720가지 전수 비교에서
 *        불일치 0건. 오행국 계산식이 연간 음양을 애초에 "볼 수 없다".
 *     2. **기각 사유는 도달 가능성이 아니라 의미론이다.** wj2~wj6 × 양간/음간
 *        10조합은 전부 실제로 나오고 각 144/144로 완전 균등하다(fallback의
 *        60/120 절반 필터보다 오히려 더 깨끗하게 도달 가능). "도달 가능한지
 *        확인해봤더니 되던데?"는 이 기각을 뒤집는 근거가 되지 않는다 — 관계가
 *        없는 두 값을 억지로 엮으면 존재하지 않는 차이를 문구가 주장하게 될
 *        뿐이다(예: "wj2-양간이라 힘차게" vs "wj2-음간이라 차분히"는 오행국이
 *        실제로 그렇게 갈라지지 않으므로 근거 없는 서사가 된다).
 *     3. **fallback의 음양 분할과는 종류가 다르다.** fallback의 `wood-yang(갑)`
 *        vs `wood-yin(을)`은 연간이라는 축 그 자체의 실존하는 두 값을 가리킨다.
 *        exact의 `wj4a`/`wj4b`(그리고 확대했다면 나왔을 wj2a/wj2b 등)는 오행국과
 *        무관하다고 위에서 증명한 외부 축(연간 음양)을 장식으로 이어붙인 것이다.
 *        "두 경로가 같은 축(음양)을 쓴다"는 표면적 대칭성은 매력적이지만, 하나는
 *        축 자체의 실체이고 하나는 무관한 장식이라 같은 종류의 비대칭이 아니다.
 *        wj4a/wj4b조차 이 장식적 성격을 안고 있지만, 6종 하한을 채울 다른 축이
 *        없어 감수한 유일한 예외다 — 이 예외를 필요 없는 곳까지 넓히지 않는다.
 * - **fallback** (생시 미상): 연간 오행×음양(10) × 띠(12) = 60가지. 명궁·오행국은 시진
 *   없이는 확정되지 않으므로(명궁=f(월,시진) 체인), exact 축을 평균 내는 대신
 *   **애초에 시진을 전혀 쓰지 않는 별개의 축**으로 완전히 갈아탄다.
 *   연간 천간/지지는 시진과 무관하게 확정되므로 12개 시진 전수 열거가 필요 없고,
 *   이산 값(슬러그)을 평균 낼 수 없는 문제 자체가 발생하지 않는다.
 *   오행(5)만으로는 도입절이 5종뿐이라, 오행을 이루는 두 천간의 음양(예: 목=갑·을)
 *   으로 한 번 더 갈라 10종으로 늘렸다. 이는 60갑자 체계에 원래 있는 구분이라
 *   갑(양)은 항상 양지(자인진오신술)와만, 을(음)은 항상 음지(축묘사미유해)와만
 *   짝을 이룬다 — 그래서 "오행×음양(10) × 띠(12)"의 전체 곱(120)이 아니라
 *   실제로 존재하는 조합만(60) 채운다. 나머지 60은 애초에 어떤 생년으로도
 *   나올 수 없는 조합이라 표에 넣지 않는다(고아 아님 — 아예 존재하지 않는 간지).
 *
 * @append-only
 * 슬러그(`id`)는 한번 발급하면 삭제·재사용 금지. `ko` 문구는 조회 시점에 채워지므로
 * 오타 수정 등 워딩 개선은 자유롭게 하되(버전 bump 불필요), 슬러그가 가리키는
 * "의미 슬롯"을 바꾸지 않는다.
 *
 * @개정이력
 * - `oo-1.0.0`: 최초 릴리스. exact 126(별14×밝기3×페이스버킷3), fallback 60(오행5×띠12).
 * - `oo-1.1.0`: CPO 재검수 반영. (1) dark 밝기군 6개 별(자미·천기·무곡·거문·천량·칠살)의
 *   변별력 저하("겉으로 드러나지 않는다"류 단일 테마로 수렴) 재작성. (2) exact 페이스를
 *   버킷 3종(early/mid/late)에서 실제 오행국 값 기반 6종(wj2/wj3/wj4a/wj4b/wj5/wj6)으로,
 *   fallback 오행 도입절을 5종에서 음양 10종으로 세분화 — 두 경우 모두 "도입절이 너무
 *   적어 스크린샷을 나란히 두면 첫 구절이 반복된다"는 지적에 따른 것. (3) 띠 "용" 종결절의
 *   "배포"(사어에 가까운 한자어)를 "배짱"으로 교체. 원격 DB에 이 값이 저장된 적이 없어
 *   (마이그레이션 미적용) 슬러그 스키마를 자유롭게 재구성할 수 있는 시점에 정리했다.
 *   `calculateOwnerOneLiner`의 공개 시그니처(입력/출력 타입)는 이번 개정으로 바뀌지 않는다.
 *
 * @유파 삼합파(三合派)
 */

/**
 * 매트릭스 버전 — 축 구성(슬러그 스키마)을 바꿀 때만 올린다.
 * 문구(`ko`) 워딩만 다듬는 경우는 버전 bump 대상이 아니다
 * (`friend-compatibility-table.ts`와 동일한 정책 — `one-liner.ts` 참고).
 */
export const OWNER_ONE_LINER_MATRIX_VERSION = "oo-1.1.0";

// ============================================================
// exact 경로 — 축 1. 명궁 주성 (슬러그용 로마자 표기)
// ============================================================

export const OWNER_STAR_SLUG: Record<MainStarName, string> = {
  자미: "ziwei",
  천기: "cheongi",
  태양: "taeyang",
  무곡: "mugok",
  천동: "cheondong",
  염정: "yeomjeong",
  천부: "cheonbu",
  태음: "taeeum",
  탐랑: "tamrang",
  거문: "geomun",
  천상: "cheonsang",
  천량: "cheonryang",
  칠살: "chilsal",
  파군: "pagun",
};

/**
 * 명궁에 주성이 2개 이상 동궁할 때 대표 별을 고르는 우선순위.
 * `MAIN_STAR_NAMES` 선언 순서(자미계 먼저, 황제성인 자미가 최우선)를 그대로 쓴다.
 * 결정론적 tie-break일 뿐 별의 우열을 뜻하지 않는다.
 */
export const OWNER_STAR_PRIORITY: Record<MainStarName, number> =
  Object.fromEntries(
    MAIN_STAR_NAMES.map((name, index) => [name, index])
  ) as Record<MainStarName, number>;

/**
 * 명궁 주성 × 밝기군(bright/neutral/dark) 별 성격 한 줄.
 *
 * `star-traits.ts`의 `STAR_TRAITS[별][밝기군]` 키워드를 근거로 삼되,
 * "허세/인색/고립" 같은 dark 그룹의 날 선 표현은 그대로 옮기지 않았다 —
 * 이 헤드라인은 owner의 친구들에게도 그대로 노출되는 공개 문구라
 * 밝기군을 "좋다/나쁘다"가 아니라 "표현되는 결이 다르다"는 톤으로 번역했다.
 * (brand-voice: 존댓말, 금지 표현 없음, 이모지 없음, 별 이름 비노출)
 *
 * @dark열_재작성_2026 최초 버전은 dark 14개 중 10개가 "겉으로는 안 드러나지만
 * 속은 ~하다"는 단일 테마로 수렴해 별끼리 변별력이 없었다(CPO 지적). 자미·천기·
 * 무곡·거문·천량·칠살 6개를 "그 별의 성질이 숨는다"가 아니라 "다른 결로 표현된다"는
 * 방향으로 재작성했다 — 이미 잘 됐던 천동/탐랑/파군의 방식(그 별 고유의 행동 패턴을
 * 그대로 쓰되 톤만 낮춤)을 따랐다.
 *
 * @전수재검토_2026 (4차 개정) 대표가 "예시 하나만 보지 말고 여러 방면에서 보라"고
 * 지시해 `STAR_TRAITS`(성격 원본 데이터)와 42개 전부를 대조하며 재검토했다. 발견한
 * 문제 2종:
 * (1) **의미 반전** — 염정.dark("속으론 뜨거운데 티는 잘 안 내요")와 탐랑.dark
 *     ("낯을 가려도 친해지면 재밌어요")는 STAR_TRAITS 원본(염정 dark=감정 폭발/
 *     날카로운 말, 탐랑 dark=탐욕/충동적/깊은 교감 회피)과 **반대 방향**을 서술하고
 *     있었다 — "톤을 낮추다가" 다른 별의 "겉/속이 다르다" 테마를 잘못 재사용한
 *     것으로 보인다. 각 별 고유의 실제 방향(감정 기복이 격해짐/새 자극에 마음이
 *     쉽게 옮겨감)으로 재작성했다.
 * (2) **밝기군 간 변별력 부족** — 태양(neutral/dark), 천부(bright/neutral),
 *     천동(neutral/dark), 천량(bright/neutral)이 같은 별 안에서 서로 다른
 *     밝기군인데도 거의 같은 문장(둘 다 "흔들리지 않는다"류)이었다. STAR_TRAITS의
 *     밝기군별 키워드가 원래 다른데 문구가 그 차이를 못 살렸던 것 — 각 밝기군의
 *     고유 키워드(예: 천부 neutral의 "표면적 안정/체면", 천량 neutral의 "오지랖")를
 *     반영해 다시 갈랐다.
 * 이 외에 42개 중 42개(거문.bright)와 12띠 중 1개(ox)에서 **다른 별/띠와 완전히
 * 같은 문구 템플릿**("군더더기 없이 ~", "한번 ~하면 끝까지 ~해요")을 그대로 쓰고
 * 있어 변별력을 해쳤다 — 각각 다른 표현으로 교체했다. 수정 총 11건, 상세는
 * git 이력 및 team-lead 보고 참고.
 */
export const OWNER_STAR_CLOSING: Record<
  MainStarName,
  Record<BrightnessGroup, string>
> = {
  자미: {
    bright: "한번 맡으면 중심을 딱 잡아줘요.",
    neutral: "은근슬쩍 분위기를 자기 쪽으로 잡아가요.",
    dark: "내 방식대로일 때 제일 힘을 내요.",
  },
  천기: {
    bright: "머릿속으로 미리 다 그려보고 움직여요.",
    neutral: "생각이 많아서 그만큼 꼼꼼해요.",
    dark: "안 좋은 쪽으로 자꾸 마음이 기울어요.",
  },
  태양: {
    bright: "가만히 있어도 주변이 저절로 환해져요.",
    neutral: "분위기는 잘 띄우지만 오래가진 않아요.",
    dark: "겉은 차가워 보여도 속마음은 따뜻해요.",
  },
  무곡: {
    bright: "말보다 행동으로 결과를 보여줘요.",
    neutral: "군더더기 없이 딱 필요한 것만 해요.",
    dark: "손해 볼 일엔 절대 먼저 나서지 않아요.",
  },
  천동: {
    bright: "같이 있으면 이상하게 마음이 편해져요.",
    neutral: "큰 결정은 주로 다른 사람한테 맡기는 편이에요.",
    dark: "먼저 움직이기보다는 그냥 흘러가는 대로 둬요.",
  },
  염정: {
    bright: "함께 있으면 분위기가 확 살아나요.",
    neutral: "은근히 매력으로 사람을 끌어당겨요.",
    dark: "감정이 욱 올라오면 말이 좀 세게 나가요.",
  },
  천부: {
    bright: "흔들려도 결국 제자리를 지켜내요.",
    neutral: "겉으로 흐트러진 모습은 잘 안 보여줘요.",
    dark: "조용해 보여도 속은 누구보다 단단해요.",
  },
  태음: {
    bright: "말 안 해도 마음을 먼저 알아차려요.",
    neutral: "속마음을 겉으로 잘 안 꺼내요.",
    dark: "혼자 조용히 마음을 정리하고 넘어가요.",
  },
  탐랑: {
    bright: "어딜 가든 금방 사람들과 친해져요.",
    neutral: "관심사가 많아서 하고 싶은 게 늘 넘쳐요.",
    dark: "새로운 자극을 좇느라 마음이 자주 바뀌어요.",
  },
  거문: {
    bright: "질문 몇 개로 핵심을 바로 찾아내요.",
    neutral: "궁금한 게 생기면 끝까지 파고들어요.",
    dark: "듣기 싫은 말도 할 말은 다 하고 넘어가요.",
  },
  천상: {
    bright: "옆에서 묵묵히 힘이 되어줘요.",
    neutral: "다들 편한 쪽으로 웬만하면 맞춰줘요.",
    dark: "티는 안 내지만 뒤에서 다 챙겨줘요.",
  },
  천량: {
    bright: "고민 있을 땐 가장 먼저 떠올라요.",
    neutral: "물어보지 않아도 이것저것 챙겨줘요.",
    dark: "현실보다 원칙을 먼저 따져요.",
  },
  칠살: {
    bright: "결정은 한번 하면 절대 안 뒤집어요.",
    neutral: "혼자 해도 웬만하면 다 해내고 말아요.",
    dark: "한번 아니다 싶으면 뒤도 안 돌아봐요.",
  },
  파군: {
    bright: "판을 새로 짜는 걸 두려워하지 않아요.",
    neutral: "익숙한 것보다 새로운 걸 먼저 시도해요.",
    dark: "조용히 있다가도 한번씩 크게 저질러요.",
  },
};

// ============================================================
// exact 경로 — 축 2. 오행국(五行局) 페이스
// ============================================================

/**
 * 오행국 페이스 키. 실제 오행국 값(2·3·5·6)은 그대로 쓰고,
 * 값이 하나뿐인 금4국만 연간(年干) 음양으로 한 번 더 갈라 6종을 만든다.
 */
export type OwnerPaceKey = "wj2" | "wj3" | "wj4a" | "wj4b" | "wj5" | "wj6";

/**
 * 오행국(대운 시작 나이) + (금4국일 때만) 연간 음양 → 페이스 키.
 * 숫자가 작을수록 대운이 일찍 시작된다는 것 외에 다른 함의는 없어
 * "속도감"이라는 대중적 비유로만 쓴다(적중률 주장 아님).
 */
export const derivePaceKey = (
  wuxingJu: WuxingJu,
  yearStem: StemIndex
): OwnerPaceKey => {
  if (wuxingJu !== 4) {
    return `wj${wuxingJu}` as OwnerPaceKey;
  }
  // 갑병무경임(짝수 인덱스)=양간, 을정기신계(홀수 인덱스)=음간
  return yearStem % 2 === 0 ? "wj4a" : "wj4b";
};

/**
 * @꼬리분산_2026 최초 버전은 6종 중 5종이 "~편이라,"로 끝나 개수만 늘었을 뿐
 * 첫 구절이 여전히 같은 틀로 읽혔다(CPO 지적). fallback의 "기운을 타고나서/
 * 성향을 타고나서/기질을 타고나서" 3갈래 처리와 같은 방식으로, 마지막 연결
 * 어구를 서로 다른 단어로 흩었다(타서/자라면서/편이라×2/늘어서/빛나니 — 5종).
 *
 * @인과연결_제거_2026 (2차 개정) 도입절(페이스)과 종결절(별 성격)은 서로 다른
 * 독립 축이라 full cartesian으로 전체 조합을 채운다. 1차 개정에서 인과
 * 어미("-어서")를 "-는데"(배경/약한 대조)로 바꿨지만 대표가 재반려했다 —
 * 종결절이 자체적으로 대조 구문("겉은 X해도")을 품은 경우 도입절의 "-는데"와
 * 겹쳐 대조가 두 겹으로 쌓였고, 근본적으로는 어떤 연결어미를 쓰든 무관한
 * 두 절을 이으면 관계를 찾게 된다는 지적이었다. 그래서 연결어미 자체를
 * 없애고 **완결된 문장(마침표)**으로 바꿨다 — 종결절과 아무 문법적 관계도
 * 약속하지 않는다. 마지막 토큰(전부 서로 다른 동사/명사 활용형)은 여전히
 * 6종 모두 유일하다.
 */
export const OWNER_PACE_OPENING: Record<OwnerPaceKey, string> = {
  wj2: "일찍부터 리듬을 잘 타요.",
  wj3: "어릴 때부터 한 뼘씩 자라왔어요.",
  wj4a: "여러 번 부딪히며 단단해졌어요.",
  wj4b: "몇 번 깎이면서 실력을 키웠어요.",
  wj5: "한 자리를 오래 다져왔어요.",
  wj6: "천천히 불붙어 늦게 빛나요.",
};

// ============================================================
// fallback 경로 — 축 1. 연간(年干) 오행 × 음양
// ============================================================

export type OwnerYearElementVariant =
  | "wood-yang"
  | "wood-yin"
  | "fire-yang"
  | "fire-yin"
  | "earth-yang"
  | "earth-yin"
  | "metal-yang"
  | "metal-yin"
  | "water-yang"
  | "water-yin";

/**
 * 연간(0~9) → 오행×음양.
 * 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수. 짝수 인덱스가 양간, 홀수가 음간.
 */
export const STEM_TO_OWNER_ELEMENT_VARIANT: Record<
  StemIndex,
  OwnerYearElementVariant
> = {
  0: "wood-yang", // 갑
  1: "wood-yin", // 을
  2: "fire-yang", // 병
  3: "fire-yin", // 정
  4: "earth-yang", // 무
  5: "earth-yin", // 기
  6: "metal-yang", // 경
  7: "metal-yin", // 신
  8: "water-yang", // 임
  9: "water-yin", // 계
};

/**
 * @인과연결_제거_2026 (2차 개정) exact 도입절과 같은 이유로, 연결어미로 종결절과
 * 이어붙이는 대신 완결된 문장(마침표)으로 바꿨다 — 연간 오행×음양과 띠 종결절도
 * 서로 무관한 독립 축이라 어떤 연결어미를 쓰든 관계를 주장하게 된다.
 */
export const OWNER_ELEMENT_OPENING: Record<OwnerYearElementVariant, string> = {
  "wood-yang": "쭉쭉 뻗어나가는 기운을 타고났어요.",
  "wood-yin": "천천히 자라나는 성향을 타고났어요.",
  "fire-yang": "화르르 타오르는 기운을 타고났어요.",
  "fire-yin": "은은하게 타오르는 기질을 타고났어요.",
  "earth-yang": "단단히 다지는 기운을 타고났어요.",
  "earth-yin": "차분히 다지는 성향을 타고났어요.",
  "metal-yang": "날카롭게 벼려내는 기운을 타고났어요.",
  "metal-yin": "정교하게 벼려내는 기질을 타고났어요.",
  "water-yang": "힘차게 흘러가는 기운을 타고났어요.",
  "water-yin": "고요히 흘러가는 성향을 타고났어요.",
};

// ============================================================
// fallback 경로 — 축 2. 띠(年支)
// ============================================================

export type OwnerYearAnimal =
  | "rat"
  | "ox"
  | "tiger"
  | "rabbit"
  | "dragon"
  | "snake"
  | "horse"
  | "sheep"
  | "monkey"
  | "rooster"
  | "dog"
  | "pig";

/** 자축인묘진사오미신유술해 (연지 인덱스 0~11) */
export const BRANCH_TO_OWNER_ANIMAL: Record<BranchIndex, OwnerYearAnimal> = {
  0: "rat",
  1: "ox",
  2: "tiger",
  3: "rabbit",
  4: "dragon",
  5: "snake",
  6: "horse",
  7: "sheep",
  8: "monkey",
  9: "rooster",
  10: "dog",
  11: "pig",
};

/** 연지 음양 (자인진오신술=양지, 축묘사미유해=음지) — fallback 조합 유효성 검사에 쓴다 */
export const isYangBranch = (branch: BranchIndex): boolean => branch % 2 === 0;

/**
 * 용(辰) 종결절: "배포"(사어에 가까운 한자어, "deploy의 배포"로 오독될 소지)를
 * "배짱"으로 교체 (CPO 재검수 — brand-voice "올드한 표현 금지").
 */
export const OWNER_ZODIAC_CLOSING: Record<OwnerYearAnimal, string> = {
  rat: "눈치 빠르게 기회를 놓치지 않아요.",
  ox: "묵묵히 꾸준하게 자기 할 일을 해내요.",
  tiger: "망설임 없이 먼저 치고 나가요.",
  rabbit: "분위기를 부드럽게 만드는 재주가 있어요.",
  dragon: "품은 뜻이 크고 배짱 하나는 남달라요.",
  snake: "겉보다 속을 훨씬 더 깊이 들여다봐요.",
  horse: "매인 걸 싫어하고 자유롭게 움직여요.",
  sheep: "먼저 나서서 주변을 살뜰히 챙겨요.",
  monkey: "순발력 있게 상황을 잘 풀어가요.",
  rooster: "맡은 일은 야무지게 마무리해요.",
  dog: "한번 곁을 내주면 끝까지 의리를 지켜요.",
  pig: "넉넉한 마음으로 사람을 잘 품어줘요.",
};

// ============================================================
// 슬러그 빌더
// ============================================================

/** exact 경로 슬러그: `oo-{별}-{밝기군}-{페이스키}` (예: `oo-ziwei-bright-wj2`) */
export const buildOwnerOneLinerId = (
  star: MainStarName,
  brightness: BrightnessGroup,
  pace: OwnerPaceKey
): string => `oo-${OWNER_STAR_SLUG[star]}-${brightness}-${pace}`;

/** fallback 경로 슬러그: `oo-year-{오행-음양}-{띠}` (예: `oo-year-wood-yang-rat`) */
export const buildOwnerYearOneLinerId = (
  elementVariant: OwnerYearElementVariant,
  animal: OwnerYearAnimal
): string => `oo-year-${elementVariant}-${animal}`;

// ============================================================
// 완성 테이블
// ============================================================

export interface OwnerOneLiner {
  /** i18n 키로 그대로 쓸 안정적 슬러그 */
  id: string;
  /** 한국어 원문 (45자 이내, 존댓말, 자미두수 용어 비노출) */
  ko: string;
}

/**
 * exact 경로 252가지(14별 × 3밝기군 × 6페이스키)를 조합해 채운다.
 * 별×밝기군과 페이스키는 서로 다른 계산 체인에서 나오는 독립 축이라
 * (오행국이 무엇이든 이론상 어느 별이든 명궁에 올 수 있다) 전체 곱을 그대로 채운다.
 */
const buildExactOwnerOneLiners = (): Record<string, OwnerOneLiner> => {
  const table: Record<string, OwnerOneLiner> = {};

  for (const star of MAIN_STAR_NAMES) {
    for (const brightness of Object.keys(
      OWNER_STAR_CLOSING[star]
    ) as BrightnessGroup[]) {
      for (const pace of Object.keys(OWNER_PACE_OPENING) as OwnerPaceKey[]) {
        const id = buildOwnerOneLinerId(star, brightness, pace);
        const ko = `${OWNER_PACE_OPENING[pace]} ${OWNER_STAR_CLOSING[star][brightness]}`;
        table[id] = { id, ko };
      }
    }
  }

  return table;
};

/**
 * fallback 경로 60가지를 채운다.
 *
 * 오행×음양(10) × 띠(12)의 전체 곱은 120이지만, 60갑자 체계상 양간(갑병무경임)은
 * 반드시 양지(자인진오신술)와만, 음간(을정기신계)은 반드시 음지(축묘사미유해)와만
 * 짝을 이룬다 — 나머지 60은 어떤 생년으로도 나올 수 없는 조합이라 아예 채우지 않는다
 * (표에 없어서 생기는 "고아 슬러그"가 아니라, 애초에 존재할 수 없는 간지다).
 */
const buildFallbackOwnerOneLiners = (): Record<string, OwnerOneLiner> => {
  const table: Record<string, OwnerOneLiner> = {};

  for (let stem = 0; stem < 10; stem++) {
    const stemIndex = stem as StemIndex;
    const elementVariant = STEM_TO_OWNER_ELEMENT_VARIANT[stemIndex];
    const stemIsYang = stem % 2 === 0;

    for (let branch = 0; branch < 12; branch++) {
      const branchIndex = branch as BranchIndex;
      if (isYangBranch(branchIndex) !== stemIsYang) continue;

      const animal = BRANCH_TO_OWNER_ANIMAL[branchIndex];
      const id = buildOwnerYearOneLinerId(elementVariant, animal);
      const ko = `${OWNER_ELEMENT_OPENING[elementVariant]} ${OWNER_ZODIAC_CLOSING[animal]}`;
      table[id] = { id, ko };
    }
  }

  return table;
};

/**
 * owner 1인 운세 한줄평 전체 테이블 (exact 252 + fallback 60 = 312종).
 * 모듈 로드 시 1회만 조합되는 순수 lookup — 런타임 재계산 없음.
 */
export const OWNER_ONE_LINERS: Record<string, OwnerOneLiner> = {
  ...buildExactOwnerOneLiners(),
  ...buildFallbackOwnerOneLiners(),
};
