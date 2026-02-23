<script lang="ts">
	import type { HNStory } from '$lib/hn-client';
	import { formatTime, getCommentsHref } from '$lib/features/feed/story-utils';

	interface Props {
		story: HNStory;
		isRead: boolean;
		isSaved: boolean;
	}

	let { story, isRead, isSaved }: Props = $props();
</script>

<div class="story-meta">
	<div class="story-meta-badges">
		<span class="meta-badge meta-badge-score">{story.points} pts</span>
		<a
			href={getCommentsHref(story)}
			target="_blank"
			rel="external noopener noreferrer"
			class="meta-badge meta-badge-comments"
		>
			{story.num_comments || 0} comments
		</a>
		<span class="meta-badge meta-badge-age">{formatTime(story.created_at_i)}</span>
	</div>
	<span class="story-author">by {story.author}</span>
	{#if isRead}
		<span class="status-badge status-read">Read</span>
	{/if}
	{#if isSaved}
		<span class="status-badge status-saved">Saved</span>
	{/if}
</div>

<style>
	.story-meta {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		flex-wrap: wrap;
	}

	.story-meta-badges {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.meta-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 600;
		line-height: 1;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.meta-badge-score {
		background: var(--color-accent-bg);
		border-color: var(--color-accent-border);
		color: var(--color-accent-text-strong);
	}

	.meta-badge-comments:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}

	.meta-badge-age {
		color: var(--color-text-muted);
	}

	.story-author {
		font-size: 0.8rem;
		color: var(--color-text-author);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.status-read {
		background: var(--color-status-read-bg);
		color: var(--color-status-read-text);
	}

	.status-saved {
		background: var(--color-status-saved-bg);
		color: var(--color-status-saved-text);
	}
</style>
