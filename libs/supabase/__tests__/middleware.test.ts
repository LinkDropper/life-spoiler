import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

import { refreshSupabaseSession } from "../middleware";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

const mockedCreateServerClient = createServerClient as jest.Mock;

const AUTH_COOKIE = "sb-project-auth-token";

const createRequest = (cookie?: string) =>
  new NextRequest("https://www.life-spoiler.com/", {
    headers: cookie ? { cookie } : {},
  });

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options: object }[]) => void;
};

const mockClient = (
  onGetClaims: (cookies: CookieMethods) => void = () => {}
) => {
  mockedCreateServerClient.mockImplementation(
    (_url: string, _key: string, { cookies }: { cookies: CookieMethods }) => ({
      auth: {
        getClaims: jest.fn(async () => {
          onGetClaims(cookies);
          return { data: null, error: null };
        }),
      },
    })
  );
};

describe("refreshSupabaseSession", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("인증 쿠키가 없으면 Supabase 클라이언트를 만들지 않는다", async () => {
    const result = await refreshSupabaseSession(
      createRequest("NEXT_LOCALE=ko")
    );

    expect(result).toEqual([]);
    expect(mockedCreateServerClient).not.toHaveBeenCalled();
  });

  it("환경 변수가 없으면 아무것도 하지 않는다", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const result = await refreshSupabaseSession(
      createRequest(`${AUTH_COOKIE}=old`)
    );

    expect(result).toEqual([]);
    expect(mockedCreateServerClient).not.toHaveBeenCalled();
  });

  it("갱신된 쿠키를 요청에 반영하고 응답용으로 반환한다", async () => {
    const refreshed = [
      { name: AUTH_COOKIE, value: "new", options: { path: "/" } },
    ];
    mockClient((cookies) => {
      expect(cookies.getAll()).toEqual([{ name: AUTH_COOKIE, value: "old" }]);
      cookies.setAll(refreshed);
    });
    const request = createRequest(`${AUTH_COOKIE}=old`);

    const result = await refreshSupabaseSession(request);

    expect(result).toEqual(refreshed);
    expect(request.cookies.get(AUTH_COOKIE)?.value).toBe("new");
    expect(request.headers.get("cookie")).toContain(`${AUTH_COOKIE}=new`);
  });

  it("세션이 유효해서 갱신이 없으면 빈 배열을 반환한다", async () => {
    mockClient();

    const result = await refreshSupabaseSession(
      createRequest(`${AUTH_COOKIE}=valid`)
    );

    expect(result).toEqual([]);
  });
});
