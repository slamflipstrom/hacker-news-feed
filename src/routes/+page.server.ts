import { getStoriesInTimeRange, type TimeRange } from "$lib/hn-client";
import type { PageServerLoad } from "./$types";

const CACHE_SECONDS = {
  "1h": 120,
  "24h": 300,
  "7d": 600,
  "30d": 900,
};

export const load: PageServerLoad = async ({ url, setHeaders }) => {
  const timeRange = (url.searchParams.get("range") as TimeRange) || "24h";
  const stories = await getStoriesInTimeRange(timeRange, 20);

  // Set HTTP cache headers
  const maxAge = CACHE_SECONDS[timeRange];
  setHeaders({
    "Cache-Control": `public, max-age=${maxAge}`,
  });

  return {
    stories,
    timeRange,
    loadedAt: Date.now(), // Add timestamp to force reactivity
  };
};
