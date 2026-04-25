import type { HNStory } from '$lib/hn-client';
import type { SortMode } from '$lib/preferences';

export function getStoryHref(story: HNStory): string {
	return story.url ?? `https://news.ycombinator.com/item?id=${story.objectID}`;
}

export function getCommentsHref(story: HNStory): string {
	return `https://news.ycombinator.com/item?id=${story.objectID}`;
}

export function getStoryDomain(story: HNStory): string {
	if (!story.url) return 'news.ycombinator.com';

	try {
		return new URL(story.url).hostname.replace(/^www\./, '');
	} catch {
		return 'news.ycombinator.com';
	}
}

export function getStoryFaviconUrl(story: HNStory): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getStoryDomain(story))}&sz=32`;
}

export function hotScore(story: HNStory, nowSeconds: number): number {
	const ageHours = Math.max(0, (nowSeconds - story.created_at_i) / 3600);
	return (story.points - 1) / Math.pow(ageHours + 2, 1.8);
}

export function getComparator(sortMode: SortMode): (a: HNStory, b: HNStory) => number {
	if (sortMode === 'comments') {
		return (a, b) => b.num_comments - a.num_comments || b.points - a.points;
	}

	if (sortMode === 'hot') {
		const nowSeconds = Math.floor(Date.now() / 1000);
		return (a, b) => hotScore(b, nowSeconds) - hotScore(a, nowSeconds);
	}

	return (a, b) => b.points - a.points || b.created_at_i - a.created_at_i;
}

export function sortStories(stories: HNStory[], sortMode: SortMode): HNStory[] {
	return [...stories].sort(getComparator(sortMode));
}

export function getStoryElementId(storyId: string): string {
	return `story-${storyId}`;
}

export function formatTime(timestamp: number): string {
	const date = new Date(timestamp * 1000);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffHours < 1) return 'just now';
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}
