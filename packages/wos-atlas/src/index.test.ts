import { describe, expect, it, vi } from "vitest";
import { WosAtlasClient, WosAtlasError } from "./index.js";

const quotaHeaders = {
  "X-Quota-Limit": "10000",
  "X-Quota-Remaining": "9999",
  "X-Quota-Reset": "1790000000",
  "X-Search-Limit": "500",
  "X-Search-Remaining": "0",
  "X-Search-Reset": "1790000100",
  "X-RateLimit-Limit": "10",
  "X-RateLimit-Remaining": "9",
  "X-RateLimit-Reset": "1790000001",
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...quotaHeaders, ...headers },
  });
}

function setup(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  const client = new WosAtlasClient({ apiKey: "wos_test", fetch: fetchMock });
  const call = () => {
    const [input, init] = fetchMock.mock.calls[0]!;
    return { url: new URL(String(input)), init: init! };
  };
  return { client, fetchMock, call };
}

describe("WosAtlasClient", () => {
  it("requires an api key", () => {
    expect(() => new WosAtlasClient({ apiKey: "" })).toThrow(TypeError);
  });

  it("sends the api key and hits the default base url", async () => {
    const body = { idOutcome: "MATCHED", players: [], stateKid: 165, viewerTier: "DEVELOPER" };
    const { client, call } = setup(jsonResponse(body));

    await expect(client.getPlayer(400001)).resolves.toEqual(body);

    const { url, init } = call();
    expect(url.href).toBe("https://api.wosatlas.com/v1/players/400001");
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("wos_test");
    expect(init.method).toBe("GET");
  });

  it("serialises query params, repeating arrays and skipping undefined", async () => {
    const { client, call } = setup(jsonResponse({ alliances: [], viewerTier: "DEVELOPER" }));

    await client.searchAlliances({ tag: "EVL", kingdomIds: [165, 166] });

    const { url } = call();
    expect(url.pathname).toBe("/v1/alliances/search");
    expect(url.searchParams.get("tag")).toBe("EVL");
    expect(url.searchParams.getAll("kingdomIds")).toEqual(["165", "166"]);
  });

  it("omits undefined query values", async () => {
    const { client, call } = setup(jsonResponse({ entries: [], kid: 0, recordedAt: "" }));

    await client.allianceLeaderboard({ kid: undefined, limit: 25 });

    expect(call().url.search).toBe("?limit=25");
  });

  it("respects a custom base url", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}));
    const client = new WosAtlasClient({
      apiKey: "wos_test",
      baseUrl: "http://localhost:8080/",
      fetch: fetchMock,
    });

    await client.getAllianceMembers(1000015);

    expect(String(fetchMock.mock.calls[0]![0])).toBe("http://localhost:8080/v1/alliances/1000015/members");
  });

  it("exposes parsed quota headers via request()", async () => {
    const { client } = setup(jsonResponse({ ok: true }));

    const res = await client.request<{ ok: boolean }>("/v1/players/1");

    expect(res.data).toEqual({ ok: true });
    expect(res.quota).toEqual({
      quota: { limit: 10000, remaining: 9999, reset: 1790000000 },
      search: { limit: 500, remaining: 0, reset: 1790000100 },
      rateLimit: { limit: 10, remaining: 9, reset: 1790000001 },
    });
  });

  it("throws a WosAtlasError built from the error body", async () => {
    const { client } = setup(
      jsonResponse(
        {
          error: "SEARCH_QUOTA_EXCEEDED",
          message: "Search quota spent",
          details: { window: "24h" },
          retryAfter: "2026-10-01T00:00:00Z",
          timestamp: "2026-09-30T10:00:00Z",
        },
        429,
      ),
    );

    const err = await client.searchPlayers({ playerName: "LordFrost" }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(WosAtlasError);
    const e = err as WosAtlasError;
    expect(e.status).toBe(429);
    expect(e.code).toBe("SEARCH_QUOTA_EXCEEDED");
    expect(e.message).toBe("Search quota spent");
    expect(e.details).toEqual({ window: "24h" });
    expect(e.retryAfter?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(e.quota.search.remaining).toBe(0);
    expect(e.quota.quota.remaining).toBe(9999);
  });

  it("falls back to the Retry-After header and HTTP_<status> code for non-JSON errors", async () => {
    const response = new Response("Bad gateway", { status: 502, headers: { "Retry-After": "30" } });
    const { client } = setup(response);
    const before = Date.now();

    const e = (await client.getPlayer(1).catch((err: unknown) => err)) as WosAtlasError;

    expect(e).toBeInstanceOf(WosAtlasError);
    expect(e.code).toBe("HTTP_502");
    expect(e.retryAfter!.getTime()).toBeGreaterThanOrEqual(before + 30_000);
  });
});
