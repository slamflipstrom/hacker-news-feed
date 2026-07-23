import { describe, expect, it } from "vitest";
import type { HNStory } from "$lib/hn-client";
import { FIRST_SEEN_MAX_AGE_MS } from "./constants";
import { hydrateFirstSeen, isStoryNew, recordFirstSeen } from "./first-seen";

const NOW = Date.parse("2026-07-19T12:00:00Z");

function createStory(objectID: string): HNStory {
  return {
    objectID,
    title: `Story ${objectID}`,
    url: `https://example.com/${objectID}`,
    points: 100,
    author: "alice",
    created_at_i: Math.floor(NOW / 1000) - 3600,
    num_comments: 10,
  };
}

describe("hydrateFirstSeen", () => {
  it("treats a missing store as a first visit", () => {
    expect(hydrateFirstSeen(null, NOW)).toEqual({
      firstSeenAtByStoryId: {},
      hasPriorVisit: false,
    });
  });

  it("keeps recent entries and reports a prior visit", () => {
    const stored = JSON.stringify({ a: NOW - 1000, b: NOW - 2000 });

    expect(hydrateFirstSeen(stored, NOW)).toEqual({
      firstSeenAtByStoryId: { a: NOW - 1000, b: NOW - 2000 },
      hasPriorVisit: true,
    });
  });

  it("prunes entries older than the max age, keeping ones exactly at the boundary", () => {
    const atCutoff = NOW - FIRST_SEEN_MAX_AGE_MS;
    const stored = JSON.stringify({ fresh: atCutoff, stale: atCutoff - 1 });

    expect(hydrateFirstSeen(stored, NOW).firstSeenAtByStoryId).toEqual({ fresh: atCutoff });
  });

  it("treats a fully pruned store as a first visit so nothing gets badged", () => {
    const stored = JSON.stringify({ old: NOW - FIRST_SEEN_MAX_AGE_MS - 1 });

    expect(hydrateFirstSeen(stored, NOW)).toEqual({
      firstSeenAtByStoryId: {},
      hasPriorVisit: false,
    });
  });

  it("treats malformed or wrongly shaped stores as a first visit", () => {
    expect(hydrateFirstSeen("not json{{{", NOW).hasPriorVisit).toBe(false);
    expect(hydrateFirstSeen("[1,2]", NOW).hasPriorVisit).toBe(false);
    expect(hydrateFirstSeen('"a"', NOW).hasPriorVisit).toBe(false);
  });

  it("drops non-numeric and non-finite timestamps", () => {
    const stored = `{"good": ${NOW}, "bad": "x", "worse": null, "inf": 1e999}`;

    expect(hydrateFirstSeen(stored, NOW)).toEqual({
      firstSeenAtByStoryId: { good: NOW },
      hasPriorVisit: true,
    });
  });
});

describe("recordFirstSeen", () => {
  it("stamps unseen stories with now and preserves existing timestamps", () => {
    const existing = { a: NOW - 5000 };

    expect(recordFirstSeen(existing, [createStory("a"), createStory("b")], NOW)).toEqual({
      a: NOW - 5000,
      b: NOW,
    });
  });

  it("returns the same reference when every story is already seen", () => {
    const existing = { a: NOW - 5000 };

    expect(recordFirstSeen(existing, [createStory("a")], NOW)).toBe(existing);
    expect(recordFirstSeen(existing, [], NOW)).toBe(existing);
  });
});

describe("isStoryNew", () => {
  const sessionStartedAt = NOW - 1000;

  it("badges only stories first seen during this session, given a prior visit", () => {
    expect(isStoryNew(NOW, sessionStartedAt, true)).toBe(true);
    expect(isStoryNew(sessionStartedAt, sessionStartedAt, true)).toBe(true);
    expect(isStoryNew(sessionStartedAt - 1, sessionStartedAt, true)).toBe(false);
    expect(isStoryNew(undefined, sessionStartedAt, true)).toBe(false);
  });

  it("never badges on a first visit", () => {
    expect(isStoryNew(NOW, sessionStartedAt, false)).toBe(false);
  });
});
