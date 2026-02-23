import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HNStory } from "$lib/hn-client";
import {
  formatTime,
  getCommentsHref,
  getStoryDomain,
  getStoryElementId,
  getStoryFaviconUrl,
  getStoryHref,
  sortStories,
} from "./story-utils";

function createStory(overrides: Partial<HNStory>): HNStory {
  return {
    objectID: "s-1",
    title: "Story",
    url: "https://example.com/story",
    points: 100,
    author: "alice",
    created_at_i: 1_700_000_000,
    num_comments: 10,
    ...overrides,
  };
}

describe("story-utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns expected story and comments hrefs", () => {
    const withUrl = createStory({ objectID: "123", url: "https://foo.dev/path" });
    const withoutUrl = createStory({ objectID: "456", url: undefined });

    expect(getStoryHref(withUrl)).toBe("https://foo.dev/path");
    expect(getStoryHref(withoutUrl)).toBe("https://news.ycombinator.com/item?id=456");
    expect(getCommentsHref(withUrl)).toBe("https://news.ycombinator.com/item?id=123");
  });

  it("resolves story domain with fallback", () => {
    expect(getStoryDomain(createStory({ url: "https://www.example.com/post" }))).toBe(
      "example.com"
    );
    expect(getStoryDomain(createStory({ url: undefined }))).toBe("news.ycombinator.com");
    expect(getStoryDomain(createStory({ url: "not-a-url" }))).toBe("news.ycombinator.com");
  });

  it("creates encoded favicon URL", () => {
    const url = getStoryFaviconUrl(createStory({ url: "https://www.example.com/post" }));
    expect(url).toBe("https://www.google.com/s2/favicons?domain=example.com&sz=32");
  });

  it("sorts stories by top with created_at_i tiebreaker", () => {
    const stories = [
      createStory({ objectID: "a", points: 50, created_at_i: 100 }),
      createStory({ objectID: "b", points: 60, created_at_i: 90 }),
      createStory({ objectID: "c", points: 50, created_at_i: 110 }),
    ];

    const sorted = sortStories(stories, "top");
    expect(sorted.map((story) => story.objectID)).toEqual(["b", "c", "a"]);
  });

  it("sorts stories by comments with points tiebreaker", () => {
    const stories = [
      createStory({ objectID: "a", num_comments: 10, points: 70 }),
      createStory({ objectID: "b", num_comments: 12, points: 60 }),
      createStory({ objectID: "c", num_comments: 10, points: 90 }),
    ];

    const sorted = sortStories(stories, "comments");
    expect(sorted.map((story) => story.objectID)).toEqual(["b", "c", "a"]);
  });

  it("formats timestamps across boundaries", () => {
    const nowSeconds = Math.floor(new Date("2026-02-23T12:00:00Z").getTime() / 1000);

    expect(formatTime(nowSeconds - 10 * 60)).toBe("just now");
    expect(formatTime(nowSeconds - 2 * 60 * 60)).toBe("2h ago");
    expect(formatTime(nowSeconds - 2 * 24 * 60 * 60)).toBe("2d ago");

    const olderTimestamp = nowSeconds - 10 * 24 * 60 * 60;
    expect(formatTime(olderTimestamp)).toBe(new Date(olderTimestamp * 1000).toLocaleDateString());
  });

  it("creates stable story element ids", () => {
    expect(getStoryElementId("abc")).toBe("story-abc");
  });
});
