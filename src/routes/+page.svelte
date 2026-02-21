<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import type { HNStory, TimeRange } from '$lib/hn-client';
	import { resolve } from '$app/paths';
	import {
		PREFERENCE_COOKIE_KEYS,
		PREFERENCE_STORAGE_KEYS,
		SORT_MODES,
		encodeHideReadPreference,
		isPreferredRange,
		isSortMode,
		parseHideReadPreference,
		type SortMode
	} from '$lib/preferences';
	import type { PageData } from './$types';

	const props: { data: PageData } = $props();
	const READ_STORAGE_KEY = 'hnrss:read-story-ids';
	const SAVED_STORAGE_KEY = 'hnrss:saved-story-ids';
	const QUEUE_SIZE = 3;
	const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
	let readStoryIds = $state<string[]>([]);
	let savedStoryIds = $state<string[]>([]);
	let activeStoryIndex = $state(0);
	let hasHydratedStoryState = false;
	let hasHydratedPreferences = false;
	let selectedTimeRange = $state<TimeRange>(props.data.timeRange);
	let selectedSortMode = $state<SortMode>(props.data.sortMode);
	let hideReadStories = $state<boolean>(props.data.hideRead);

	const timeRanges: Array<{ value: TimeRange; label: string }> = [
		{ value: '24h', label: 'Last 24 Hours' },
		{ value: '7d', label: 'Last 7 Days' },
		{ value: '30d', label: 'Last 30 Days' }
	];
	const sortModeLabels: Record<SortMode, string> = {
		top: 'Top',
		new: 'Newest',
		comments: 'Most Commented'
	};
	const sortModes: Array<{ value: SortMode; label: string }> = SORT_MODES.map((mode) => ({
		value: mode,
		label: sortModeLabels[mode]
	}));

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

	function toggleStorySaved(storyId: string): void {
		if (isStorySaved(storyId)) {
			savedStoryIds = savedStoryIds.filter((id) => id !== storyId);
			return;
		}

		savedStoryIds = [...savedStoryIds, storyId];
	}

	function getStoryHref(story: HNStory): string {
		return story.url ?? `https://news.ycombinator.com/item?id=${story.objectID}`;
	}

	function getCommentsHref(story: HNStory): string {
		return `https://news.ycombinator.com/item?id=${story.objectID}`;
	}

	function getStoryDomain(story: HNStory): string {
		if (!story.url) return 'news.ycombinator.com';

		try {
			return new URL(story.url).hostname.replace(/^www\./, '');
		} catch {
			return 'news.ycombinator.com';
		}
	}

	function getStoryFaviconUrl(story: HNStory): string {
		return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getStoryDomain(story))}&sz=32`;
	}

	function sortStories(stories: HNStory[], sortMode: SortMode): HNStory[] {
		const sortedStories = [...stories];

		if (sortMode === 'new') {
			return sortedStories.sort((a, b) => b.created_at_i - a.created_at_i || b.points - a.points);
		}

		if (sortMode === 'comments') {
			return sortedStories.sort((a, b) => b.num_comments - a.num_comments || b.points - a.points);
		}

		return sortedStories.sort((a, b) => b.points - a.points || b.created_at_i - a.created_at_i);
	}

	function getQueryForPreferences(
		timeRange: TimeRange,
		sortMode: SortMode,
		hideRead: boolean
	): string {
		const params = new URLSearchParams();
		params.set('range', timeRange);
		params.set('sort', sortMode);
		if (hideRead) {
			params.set('hideRead', '1');
		}
		return params.toString();
	}

	function getRangeHref(timeRange: TimeRange): string {
		const query = getQueryForPreferences(timeRange, selectedSortMode, hideReadStories);
		return `${resolve('/')}?${query}`;
	}

	function persistPreferenceState(): void {
		localStorage.setItem(PREFERENCE_STORAGE_KEYS.range, selectedTimeRange);
		localStorage.setItem(PREFERENCE_STORAGE_KEYS.sortMode, selectedSortMode);
		localStorage.setItem(PREFERENCE_STORAGE_KEYS.hideRead, encodeHideReadPreference(hideReadStories));

		document.cookie = `${PREFERENCE_COOKIE_KEYS.range}=${selectedTimeRange}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
		document.cookie = `${PREFERENCE_COOKIE_KEYS.sortMode}=${selectedSortMode}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
		document.cookie = `${PREFERENCE_COOKIE_KEYS.hideRead}=${encodeHideReadPreference(hideReadStories)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
	}

	function replacePreferenceQueryWithoutReload(): void {
		const nextUrl = new URL(window.location.href);
		const query = getQueryForPreferences(selectedTimeRange, selectedSortMode, hideReadStories);
		nextUrl.search = query;
		history.replaceState(history.state, '', nextUrl);
	}

	async function selectTimeRange(timeRange: TimeRange): Promise<void> {
		if (timeRange === selectedTimeRange) return;

		selectedTimeRange = timeRange;
		await goto(getRangeHref(timeRange), {
			keepFocus: true,
			noScroll: true
		});
	}

	function selectSortMode(sortMode: SortMode): void {
		if (sortMode === selectedSortMode) return;
		selectedSortMode = sortMode;
		activeStoryIndex = 0;
		if (!browser || !hasHydratedPreferences) return;

		replacePreferenceQueryWithoutReload();
	}

	function toggleHideRead(): void {
		hideReadStories = !hideReadStories;
		activeStoryIndex = 0;
		if (!browser || !hasHydratedPreferences) return;

		replacePreferenceQueryWithoutReload();
	}

	function skipStory(storyId: string): void {
		markStoryRead(storyId);
	}

	function getStoryElementId(storyId: string): string {
		return `story-${storyId}`;
	}

	let displayedStories = $derived.by(() => {
		const sortedStories = sortStories(props.data.stories, selectedSortMode);
		if (!hideReadStories) return sortedStories;
		return sortedStories.filter((story) => !isStoryRead(story.objectID));
	});

	function getActiveStory(): HNStory | undefined {
		return displayedStories[activeStoryIndex];
	}

	function setActiveStoryIndex(index: number): void {
		if (displayedStories.length === 0) {
			activeStoryIndex = 0;
			return;
		}

		const nextIndex = Math.max(0, Math.min(index, displayedStories.length - 1));
		activeStoryIndex = nextIndex;
		const nextStory = displayedStories[nextIndex];
		const nextElement = document.getElementById(getStoryElementId(nextStory.objectID));
		nextElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	function openStory(story: HNStory): void {
		markStoryRead(story.objectID);
		window.open(getStoryHref(story), '_blank', 'noopener,noreferrer');
	}

	function openStoryComments(story: HNStory): void {
		window.open(getCommentsHref(story), '_blank', 'noopener,noreferrer');
	}

	function handleKeyboardShortcuts(event: KeyboardEvent): void {
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		const target = event.target as HTMLElement | null;
		const tagName = target?.tagName;
		if (
			target?.isContentEditable ||
			tagName === 'INPUT' ||
			tagName === 'TEXTAREA' ||
			tagName === 'SELECT'
		) {
			return;
		}

		const key = event.key.toLowerCase();
		if (key === 'j') {
			event.preventDefault();
			setActiveStoryIndex(activeStoryIndex + 1);
			return;
		}

		if (key === 'k') {
			event.preventDefault();
			setActiveStoryIndex(activeStoryIndex - 1);
			return;
		}

		const activeStory = getActiveStory();
		if (!activeStory) return;

		if (key === 'o' || key === 'enter') {
			event.preventDefault();
			openStory(activeStory);
			return;
		}

		if (key === 's') {
			event.preventDefault();
			toggleStorySaved(activeStory.objectID);
			return;
		}

		if (key === 'm') {
			event.preventDefault();
			markStoryRead(activeStory.objectID);
			return;
		}

		if (key === 'c') {
			event.preventDefault();
			openStoryComments(activeStory);
		}
	}

	function getQueueStories(stories: HNStory[]) {
		return stories.slice(0, QUEUE_SIZE);
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

	$effect(() => {
		selectedTimeRange = props.data.timeRange;
		selectedSortMode = props.data.sortMode;
		hideReadStories = props.data.hideRead;
	});

	$effect(() => {
		if (!browser || hasHydratedPreferences) return;

		const searchParams = new URLSearchParams(window.location.search);
		const storedRange = localStorage.getItem(PREFERENCE_STORAGE_KEYS.range);
		const storedSortMode = localStorage.getItem(PREFERENCE_STORAGE_KEYS.sortMode);
		const storedHideRead = localStorage.getItem(PREFERENCE_STORAGE_KEYS.hideRead);

		let shouldNavigate = false;
		if (!searchParams.has('range') && isPreferredRange(storedRange) && storedRange !== selectedTimeRange) {
			selectedTimeRange = storedRange;
			shouldNavigate = true;
		}

		if (!searchParams.has('sort') && isSortMode(storedSortMode)) {
			selectedSortMode = storedSortMode;
		}

		const parsedStoredHideRead = parseHideReadPreference(storedHideRead);
		if (!searchParams.has('hideRead') && parsedStoredHideRead !== null) {
			hideReadStories = parsedStoredHideRead;
		}

		hasHydratedPreferences = true;
		persistPreferenceState();

		if (shouldNavigate) {
			void goto(getRangeHref(selectedTimeRange), {
				keepFocus: true,
				noScroll: true,
				replaceState: true
			});
			return;
		}

		replacePreferenceQueryWithoutReload();
	});

	$effect(() => {
		if (!browser || !hasHydratedPreferences) return;
		persistPreferenceState();
	});

	$effect(() => {
		if (!browser) return;

		const maxIndex = Math.max(0, displayedStories.length - 1);
		if (activeStoryIndex > maxIndex) {
			activeStoryIndex = maxIndex;
		}
	});

</script>

<svelte:window onkeydown={handleKeyboardShortcuts} />

<div class="container">
	<header>
		<h1>🔥 Top {props.data.storiesLimit} Hacker News Stories</h1>
		<div class="time-range-selector">
			{#each timeRanges as range (range.value)}
				<a
					href={getRangeHref(range.value)}
					class="range-btn"
					class:active={selectedTimeRange === range.value}
					data-sveltekit-noscroll
					onclick={(event) => {
						event.preventDefault();
						void selectTimeRange(range.value);
					}}
				>
					{range.label}
				</a>
			{/each}
		</div>
		<div class="preference-controls">
			<div class="sort-selector" role="group" aria-label="Sort stories">
				{#each sortModes as mode (mode.value)}
					<button
						type="button"
						class="sort-btn"
						class:active={selectedSortMode === mode.value}
						onclick={() => selectSortMode(mode.value)}
					>
						{mode.label}
					</button>
				{/each}
			</div>
			<button
				type="button"
				class="hide-read-toggle"
				class:active={hideReadStories}
				aria-pressed={hideReadStories}
				onclick={toggleHideRead}
			>
				{hideReadStories ? 'Unread only' : 'Show read'}
			</button>
		</div>
		<p class="keyboard-hint">Keyboard: j/k navigate • o/Enter open • c comments • s save • m mark read</p>
	</header>

	<main>
		{#if props.data.error}
			<p class="error-message">{props.data.error}</p>
		{/if}

		{#if props.data.stories.length === 0}
			<p class="no-stories">No stories found in this time range.</p>
		{:else}
			{#if displayedStories.length === 0}
				<p class="no-stories">No stories match these filters.</p>
			{:else}
				{@const queueStories = getQueueStories(displayedStories)}
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
									onclick={() => markStoryRead(story.objectID)}
								>
									{story.title}
								</a>
								<span>{story.points} points • {formatTime(story.created_at_i)}</span>
							</div>
						</li>
					{/each}
				</ol>
			</section>

			<ol class="story-list">
				{#each displayedStories as story, index (story.objectID)}
					{@const storyDomain = getStoryDomain(story)}
					<li
						id={getStoryElementId(story.objectID)}
						class="story-item"
						class:read={isStoryRead(story.objectID)}
						class:active={index === activeStoryIndex}
					>
						<div class="rank">#{index + 1}</div>
						<div class="story-content">
							<div class="story-title-row">
								<h2 class="story-title">
									<a
										href={getStoryHref(story)}
										target="_blank"
										rel="external noopener noreferrer"
										onclick={() => markStoryRead(story.objectID)}
									>
										{story.title}
									</a>
								</h2>
								<span class="story-domain">
									<img
										src={getStoryFaviconUrl(story)}
										alt=""
										loading="lazy"
										decoding="async"
										width="16"
										height="16"
									/>
									{storyDomain}
								</span>
							</div>
							<div class="story-actions">
								<a
									href={getStoryHref(story)}
									target="_blank"
									rel="external noopener noreferrer"
									class="story-action story-action-open"
									onclick={() => markStoryRead(story.objectID)}
								>
									Open
								</a>
								<button
									type="button"
									class="story-action story-action-save"
									aria-pressed={isStorySaved(story.objectID)}
									onclick={() => toggleStorySaved(story.objectID)}
								>
									{isStorySaved(story.objectID) ? 'Saved' : 'Save'}
								</button>
								<button
									type="button"
									class="story-action story-action-skip"
									onclick={() => skipStory(story.objectID)}
								>
									Skip
								</button>
							</div>
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
								{#if isStoryRead(story.objectID)}
									<span class="status-badge status-read">Read</span>
								{/if}
								{#if isStorySaved(story.objectID)}
									<span class="status-badge status-saved">Saved</span>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ol>
			{/if}
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

	.preference-controls {
		margin-top: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.sort-selector {
		display: inline-flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.sort-btn,
	.hide-read-toggle {
		padding: 0.38rem 0.7rem;
		border: 1px solid #dddddd;
		border-radius: 999px;
		background: white;
		color: #4f4f4f;
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.sort-btn:hover,
	.hide-read-toggle:hover {
		border-color: #cfcfcf;
		background: #f8f8f8;
	}

	.sort-btn.active {
		border-color: #ffbf94;
		background: #fff3eb;
		color: #bb4f00;
	}

	.hide-read-toggle.active {
		border-color: #ffbf94;
		background: #fff3eb;
		color: #bb4f00;
	}

	.story-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.keyboard-hint {
		margin: 0.75rem 0 0;
		font-size: 0.78rem;
		color: #7b7b7b;
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

	.story-item.active {
		border-color: #ffba8a;
		box-shadow: 0 0 0 2px #ffe7d3;
	}

	.story-item.read {
		background: #fafafa;
		border-color: #ececec;
		opacity: 0.72;
	}

	.story-item.read.active {
		border-color: #ffd3b4;
		box-shadow: 0 0 0 2px #ffefe4;
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
		color: #333;
		text-decoration: none;
	}

	.story-title a:hover {
		color: #ff6600;
	}

	.story-domain {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		background: #f6f6f6;
		border: 1px solid #ececec;
		color: #565656;
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
		border: 1px solid #e2e2e2;
		background: #fff;
		color: #444;
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
		border-color: #cfcfcf;
		background: #f8f8f8;
	}

	.story-action-open {
		border-color: #ffcfab;
		color: #c25100;
		background: #fff5ef;
	}

	.story-action-open:hover {
		border-color: #ffb982;
		background: #ffefe4;
	}

	.story-action-save[aria-pressed='true'] {
		border-color: #ffbe8f;
		background: #fff1e6;
		color: #bb4f00;
	}

	.story-action-skip {
		color: #666;
	}

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

		.preference-controls {
			margin-top: 0.55rem;
		}

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
