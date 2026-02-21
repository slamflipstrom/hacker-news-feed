<script lang="ts">
	import { browser } from '$app/environment';
	import type { TimeRange } from '$lib/hn-client';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	const props: { data: PageData } = $props();
	const READ_STORAGE_KEY = 'hnrss:read-story-ids';
	const SAVED_STORAGE_KEY = 'hnrss:saved-story-ids';
	const QUEUE_SIZE = 3;
	let readStoryIds = $state<string[]>([]);
	let savedStoryIds = $state<string[]>([]);
	let hasHydratedStoryState = false;

	const timeRanges: Array<{ value: TimeRange; label: string }> = [
		{ value: '24h', label: 'Last 24 Hours' },
		{ value: '7d', label: 'Last 7 Days' },
		{ value: '30d', label: 'Last 30 Days' }
	];

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

	function isStoryRead(storyId: string): boolean {
		return readStoryIds.includes(storyId);
	}

	function isStorySaved(storyId: string): boolean {
		return savedStoryIds.includes(storyId);
	}

	function markStoryRead(storyId: string): void {
		if (isStoryRead(storyId)) return;
		readStoryIds = [...readStoryIds, storyId];
	}

	function getQueueStories() {
		return props.data.stories.slice(0, QUEUE_SIZE);
	}

	function formatTime(timestamp: number): string {
		const date = new Date(timestamp * 1000);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffHours / 24);

		if (diffHours < 1) return 'just now';
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	$effect(() => {
		if (!browser || hasHydratedStoryState) return;

		readStoryIds = parseStoredIds(localStorage.getItem(READ_STORAGE_KEY));
		savedStoryIds = parseStoredIds(localStorage.getItem(SAVED_STORAGE_KEY));
		hasHydratedStoryState = true;
	});

	$effect(() => {
		if (!browser || !hasHydratedStoryState) return;

		localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readStoryIds));
		localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(savedStoryIds));
	});
</script>

<div class="container">
	<header>
		<h1>🔥 Top {props.data.storiesLimit} Hacker News Stories</h1>
		<div class="time-range-selector">
			{#each timeRanges as range (range.value)}
				<a
					href={resolve('/') + '?range=' + range.value}
					class="range-btn"
					class:active={props.data.timeRange === range.value}
					data-sveltekit-noscroll
				>
					{range.label}
				</a>
			{/each}
		</div>
	</header>

	<main>
		{#if props.data.error}
			<p class="error-message">{props.data.error}</p>
		{/if}

		{#if props.data.stories.length === 0}
			<p class="no-stories">No stories found in this time range.</p>
		{:else}
			{@const queueStories = getQueueStories()}
			{@const queueReadCount = queueStories.filter((story) => isStoryRead(story.objectID)).length}
			{@const queueProgress =
				queueStories.length > 0 ? Math.round((queueReadCount / queueStories.length) * 100) : 0}

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
					<div class="queue-progress-fill" style={`width: ${queueProgress}%`}></div>
				</div>
				<ol class="queue-list">
					{#each queueStories as story, index (story.objectID)}
						<li class="queue-item" class:read={isStoryRead(story.objectID)}>
							<span class="queue-rank">#{index + 1}</span>
							<div class="queue-story">
								{#if story.url}
									<a
										href={story.url}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={() => markStoryRead(story.objectID)}
									>
										{story.title}
									</a>
								{:else}
									<a
										href="https://news.ycombinator.com/item?id={story.objectID}"
										target="_blank"
										rel="external noopener noreferrer"
										onclick={() => markStoryRead(story.objectID)}
									>
										{story.title}
									</a>
								{/if}
								<span>{story.points} points • {formatTime(story.created_at_i)}</span>
							</div>
						</li>
					{/each}
				</ol>
			</section>

			<ol class="story-list">
				{#each props.data.stories as story, index (story.objectID)}
					<li class="story-item" class:read={isStoryRead(story.objectID)}>
						<div class="rank">#{index + 1}</div>
						<div class="story-content">
							<h2>
								{#if story.url}
									<a
										href={story.url}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={() => markStoryRead(story.objectID)}
									>
										{story.title}
									</a>
								{:else}
									<a
										href="https://news.ycombinator.com/item?id={story.objectID}"
										target="_blank"
										rel="external noopener noreferrer"
										onclick={() => markStoryRead(story.objectID)}
									>
										{story.title}
									</a>
								{/if}
							</h2>
							<div class="story-meta">
								{#if isStoryRead(story.objectID)}
									<span class="status-badge status-read">Read</span>
								{/if}
								{#if isStorySaved(story.objectID)}
									<span class="status-badge status-saved">Saved</span>
								{/if}
								<span class="score">{story.points} points</span>
								<span>by {story.author}</span>
								<span>{formatTime(story.created_at_i)}</span>
								<a
									href="https://news.ycombinator.com/item?id={story.objectID}"
									target="_blank"
									rel="external noopener noreferrer"
								>
									{story.num_comments || 0} comments
								</a>
							</div>
						</div>
					</li>
				{/each}
			</ol>
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

	header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 1.5rem;
		color: #ff6600;
	}

	.time-range-selector {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.range-btn {
		padding: 0.5rem 1rem;
		border: 2px solid #e0e0e0;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		text-decoration: none;
		color: #333;
		font-size: 0.95rem;
		transition: all 0.2s;
	}

	.range-btn:hover {
		border-color: #ff6600;
		background: #fff5f0;
	}

	.range-btn.active {
		background: #ff6600;
		color: white;
		border-color: #ff6600;
	}

	.story-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.queue-section {
		padding: 1rem;
		margin-bottom: 1.25rem;
		border-radius: 10px;
		border: 1px solid #ffe1cc;
		background: linear-gradient(180deg, #fff8f3 0%, #fff 100%);
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
		color: #a64500;
	}

	.queue-progress-label {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: #99521d;
	}

	.queue-progress-track {
		height: 0.5rem;
		border-radius: 999px;
		background: #ffe7d6;
		overflow: hidden;
		margin-bottom: 0.9rem;
	}

	.queue-progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #ff8a3d 0%, #ff6600 100%);
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
		background: #ffffff;
		border: 1px solid #f3d8c6;
	}

	.queue-item.read {
		opacity: 0.68;
	}

	.queue-rank {
		min-width: 2.4rem;
		font-size: 0.82rem;
		font-weight: 700;
		color: #ab6a3f;
	}

	.queue-story {
		display: grid;
		gap: 0.2rem;
	}

	.queue-story a {
		color: #2d2d2d;
		text-decoration: none;
		font-weight: 600;
		line-height: 1.25;
	}

	.queue-story a:hover {
		color: #cc5a00;
	}

	.queue-story span {
		font-size: 0.8rem;
		color: #7c5f4a;
	}

	.story-item {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-bottom: 1rem;
		transition: box-shadow 0.2s;
	}

	.story-item:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.story-item.read {
		background: #fafafa;
		border-color: #ececec;
		opacity: 0.72;
	}

	.story-item.read:hover {
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
	}

	.rank {
		font-size: 1.5rem;
		font-weight: bold;
		color: #999;
		min-width: 3rem;
	}

	.story-content {
		flex: 1;
	}

	h2 {
		font-size: 1.25rem;
		margin: 0 0 0.5rem 0;
		font-weight: 600;
	}

	h2 a {
		color: #333;
		text-decoration: none;
	}

	h2 a:hover {
		color: #ff6600;
	}

	.story-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: #666;
		flex-wrap: wrap;
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

	.score {
		color: #ff6600;
		font-weight: 600;
	}

	.story-meta a {
		color: #666;
		text-decoration: none;
	}

	.story-meta a:hover {
		color: #ff6600;
	}

	.error-message {
		background: #fff5f5;
		border: 1px solid #ffd5d5;
		color: #b20000;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.no-stories {
		text-align: center;
		padding: 3rem;
		color: #999;
		font-size: 1.125rem;
	}

	@media (max-width: 640px) {
		.container {
			padding: 1rem 0.5rem;
		}

		h1 {
			font-size: 1.5rem;
		}

		.time-range-selector {
			gap: 0.375rem;
		}

		.range-btn {
			padding: 0.35rem 0.65rem;
			font-size: 0.8rem;
			border-width: 1px;
			border-radius: 5px;
		}

		.story-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.rank {
			min-width: auto;
		}

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

	@media (max-width: 380px) {
		.range-btn {
			padding: 0.3rem 0.5rem;
			font-size: 0.75rem;
		}
	}
</style>
