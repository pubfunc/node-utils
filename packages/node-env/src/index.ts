export class EnvVarError extends Error {
  constructor(key: string, reason: string) {
    super(`Environment variable "${key}": ${reason}`);
    this.name = "EnvVarError";
  }
}

function readRaw(key: string): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return undefined;
  }
  return value;
}

function parseBool(value: string): boolean | undefined {
  switch (value.trim().toLowerCase()) {
    case "true":
    case "1":
    case "yes":
    case "on":
      return true;
    case "false":
    case "0":
    case "no":
    case "off":
      return false;
    default:
      return undefined;
  }
}

function parseIntValue(value: string): number | undefined {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

function parseFloatValue(value: string): number | undefined {
  const parsed = Number.parseFloat(value.trim());
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return parsed;
}

function parseCsvString(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export class Env<TKey extends string = string> {
  str<TDefault = undefined>(
    key: TKey,
    defaultValue?: TDefault,
  ): TDefault extends undefined ? string | undefined : string | TDefault {
    const value = readRaw(key);
    if (value === undefined) {
      return defaultValue as TDefault extends undefined
        ? string | undefined
        : string | TDefault;
    }
    return value as TDefault extends undefined
      ? string | undefined
      : string | TDefault;
  }

  requireStr(key: TKey): string {
    const value = readRaw(key);
    if (value === undefined) {
      throw new EnvVarError(key, "is required");
    }
    return value;
  }

  int<TDefault = undefined>(
    key: TKey,
    defaultValue?: TDefault,
  ): TDefault extends undefined ? number | undefined : number | TDefault {
    const raw = readRaw(key);
    if (raw === undefined) {
      return defaultValue as TDefault extends undefined
        ? number | undefined
        : number | TDefault;
    }
    const value = parseIntValue(raw);
    if (value === undefined) {
      return defaultValue as TDefault extends undefined
        ? number | undefined
        : number | TDefault;
    }
    return value as TDefault extends undefined
      ? number | undefined
      : number | TDefault;
  }

  requireInt(key: TKey): number {
    const raw = readRaw(key);
    if (raw === undefined) {
      throw new EnvVarError(key, "is required");
    }
    const value = parseIntValue(raw);
    if (value === undefined) {
      throw new EnvVarError(key, "must be a valid integer");
    }
    return value;
  }

  float<TDefault = undefined>(
    key: TKey,
    defaultValue?: TDefault,
  ): TDefault extends undefined ? number | undefined : number | TDefault {
    const raw = readRaw(key);
    if (raw === undefined) {
      return defaultValue as TDefault extends undefined
        ? number | undefined
        : number | TDefault;
    }
    const value = parseFloatValue(raw);
    if (value === undefined) {
      return defaultValue as TDefault extends undefined
        ? number | undefined
        : number | TDefault;
    }
    return value as TDefault extends undefined
      ? number | undefined
      : number | TDefault;
  }

  requireFloat(key: TKey): number {
    const raw = readRaw(key);
    if (raw === undefined) {
      throw new EnvVarError(key, "is required");
    }
    const value = parseFloatValue(raw);
    if (value === undefined) {
      throw new EnvVarError(key, "must be a valid number");
    }
    return value;
  }

  bool<TDefault = undefined>(
    key: TKey,
    defaultValue?: TDefault,
  ): TDefault extends undefined ? boolean | undefined : boolean | TDefault {
    const raw = readRaw(key);
    if (raw === undefined) {
      return defaultValue as TDefault extends undefined
        ? boolean | undefined
        : boolean | TDefault;
    }
    const value = parseBool(raw);
    if (value === undefined) {
      return defaultValue as TDefault extends undefined
        ? boolean | undefined
        : boolean | TDefault;
    }
    return value as TDefault extends undefined
      ? boolean | undefined
      : boolean | TDefault;
  }

  requireBool(key: TKey): boolean {
    const raw = readRaw(key);
    if (raw === undefined) {
      throw new EnvVarError(key, "is required");
    }
    const value = parseBool(raw);
    if (value === undefined) {
      throw new EnvVarError(key, "must be a valid boolean");
    }
    return value;
  }

  csvString<TDefault = undefined>(
    key: TKey,
    defaultValue?: TDefault,
  ): TDefault extends undefined ? string[] | undefined : string[] | TDefault {
    const raw = readRaw(key);
    if (raw === undefined) {
      return defaultValue as TDefault extends undefined
        ? string[] | undefined
        : string[] | TDefault;
    }
    return parseCsvString(raw) as TDefault extends undefined
      ? string[] | undefined
      : string[] | TDefault;
  }

  requireCsvString(key: TKey): string[] {
    const raw = readRaw(key);
    if (raw === undefined) {
      throw new EnvVarError(key, "is required");
    }
    return parseCsvString(raw);
  }
}
