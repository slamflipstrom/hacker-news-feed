<script lang="ts">
	import type { HNStory } from '$lib/hn-client';
	import StoryCard from '$lib/features/feed/components/StoryCard.svelte';
	import { getStoryElementId } from '$lib/features/feed/story-utils';

	interface Props {
		stories: HNStory[];
		activeStoryIndex: number;
		isStoryRead: (storyId: string) => boolean;
		isStorySaved: (storyId: string) => boolean;
		onMarkRead: (storyId: string) => void;
		onToggleSave: (story: HNStory) => void;
		onSkip: (storyId: string) => void;
	}

	let {
		stories,
		activeStoryIndex,
		isStoryRead,
		isStorySaved,
		onMarkRead,
		onToggleSave,
		onSkip
	}: Props = $props();
</script>

<ol class="story-list">
	{#each stories as story, index (story.objectID)}
		<StoryCard
			{story}
			{index}
			elementId={getStoryElementId(story.objectID)}
			isActive={index === activeStoryIndex}
			isRead={isStoryRead(story.objectID)}
			isSaved={isStorySaved(story.objectID)}
			onMarkRead={onMarkRead}
			onToggleSave={onToggleSave}
			onSkip={onSkip}
		/>
	{/each}
</ol>

<style>
	.story-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
