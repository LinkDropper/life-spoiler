import type {
  FriendCompatibilityConfidence,
  FriendCompatibilityFactor,
} from "@/libs/zi-wei-dou-shu";

/**
 * 친구 우주 궁합 — API 경계 DTO.
 *
 * 개인정보 공개 범위 B안(PRD 확정): **이름만 공개, 생년월일시는 계산에만 사용하고
 * API 경계 밖으로 내보내지 않는다. owner도 예외가 없다.**
 *
 * 이 파일의 DTO는 그 경계를 타입으로 고정하는 역할을 한다. 아래 컴파일 타임 가드가
 * 생년월일/생시/성별/내부 PK 계열 키가 DTO에 추가되는 순간 빌드를 깨뜨린다.
 * 방어선은 이 타입 하나가 아니라 (1) DB 조회 시 민감 컬럼을 애초에 select 하지 않는 것과
 * (2) 이 DTO 타입, 두 겹으로 구성된다 (`libs/universe/repository.ts` 참조).
 */

/** 응답에 절대 등장하면 안 되는 키 (camelCase / snake_case 양쪽) */
type PersonalDataKey =
  | "id"
  | "universeId"
  | "universe_id"
  | "birthDate"
  | "birth_date"
  | "birthTime"
  | "birth_time"
  | "birthTimeUnknown"
  | "birth_time_unknown"
  | "calendarType"
  | "calendar_type"
  | "isLeapMonth"
  | "is_leap_month"
  | "gender"
  | "creatorIpHash"
  | "creator_ip_hash"
  | "ownerTokenHash"
  | "owner_token_hash";

type HasNoPersonalData<T> =
  Extract<keyof T, PersonalDataKey> extends never ? true : false;

type Assert<T extends true> = T;

export interface UniverseOwnerSummaryDto {
  /** owner 표시 이름 (미입력 시 null → 클라이언트가 중립 문구로 대체) */
  ownerName: string | null;
  guestCount: number;
  /**
   * 우주 전체의 계산 확신도.
   *
   * owner가 시간 미상이면 모든 쌍에 owner가 포함되므로 우주 전체가 `estimated`가 된다.
   * 이 값은 **입력값(birth_time_unknown)이 아니라 계산 결과의 성격**이며, guest별
   * `confidence`와 같은 범주다. 배너/캡션을 우주 단위로 1회만 노출하려면 이 신호가 필요하다.
   *
   * guest 목록에서 역산할 수 없다: 친구가 0명이면 단서가 없고, 전원이 시간 미상인 경우와
   * owner가 시간 미상인 경우가 구분되지 않는다. 그래서 명시 필드로 둔다.
   */
  confidence: FriendCompatibilityConfidence;
  /**
   * owner 운세 한줄평 템플릿 ID. `UniverseGuestDto.oneLinerId`와 대칭.
   * 우주 생성 시점에 산출된 스냅샷이며, 컬럼 추가 이전 우주는 조회 시점에 지연 산출된다
   * (`libs/universe/service.ts` 참조) — 그래도 응답에는 항상 채워진 값만 나간다.
   */
  oneLinerId: string;
  /** EN/JA 로케일에서도 한국어를 반환한다. 폴백 전용 (`UniverseGuestDto.oneLinerKo`와 동일 정책) */
  oneLinerKo: string;
  /**
   * 전체 우주 중 별(친구) 개수 순위 (동점 공유, 1부터 시작).
   * 친구가 0명이면 "별을 하나라도 보유한" 우주가 아니므로 null — 클라이언트가 이 필드로
   * 노출 여부를 그대로 판단한다(별도 guestCount 재확인 불필요).
   */
  guestCountRank: number | null;
}

export interface UniverseGuestDto {
  /** 별 배치용 결정론적 시드. 내부 PK 대신 이 값을 노출한다 */
  starSeed: string;
  name: string;
  /** 정수, 실사용 범위 12~99 (0/100은 구조적으로 미도달) */
  score: number;
  /** 등급 슬러그 — 라벨은 FRIEND_COMPATIBILITY_TIERS에서 조회 */
  tier: string;
  oneLinerId: string;
  /** EN/JA 로케일에서도 한국어를 반환한다. 폴백 전용 */
  oneLinerKo: string;
  confidence: FriendCompatibilityConfidence;
  /**
   * 별 좌표(컨테이너 기준 좌측/상단 비율, 0~1). 등록 시점에 서버가 랜덤 산출해
   * DB에 영구 저장한 값으로, 점수/다른 친구 등록과 무관하게 절대 바뀌지 않는다.
   * 렌더 좌표(`StarPlacement.leftRatio/topRatio`)와 다른 개념이다 — 오버플로 본인
   * 별은 이 값을 무시하고 항상 고정 궤도를 렌더에 쓴다.
   */
  posXRatio: number;
  posYRatio: number;
  /**
   * 점수 산출 근거 breakdown(축 이름 + 판정 문장 + 기여도). 이름·생년월일 등
   * 개인정보를 담지 않는 순수 계산 결과라 목록 조회에도 포함한다(드로어 상세용).
   * 3~8개, 델타 합 + 기준점수 = score.
   */
  factors: FriendCompatibilityFactor[];
}

export interface UniverseDetailDto {
  publicId: string;
  ownerSummary: UniverseOwnerSummaryDto;
  /** 점수 내림차순 정렬 */
  guests: UniverseGuestDto[];
  guestCount: number;
  /** 참여 인원 하드캡 도달 여부 (등록 버튼 비활성화용) */
  isFull: boolean;
}

export interface GuestSubmitResultDto extends UniverseGuestDto {
  /** 동일 조합 재제출이면 true (E1 업서트) */
  isDuplicate: boolean;
}

export interface UniverseCreateResultDto {
  publicId: string;
}

// 컴파일 타임 가드 — 위 DTO에 개인정보 키가 추가되면 여기서 빌드가 깨진다.
type _AssertOwnerSummary = Assert<HasNoPersonalData<UniverseOwnerSummaryDto>>;
type _AssertGuest = Assert<HasNoPersonalData<UniverseGuestDto>>;
type _AssertDetail = Assert<HasNoPersonalData<UniverseDetailDto>>;
type _AssertSubmitResult = Assert<HasNoPersonalData<GuestSubmitResultDto>>;
type _AssertCreateResult = Assert<HasNoPersonalData<UniverseCreateResultDto>>;
