import { browser } from '$app/environment';
import type { HNStory } from '$lib/hn-client';

interface NavigationDependencies {
	areKeyboardShortcutsEnabled: () => boolean;
	getDisplayedStories: () => HNStory[];
	getStoryElementId: (storyId: string) => string;
	onOpenStory: (story: HNStory) => void;
	onOpenStoryComments: (story: HNStory) => void;
	onToggleStorySaved: (story: HNStory) => void;
	onMarkStoryRead: (storyId: string) => void;
	onToggleSortMode: () => void;
	onCycleTimeRange: () => void;
	onToggleHideRead: () => void;
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

function isInteractiveTarget(target: EventTarget | null): boolean {
	const element = target as Element | null;
	if (!element) return false;
	return (
		element.closest(
			'a[href], button, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])'
		) !== null
	);
}

function blurInteractiveTarget(target: EventTarget | null): void {
	const element = target as HTMLElement | null;
	if (!element || !isInteractiveTarget(element)) return;
	element.blur();
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
		if (!deps.areKeyboardShortcutsEnabled()) return;
		const key = event.key.toLowerCase();
		if (isInteractiveTarget(event.target) && key !== 'j' && key !== 'k' && key !== 'c') return;
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

		if (key === 'h') {
			event.preventDefault();
			deps.onToggleHideRead();
			return;
		}

		if (key === 'j') {
			event.preventDefault();
			setActiveStoryIndex(state.activeStoryIndex + 1);
			blurInteractiveTarget(event.target);
			return;
		}

		if (key === 'k') {
			event.preventDefault();
			setActiveStoryIndex(state.activeStoryIndex - 1);
			blurInteractiveTarget(event.target);
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
			deps.onToggleStorySaved(activeStory);
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
