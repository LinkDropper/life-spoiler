import { createAuthClient, createServerClient } from "@/libs/supabase";

const USER_ID = "user-1";
const PROFILE_B = "profile-b";
const IMAGE_HASH = "abc123hash";
const EXISTING_SHARE_ID = "existing-01";

jest.mock("@/libs/supabase");
jest.mock("nanoid", () => ({ nanoid: () => "new-share-id" }));
jest.mock("@/libs/face-spoiler/animal-classifier");
jest.mock("@/libs/face-spoiler/gemini");

const makeMockChain = (resolvedValue: unknown) => {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.not = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.limit = jest.fn().mockReturnValue(chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(resolvedValue);
  chain.insert = jest.fn().mockResolvedValue({ error: null });
  return chain;
};

import { POST } from "../route";

describe("POST /api/face-spoiler/report/generate", () => {
  let faceReportsCallCount: number;
  let faceReportChains: ReturnType<typeof makeMockChain>[];

  beforeEach(() => {
    faceReportsCallCount = 0;
    faceReportChains = [];

    const mockAuthFrom = jest.fn().mockImplementation(() => {
      return makeMockChain({ data: { id: PROFILE_B } });
    });

    (createAuthClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: USER_ID } } }),
      },
      from: (...args: unknown[]) => mockAuthFrom(...args),
    });

    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    const mockStorageFrom = jest.fn().mockReturnValue({ remove: mockRemove });
    const mockAdminFrom = jest.fn().mockImplementation((table: string) => {
      if (table === "face_reports") {
        const chain = faceReportChains[faceReportsCallCount];
        faceReportsCallCount++;
        return chain;
      }
      return makeMockChain({ data: null });
    });

    (createServerClient as jest.Mock).mockReturnValue({
      from: (...args: unknown[]) => mockAdminFrom(...args),
      storage: { from: mockStorageFrom },
    });
  });

  const buildRequest = (profileId: string) =>
    new Request("http://localhost/api/face-spoiler/report/generate", {
      method: "POST",
      body: JSON.stringify({
        imagePath: `uploads/${USER_ID}/${profileId}/photo.jpg`,
        imageHash: IMAGE_HASH,
        profileId,
      }),
    });

  it("동일 유저가 다른 프로필로 같은 이미지를 업로드하면 Tier 1 캐시가 히트한다", async () => {
    faceReportChains.push(
      makeMockChain({ data: { share_id: EXISTING_SHARE_ID } })
    );

    const response = await POST(buildRequest(PROFILE_B));
    const json = await response.json();

    expect(json.cached).toBe(true);
    expect(json.shareId).toBe(EXISTING_SHARE_ID);

    // Tier 1 쿼리에 face_profile_id 필터가 없어야 한다
    const [tier1Chain] = faceReportChains;
    const eqCalls = tier1Chain.eq.mock.calls.map((call: unknown[]) => call[0]);
    expect(eqCalls).toContain("user_id");
    expect(eqCalls).toContain("image_hash");
    expect(eqCalls).not.toContain("face_profile_id");

    // Tier 2/3에 도달하지 않아야 한다
    expect(faceReportsCallCount).toBe(1);
  });
});
