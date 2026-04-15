import { GET } from "../route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown) => data,
  },
}));

describe("GET /api/test-autofix", () => {
  it("rows[0]이 존재할 때 firstName을 반환한다", async () => {
    const response = await GET();
    expect(response).toEqual({ firstName: expect.any(String) });
  });
});
