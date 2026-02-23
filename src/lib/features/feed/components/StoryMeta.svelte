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
		border: 1px solid #e6e6e6;
		background: #fff;
		color: #555;
		text-decoration: none;
	}

	.meta-badge-score {
		background: #fff3eb;
		border-color: #ffd8bf;
		color: #c25100;
	}

	.meta-badge-comments:hover {
		border-color: #cfcfcf;
		background: #f8f8f8;
		color: #383838;
	}

	.meta-badge-age {
		color: #666;
	}

	.story-author {
		font-size: 0.8rem;
		color: #8a8a8a;
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
		background: #f0f0f0;
		color: #666;
	}

	.status-saved {
		background: #fff0e5;
		color: #cc5a00;
	}
</style>
