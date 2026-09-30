import type { components, operations } from "./schema.js";

export type OperationId = keyof operations;

export type QueryParams<K extends OperationId> = NonNullable<
  operations[K]["parameters"]["query"]
>;

export type ResponseBody<K extends OperationId> =
  operations[K]["responses"][200]["content"]["application/json"];

export type ErrorResponse = components["schemas"]["ErrorResponse"];

export type AllianceLeaderboardParams = QueryParams<"allianceLeaderboard">;
export type AllianceLeaderboard = ResponseBody<"allianceLeaderboard">;
export type AllianceLeaderboardEntry = AllianceLeaderboard["entries"][number];

export type AllianceRecruitingParams = QueryParams<"allianceRecruiting">;
export type AllianceRecruiting = ResponseBody<"allianceRecruiting">;
export type AllianceRecruitingEntry = AllianceRecruiting["entries"][number];

export type SearchAlliancesParams = QueryParams<"searchAlliances">;
export type SearchAlliancesResult = ResponseBody<"searchAlliances">;
export type AllianceSearchHit = SearchAlliancesResult["alliances"][number];

export type AllianceMembers = ResponseBody<"getAllianceMembers">;
export type AllianceMember = AllianceMembers["members"][number];

export type SearchPlayersParams = QueryParams<"searchPlayers">;
export type SearchPlayersResult = ResponseBody<"searchPlayers">;

export type GetPlayerResult = ResponseBody<"getPlayer">;
export type Player = GetPlayerResult["players"][number];

export type ViewerTier = GetPlayerResult["viewerTier"];

export type ErrorCode =
  | "INVALID_API_KEY"
  | "ENDPOINT_NOT_ALLOWED"
  | "QUOTA_EXCEEDED"
  | "SEARCH_QUOTA_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED";

export interface QuotaWindow {
  limit?: number;
  remaining?: number;
  /** Unix seconds at which the oldest request in the window ages out. */
  reset?: number;
}

export interface QuotaInfo {
  /** Rolling thirty-day read quota. */
  quota: QuotaWindow;
  /** Rolling twenty-four-hour search quota. */
  search: QuotaWindow;
  /** Short burst window. */
  rateLimit: QuotaWindow;
}
