import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStoriesInTimeRange, type HNStory } from "./hn-client";

interface AlgoliaPayload {
  hits: HNStory[];
  page: number;
  nbPages: number;
}

function responseFrom(payload: AlgoliaPayload, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

describe("hn-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries retryable HTTP failures and eventually succeeds", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(responseFrom({ hits: [], page: 0, nbPages: 1 }, 500))
      .mockResolvedValueOnce(
        responseFrom(
          {
            hits: [story({ objectID: "ok", points: 42, title: "Recovered" })],
            page: 0,
            nbPages: 1,
          },
          200
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const pending = getStoriesInTimeRange("24h", 10);
    await vi.advanceTimersByTimeAsync(250);
    const stories = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(stories).toHaveLength(1);
    expect(stories[0]?.objectID).toBe("ok");
  });

  it("does not retry non-retryable HTTP status", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValue(responseFrom({ hits: [], page: 0, nbPages: 1 }, 400));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getStoriesInTimeRange("24h", 10)).rejects.toThrow("Algolia API error: 400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network errors and then succeeds", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new TypeError("network down"))
      .mockResolvedValueOnce(
        responseFrom(
          {
            hits: [story({ objectID: "recovered", points: 25 })],
            page: 0,
            nbPages: 1,
          },
          200
        )
      );

    vi.stubGlobal("fetch", fetchMock);

    const pending = getStoriesInTimeRange("24h", 10);
    await vi.advanceTimersByTimeAsync(250);
    const stories = await pending;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(stories[0]?.objectID).toBe("recovered");
  });

  it("fetches up to five pages when many pages are available", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>().mockImplementation(async (url) => {
      const requestUrl = new URL(url);
      const page = Number(requestUrl.searchParams.get("page") ?? "0");

      return responseFrom(
        {
          hits: [story({ objectID: `story-${page}`, points: 100 - page, title: `Story ${page}` })],
          page,
          nbPages: 10,
        },
        200
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const stories = await getStoriesInTimeRange("24h", 10);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(stories).toHaveLength(5);
  });

  it("stops early when first response indicates one page", async () => {
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValue(responseFrom({ hits: [story({ objectID: "only" })], page: 0, nbPages: 1 }, 200));

    vi.stubGlobal("fetch", fetchMock);

    const stories = await getStoriesInTimeRange("24h", 10);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(stories).toHaveLength(1);
  });

  it("dedupes, filters missing titles, sorts by points, and applies limit", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>().mockImplementation(async (url) => {
      const page = Number(new URL(url).searchParams.get("page") ?? "0");
      if (page === 0) {
        return responseFrom(
          {
            page,
            nbPages: 2,
            hits: [
              story({ objectID: "dup", title: "Old dup", points: 20 }),
              story({ objectID: "high", title: "High", points: 90 }),
              story({ objectID: "no-title", title: "", points: 999 }),
            ],
          },
          200
        );
      }

      return responseFrom(
        {
          page,
          nbPages: 2,
          hits: [
            story({ objectID: "dup", title: "New dup", points: 60 }),
            story({ objectID: "mid", title: "Mid", points: 50 }),
          ],
        },
        200
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const stories = await getStoriesInTimeRange("24h", 2);

    expect(stories.map((entry) => entry.objectID)).toEqual(["high", "dup"]);
    expect(stories[1]?.title).toBe("New dup");
  });

  it("builds expected search query parameters", async () => {
    const fetchMock = vi
      .fn<(url: string) => Promise<Response>>()
      .mockResolvedValue(responseFrom({ hits: [], page: 0, nbPages: 1 }, 200));

    vi.stubGlobal("fetch", fetchMock);

    await getStoriesInTimeRange("7d", 10);

    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0] ?? "");
    expect(calledUrl.pathname).toBe("/api/v1/search");
    expect(calledUrl.searchParams.get("tags")).toBe("story");
    expect(calledUrl.searchParams.get("hitsPerPage")).toBe("200");
    expect(calledUrl.searchParams.get("page")).toBe("0");

    const nowSeconds = Math.floor(new Date("2026-02-23T12:00:00Z").getTime() / 1000);
    const expectedCutoff = nowSeconds - 604800;
    expect(calledUrl.searchParams.get("numericFilters")).toBe(
      `created_at_i>${expectedCutoff},points>10`
    );
  });
});
