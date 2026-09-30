import type { ErrorCode, QuotaInfo } from "./types.js";

export interface WosAtlasErrorInit {
  status: number;
  code: ErrorCode | (string & {});
  message: string;
  details?: Record<string, unknown>;
  retryAfter?: Date;
  timestamp?: Date;
  quota: QuotaInfo;
  response: Response;
}

export class WosAtlasError extends Error {
  readonly status: number;
  /** The API `error` code, or `HTTP_<status>` when the body is not a recognised error payload. */
  readonly code: ErrorCode | (string & {});
  readonly details: Record<string, unknown>;
  readonly retryAfter?: Date;
  readonly timestamp?: Date;
  readonly quota: QuotaInfo;
  readonly response: Response;

  constructor(init: WosAtlasErrorInit) {
    super(init.message);
    this.name = "WosAtlasError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? {};
    this.retryAfter = init.retryAfter;
    this.timestamp = init.timestamp;
    this.quota = init.quota;
    this.response = init.response;
  }
}
