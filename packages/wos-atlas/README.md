# @pubfunc/wos-atlas

Typed, zero-dependency SDK for the [Whiteout Survival Atlas API](https://wosatlas.com/developers), built on the standard `fetch` API.

## Install

```bash
npm install @pubfunc/wos-atlas
```

Requires Node.js 18+ (or any runtime with a global `fetch`).

## Usage

```ts
import { WosAtlasClient, WosAtlasError } from "@pubfunc/wos-atlas";

const atlas = new WosAtlasClient({ apiKey: process.env.WOS_ATLAS_API_KEY! });

const { players } = await atlas.searchPlayers({ playerName: "LordFrost", kingdomIds: [165] });
const player = await atlas.getPlayer(players[0].uid);

const leaderboard = await atlas.allianceLeaderboard({ kid: 165, limit: 25 });
const recruiting = await atlas.allianceRecruiting({ kid: 165, minLevel: 25 });
const { alliances } = await atlas.searchAlliances({ tag: "EVL" });
const roster = await atlas.getAllianceMembers(alliances[0].aid);
```

### Options

| Option    | Default                     | Description                              |
| --------- | --------------------------- | ---------------------------------------- |
| `apiKey`  | required                    | Developer API key (`wos_...`)            |
| `baseUrl` | `https://api.wosatlas.com`  | API base URL                             |
| `fetch`   | `globalThis.fetch`          | Custom fetch implementation              |
| `headers` | `{}`                        | Extra headers sent with every request    |

Every method also accepts `{ signal, headers }` as its last argument.

### Quota headers

Use the low-level `request()` method to get the parsed quota/rate-limit headers alongside the data:

```ts
const { data, quota } = await atlas.request("/v1/players/400001");
quota.quota.remaining;     // rolling 30-day read quota
quota.search.remaining;    // rolling 24-hour search quota
quota.rateLimit.remaining; // short burst window
```

### Errors

Non-2xx responses throw a `WosAtlasError`. Per the API's retry policy, branch on `code` and `retryAfter`, not on remaining counters:

```ts
try {
  await atlas.searchPlayers({ playerName: "LordFrost" });
} catch (err) {
  if (err instanceof WosAtlasError && err.code === "RATE_LIMIT_EXCEEDED") {
    // wait until err.retryAfter, then retry
  }
}
```

Error codes: `INVALID_API_KEY` (401), `ENDPOINT_NOT_ALLOWED` (403), `QUOTA_EXCEEDED`, `SEARCH_QUOTA_EXCEEDED`, `RATE_LIMIT_EXCEEDED` (429).

## Types

All request/response types are generated from the [OpenAPI schema](https://wosatlas.com/developer-api/openapi.json) with [openapi-typescript](https://openapi-ts.dev) and exported (`Player`, `AllianceMember`, `AllianceLeaderboardEntry`, ..., plus the raw `paths`, `components`, `operations`).

To regenerate `src/schema.ts` after the API changes:

```bash
pnpm --filter @pubfunc/wos-atlas generate
```
