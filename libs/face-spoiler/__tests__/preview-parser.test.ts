import {
  extractAnimalShortName,
  parseFirstImpression,
  parseParts,
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

  it("줄바꿈이 포함된 summary 본문은 ReactMarkdown 렌더 위해 보존한다", () => {
    const body = `### 눈
설명.

### 한 줄 정리
- 첫째 포인트
- 둘째 포인트`;
    const parsed = parseParts(body);
    expect(parsed.summary).toBe("- 첫째 포인트\n- 둘째 포인트");
  });
});
