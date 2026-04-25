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

const runtimeEnv = (
  globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
).process?.env;
const ALGOLIA_API_BASE = runtimeEnv?.HN_API_BASE_URL ?? "https://hn.algolia.com/api/v1";
const FETCH_TIMEOUT_MS = 8000;
const FETCH_MAX_RETRIES = 2;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

interface AlgoliaResponse {
  hits: HNStory[];
  page: number;
  nbPages: number;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBackoffMs(attempt: number): number {
  return 250 * 2 ** attempt;
}

async function fetchJsonWithRetry<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (response.ok) {
        return (await response.json()) as T;
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
        error instanceof SyntaxError ||
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

export type AlgoliaEndpoint = "search" | "search_by_date";

export interface GetStoriesOptions {
  compare?: (a: HNStory, b: HNStory) => number;
  endpoint?: AlgoliaEndpoint;
  minPoints?: number;
}

export async function getStoriesInTimeRange(
  timeRange: TimeRange,
  limit: number = 10,
  options: GetStoriesOptions = {}
): Promise<HNStory[]> {
  const compare = options.compare ?? ((a, b) => b.points - a.points);
  const endpoint = options.endpoint ?? "search";
  const minPoints = options.minPoints ?? 10;

  const now = Math.floor(Date.now() / 1000);
  const timeLimit = now - TIME_RANGE_SECONDS[timeRange];

  // Pull multiple pages to improve top-score accuracy across larger ranges.
  const hitsPerPage = 200;
  const maxPagesToFetch = 5;
  const allHits: HNStory[] = [];

  let pagesAvailable = 1;
  for (let page = 0; page < maxPagesToFetch; page += 1) {
    if (page >= pagesAvailable) {
      break;
    }

    const url = new URL(`${ALGOLIA_API_BASE}/${endpoint}`);
    url.searchParams.set("tags", "story");
    url.searchParams.set(
      "numericFilters",
      `created_at_i>${timeLimit},points>${minPoints}`
    );
    url.searchParams.set("hitsPerPage", hitsPerPage.toString());
    url.searchParams.set("page", page.toString());

    const data = await fetchJsonWithRetry<AlgoliaResponse>(url.toString());
    pagesAvailable = Math.max(data.nbPages, page + 1);
    allHits.push(...data.hits);
  }

  const dedupedStories = Array.from(
    new Map(
      allHits
        .filter((story) => story.title)
        .map((story) => [story.objectID, story] as const)
    ).values()
  );

  return dedupedStories.sort(compare).slice(0, limit);
}
