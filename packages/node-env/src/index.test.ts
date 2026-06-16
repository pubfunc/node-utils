import { afterEach, describe, expect, it } from "vitest";
import { Env, EnvVarInvalidError, EnvVarMissingError } from "./index.js";

const TEST_KEY = "NODE_ENV_TEST_VAR";

afterEach(() => {
  delete process.env[TEST_KEY];
});

describe("Env", () => {
  const env = new Env();

  describe("str", () => {
    it("returns the value when set", () => {
      process.env[TEST_KEY] = "hello";
      expect(env.str(TEST_KEY)).toBe("hello");
    });

    it("returns undefined when missing", () => {
      expect(env.str(TEST_KEY)).toBeUndefined();
    });

    it("returns the default when missing", () => {
      expect(env.str(TEST_KEY, "fallback")).toBe("fallback");
    });

    it("treats empty string as missing", () => {
      process.env[TEST_KEY] = "";
      expect(env.str(TEST_KEY)).toBeUndefined();
      expect(env.str(TEST_KEY, "fallback")).toBe("fallback");
    });
  });

  describe("requireStr", () => {
    it("returns the value when set", () => {
      process.env[TEST_KEY] = "hello";
      expect(env.requireStr(TEST_KEY)).toBe("hello");
    });

    it("throws when missing or empty", () => {
      expect(() => env.requireStr(TEST_KEY)).toThrow(EnvVarMissingError);
      process.env[TEST_KEY] = "";
      expect(() => env.requireStr(TEST_KEY)).toThrow(EnvVarMissingError);
    });
  });

  describe("int", () => {
    it("parses integers", () => {
      process.env[TEST_KEY] = "42";
      expect(env.int(TEST_KEY)).toBe(42);
    });

    it("returns default for missing or invalid values", () => {
      expect(env.int(TEST_KEY, 7)).toBe(7);
      process.env[TEST_KEY] = "not-a-number";
      expect(env.int(TEST_KEY, 7)).toBe(7);
    });
  });

  describe("requireInt", () => {
    it("parses integers", () => {
      process.env[TEST_KEY] = "42";
      expect(env.requireInt(TEST_KEY)).toBe(42);
    });

    it("throws when missing", () => {
      expect(() => env.requireInt(TEST_KEY)).toThrow(EnvVarMissingError);
    });

    it("throws when invalid", () => {
      process.env[TEST_KEY] = "abc";
      expect(() => env.requireInt(TEST_KEY)).toThrow(EnvVarInvalidError);
    });
  });

  describe("float", () => {
    it("parses floats", () => {
      process.env[TEST_KEY] = "3.14";
      expect(env.float(TEST_KEY)).toBe(3.14);
    });

    it("returns default for missing or invalid values", () => {
      expect(env.float(TEST_KEY, 1.5)).toBe(1.5);
      process.env[TEST_KEY] = "not-a-number";
      expect(env.float(TEST_KEY, 1.5)).toBe(1.5);
    });
  });

  describe("requireFloat", () => {
    it("parses floats", () => {
      process.env[TEST_KEY] = "3.14";
      expect(env.requireFloat(TEST_KEY)).toBe(3.14);
    });

    it("throws when missing", () => {
      expect(() => env.requireFloat(TEST_KEY)).toThrow(EnvVarMissingError);
    });

    it("throws when invalid", () => {
      process.env[TEST_KEY] = "abc";
      expect(() => env.requireFloat(TEST_KEY)).toThrow(EnvVarInvalidError);
    });
  });

  describe("bool", () => {
    it.each([
      ["true", true],
      ["TRUE", true],
      ["1", true],
      ["yes", true],
      ["on", true],
      ["false", false],
      ["0", false],
      ["no", false],
      ["off", false],
    ])("parses %s as %s", (input, expected) => {
      process.env[TEST_KEY] = input;
      expect(env.bool(TEST_KEY)).toBe(expected);
    });

    it("returns default for missing or invalid values", () => {
      expect(env.bool(TEST_KEY, true)).toBe(true);
      process.env[TEST_KEY] = "maybe";
      expect(env.bool(TEST_KEY, false)).toBe(false);
    });
  });

  describe("requireBool", () => {
    it("parses booleans", () => {
      process.env[TEST_KEY] = "true";
      expect(env.requireBool(TEST_KEY)).toBe(true);
    });

    it("throws when missing", () => {
      expect(() => env.requireBool(TEST_KEY)).toThrow(EnvVarMissingError);
    });

    it("throws when invalid", () => {
      process.env[TEST_KEY] = "maybe";
      expect(() => env.requireBool(TEST_KEY)).toThrow(EnvVarInvalidError);
    });
  });

  describe("csvString", () => {
    it("splits comma-separated values", () => {
      process.env[TEST_KEY] = "a, b , c";
      expect(env.csvString(TEST_KEY)).toEqual(["a", "b", "c"]);
    });

    it("returns default when missing", () => {
      expect(env.csvString(TEST_KEY, ["x"])).toEqual(["x"]);
    });
  });

  describe("requireCsvString", () => {
    it("splits comma-separated values", () => {
      process.env[TEST_KEY] = "a,b";
      expect(env.requireCsvString(TEST_KEY)).toEqual(["a", "b"]);
    });

    it("throws when missing", () => {
      expect(() => env.requireCsvString(TEST_KEY)).toThrow(EnvVarMissingError);
    });
  });

  describe("typed keys", () => {
    it("restricts keys to the provided union", () => {
      type AppEnv = "PORT" | "DEBUG";
      const typedEnv = new Env<AppEnv>();
      process.env.PORT = "3000";
      expect(typedEnv.int("PORT")).toBe(3000);
    });
  });
});
