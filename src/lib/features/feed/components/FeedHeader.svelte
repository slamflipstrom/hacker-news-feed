<script lang="ts">
	import type { TimeRange } from '$lib/hn-client';
	import type { SortMode } from '$lib/preferences';
	import type { TimeRangeOption, SortModeOption } from '$lib/features/feed/types';
	import KeyboardHint from '$lib/features/feed/components/KeyboardHint.svelte';

	interface Props {
		storiesLimit: number;
		timeRanges: TimeRangeOption[];
		sortModes: SortModeOption[];
		selectedTimeRange: TimeRange;
		selectedSortMode: SortMode;
		hideReadStories: boolean;
		showKeyboardShortcuts: boolean;
		getRangeHref: (timeRange: TimeRange) => string;
		onSelectTimeRange: (timeRange: TimeRange) => Promise<void>;
		onSelectSortMode: (sortMode: SortMode) => void;
		onToggleHideRead: () => void;
		onToggleKeyboardShortcuts: () => void;
	}

	let {
		storiesLimit,
		timeRanges,
		sortModes,
		selectedTimeRange,
		selectedSortMode,
		hideReadStories,
		showKeyboardShortcuts,
		getRangeHref,
		onSelectTimeRange,
		onSelectSortMode,
		onToggleHideRead,
		onToggleKeyboardShortcuts
	}: Props = $props();
</script>

<header>
	<h1>🔥 Top {storiesLimit} Hacker News Stories</h1>
	<div class="time-range-selector">
		{#each timeRanges as range (range.value)}
			<a
				href={getRangeHref(range.value)}
				class="range-btn"
				class:active={selectedTimeRange === range.value}
				data-sveltekit-noscroll
				onclick={(event) => {
					event.preventDefault();
					void onSelectTimeRange(range.value);
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
					onclick={() => onSelectSortMode(mode.value)}
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
			onclick={onToggleHideRead}
		>
			{hideReadStories ? 'Unread only' : 'Show read'}
		</button>
	</div>
	<p class="keyboard-shortcuts-toggle">
		<button
			type="button"
			class="keyboard-shortcuts-link"
			aria-expanded={showKeyboardShortcuts}
			onclick={onToggleKeyboardShortcuts}
		>
			{showKeyboardShortcuts ? 'Hide keyboard shortcuts' : 'Keyboard shortcuts'}
		</button>
	</p>
	<KeyboardHint show={showKeyboardShortcuts} />
</header>

<style>
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

	.keyboard-shortcuts-toggle {
		margin: 0.75rem 0 0;
	}

	.keyboard-shortcuts-link {
		padding: 0;
		border: 0;
		background: transparent;
		color: #8f4a16;
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	.keyboard-shortcuts-link:hover {
		color: #bb4f00;
	}

	.keyboard-shortcuts-link:focus-visible {
		outline: 2px solid #ffbf94;
		outline-offset: 2px;
		border-radius: 4px;
	}

	@media (max-width: 640px) {
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
	}

	@media (max-width: 380px) {
		.range-btn {
			padding: 0.3rem 0.5rem;
			font-size: 0.75rem;
		}
	}
</style>
