<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';

	const props: { data: PageData } = $props();

	const timeRanges = [
		{ value: '1h', label: 'Last Hour' },
		{ value: '24h', label: 'Last 24 Hours' },
		{ value: '7d', label: 'Last 7 Days' },
		{ value: '30d', label: 'Last 30 Days' }
	];

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

</script>

<div class="container">
	<header>
		<h1>🔥 Top 10 Hacker News Stories</h1>
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
		{#if props.data.stories.length === 0}
			<p class="no-stories">No stories found in this time range.</p>
		{:else}
			<ol class="story-list">
				{#each props.data.stories as story, index (story.objectID)}
					<li class="story-item">
						<div class="rank">#{index + 1}</div>
						<div class="story-content">
							<h2>
								{#if story.url}
									<a href={story.url} target="_blank" rel="external noopener noreferrer">
										{story.title}
									</a>
								{:else}
									<a href="https://news.ycombinator.com/item?id={story.objectID}" target="_blank" rel="external noopener noreferrer">
										{story.title}
									</a>
								{/if}
							</h2>
							<div class="story-meta">
								<span class="score">{story.points} points</span>
								<span>by {story.author}</span>
								<span>{formatTime(story.created_at_i)}</span>
								<a href="https://news.ycombinator.com/item?id={story.objectID}" target="_blank" rel="external noopener noreferrer">
									{story.num_comments|| 0} comments
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
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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

		.story-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.rank {
			min-width: auto;
		}
	}
</style>
