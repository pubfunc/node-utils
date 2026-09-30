import { WosAtlasError } from "./error.js";
import type {
  AllianceLeaderboard,
  AllianceLeaderboardParams,
  AllianceMembers,
  AllianceRecruiting,
  AllianceRecruitingParams,
  ErrorResponse,
  GetPlayerResult,
  QuotaInfo,
  QuotaWindow,
  SearchAlliancesParams,
  SearchAlliancesResult,
  SearchPlayersParams,
  SearchPlayersResult,
} from "./types.js";

export const DEFAULT_BASE_URL = "https://api.wosatlas.com";

export interface WosAtlasClientOptions {
  /** Developer API key, begins with `wos_`. */
  apiKey: string;
  baseUrl?: string;
  /** Custom fetch implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface WosAtlasResponse<T> {
  data: T;
  quota: QuotaInfo;
  response: Response;
}

type QueryValue = string | number | boolean | Array<string | number | boolean> | undefined | null;

export class WosAtlasClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly headers: Record<string, string>;

  constructor(options: WosAtlasClientOptions) {
    if (!options.apiKey) {
      throw new TypeError("WosAtlasClient: apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.headers = options.headers ?? {};
  }

  /** Rank alliances by total power, globally or within one State. */
  async allianceLeaderboard(
    params: AllianceLeaderboardParams = {},
    options?: RequestOptions,
  ): Promise<AllianceLeaderboard> {
    return (await this.request<AllianceLeaderboard>("/v1/alliances/leaderboard", params, options)).data;
  }

  /** List alliances open to applications that still have a seat free. */
  async allianceRecruiting(
    params: AllianceRecruitingParams = {},
    options?: RequestOptions,
  ): Promise<AllianceRecruiting> {
    return (await this.request<AllianceRecruiting>("/v1/alliances/recruiting", params, options)).data;
  }

  /** Search alliances by tag or name. Counts against the search quota. */
  async searchAlliances(
    params: SearchAlliancesParams,
    options?: RequestOptions,
  ): Promise<SearchAlliancesResult> {
    return (await this.request<SearchAlliancesResult>("/v1/alliances/search", params, options)).data;
  }

  /** Fetch an alliance and its member roster. */
  async getAllianceMembers(aid: number, options?: RequestOptions): Promise<AllianceMembers> {
    return (
      await this.request<AllianceMembers>(`/v1/alliances/${encodeURIComponent(aid)}/members`, {}, options)
    ).data;
  }

  /** Search players by name fragment, Chief ID or internal uid. Counts against the search quota. */
  async searchPlayers(
    params: SearchPlayersParams,
    options?: RequestOptions,
  ): Promise<SearchPlayersResult> {
    return (await this.request<SearchPlayersResult>("/v1/players/search", params, options)).data;
  }

  /** Fetch one player by the atlas's internal uid (not the in-game Chief ID). */
  async getPlayer(uid: number, options?: RequestOptions): Promise<GetPlayerResult> {
    return (await this.request<GetPlayerResult>(`/v1/players/${encodeURIComponent(uid)}`, {}, options))
      .data;
  }

  /** Low-level GET that also exposes the parsed quota headers and raw response. */
  async request<T>(
    path: string,
    query: Record<string, QueryValue> = {},
    options: RequestOptions = {},
  ): Promise<WosAtlasResponse<T>> {
    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        url.searchParams.append(key, String(item));
      }
    }

    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.headers,
        ...options.headers,
        "X-Api-Key": this.apiKey,
      },
      signal: options.signal,
    });

    const quota = parseQuota(response.headers);

    if (!response.ok) {
      throw await toError(response, quota);
    }

    return { data: (await response.json()) as T, quota, response };
  }
}

function parseNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseWindow(headers: Headers, prefix: string): QuotaWindow {
  return {
    limit: parseNumber(headers.get(`${prefix}-Limit`)),
    remaining: parseNumber(headers.get(`${prefix}-Remaining`)),
    reset: parseNumber(headers.get(`${prefix}-Reset`)),
  };
}

export function parseQuota(headers: Headers): QuotaInfo {
  return {
    quota: parseWindow(headers, "X-Quota"),
    search: parseWindow(headers, "X-Search"),
    rateLimit: parseWindow(headers, "X-RateLimit"),
  };
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value === "") return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** `Retry-After` may be delta-seconds or an HTTP date. */
function parseRetryAfterHeader(value: string | null): Date | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return new Date(Date.now() + seconds * 1000);
  return parseDate(value);
}

async function toError(response: Response, quota: QuotaInfo): Promise<WosAtlasError> {
  let body: Partial<ErrorResponse> | undefined;
  try {
    const parsed: unknown = await response.json();
    if (parsed && typeof parsed === "object") body = parsed as Partial<ErrorResponse>;
  } catch {
    body = undefined;
  }

  return new WosAtlasError({
    status: response.status,
    code: typeof body?.error === "string" ? body.error : `HTTP_${response.status}`,
    message:
      typeof body?.message === "string"
        ? body.message
        : `WOS Atlas request failed with status ${response.status}`,
    details: body?.details,
    retryAfter: parseDate(body?.retryAfter) ?? parseRetryAfterHeader(response.headers.get("Retry-After")),
    timestamp: parseDate(body?.timestamp),
    quota,
    response,
  });
}
