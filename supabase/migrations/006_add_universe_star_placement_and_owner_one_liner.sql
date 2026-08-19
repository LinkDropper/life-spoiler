-- 친구 우주 궁합 — 별 좌표 영구 저장 + owner 운세 한줄평 컬럼/배선
--
-- 배경 1) 별 좌표 영구 저장
--   기존에는 별 위치가 점수 내림차순 rankIndex에서 매 렌더마다 파생됐다. 그래서 새 친구가
--   높은 점수로 등록되면 기존 별들이 링을 갈아타며 표시 위치가 흔들렸다 — 재방문 사용자에게
--   "내 별이 어디 갔지"가 발생해 재공유 동기를 직접 깎는 문제였다. (CTO/CPO 확정)
--
--   이 마이그레이션은 등록 시점에 서버가 랜덤 산출한 좌표를 영구 저장하는 컬럼을 추가한다.
--   이후 다른 친구가 등록되든 점수가 어떻든 좌표는 절대 바뀌지 않는다. 점수-거리 결합
--   ("1등이 owner와 가장 가깝다")은 이 변경으로 폐기됐다 — 점수는 크기/밝기에만 남는다.
--
--   저장 포맷은 정규화 x/y 비율(0~1)이다. 극좌표가 아니다 — 캔버스가
--   `aspect-ratio: 1/1.05`로 비정사각이라 극좌표로 저장하면 렌더할 때마다 타원 보정이
--   필요하고 겹침 판정도 부정확해진다. 비율은 컨테이너 크기 변화와 무관하다.
--
-- 배경 2) owner 운세 한줄평
--   최상단(섹션1)에 우주 주인(owner) 본인의 운세 한줄평을 노출한다 (PRD 원 요구사항).
--   우주 생성 시점에 계산해 스냅샷으로 저장한다 — 친구 궁합 결과와 동일하게 조회마다
--   재계산하지 않아 조회 비용이 붙지 않고, 표시값도 항상 일관된다.
--
-- 원격 적용은 사용자 승인 필요 (.claude/rules/database-safety.md 준수).

-- ---------------------------------------------------------------------------
-- 1. universe_guests — 좌표 컬럼 추가 (nullable로 시작 → 백필 → NOT NULL 승격)
-- ---------------------------------------------------------------------------

ALTER TABLE universe_guests
  ADD COLUMN IF NOT EXISTS pos_x_ratio DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pos_y_ratio DOUBLE PRECISION;

-- ---------------------------------------------------------------------------
-- 2. 기존 행 백필
-- ---------------------------------------------------------------------------
--
-- 원격 DB에 이미 데이터가 있을 수 있으므로, 이미 우주를 본 사람에게 위치가 바뀌어
-- 보이지 않도록 **기존 화면에 실제로 렌더링되던 자리**를 좌표로 환산해 넣는다.
-- 즉 기존 프론트(구 getStarPlacement)의 2링 배치 공식을 SQL로 재현한다:
--   - 정렬: universe_id 파티션 내 score DESC, created_at ASC (기존 표시 정렬과 동일)
--   - 0-based rank_index < 12 → ring1 (반경비 0.25), 12~29 → ring2 (반경비 0.375)
--   - 슬롯 각도 = (링 내 인덱스 / 링 정원) * 2π - π/2 (12시 방향 시작)
--   - seed 기반 지터(±7.5%)는 SQL로 재현하기 어려워 생략한다 — 지터는 최대
--     슬롯 간격의 7.5%뿐이라 생략해도 "완전히 다른 자리"로는 보이지 않는다.
--   - rank_index >= 30(기존에도 렌더링되지 않던 별)은 화면에 나온 적이 없으므로
--     정확한 위치를 재현할 이유가 없다. 골든 앵글(137.508°)로 링2 바깥(반경비 0.42)에
--     흩어 캔버스 안에는 들어오되 서로 겹치지 않게만 한다.
WITH ranked_guests AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY universe_id
      ORDER BY score DESC, created_at ASC
    ) - 1 AS rank_index
  FROM universe_guests
),
placement AS (
  SELECT
    id,
    CASE
      WHEN rank_index < 30 THEN
        -- 기존 2링 배치 공식 재현
        0.5 + cos(
          (
            (CASE WHEN rank_index < 12 THEN rank_index ELSE rank_index - 12 END)::float8
            / (CASE WHEN rank_index < 12 THEN 12 ELSE 18 END)::float8
          ) * 2 * pi() - pi() / 2
        ) * (CASE WHEN rank_index < 12 THEN 0.25 ELSE 0.375 END)
      ELSE
        -- 렌더링된 적 없는 별 — 골든 앵글로 링2 바깥에 흩어 캔버스 안에만 들어오게 한다
        0.5 + cos(radians(rank_index * 137.508)) * 0.42
    END AS pos_x_ratio,
    CASE
      WHEN rank_index < 30 THEN
        0.5 + sin(
          (
            (CASE WHEN rank_index < 12 THEN rank_index ELSE rank_index - 12 END)::float8
            / (CASE WHEN rank_index < 12 THEN 12 ELSE 18 END)::float8
          ) * 2 * pi() - pi() / 2
        ) * (CASE WHEN rank_index < 12 THEN 0.25 ELSE 0.375 END)
      ELSE
        0.5 + sin(radians(rank_index * 137.508)) * 0.42
    END AS pos_y_ratio
  FROM ranked_guests
)
UPDATE universe_guests
SET
  pos_x_ratio = placement.pos_x_ratio,
  pos_y_ratio = placement.pos_y_ratio
FROM placement
WHERE universe_guests.id = placement.id
  AND universe_guests.pos_x_ratio IS NULL;

-- ---------------------------------------------------------------------------
-- 3. 백필 후 제약 승격 — 신규 INSERT는 항상 서버가 값을 채우므로 nullable로 둘 이유가 없다
-- ---------------------------------------------------------------------------

ALTER TABLE universe_guests
  ADD CONSTRAINT universe_guests_pos_x_ratio_range
    CHECK (pos_x_ratio >= 0 AND pos_x_ratio <= 1),
  ADD CONSTRAINT universe_guests_pos_y_ratio_range
    CHECK (pos_y_ratio >= 0 AND pos_y_ratio <= 1);

ALTER TABLE universe_guests
  ALTER COLUMN pos_x_ratio SET NOT NULL,
  ALTER COLUMN pos_y_ratio SET NOT NULL;

COMMENT ON COLUMN universe_guests.pos_x_ratio IS '별 좌표 — 컨테이너 기준 좌측 비율(0~1). 등록 시점에 서버가 랜덤 산출해 영구 저장하며 이후 절대 재계산하지 않는다';
COMMENT ON COLUMN universe_guests.pos_y_ratio IS '별 좌표 — 컨테이너 기준 상단 비율(0~1). 등록 시점에 서버가 랜덤 산출해 영구 저장하며 이후 절대 재계산하지 않는다';

-- ---------------------------------------------------------------------------
-- 4. universes — owner 한줄평 컬럼
-- ---------------------------------------------------------------------------
--
-- owner 1인의 자미두수 명반에서 결정론적으로 산출되는 운세 한줄평 스냅샷이다.
-- 우주 생성 시점에 계산해 저장하며, 재계산 대신 스냅샷을 저장하는 이유는
-- universe_guests.matrix_version과 같다 — 매트릭스 버전이 올라가도 이미 공유된 링크의
-- 문구가 조용히 바뀌면 안 되고, owner_one_liner_version을 남겨두면 명백한 계산 버그가
-- 발견됐을 때 해당 버전 행만 골라 선택 백필할 수 있다. 기본 정책은 백필하지 않는다.
--
-- 두 컬럼 모두 nullable이다. 이 컬럼이 추가되기 전에 이미 생성된 우주 행에는 값이 없고,
-- SQL만으로는 채울 수 없다(산출이 TypeScript 엔진 로직이라). 그래서 애플리케이션이
-- 조회 시점에 NULL이면 1회 계산해 채우는 지연 산출(자가 치유) 경로를 갖는다
-- (`libs/universe/service.ts` 참조). 한 번 채워지면 다시 계산하지 않는다.

ALTER TABLE universes
  ADD COLUMN IF NOT EXISTS owner_one_liner_id TEXT,
  ADD COLUMN IF NOT EXISTS owner_one_liner_version TEXT;

ALTER TABLE universes
  ADD CONSTRAINT universes_owner_one_liner_id_length CHECK (
    owner_one_liner_id IS NULL
    OR char_length(owner_one_liner_id) BETWEEN 1 AND 80
  ),
  ADD CONSTRAINT universes_owner_one_liner_version_length CHECK (
    owner_one_liner_version IS NULL
    OR char_length(owner_one_liner_version) BETWEEN 1 AND 40
  ),
  -- 둘 중 하나만 채워진 상태(부분 백필)는 데이터 손상 신호이므로 함께 채워지도록 강제한다
  ADD CONSTRAINT universes_owner_one_liner_consistency CHECK (
    (owner_one_liner_id IS NULL AND owner_one_liner_version IS NULL)
    OR (owner_one_liner_id IS NOT NULL AND owner_one_liner_version IS NOT NULL)
  );

COMMENT ON COLUMN universes.owner_one_liner_id IS 'owner 한줄평 템플릿 ID 스냅샷 (선택, 컬럼 추가 이전 우주는 NULL → 조회 시점 지연 산출). 실제 문구는 렌더 시점에 조회하여 다국어 확장/오타 수정이 과거 행에도 반영되게 한다';
COMMENT ON COLUMN universes.owner_one_liner_version IS '한줄평 산출에 쓰인 매트릭스 버전 스냅샷 (예: oo-1.0.0). universe_guests.matrix_version과 동일한 이유로 저장 — 계산 버그 발견 시 해당 버전 행만 선택 백필하기 위함. 기본 정책은 백필하지 않음';
