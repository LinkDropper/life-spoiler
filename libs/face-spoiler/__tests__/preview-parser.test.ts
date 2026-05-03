import {
  extractAnimalShortName,
  parseAnimalRatios,
  parseAnimalSection,
  parseFirstImpression,
  parseParts,
  stripAnimalRatioPrefix,
  stripOneLinerSubsections,
} from "../preview-parser";

describe("extractAnimalShortName", () => {
  it("동물상 비율 표기에서 가장 높은 비율의 이름을 선택한다", () => {
    const body =
      "비율로 보면 **사슴상 60% + 너구리상 40%** 느낌입니다. 사슴상 쪽은 ...";
    expect(extractAnimalShortName(body)).toBe("사슴상");
  });

  it("비율 표기가 없으면 본문에서 가장 먼저 등장한 동물상을 채택한다", () => {
    const body =
      "이 얼굴은 여우상 느낌이 강하고, 일부 사슴상 인상도 함께 보입니다.";
    expect(extractAnimalShortName(body)).toBe("여우상");
  });

  it("화이트리스트와 매칭되지 않으면 null", () => {
    expect(
      extractAnimalShortName("동물상이 따로 정의되지 않았습니다.")
    ).toBeNull();
  });

  it("숫자가 % 앞에 붙은 형태도 인식한다", () => {
    const body = "30% 너구리상과 70% 강아지상의 조합입니다.";
    expect(extractAnimalShortName(body)).toBe("강아지상");
  });
});

describe("parseAnimalRatios", () => {
  it("두 동물상 + 비율을 비율 내림차순으로 반환한다", () => {
    const body = "**여우상 65% + 곰상 35%** 묵직한데 은근 계산 빠른 상.";
    expect(parseAnimalRatios(body)).toEqual([
      { name: "여우상", ratio: 65 },
      { name: "곰상", ratio: 35 },
    ]);
  });

  it("단일 동물상이면 100% 로 보정해 1개 반환한다", () => {
    const body = "이 얼굴은 또렷한 여우상입니다. 다른 인상은 거의 없습니다.";
    expect(parseAnimalRatios(body)).toEqual([{ name: "여우상", ratio: 100 }]);
  });

  it("비율이 한쪽만 있으면 비율 있는 쪽이 먼저 정렬된다", () => {
    const body =
      "주로 강아지상 80% 인상이 강하고, 약간의 사슴상 느낌도 같이 있습니다.";
    expect(parseAnimalRatios(body)).toEqual([
      { name: "강아지상", ratio: 80 },
      { name: "사슴상", ratio: 0 },
    ]);
  });

  it("매칭되는 동물상이 없으면 빈 배열", () => {
    expect(parseAnimalRatios("동물상이 정의되지 않았습니다.")).toEqual([]);
  });
});

describe("stripAnimalRatioPrefix", () => {
  it("**여우상 65% + 곰상 35%** 같은 메타 라벨 첫 단락은 제거한다", () => {
    const body = `**여우상 65% + 곰상 35%**

전체적인 얼굴의 안정감이 곰상의 분위기를 자아냅니다.`;
    expect(stripAnimalRatioPrefix(body)).toBe(
      "전체적인 얼굴의 안정감이 곰상의 분위기를 자아냅니다."
    );
  });

  it("동물상 이름이 들어간 일반 본문 단락은 보존한다", () => {
    const body = `사진을 보면 여우상의 인상이 60% 정도로 가장 두드러집니다. 동시에 곰상의 안정감이 곁들여져 있습니다.

추가 단락.`;
    expect(stripAnimalRatioPrefix(body)).toBe(body);
  });

  it("비율 메타가 없으면 본문 그대로 반환한다", () => {
    const body = "여우상의 매력이 두드러진 인상입니다.";
    expect(stripAnimalRatioPrefix(body)).toBe(body);
  });
});

describe("parseAnimalSection", () => {
  it("'### 한 줄 정리' 블록을 summary 로 분리하고 description 에서 제거한다", () => {
    const body = `**여우상 65% + 곰상 35%**

### 선택 동물상
- **여우상 65%**: 맑고 단정한 인상.
- **곰상 35%**: 안정감.

### 한 줄 정리
- 사슴의 순함에 고양이의 거리감 한 꼬집 얹은 캐릭터입니다.`;

    const parsed = parseAnimalSection(body);
    expect(parsed.summary).toBe(
      "사슴의 순함에 고양이의 거리감 한 꼬집 얹은 캐릭터입니다."
    );
    // 본문 부분은 보존 (선택 동물상 헤딩 + 불릿)
    expect(parsed.description).toContain("선택 동물상");
    expect(parsed.description).toContain("**여우상 65%**");
    // 비율 메타 prefix 와 한 줄 정리 헤딩은 제거
    expect(parsed.description).not.toContain("한 줄 정리");
    expect(parsed.description.startsWith("**여우상 65% + 곰상 35%**")).toBe(
      false
    );
  });

  it("불릿 없는 한 줄 정리도 평문으로 추출한다", () => {
    const body = `### 본문
설명입니다.

### 한 줄 정리
요약 문장.`;
    const parsed = parseAnimalSection(body);
    expect(parsed.summary).toBe("요약 문장.");
  });

  it("인라인 **한 줄 평:** 패턴도 summary 로 추출한다", () => {
    const body = `여우상 인상이 강합니다.

**한 줄 평:** 깔끔한 인상에 은은한 미스터리.`;
    const parsed = parseAnimalSection(body);
    expect(parsed.summary).toBe("깔끔한 인상에 은은한 미스터리.");
  });

  it("한 줄 정리 블록이 없으면 summary 는 null 이다", () => {
    const body = "여우상이 분명히 보입니다.";
    const parsed = parseAnimalSection(body);
    expect(parsed.summary).toBeNull();
    expect(parsed.description).toBe("여우상이 분명히 보입니다.");
  });
});

describe("stripOneLinerSubsections", () => {
  it("'### 한 줄 정리' 블록과 그 본문(불릿 포함)을 제거한다", () => {
    const body = `### 본문
설명입니다.

### 한 줄 정리
- 한 줄 평 텍스트입니다.`;
    expect(stripOneLinerSubsections(body)).toBe(`### 본문
설명입니다.`);
  });

  it("'### 최종 한 줄 평' 블록도 제거한다", () => {
    const body = `### 종합 점수
87점.

### 최종 한 줄 평
보일 듯 말 듯한 신뢰감.`;
    expect(stripOneLinerSubsections(body)).toBe(`### 종합 점수
87점.`);
  });

  it("'**한 줄 평:** ...' 인라인 라인을 제거한다", () => {
    const body = `본문 단락.

**한 줄 평:** 깔끔한 인상.

이어지는 단락.`;
    expect(stripOneLinerSubsections(body)).toBe(`본문 단락.

이어지는 단락.`);
  });

  it("'**최종 한 줄 평:** ...' 인라인 라인도 제거한다", () => {
    const body = `종합 점수 87점.

**최종 한 줄 평:** 보일 듯 말 듯한 신뢰감.`;
    expect(stripOneLinerSubsections(body)).toBe("종합 점수 87점.");
  });

  it("'한 줄 평' 헤딩 다음에 또 다른 헤딩이 오면 그 이후는 보존한다", () => {
    const body = `### 한 줄 정리
요약 문장.

### 다음 섹션
이어지는 본문.`;
    expect(stripOneLinerSubsections(body)).toBe(`### 다음 섹션
이어지는 본문.`);
  });

  it("일반 본문 안에 한 줄 평이 단어로만 등장하면 보존한다", () => {
    const body = "한 줄 평을 언급하는 평범한 문장입니다.";
    expect(stripOneLinerSubsections(body)).toBe(body);
  });

  it("한 줄 평 관련 헤딩이 전혀 없으면 본문이 그대로 반환된다", () => {
    const body = `### 본문
설명입니다.

추가 설명.`;
    expect(stripOneLinerSubsections(body)).toBe(body);
  });

  it("빈 본문은 빈 문자열을 반환한다", () => {
    expect(stripOneLinerSubsections("")).toBe("");
  });
});

describe("parseFirstImpression", () => {
  it("### 헤딩 + 불릿 + **한 줄 평:** 패턴을 분해한다", () => {
    const body = `### 전체 분위기
사진에서 보이는 인상 기준으로는, 첫 장에 들어오는 느낌이 과하게 튀기보다 정돈된 쪽입니다.

### 핵심 포인트
- 깔끔함과 안정감이 먼저 보이는 얼굴
- 무심한 듯 보이지만 디테일이 살아 있는 인상
- 가까워질수록 더 궁금해지는 스타일

### 한 줄 해석
초반엔 "말 적은 사람인가?" 싶다가도, 알고 보면 회의실에서도 단톡방에서도 은근히 중심을 잡는 쪽으로 보입니다.`;

    const parsed = parseFirstImpression(body);
    expect(parsed.lead).toContain("정돈된 쪽");
    expect(parsed.points).toEqual([
      "깔끔함과 안정감이 먼저 보이는 얼굴",
      "무심한 듯 보이지만 디테일이 살아 있는 인상",
      "가까워질수록 더 궁금해지는 스타일",
    ]);
    expect(parsed.summary).toContain("회의실");
  });

  it("인라인 **한 줄 평:** 패턴도 summary 로 추출한다", () => {
    const body = `사진에서 보이는 첫인상은 한마디로 정돈된 무표정의 신뢰형입니다. 과하게 꾸민 느낌은 없는데도 ...

**한 줄 평:** 깔끔한 얼굴에 조용한 압박감 한 스푼.`;

    const parsed = parseFirstImpression(body);
    expect(parsed.summary).toBe("깔끔한 얼굴에 조용한 압박감 한 스푼.");
    expect(parsed.lead).toContain("정돈된 무표정의 신뢰형");
    expect(parsed.points).toEqual([]);
  });

  it("불릿이 없으면 points 는 빈 배열", () => {
    const body = "단순한 단락 하나만 있는 본문입니다.";
    const parsed = parseFirstImpression(body);
    expect(parsed.points).toEqual([]);
    expect(parsed.lead).toBe("단순한 단락 하나만 있는 본문입니다.");
  });
});

describe("parseParts", () => {
  it("### 헤딩 단위로 sub-section 을 분리하고 한 줄 평을 summary 로 뺀다", () => {
    const body = `### 눈
눈매가 또렷하여 신중한 분위기입니다.

### 코
코끝이 부드럽게 마무리되어 균형감이 좋습니다.

### 입
정리된 입매가 무게감을 더합니다.

**한 줄 평:** 눈은 브레이크, 입은 서스펜션.`;

    const parsed = parseParts(body);
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items[0]).toEqual({
      name: "눈",
      body: "눈매가 또렷하여 신중한 분위기입니다.",
    });
    expect(parsed.summary).toBe("눈은 브레이크, 입은 서스펜션.");
  });

  it("'한 줄 평' 헤딩이 있으면 summary 로 분리한다", () => {
    const body = `### 눈
설명1.

### 한 줄 평
요약 한 줄.`;
    const parsed = parseParts(body);
    expect(parsed.items.map((i) => i.name)).toEqual(["눈"]);
    expect(parsed.summary).toBe("요약 한 줄.");
  });

  it("헤딩이 전혀 없으면 items 가 빈 배열", () => {
    const body = "그냥 평문입니다.";
    const parsed = parseParts(body);
    expect(parsed.items).toEqual([]);
  });

  it("얼굴형 / 윤곽 류 헤딩은 '얼굴형 / 전체 구조' 라벨로 정규화한다", () => {
    const body = `### 얼굴형/윤곽
턱선 본문.

### 얼굴형 / 전체 윤곽
또 다른 본문.`;
    const parsed = parseParts(body);
    expect(parsed.items.map((i) => i.name)).toEqual([
      "얼굴형 / 전체 구조",
      "얼굴형 / 전체 구조",
    ]);
  });

  it("'기억에 남는 한 줄' / '한 줄 정리' 헤딩은 summary 로 분리된다", () => {
    const body = `### 눈
설명.

### 기억에 남는 한 줄
요약 본문.`;
    const parsed = parseParts(body);
    // normalize 로 "한 줄 정리" 라벨이 되고, 그 라벨은 summary 패턴에 매치되어
    // sub-card 가 아니라 summary 로 빠진다.
    expect(parsed.items.map((i) => i.name)).toEqual(["눈"]);
    expect(parsed.summary).toBe("요약 본문.");
  });

  it("불릿 리스트 형태의 summary 본문은 한 줄 평문으로 평탄화한다", () => {
    const body = `### 눈
설명.

### 한 줄 정리
- 첫째 포인트
- 둘째 포인트`;
    const parsed = parseParts(body);
    expect(parsed.summary).toBe("첫째 포인트 둘째 포인트");
  });
});
