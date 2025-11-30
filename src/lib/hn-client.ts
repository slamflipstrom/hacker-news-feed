export interface HNStory {
  objectID: string;
  title: string;
  url?: string;
  points: number;
  author: string;
  created_at_i: number;
  num_comments: number;
}

export type TimeRange = "1h" | "24h" | "7d" | "30d";

const ALGOLIA_API_BASE = "https://hn.algolia.com/api/v1";

interface AlgoliaResponse {
  hits: HNStory[];
}

export async function getStoriesInTimeRange(
  timeRange: TimeRange,
  limit: number = 10
): Promise<HNStory[]> {
  const now = Math.floor(Date.now() / 1000);
  const timeRanges: Record<TimeRange, number> = {
    "1h": 3600,
    "24h": 86400,
    "7d": 604800,
    "30d": 2592000,
  };

  const timeLimit = now - timeRanges[timeRange];

  // Fetch more results than needed to ensure we get the highest-scored stories
  const fetchLimit = Math.min(limit * 10, 1000); // Increase multiplier and cap at API max

  console.log(
    "timeLimit",
    timeLimit,
    "timestamp:",
    new Date(timeLimit * 1000).toISOString()
  );

  const url = new URL(`${ALGOLIA_API_BASE}/search`);
  url.searchParams.set("tags", "story");
  url.searchParams.set("numericFilters", `created_at_i>${timeLimit},points>10`); // Require minimum 10 points
  url.searchParams.set("hitsPerPage", fetchLimit.toString());

  console.log(`Fetching stories for ${timeRange}, URL:`, url.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Algolia API error: ${response.statusText}`);
  }

  const data: AlgoliaResponse = await response.json();
  console.log(`Fetched ${data.hits.length} stories for ${timeRange}`);

  // Sort by points descending and return top N
  const sorted = data.hits.sort((a, b) => b.points - a.points).slice(0, limit);
  console.log(
    `Top 3 stories for ${timeRange}:`,
    sorted
      .slice(0, 3)
      .map(
        (s) =>
          `${s.title.substring(0, 30)}... (${s.points}pts, id:${s.objectID})`
      )
  );
  return sorted;
}
