import type { BranchIndex, WuxingJu } from "../types";

/**
 * 자미성 위치 계산 함수 (역설계 로직 적용)
 * * [공식 알고리즘]
 * 1. 목표수(Target): 생일보다 크거나 같은 국수(Ju)의 최소 배수를 찾음
 * 2. 몫(Quotient): Target / Ju
 * 3. 차이(Diff): Target - 생일
 * 4. 기준점: 인(寅, index 2)에서 몫만큼 순행한 위치 (보정: 2 + Quotient - 1)
 * 5. 최종 이동:
 * - 차이가 홀수면: 기준점에서 차이만큼 역행(-)
 * - 차이가 짝수면: 기준점에서 차이만큼 순행(+)
 */
function getZiweiLocation(ju: WuxingJu, day: number): BranchIndex {
  // 1. Target 찾기
  let target = ju;
  while (target < day) {
    target += ju;
  }

  const quotient = target / ju;
  const diff = target - day;

  // 2. Base Position (인궁=2 부터 시작)
  // 몫이 1일 때 인궁(2)에 있어야 하므로 (2 + quotient - 1)
  let currentPos = (2 + quotient - 1) % 12;

  // 3. Diff 보정
  if (diff % 2 !== 0) {
    // 홀수: 역행 (Subtract)
    currentPos = (currentPos - diff) % 12;
    if (currentPos < 0) currentPos += 12; // 음수 보정
  } else {
    // 짝수: 순행 (Add)
    currentPos = (currentPos + diff) % 12;
  }

  return currentPos as BranchIndex;
}

/**
 * 테이블 생성 헬퍼
 */
const generateTable = (ju: WuxingJu) => {
  const table: Record<number, BranchIndex> = {};
  for (let d = 1; d <= 30; d++) {
    table[d] = getZiweiLocation(ju, d);
  }
  return table;
};

/**
 * 자미성 위치 테이블
 * [오행국][음력일] = 지지 인덱스
 *
 * @지지인덱스 0:자, 1:축, 2:인, 3:묘, 4:진, 5:사, 6:오, 7:미, 8:신, 9:유, 10:술, 11:해
 * @검증 화6국 22일 -> 미(未, 7) / 금4국 13일 -> 인(寅, 2) / 금4국 14일 -> 미(未, 7)
 */
export const ZIWEI_POSITION_TABLE: Record<
  WuxingJu,
  Record<number, BranchIndex>
> = {
  // 수이국 (水二局)
  2: generateTable(2),
  
  // 목삼국 (木三局)
  3: generateTable(3),

  // 금사국 (金四局)
  4: generateTable(4),

  // 토오국 (土五局)
  5: generateTable(5),

  // 화육국 (火六局)
  6: generateTable(6),
};
