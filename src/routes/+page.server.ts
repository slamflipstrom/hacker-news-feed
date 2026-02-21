import {
  getStoriesInTimeRange,
  isTimeRange,
  type TimeRange,
} from "$lib/hn-client";
import {
  DEFAULT_HIDE_READ,
  DEFAULT_SORT_MODE,
  PREFERENCE_COOKIE_KEYS,
  isSortMode,
  parseHideReadPreference,
} from "$lib/preferences";
import type { PageServerLoad } from "./$types";

const DEFAULT_TIME_RANGE: TimeRange = "24h";
const STORIES_LIMIT = 20;

const CACHE_SECONDS: Record<TimeRange, number> = {
  "24h": 300,
  "7d": 600,
  "30d": 900,
};
const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const load: PageServerLoad = async ({ url, setHeaders, cookies }) => {
  const startTime = Date.now();
  const rawRange = url.searchParams.get("range");
  const rawSortMode = url.searchParams.get("sort");
  const rawHideRead = url.searchParams.get("hideRead");
  const storedRange = url.searchParams.has("range")
    ? null
    : cookies.get(PREFERENCE_COOKIE_KEYS.range) ?? null;
  const storedSortMode = url.searchParams.has("sort")
    ? null
    : cookies.get(PREFERENCE_COOKIE_KEYS.sortMode) ?? null;
  const storedHideRead = url.searchParams.has("hideRead")
    ? null
    : cookies.get(PREFERENCE_COOKIE_KEYS.hideRead) ?? null;

  const resolvedRange =
    (isTimeRange(rawRange) && rawRange) ||
    (isTimeRange(storedRange) && storedRange) ||
    DEFAULT_TIME_RANGE;
  const resolvedSortMode =
    (isSortMode(rawSortMode) && rawSortMode) ||
    (isSortMode(storedSortMode) && storedSortMode) ||
    DEFAULT_SORT_MODE;
  const resolvedHideRead =
    parseHideReadPreference(rawHideRead) ??
    parseHideReadPreference(storedHideRead) ??
    DEFAULT_HIDE_READ;
  const timeRange = resolvedRange;

  cookies.set(PREFERENCE_COOKIE_KEYS.range, resolvedRange, {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  cookies.set(PREFERENCE_COOKIE_KEYS.sortMode, resolvedSortMode, {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  cookies.set(PREFERENCE_COOKIE_KEYS.hideRead, resolvedHideRead ? "1" : "0", {
    path: "/",
    maxAge: PREFERENCE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });

  console.log("[PageServer] Loading stories", {
    requestedRange: rawRange,
    resolvedRange: timeRange,
    requestedSortMode: rawSortMode,
    resolvedSortMode,
    requestedHideRead: rawHideRead,
    resolvedHideRead,
    isDefault: !rawRange,
    invalidRange: rawRange !== null && !isTimeRange(rawRange),
    invalidSortMode: rawSortMode !== null && !isSortMode(rawSortMode),
    invalidHideRead:
      rawHideRead !== null && parseHideReadPreference(rawHideRead) === null,
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
      sortMode: resolvedSortMode,
      hideRead: resolvedHideRead,
      storiesCount: stories.length,
      cacheTTL: maxAge,
      durationMs: duration,
    });

    return {
      stories,
      timeRange,
      sortMode: resolvedSortMode,
      hideRead: resolvedHideRead,
      storiesLimit: STORIES_LIMIT,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[PageServer] Failed to load stories", {
      timeRange,
      sortMode: resolvedSortMode,
      hideRead: resolvedHideRead,
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
    });

    setHeaders({
      "Cache-Control": "no-store",
    });

    return {
      stories: [],
      timeRange,
      sortMode: resolvedSortMode,
      hideRead: resolvedHideRead,
      storiesLimit: STORIES_LIMIT,
      error: "Could not load stories right now. Please try again shortly.",
    };
  }
};
