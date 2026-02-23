import { browser } from '$app/environment';
import { READ_STORAGE_KEY, SAVED_STORAGE_KEY } from '$lib/features/feed/constants';

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

export function createStoryStateController() {
	const state = $state({
		readStoryIds: [] as string[],
		savedStoryIds: [] as string[],
		hasHydratedStoryState: false
	});

	function isStoryRead(storyId: string): boolean {
		return state.readStoryIds.includes(storyId);
	}

	function isStorySaved(storyId: string): boolean {
		return state.savedStoryIds.includes(storyId);
	}

	function markStoryRead(storyId: string): void {
		if (isStoryRead(storyId)) return;
		state.readStoryIds = [...state.readStoryIds, storyId];
	}

	function toggleStorySaved(storyId: string): void {
		if (isStorySaved(storyId)) {
			state.savedStoryIds = state.savedStoryIds.filter((id) => id !== storyId);
			return;
		}

		state.savedStoryIds = [...state.savedStoryIds, storyId];
	}

	$effect(() => {
		if (!browser || state.hasHydratedStoryState) return;

		state.readStoryIds = parseStoredIds(localStorage.getItem(READ_STORAGE_KEY));
		state.savedStoryIds = parseStoredIds(localStorage.getItem(SAVED_STORAGE_KEY));
		state.hasHydratedStoryState = true;
	});

	$effect(() => {
		if (!browser || !state.hasHydratedStoryState) return;

		localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(state.readStoryIds));
		localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(state.savedStoryIds));
	});

	return {
		state,
		isStoryRead,
		isStorySaved,
		markStoryRead,
		toggleStorySaved
	};
}
