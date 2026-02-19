import {
  getStoriesInTimeRange,
  isTimeRange,
  type TimeRange,
} from "$lib/hn-client";
import type { PageServerLoad } from "./$types";

const DEFAULT_TIME_RANGE: TimeRange = "24h";
const STORIES_LIMIT = 20;

const CACHE_SECONDS: Record<TimeRange, number> = {
  "24h": 300,
  "7d": 600,
  "30d": 900,
};

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const startTime = Date.now();
  const rawRange = url.searchParams.get("range");
  const isValidRange = isTimeRange(rawRange);
  const timeRange = isValidRange ? rawRange : DEFAULT_TIME_RANGE;

  console.log("[PageServer] Loading stories", {
    requestedRange: rawRange,
    resolvedRange: timeRange,
    isDefault: !rawRange,
    invalidRange: rawRange !== null && !isValidRange,
  });

  try {
    const stories = await getStoriesInTimeRange(timeRange, STORIES_LIMIT);
    const maxAge = CACHE_SECONDS[timeRange];

    setHeaders({
      "Cache-Control": `public, max-age=${maxAge}, stale-while-revalidate=60`,
    });

    const duration = Date.now() - startTime;
    console.log("[PageServer] Page loaded successfully", {
      timeRange,
      storiesCount: stories.length,
      cacheTTL: maxAge,
      durationMs: duration,
    });

    return {
      stories,
      timeRange,
      storiesLimit: STORIES_LIMIT,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[PageServer] Failed to load stories", {
      timeRange,
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    setHeaders({
      "Cache-Control": "no-store",
    });

    return {
      stories: [],
      timeRange,
      storiesLimit: STORIES_LIMIT,
      error: "Could not load stories right now. Please try again shortly.",
    };
  }
};
