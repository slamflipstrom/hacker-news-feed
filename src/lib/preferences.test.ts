import { describe, expect, it } from "vitest";
import {
  encodeEnabledPreference,
  encodeHideReadPreference,
  parseEnabledPreference,
  isTimeRange,
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
    expect(isTimeRange("24h")).toBe(true);
    expect(isTimeRange("7d")).toBe(true);
    expect(isTimeRange("30d")).toBe(true);
    expect(isTimeRange("90d")).toBe(false);
    expect(isTimeRange(null)).toBe(false);
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

  it("parses enabled/disabled preference values", () => {
    expect(parseEnabledPreference("1")).toBe(true);
    expect(parseEnabledPreference("true")).toBe(true);
    expect(parseEnabledPreference("0")).toBe(false);
    expect(parseEnabledPreference("false")).toBe(false);
    expect(parseEnabledPreference("yes")).toBeNull();
    expect(parseEnabledPreference(null)).toBeNull();
  });

  it("encodes enabled/disabled preference values", () => {
    expect(encodeEnabledPreference(true)).toBe("1");
    expect(encodeEnabledPreference(false)).toBe("0");
  });
});
