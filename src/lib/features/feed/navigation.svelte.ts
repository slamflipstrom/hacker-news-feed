import { browser } from '$app/environment';
import type { HNStory } from '$lib/hn-client';

interface NavigationDependencies {
	getDisplayedStories: () => HNStory[];
	getStoryElementId: (storyId: string) => string;
	onOpenStory: (story: HNStory) => void;
	onOpenStoryComments: (story: HNStory) => void;
	onToggleStorySaved: (storyId: string) => void;
	onMarkStoryRead: (storyId: string) => void;
	onToggleSortMode: () => void;
	onCycleTimeRange: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	const tagName = element?.tagName;

	return (
		element?.isContentEditable === true ||
		tagName === 'INPUT' ||
		tagName === 'TEXTAREA' ||
		tagName === 'SELECT'
	);
}

export function createNavigationController(deps: NavigationDependencies) {
	const state = $state({
		activeStoryIndex: 0
	});

	function getActiveStory(): HNStory | undefined {
		return deps.getDisplayedStories()[state.activeStoryIndex];
	}

	function setActiveStoryIndex(index: number): void {
		const displayedStories = deps.getDisplayedStories();
		if (displayedStories.length === 0) {
			state.activeStoryIndex = 0;
			return;
		}

		const nextIndex = Math.max(0, Math.min(index, displayedStories.length - 1));
		state.activeStoryIndex = nextIndex;
		const nextStory = displayedStories[nextIndex];
		const nextElement = document.getElementById(deps.getStoryElementId(nextStory.objectID));
		nextElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	function resetActiveStoryIndex(): void {
		state.activeStoryIndex = 0;
	}

	function handleKeyboardShortcuts(event: KeyboardEvent): void {
		if (event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return;

		const key = event.key.toLowerCase();
		if (key === 't') {
			event.preventDefault();
			deps.onToggleSortMode();
			return;
		}

		if (key === 'r') {
			event.preventDefault();
			deps.onCycleTimeRange();
			return;
		}

		if (key === 'j') {
			event.preventDefault();
			setActiveStoryIndex(state.activeStoryIndex + 1);
			return;
		}

		if (key === 'k') {
			event.preventDefault();
			setActiveStoryIndex(state.activeStoryIndex - 1);
			return;
		}

		const activeStory = getActiveStory();
		if (!activeStory) return;

		if (key === 'o' || key === 'enter') {
			event.preventDefault();
			deps.onOpenStory(activeStory);
			return;
		}

		if (key === 's') {
			event.preventDefault();
			deps.onToggleStorySaved(activeStory.objectID);
			return;
		}

		if (key === 'm') {
			event.preventDefault();
			deps.onMarkStoryRead(activeStory.objectID);
			return;
		}

		if (key === 'c') {
			event.preventDefault();
			deps.onOpenStoryComments(activeStory);
		}
	}

	$effect(() => {
		if (!browser) return;

		const displayedStories = deps.getDisplayedStories();
		const maxIndex = Math.max(0, displayedStories.length - 1);
		if (state.activeStoryIndex > maxIndex) {
			state.activeStoryIndex = maxIndex;
		}
	});

	return {
		state,
		setActiveStoryIndex,
		resetActiveStoryIndex,
		handleKeyboardShortcuts
	};
}
