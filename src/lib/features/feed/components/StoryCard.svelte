<script lang="ts">
	import type { HNStory } from '$lib/hn-client';
	import StoryMeta from '$lib/features/feed/components/StoryMeta.svelte';
	import { getStoryDomain, getStoryFaviconUrl, getStoryHref } from '$lib/features/feed/story-utils';

	interface Props {
		story: HNStory;
		index: number;
		elementId: string;
		isActive: boolean;
		isRead: boolean;
		isSaved: boolean;
		onMarkRead: (storyId: string) => void;
		onToggleSave: (story: HNStory) => void;
		onSkip: (storyId: string) => void;
	}

	let {
		story,
		index,
		elementId,
		isActive,
		isRead,
		isSaved,
		onMarkRead,
		onToggleSave,
		onSkip
	}: Props = $props();

	let storyDomain = $derived(getStoryDomain(story));
</script>

<li id={elementId} class="story-item" class:read={isRead} class:active={isActive}>
	<div class="rank">#{index + 1}</div>
	<div class="story-content">
		<div class="story-title-row">
			<h2 class="story-title">
				<a
					href={getStoryHref(story)}
					target="_blank"
					rel="external noopener noreferrer"
					onclick={() => onMarkRead(story.objectID)}
				>
					{story.title}
				</a>
			</h2>
			<span class="story-domain">
				<img src={getStoryFaviconUrl(story)} alt="" loading="lazy" decoding="async" width="16" height="16" />
				{storyDomain}
			</span>
		</div>
		<div class="story-actions">
			<a
				href={getStoryHref(story)}
				target="_blank"
				rel="external noopener noreferrer"
				class="story-action story-action-open"
				onclick={() => onMarkRead(story.objectID)}
			>
				Open
			</a>
			<button
				type="button"
				class="story-action story-action-save"
				aria-pressed={isSaved}
				onclick={() => onToggleSave(story)}
			>
				{isSaved ? 'Saved' : 'Save'}
			</button>
			<button type="button" class="story-action story-action-skip" onclick={() => onSkip(story.objectID)}>
				Skip
			</button>
		</div>
		<StoryMeta {story} {isRead} />
	</div>
</li>

<style>
	.story-item {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		margin-bottom: 1rem;
		transition: box-shadow 0.2s;
	}

	.story-item:hover {
		box-shadow: var(--shadow-card-hover);
	}

	.story-item.active {
		border-color: var(--color-accent-border);
		box-shadow: var(--shadow-card-active);
	}

	.story-item.read {
		background: var(--color-surface-subtle);
		border-color: var(--color-border-subtle);
	}

	.story-item.read.active {
		border-color: var(--color-accent-border);
		box-shadow: var(--shadow-card-active-read);
	}

	.story-item.read:hover {
		box-shadow: var(--shadow-card-hover-read);
	}

	.rank {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-text-faint);
		min-width: 3rem;
	}

	.story-content {
		flex: 1;
	}

	.story-title-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		justify-content: space-between;
		margin: 0 0 0.65rem 0;
	}

	.story-title {
		font-size: 1.34rem;
		margin: 0;
		font-weight: 600;
		line-height: 1.3;
	}

	.story-title a {
		color: var(--color-text-primary);
		text-decoration: none;
	}

	.story-title a:hover {
		color: var(--color-brand);
	}

	.story-domain {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: var(--color-surface-chip);
		border: 1px solid var(--color-border-subtle);
		color: var(--color-text-secondary);
		font-size: 0.76rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.story-domain img {
		flex-shrink: 0;
		border-radius: 2px;
	}

	.story-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.65rem;
	}

	.story-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
	}

	button.story-action {
		font-family: inherit;
	}

	.story-action:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
	}

	.story-action-open {
		border-color: var(--color-accent-border-light);
		color: var(--color-accent-text-strong);
		background: var(--color-accent-bg);
	}

	.story-action-open:hover {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg-hover);
	}

	.story-action-save[aria-pressed='true'] {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg);
		color: var(--color-accent-text);
	}

	.story-action-skip {
		color: var(--color-text-muted);
	}

	@media (max-width: 640px) {
		.story-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.story-title-row {
			flex-direction: column;
			gap: 0.45rem;
		}

		.rank {
			min-width: auto;
		}
	}
</style>
