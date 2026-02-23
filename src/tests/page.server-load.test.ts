import { beforeEach, describe, expect, it, vi } from "vitest";
import { load } from "../routes/+page.server";
import { getStoriesInTimeRange } from "$lib/hn-client";
import { PREFERENCE_COOKIE_KEYS } from "$lib/preferences";
import type { HNStory } from "$lib/hn-client";

vi.mock("$lib/hn-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("$lib/hn-client")>();
  return {
    ...actual,
    getStoriesInTimeRange: vi.fn(),
  };
});

function story(overrides: Partial<HNStory>): HNStory {
  return {
    objectID: "story-1",
    title: "Story",
    url: "https://example.com/story",
    points: 100,
    author: "alice",
    created_at_i: 1_700_000_000,
    num_comments: 10,
    ...overrides,
  };
}

function createCookies(initial: Record<string, string | undefined> = {}) {
  const values = new Map<string, string | undefined>(Object.entries(initial));
  const setCalls: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  return {
    values,
    setCalls,
    get(name: string) {
      return values.get(name);
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      values.set(name, value);
      setCalls.push({ name, value, options });
    },
  };
}

function createLoadEvent(urlPath: string, cookies: ReturnType<typeof createCookies>) {
  const headers: Record<string, string> = {};

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: {
      url: new URL(`http://localhost${urlPath}`),
      setHeaders(next: Record<string, string>) {
        Object.assign(headers, next);
      },
      cookies,
      parent: async () => ({ theme: "system" as const }),
    } as any as Parameters<typeof load>[0],
    headers,
  };
}

async function runLoad(event: Parameters<typeof load>[0]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await load(event)) as any;
  if (!result) {
    throw new Error("Expected load() to return page data");
  }

  return result as Record<string, unknown>;
}

describe("+page.server load", () => {
  const mockGetStories = vi.mocked(getStoriesInTimeRange);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers query params over stored cookie preferences", async () => {
    mockGetStories.mockResolvedValue([story({ objectID: "q" })]);
    const cookies = createCookies({
      [PREFERENCE_COOKIE_KEYS.range]: "30d",
      [PREFERENCE_COOKIE_KEYS.sortMode]: "top",
      [PREFERENCE_COOKIE_KEYS.hideRead]: "0",
    });

    const { event, headers } = createLoadEvent("/?range=7d&sort=comments&hideRead=1", cookies);
    const data = await runLoad(event);

    expect(mockGetStories).toHaveBeenCalledWith("7d", 100);
    expect(data.timeRange).toBe("7d");
    expect(data.sortMode).toBe("comments");
    expect(data.hideRead).toBe(true);
    expect(headers["Cache-Control"]).toBe("public, max-age=600, stale-while-revalidate=60");

    expect(cookies.setCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: PREFERENCE_COOKIE_KEYS.range, value: "7d" }),
        expect.objectContaining({ name: PREFERENCE_COOKIE_KEYS.sortMode, value: "comments" }),
        expect.objectContaining({ name: PREFERENCE_COOKIE_KEYS.hideRead, value: "1" }),
      ])
    );
  });

  it("falls back to cookies when query params are missing", async () => {
    mockGetStories.mockResolvedValue([story({ objectID: "cookie" })]);
    const cookies = createCookies({
      [PREFERENCE_COOKIE_KEYS.range]: "30d",
      [PREFERENCE_COOKIE_KEYS.sortMode]: "comments",
      [PREFERENCE_COOKIE_KEYS.hideRead]: "0",
    });

    const { event, headers } = createLoadEvent("/", cookies);
    const data = await runLoad(event);

    expect(mockGetStories).toHaveBeenCalledWith("30d", 100);
    expect(data.timeRange).toBe("30d");
    expect(data.sortMode).toBe("comments");
    expect(data.hideRead).toBe(false);
    expect(headers["Cache-Control"]).toBe("public, max-age=900, stale-while-revalidate=60");
  });

  it("uses defaults for invalid query and cookie values", async () => {
    mockGetStories.mockResolvedValue([story({ objectID: "default" })]);
    const cookies = createCookies({
      [PREFERENCE_COOKIE_KEYS.range]: "90d",
      [PREFERENCE_COOKIE_KEYS.sortMode]: "new",
      [PREFERENCE_COOKIE_KEYS.hideRead]: "maybe",
    });

    const { event, headers } = createLoadEvent("/?range=bad&sort=new&hideRead=wat", cookies);
    const data = await runLoad(event);

    expect(mockGetStories).toHaveBeenCalledWith("24h", 100);
    expect(data.timeRange).toBe("24h");
    expect(data.sortMode).toBe("top");
    expect(data.hideRead).toBe(false);
    expect(headers["Cache-Control"]).toBe("public, max-age=300, stale-while-revalidate=60");
  });

  it("returns fallback payload and no-store cache-control when story load fails", async () => {
    mockGetStories.mockRejectedValue(new Error("boom"));
    const cookies = createCookies();

    const { event, headers } = createLoadEvent("/?range=24h&sort=top", cookies);
    const data = await runLoad(event);

    expect(data.stories).toEqual([]);
    expect(data.error).toBe("Could not load stories right now. Please try again shortly.");
    expect(headers["Cache-Control"]).toBe("no-store");
  });
});
