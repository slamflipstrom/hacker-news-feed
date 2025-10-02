export interface HNStory {
	id: number;
	title: string;
	url?: string;
	score: number;
	by: string;
	time: number;
	descendants: number;
}

export type TimeRange = '1h' | '24h' | '7d' | '30d';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export async function getTopStories(limit: number = 500): Promise<number[]> {
	const response = await fetch(`${HN_API_BASE}/topstories.json`);
	const storyIds = await response.json();
	return storyIds.slice(0, limit);
}

export async function getStory(id: number): Promise<HNStory | null> {
	const response = await fetch(`${HN_API_BASE}/item/${id}.json`);
	if (!response.ok) return null;
	return response.json();
}

export async function getStoriesInTimeRange(
	timeRange: TimeRange,
	topN: number = 10
): Promise<HNStory[]> {
	const now = Date.now() / 1000; // Convert to seconds
	const timeRanges: Record<TimeRange, number> = {
		'1h': 3600,
		'24h': 86400,
		'7d': 604800,
		'30d': 2592000
	};

	const timeLimit = now - timeRanges[timeRange];

	// Fetch top stories IDs
	const storyIds = await getTopStories(500);

	// Fetch story details in parallel
	const stories = await Promise.all(
		storyIds.map(id => getStory(id))
	);

	// Filter by time range and sort by score
	const filteredStories = stories
		.filter((story): story is HNStory =>
			story !== null &&
			story.time >= timeLimit &&
			story.score > 0
		)
		.sort((a, b) => b.score - a.score)
		.slice(0, topN);

	return filteredStories;
}
