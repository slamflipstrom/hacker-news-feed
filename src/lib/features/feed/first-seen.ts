import type { HNStory } from '$lib/hn-client';
import { FIRST_SEEN_MAX_AGE_MS } from '$lib/features/feed/constants';

export interface FirstSeenState {
	firstSeenAtByStoryId: Record<string, number>;
	hasPriorVisit: boolean;
}

function parseStoredFirstSeen(value: string | null): Record<string, number> {
	if (!value) return {};

	try {
		const parsed = JSON.parse(value);
		if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

		return Object.fromEntries(
			Object.entries(parsed).filter(
				(entry): entry is [string, number] =>
					typeof entry[1] === 'number' && Number.isFinite(entry[1])
			)
		);
	} catch {
		return {};
	}
}

export function hydrateFirstSeen(storedValue: string | null, now: number): FirstSeenState {
	const storedFirstSeen = parseStoredFirstSeen(storedValue);
	const pruneCutoff = now - FIRST_SEEN_MAX_AGE_MS;
	const firstSeenAtByStoryId = Object.fromEntries(
		Object.entries(storedFirstSeen).filter(([, firstSeenAt]) => firstSeenAt >= pruneCutoff)
	);

	// On the very first visit everything is unseen; badging the whole page
	// as "New" would be noise, so newness only kicks in from visit two.
	// Judged post-prune: a store whose entries have all aged out is a de facto
	// first visit — otherwise a 35-day absence would badge the entire page.
	return {
		firstSeenAtByStoryId,
		hasPriorVisit: Object.keys(firstSeenAtByStoryId).length > 0
	};
}

export function recordFirstSeen(
	firstSeenAtByStoryId: Record<string, number>,
	stories: HNStory[],
	now: number
): Record<string, number> {
	const unseenIds = stories
		.map((story) => story.objectID)
		.filter((storyId) => firstSeenAtByStoryId[storyId] === undefined);
	if (unseenIds.length === 0) return firstSeenAtByStoryId;

	return {
		...firstSeenAtByStoryId,
		...Object.fromEntries(unseenIds.map((storyId) => [storyId, now] as const))
	};
}

export function isStoryNew(
	firstSeenAt: number | undefined,
	sessionStartedAt: number,
	hasPriorVisit: boolean
): boolean {
	return hasPriorVisit && (firstSeenAt ?? 0) >= sessionStartedAt;
}
