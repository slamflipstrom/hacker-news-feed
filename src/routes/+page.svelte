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
	import type { HNStory } from '$lib/hn-client';
	import type { SortMode } from '$lib/preferences';
	import type { PageData } from './$types';

	const props: { data: PageData } = $props();

	const preferences = createPreferencesController({
		timeRange: props.data.timeRange,
		sortMode: props.data.sortMode,
		hideRead: props.data.hideRead
	});
	const storyState = createStoryStateController();
	let showKeyboardShortcuts = $state(false);

	let displayedStories = $derived.by(() => {
		const sortedStories = sortStories(props.data.stories, preferences.state.selectedSortMode)
			.slice(0, props.data.storiesLimit);
		if (!preferences.state.hideReadStories) return sortedStories;
		return sortedStories.filter((story) => !storyState.isStoryRead(story.objectID));
	});

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

	function toggleHideRead(): void {
		preferences.toggleHideRead();
		navigation.resetActiveStoryIndex();
	}

	function toggleKeyboardShortcuts(): void {
		showKeyboardShortcuts = !showKeyboardShortcuts;
	}

	const navigation = createNavigationController({
		getDisplayedStories: () => displayedStories,
		getStoryElementId,
		onOpenStory: openStory,
		onOpenStoryComments: openStoryComments,
		onToggleStorySaved: storyState.toggleStorySaved,
		onMarkStoryRead: storyState.markStoryRead
	});

	$effect(() => {
		preferences.state.selectedTimeRange = props.data.timeRange;
		preferences.state.selectedSortMode = props.data.sortMode;
		preferences.state.hideReadStories = props.data.hideRead;
	});
</script>

<svelte:window onkeydown={navigation.handleKeyboardShortcuts} />

<div class="container">
	<FeedHeader
		storiesLimit={props.data.storiesLimit}
		timeRanges={TIME_RANGE_OPTIONS}
		sortModes={SORT_MODE_OPTIONS}
		selectedTimeRange={preferences.state.selectedTimeRange}
		selectedSortMode={preferences.state.selectedSortMode}
		hideReadStories={preferences.state.hideReadStories}
		{showKeyboardShortcuts}
		getRangeHref={preferences.getRangeHref}
		onSelectTimeRange={preferences.selectTimeRange}
		onSelectSortMode={selectSortMode}
		onToggleHideRead={toggleHideRead}
		onToggleKeyboardShortcuts={toggleKeyboardShortcuts}
	/>

	<main>
		{#if props.data.error}
			<p class="error-message">{props.data.error}</p>
		{/if}

		{#if props.data.stories.length === 0}
			<EmptyState message="No stories found in this time range." />
		{:else if displayedStories.length === 0}
			<EmptyState message="No stories match these filters." />
		{:else}
			<QueueSection
				stories={displayedStories}
				isStoryRead={storyState.isStoryRead}
				onMarkRead={storyState.markStoryRead}
			/>
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

	.error-message {
		background: #fff5f5;
		border: 1px solid #ffd5d5;
		color: #b20000;
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
