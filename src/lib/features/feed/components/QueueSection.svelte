<script lang="ts">
	import type { HNStory } from '$lib/hn-client';
	import { QUEUE_SIZE } from '$lib/features/feed/constants';
	import { formatTime, getStoryHref } from '$lib/features/feed/story-utils';

	interface Props {
		stories: HNStory[];
		isStoryRead: (storyId: string) => boolean;
		onMarkRead: (storyId: string) => void;
	}

	let { stories, isStoryRead, onMarkRead }: Props = $props();

	let queueStories = $derived(stories.slice(0, QUEUE_SIZE));
	let queueReadCount = $derived(queueStories.filter((story) => isStoryRead(story.objectID)).length);
	let queueProgress = $derived(
		queueStories.length > 0 ? Math.round((queueReadCount / queueStories.length) * 100) : 0
	);
</script>

<section class="queue-section" aria-label="Today's queue">
	<div class="queue-header">
		<h2 class="queue-title">Today&apos;s Queue</h2>
		<p class="queue-progress-label">{queueReadCount}/{queueStories.length} read</p>
	</div>
	<div
		class="queue-progress-track"
		role="progressbar"
		aria-label="Queue progress"
		aria-valuemin="0"
		aria-valuemax={queueStories.length}
		aria-valuenow={queueReadCount}
	>
		<div class="queue-progress-fill" style:width="{queueProgress}%"></div>
	</div>
	<ol class="queue-list">
		{#each queueStories as story, index (story.objectID)}
			<li class="queue-item" class:read={isStoryRead(story.objectID)}>
				<span class="queue-rank">#{index + 1}</span>
				<div class="queue-story">
					<a
						href={getStoryHref(story)}
						target="_blank"
						rel="external noopener noreferrer"
						onclick={() => onMarkRead(story.objectID)}
					>
						{story.title}
					</a>
					<span>{story.points} points • {formatTime(story.created_at_i)}</span>
				</div>
			</li>
		{/each}
	</ol>
</section>

<style>
	.queue-section {
		padding: 1rem;
		margin-bottom: 1.25rem;
		border-radius: 10px;
		border: 1px solid var(--color-queue-border);
		background: linear-gradient(180deg, var(--color-queue-bg-from) 0%, var(--color-surface) 100%);
	}

	.queue-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}

	.queue-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-queue-title);
	}

	.queue-progress-label {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-queue-label);
	}

	.queue-progress-track {
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-queue-track);
		overflow: hidden;
		margin-bottom: 0.9rem;
	}

	.queue-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-brand-light) 0%, var(--color-brand) 100%);
		transition: width 0.25s ease-out;
	}

	.queue-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.6rem;
	}

	.queue-item {
		display: flex;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: 8px;
		background: var(--color-surface);
		border: 1px solid var(--color-queue-item-border);
	}

	.queue-item.read {
		opacity: 0.68;
	}

	.queue-rank {
		min-width: 2.4rem;
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-queue-rank);
	}

	.queue-story {
		display: grid;
		gap: 0.2rem;
	}

	.queue-story a {
		color: var(--color-queue-link);
		text-decoration: none;
		font-weight: 600;
		line-height: 1.25;
	}

	.queue-story a:hover {
		color: var(--color-accent-text-strong);
	}

	.queue-story span {
		font-size: 0.8rem;
		color: var(--color-queue-meta);
	}

	@media (max-width: 640px) {
		.queue-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.queue-item {
			flex-direction: column;
			gap: 0.35rem;
		}

		.queue-rank {
			min-width: auto;
		}
	}
</style>
