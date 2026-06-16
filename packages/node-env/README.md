# @pubfunc/node-env

Type-safe wrapper around `process.env`.

## Install

```bash
pnpm add @pubfunc/node-env
```

## Usage

```ts
import { Env } from "@pubfunc/node-env";

type AppEnv = "PORT" | "DEBUG" | "ALLOWED_ORIGINS" | "DATABASE_URL";
const env = new Env<AppEnv>();

// Optional reads (empty string is treated as missing)
const port = env.int("PORT", 3000);
const debug = env.bool("DEBUG", false);
const origins = env.csvString("ALLOWED_ORIGINS", ["http://localhost:3000"]);

// Required reads (throws if missing/empty/invalid)
const databaseUrl = env.requireStr("DATABASE_URL");
```

## API

All methods treat **missing** variables and the **empty string** (`""`) as `undefined`.

- `str(key, default?)`
- `int(key, default?)` (base-10 integer parsing)
- `float(key, default?)`
- `bool(key, default?)` (`true/1/yes/on` and `false/0/no/off`, case-insensitive)
- `csvString(key, default?)` (splits on `,`, trims, drops empty items)

Each has a `requireX` variant that throws if missing/empty/invalid:

- `requireStr(key)`
- `requireInt(key)`
- `requireFloat(key)`
- `requireBool(key)`
- `requireCsvString(key)`

Errors are thrown as `EnvVarError`.

