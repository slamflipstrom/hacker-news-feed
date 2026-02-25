<script lang="ts">
	import { getCommentsHref, getStoryElementId, getStoryHref, sortStories } from '$lib/features/feed/story-utils';
	import { SORT_MODE_OPTIONS, TIME_RANGE_OPTIONS } from '$lib/features/feed/constants';
	import { createPreferencesController } from '$lib/features/feed/preferences.svelte';
	import { createStoryStateController } from '$lib/features/feed/story-state.svelte';
	import { createNavigationController } from '$lib/features/feed/navigation.svelte';
	import FeedHeader from '$lib/features/feed/components/FeedHeader.svelte';
	import EmptyState from '$lib/features/feed/components/EmptyState.svelte';
	import QueueSection from '$lib/features/feed/components/QueueSection.svelte';
	import StoryList from '$lib/features/feed/components/StoryList.svelte';
	import type { HNStory, TimeRange } from '$lib/hn-client';
	import type { SortMode } from '$lib/preferences';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	const props: { data: PageData } = $props();

	const preferences = createPreferencesController({
		timeRange: props.data.timeRange,
		sortMode: props.data.sortMode,
		hideRead: props.data.hideRead,
		themeMode: props.data.themeMode
	});
	const storyState = createStoryStateController();
	let showKeyboardShortcuts = $state(false);
	let showingSavedStories = $state(false);
	let loadedAt = $state(Date.now());
	let now = $state(Date.now());

	let savedStories = $derived.by(() =>
		sortStories(storyState.getSavedStories(), preferences.state.selectedSortMode)
	);

	let displayedStories = $derived.by(() => {
		const baseStories = showingSavedStories
			? savedStories
			: sortStories(props.data.stories, preferences.state.selectedSortMode).slice(
					0,
					props.data.storiesLimit
				);
		if (!preferences.state.hideReadStories) return baseStories;
		return baseStories.filter((story) => !storyState.isStoryRead(story.objectID));
	});

	const totalStories = $derived(displayedStories.length);
	const unreadCount = $derived(
		displayedStories.filter((s) => !storyState.isStoryRead(s.objectID)).length
	);
	const hasUnreadStories = $derived(unreadCount > 0);
	const minutesAgo = $derived(Math.floor((now - loadedAt) / 60_000));

	function openStory(story: HNStory): void {
		storyState.markStoryRead(story.objectID);
		window.open(getStoryHref(story), '_blank', 'noopener,noreferrer');
	}

	function openStoryComments(story: HNStory): void {
		window.open(getCommentsHref(story), '_blank', 'noopener,noreferrer');
	}

	function skipStory(storyId: string): void {
		storyState.markStoryRead(storyId);
	}

	function selectSortMode(sortMode: SortMode): void {
		preferences.selectSortMode(sortMode);
		navigation.resetActiveStoryIndex();
	}

	function toggleSortMode(): void {
		const nextSortMode: SortMode =
			preferences.state.selectedSortMode === 'top' ? 'comments' : 'top';
		selectSortMode(nextSortMode);
	}

	function cycleTimeRange(): void {
		const currentIndex = TIME_RANGE_OPTIONS.findIndex(
			(option) => option.value === preferences.state.selectedTimeRange
		);
		const nextRange: TimeRange =
			TIME_RANGE_OPTIONS[(currentIndex + 1) % TIME_RANGE_OPTIONS.length]?.value ??
			TIME_RANGE_OPTIONS[0].value;
		navigation.resetActiveStoryIndex();
		void preferences.selectTimeRange(nextRange);
	}

	function toggleHideRead(): void {
		preferences.toggleHideRead();
		navigation.resetActiveStoryIndex();
	}

	function toggleKeyboardShortcuts(): void {
		showKeyboardShortcuts = !showKeyboardShortcuts;
	}

	function showAllStories(): void {
		showingSavedStories = false;
		navigation.resetActiveStoryIndex();
	}

	function showSavedStories(): void {
		showingSavedStories = true;
		navigation.resetActiveStoryIndex();
	}

	async function handleRefresh(): Promise<void> {
		await invalidateAll();
	}

	const navigation = createNavigationController({
		areKeyboardShortcutsEnabled: () => preferences.state.keyboardShortcutsEnabled,
		getDisplayedStories: () => displayedStories,
		getStoryElementId,
		onOpenStory: openStory,
		onOpenStoryComments: openStoryComments,
		onToggleStorySaved: storyState.toggleStorySaved,
		onMarkStoryRead: storyState.markStoryRead,
		onToggleSortMode: toggleSortMode,
		onCycleTimeRange: cycleTimeRange,
		onToggleHideRead: toggleHideRead
	});

	$effect(() => {
		void props.data.stories;
		loadedAt = Date.now();
	});

	$effect(() => {
		const id = setInterval(() => {
			now = Date.now();
		}, 60_000);
		return () => clearInterval(id);
	});

	$effect(() => {
		preferences.state.selectedTimeRange = props.data.timeRange;
		preferences.state.selectedSortMode = props.data.sortMode;
		preferences.state.hideReadStories = props.data.hideRead;
		preferences.state.selectedThemeMode = props.data.themeMode;
	});

	$effect(() => {
		storyState.upsertSavedStories(props.data.stories);
	});
</script>

<svelte:window onkeydown={navigation.handleKeyboardShortcuts} />

<div class="container">
	<FeedHeader
		storiesLimit={props.data.storiesLimit}
		showingSavedOnly={showingSavedStories}
		savedStoriesCount={savedStories.length}
		timeRanges={TIME_RANGE_OPTIONS}
		sortModes={SORT_MODE_OPTIONS}
		selectedTimeRange={preferences.state.selectedTimeRange}
		selectedSortMode={preferences.state.selectedSortMode}
		hideReadStories={preferences.state.hideReadStories}
		themeMode={preferences.state.selectedThemeMode}
		keyboardShortcutsEnabled={preferences.state.keyboardShortcutsEnabled}
		{showKeyboardShortcuts}
		getRangeHref={preferences.getRangeHref}
		onSelectTimeRange={preferences.selectTimeRange}
		onSelectSortMode={selectSortMode}
		onToggleHideRead={toggleHideRead}
		onShowAllStories={showAllStories}
		onShowSavedStories={showSavedStories}
		onCycleTheme={preferences.cycleTheme}
		onToggleKeyboardShortcuts={toggleKeyboardShortcuts}
		onToggleKeyboardShortcutsEnabled={preferences.toggleKeyboardShortcutsEnabled}
		onMarkAllRead={() => storyState.markAllRead(displayedStories)}
		onRefresh={handleRefresh}
		{hasUnreadStories}
		{minutesAgo}
	/>

	<main>
		{#if props.data.error}
			<p class="error-message">{props.data.error}</p>
		{/if}

		{#if !showingSavedStories && props.data.stories.length === 0}
			<EmptyState message="No stories found in this time range." />
		{:else if displayedStories.length === 0}
			<EmptyState
				message={
					showingSavedStories
						? savedStories.length === 0
							? 'No saved stories yet.'
							: 'No saved stories match these filters.'
						: 'No stories match these filters.'
				}
			/>
		{:else}
			{#if !showingSavedStories}
				<QueueSection
					stories={displayedStories}
					isStoryRead={storyState.isStoryRead}
					onMarkRead={storyState.markStoryRead}
				/>
			{/if}
			<p class="story-count">
				{totalStories}
				{totalStories === 1 ? 'story' : 'stories'}
				{#if unreadCount > 0}· {unreadCount} unread{:else}· all read{/if}
			</p>
			<StoryList
				stories={displayedStories}
				activeStoryIndex={navigation.state.activeStoryIndex}
				isStoryRead={storyState.isStoryRead}
				isStorySaved={storyState.isStorySaved}
				onMarkRead={storyState.markStoryRead}
				onToggleSave={storyState.toggleStorySaved}
				onSkip={skipStory}
			/>
		{/if}
	</main>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem 1rem;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}

	.story-count {
		margin: 0 0 0.5rem;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.error-message {
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		color: var(--color-error-text);
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.container {
			padding: 1rem 0.5rem;
		}
	}
</style>
