export interface HNStory {
  objectID: string;
  title: string;
  url?: string;
  points: number;
  author: string;
  created_at_i: number;
  num_comments: number;
}

export const TIME_RANGES = ["24h", "7d", "30d"] as const;
export type TimeRange = (typeof TIME_RANGES)[number];

const TIME_RANGE_SECONDS: Record<TimeRange, number> = {
  "24h": 86400,
  "7d": 604800,
  "30d": 2592000,
};

const ALGOLIA_API_BASE = "https://hn.algolia.com/api/v1";
const FETCH_TIMEOUT_MS = 8000;
const FETCH_MAX_RETRIES = 2;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

interface AlgoliaResponse {
  hits: HNStory[];
}

export function isTimeRange(value: string | null): value is TimeRange {
  return value !== null && TIME_RANGES.includes(value as TimeRange);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffMs(attempt: number): number {
  return 250 * 2 ** attempt;
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.ok) {
        return response;
      }

      const shouldRetry =
        RETRYABLE_STATUS_CODES.has(response.status) && attempt < FETCH_MAX_RETRIES;

      if (!shouldRetry) {
        throw new Error(`Algolia API error: ${response.status} ${response.statusText}`);
      }

      console.warn("[HN-Client] Retrying after API failure", {
        status: response.status,
        statusText: response.statusText,
        attempt: attempt + 1,
      });
      await wait(getBackoffMs(attempt));
    } catch (error) {
      const retryableError =
        error instanceof TypeError ||
        (error instanceof Error && error.name === "AbortError");
      const shouldRetry = retryableError && attempt < FETCH_MAX_RETRIES;

      if (!shouldRetry) {
        throw error;
      }

      console.warn("[HN-Client] Retrying after network error", {
        attempt: attempt + 1,
        error: error instanceof Error ? error.message : String(error),
      });
      await wait(getBackoffMs(attempt));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error("Failed to fetch Hacker News stories after retries");
}

export async function getStoriesInTimeRange(
  timeRange: TimeRange,
  limit: number = 10
): Promise<HNStory[]> {
  const startTime = Date.now();
  const now = Math.floor(Date.now() / 1000);
  const timeLimit = now - TIME_RANGE_SECONDS[timeRange];

  // Fetch more results than needed to ensure we get the highest-scored stories.
  const fetchLimit = Math.min(limit * 10, 1000);

  const url = new URL(`${ALGOLIA_API_BASE}/search`);
  url.searchParams.set("tags", "story");
  url.searchParams.set("numericFilters", `created_at_i>${timeLimit},points>10`);
  url.searchParams.set("hitsPerPage", fetchLimit.toString());

  console.log("[HN-Client] Fetching stories", {
    timeRange,
    requestedLimit: limit,
    fetchLimit,
    minTimestamp: timeLimit,
    url: url.toString(),
  });

  try {
    const response = await fetchWithRetry(url.toString());
    const data: AlgoliaResponse = await response.json();

    const sorted = data.hits
      .filter((story) => story.title)
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);

    const duration = Date.now() - startTime;
    console.log("[HN-Client] Stories fetched successfully", {
      timeRange,
      hitsReceived: data.hits.length,
      hitsReturned: sorted.length,
      topScore: sorted[0]?.points || 0,
      durationMs: duration,
    });

    return sorted;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[HN-Client] Error fetching stories", {
      timeRange,
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });
    throw error;
  }
}
