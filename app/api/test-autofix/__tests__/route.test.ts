import { GET } from "../route";

describe("GET /api/test-autofix", () => {
  it("rows[0]가 존재할 때 firstName을 반환한다", async () => {
    // Act
    const response = await GET();
    const body = await response.json();

    // Assert
    expect(body.firstName).toBe("tester");
  });

  it("응답이 TypeError 없이 정상적으로 완료된다", async () => {
    // Arrange & Act & Assert
    await expect(GET()).resolves.not.toThrow();
  });
});
