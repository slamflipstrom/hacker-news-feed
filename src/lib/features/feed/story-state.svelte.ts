import { browser } from '$app/environment';
import type { HNStory } from '$lib/hn-client';
import {
	READ_STORAGE_KEY,
	SAVED_STORAGE_KEY,
	SAVED_STORIES_STORAGE_KEY
} from '$lib/features/feed/constants';

function parseStoredIds(value: string | null): string[] {
	if (!value) return [];

	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];
		return Array.from(new Set(parsed.filter((item): item is string => typeof item === 'string')));
	} catch {
		return [];
	}
}

function isValidStoredStory(value: unknown): value is HNStory {
	if (typeof value !== 'object' || value === null) return false;

	const story = value as Partial<HNStory>;
	return (
		typeof story.objectID === 'string' &&
		typeof story.title === 'string' &&
		typeof story.points === 'number' &&
		typeof story.author === 'string' &&
		typeof story.created_at_i === 'number' &&
		typeof story.num_comments === 'number' &&
		(story.url === undefined || typeof story.url === 'string')
	);
}

function parseStoredStories(value: string | null): HNStory[] {
	if (!value) return [];

	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];

		return Array.from(
			new Map(
				parsed
					.filter((item): item is HNStory => isValidStoredStory(item))
					.map((story) => [story.objectID, story] as const)
			).values()
		);
	} catch {
		return [];
	}
}

function toStoryById(stories: HNStory[]): Record<string, HNStory> {
	return Object.fromEntries(stories.map((story) => [story.objectID, story] as const));
}

function toSavedStorySnapshot(story: HNStory): HNStory {
	return {
		objectID: story.objectID,
		title: story.title,
		url: story.url,
		points: story.points,
		author: story.author,
		created_at_i: story.created_at_i,
		num_comments: story.num_comments
	};
}

function isSameStorySnapshot(a: HNStory, b: HNStory): boolean {
	return (
		a.objectID === b.objectID &&
		a.title === b.title &&
		a.url === b.url &&
		a.points === b.points &&
		a.author === b.author &&
		a.created_at_i === b.created_at_i &&
		a.num_comments === b.num_comments
	);
}

export function createStoryStateController() {
	const state = $state({
		readStoryIds: [] as string[],
		savedStoryIds: [] as string[],
		savedStoriesById: {} as Record<string, HNStory>,
		hasHydratedStoryState: false
	});

	function isStoryRead(storyId: string): boolean {
		return state.readStoryIds.includes(storyId);
	}

	function isStorySaved(storyId: string): boolean {
		return state.savedStoryIds.includes(storyId);
	}

	function getSavedStories(): HNStory[] {
		return state.savedStoryIds
			.map((storyId) => state.savedStoriesById[storyId])
			.filter((story): story is HNStory => story !== undefined);
	}

	function markStoryRead(storyId: string): void {
		if (isStoryRead(storyId)) return;
		state.readStoryIds = [...state.readStoryIds, storyId];
	}

	function markAllRead(stories: HNStory[]): void {
		const newIds = stories.map((s) => s.objectID).filter((id) => !isStoryRead(id));
		if (newIds.length === 0) return;
		state.readStoryIds = [...state.readStoryIds, ...newIds];
	}

	function toggleStorySaved(story: HNStory): void {
		const { objectID: storyId } = story;

		if (isStorySaved(storyId)) {
			state.savedStoryIds = state.savedStoryIds.filter((id) => id !== storyId);
			const { [storyId]: _removedStory, ...nextSavedStoriesById } = state.savedStoriesById;
			state.savedStoriesById = nextSavedStoriesById;
			return;
		}

		state.savedStoryIds = [...state.savedStoryIds, storyId];
		state.savedStoriesById = { ...state.savedStoriesById, [storyId]: toSavedStorySnapshot(story) };
	}

	function upsertSavedStories(stories: HNStory[]): void {
		if (stories.length === 0) return;

		let hasChanges = false;
		const nextSavedStoriesById = { ...state.savedStoriesById };
		for (const story of stories) {
			if (!isStorySaved(story.objectID)) continue;
			const storySnapshot = toSavedStorySnapshot(story);
			const existingStory = nextSavedStoriesById[story.objectID];
			if (existingStory && isSameStorySnapshot(existingStory, storySnapshot)) continue;

			nextSavedStoriesById[story.objectID] = storySnapshot;
			hasChanges = true;
		}
		if (!hasChanges) return;

		state.savedStoriesById = nextSavedStoriesById;
	}

	$effect(() => {
		if (!browser || state.hasHydratedStoryState) return;

		state.readStoryIds = parseStoredIds(localStorage.getItem(READ_STORAGE_KEY));
		const storedSavedStoryIds = parseStoredIds(localStorage.getItem(SAVED_STORAGE_KEY));
		const storedSavedStories = parseStoredStories(localStorage.getItem(SAVED_STORIES_STORAGE_KEY));
		const savedStoriesById = toStoryById(storedSavedStories);

		state.savedStoryIds = Array.from(
			new Set([...storedSavedStoryIds, ...Object.keys(savedStoriesById)])
		);
		state.savedStoriesById = savedStoriesById;
		state.hasHydratedStoryState = true;
	});

	$effect(() => {
		if (!browser || !state.hasHydratedStoryState) return;

		localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(state.readStoryIds));
		localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(state.savedStoryIds));
		localStorage.setItem(SAVED_STORIES_STORAGE_KEY, JSON.stringify(getSavedStories()));
	});

	return {
		state,
		isStoryRead,
		isStorySaved,
		getSavedStories,
		markStoryRead,
		markAllRead,
		toggleStorySaved,
		upsertSavedStories
	};
}
