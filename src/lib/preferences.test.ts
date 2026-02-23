import { describe, expect, it } from "vitest";
import {
  encodeHideReadPreference,
  isPreferredRange,
  isSortMode,
  isThemeMode,
  parseHideReadPreference,
} from "./preferences";

describe("preferences helpers", () => {
  it("validates supported sort modes", () => {
    expect(isSortMode("top")).toBe(true);
    expect(isSortMode("comments")).toBe(true);
    expect(isSortMode("new")).toBe(false);
    expect(isSortMode(null)).toBe(false);
  });

  it("validates supported theme modes", () => {
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("light")).toBe(true);
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("night")).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });

  it("validates preferred time ranges", () => {
    expect(isPreferredRange("24h")).toBe(true);
    expect(isPreferredRange("7d")).toBe(true);
    expect(isPreferredRange("30d")).toBe(true);
    expect(isPreferredRange("90d")).toBe(false);
    expect(isPreferredRange(null)).toBe(false);
  });

  it("parses hide-read values", () => {
    expect(parseHideReadPreference("1")).toBe(true);
    expect(parseHideReadPreference("true")).toBe(true);
    expect(parseHideReadPreference("0")).toBe(false);
    expect(parseHideReadPreference("false")).toBe(false);
    expect(parseHideReadPreference(null)).toBeNull();
  });

  it("returns null for unsupported hide-read values", () => {
    expect(parseHideReadPreference("yes")).toBeNull();
    expect(parseHideReadPreference("")) .toBeNull();
  });

  it("encodes hide-read values", () => {
    expect(encodeHideReadPreference(true)).toBe("1");
    expect(encodeHideReadPreference(false)).toBe("0");
  });
});
