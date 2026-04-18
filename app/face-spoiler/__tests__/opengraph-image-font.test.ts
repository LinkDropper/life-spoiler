import { readFileSync } from "fs";
import path from "path";

const OG_IMAGE_PATH = path.join(
  __dirname,
  "../r/[shareId]/opengraph-image.tsx"
);

describe("face-spoiler opengraph-image 폰트 로딩", () => {
  const source = readFileSync(OG_IMAGE_PATH, "utf-8");

  it("readFile(process.cwd()) 패턴을 사용하지 않는다 (Vercel 서버리스에서 실패)", () => {
    expect(source).not.toMatch(/readFile\s*\(/);
    expect(source).not.toMatch(/process\.cwd\(\)/);
  });

  it("fetch + new URL(import.meta.url) 패턴으로 폰트를 로드한다", () => {
    expect(source).toMatch(/fetch\s*\(\s*new URL\(/);
    expect(source).toMatch(/import\.meta\.url/);
  });

  it("필요한 폰트 파일이 public/fonts에 존재한다", () => {
    const fontsDir = path.join(__dirname, "../../../public/fonts");
    const lotteriaPath = path.join(fontsDir, "LotteriaDdag.ttf");
    const sbMediumPath = path.join(fontsDir, "SB-M.otf");

    expect(() => readFileSync(lotteriaPath)).not.toThrow();
    expect(() => readFileSync(sbMediumPath)).not.toThrow();
  });
});
