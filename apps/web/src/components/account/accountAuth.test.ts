import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const ORIGIN = "http://localhost:5733";
const RELAY = "http://localhost:8787";

function fakeJwt(claims: Record<string, unknown>): string {
  const part = (value: unknown) => btoa(JSON.stringify(value)).replace(/=+$/u, "");
  return `${part({ alg: "EdDSA", typ: "JWT" })}.${part(claims)}.sig`;
}

const token = fakeJwt({ sub: "user-1", email: "a@example.test" });

class FakeChannel {
  static all: FakeChannel[] = [];
  onmessage: (() => void) | null = null;
  constructor() {
    FakeChannel.all.push(this);
  }
  postMessage() {
    for (const other of FakeChannel.all) if (other !== this) other.onmessage?.();
  }
}

let fetchMock: ReturnType<typeof vi.fn>;
let assign: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  FakeChannel.all = [];
  const storage = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  assign = vi.fn();
  vi.stubGlobal("window", { location: Object.assign(new URL(`${ORIGIN}/settings`), { assign }) });
  vi.stubGlobal("BroadcastChannel", FakeChannel);
  vi.stubEnv("VITE_VEKREL_RELAY_URL", RELAY);
  // No cookie yet: the relay refuses the refresh.
  fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    const body = new URLSearchParams(init.body as string);
    if (url.endsWith("/oauth/token") && body.get("grant_type") === "authorization_code") {
      return Response.json({ access_token: token, expires_in: 600 });
    }
    return Response.json({ error: "invalid_grant" }, { status: 400 });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function startedSignIn(returnTo?: string) {
  const auth = await import("./accountAuth");
  auth.startAccountSignIn(returnTo);
  const authorize = new URL(assign.mock.calls[0]![0] as string);
  const callback = `${ORIGIN}/auth/callback?code=code-1&state=${authorize.searchParams.get("state")}`;
  return { auth, authorize, callback };
}

describe("web account auth", () => {
  it("authorizes at the relay with this origin's callback", async () => {
    const { authorize } = await startedSignIn();

    expect(`${authorize.origin}${authorize.pathname}`).toBe(`${RELAY}/oauth/authorize`);
    expect(authorize.searchParams.get("client_id")).toBe("vekrel-web");
    expect(authorize.searchParams.get("redirect_uri")).toBe(`${ORIGIN}/auth/callback`);
  });

  it("exchanges the code with the cookie and returns to the page sign-in started on", async () => {
    const { auth, callback } = await startedSignIn(`${ORIGIN}/settings/connections?x=1#y`);

    await expect(auth.completeAccountSignIn(callback)).resolves.toBe("/settings/connections?x=1#y");
    const exchange = fetchMock.mock.calls.find(([, init]) =>
      String(init.body).includes("authorization_code"),
    )!;
    expect(exchange[1].credentials).toBe("include");
    await expect(auth.getAccountToken()).resolves.toBe(token);
  });

  it("uses a pending sign-in once, so a reloaded callback cannot replay it", async () => {
    const { auth, callback } = await startedSignIn();

    await auth.completeAccountSignIn(callback);
    await expect(auth.completeAccountSignIn(callback)).rejects.toThrow(/not started in this tab/u);
  });

  it("never returns to another origin", async () => {
    const { auth, callback } = await startedSignIn("https://evil.example.test/steal");

    await expect(auth.completeAccountSignIn(callback)).resolves.toBe("/");
  });

  it("refuses a callback whose state is not this tab's", async () => {
    const { auth } = await startedSignIn();

    await expect(
      auth.completeAccountSignIn(`${ORIGIN}/auth/callback?code=code-1&state=forged`),
    ).rejects.toThrow(/does not belong/u);
  });

  it("wakes a signed-out tab when another tab signs in", async () => {
    const { auth, callback } = await startedSignIn();
    await expect(auth.getAccountToken()).resolves.toBeNull();
    const refreshes = () =>
      fetchMock.mock.calls.filter(([, init]) => String(init.body).includes("refresh_token")).length;
    const before = refreshes();

    // Another tab: same cookie jar, its own session and channel.
    new FakeChannel().postMessage();
    await vi.waitFor(() => expect(refreshes()).toBe(before + 1));
    // This tab's own completion also announces; it must not throw.
    await auth.completeAccountSignIn(callback);
  });
});
