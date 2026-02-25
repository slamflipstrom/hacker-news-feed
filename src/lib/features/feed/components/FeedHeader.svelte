<script lang="ts">
	import type { TimeRange } from '$lib/hn-client';
	import type { SortMode, ThemeMode } from '$lib/preferences';
	import type { TimeRangeOption, SortModeOption } from '$lib/features/feed/types';
	import KeyboardHint from '$lib/features/feed/components/KeyboardHint.svelte';

	const THEME_LABELS: Record<ThemeMode, string> = {
		system: 'System',
		light: '☀ Light',
		dark: '☾ Dark'
	};

	interface Props {
		storiesLimit: number;
		showingSavedOnly: boolean;
		savedStoriesCount: number;
		timeRanges: TimeRangeOption[];
		sortModes: SortModeOption[];
		selectedTimeRange: TimeRange;
		selectedSortMode: SortMode;
		hideReadStories: boolean;
		themeMode: ThemeMode;
		keyboardShortcutsEnabled: boolean;
		showKeyboardShortcuts: boolean;
		getRangeHref: (timeRange: TimeRange) => string;
		onSelectTimeRange: (timeRange: TimeRange) => Promise<void>;
		onSelectSortMode: (sortMode: SortMode) => void;
		onToggleHideRead: () => void;
		onShowAllStories: () => void;
		onShowSavedStories: () => void;
		onCycleTheme: () => void;
		onToggleKeyboardShortcuts: () => void;
		onToggleKeyboardShortcutsEnabled: () => void;
		onMarkAllRead: () => void;
		onRefresh: () => void;
		hasUnreadStories: boolean;
		minutesAgo: number;
	}

	let {
		storiesLimit,
		showingSavedOnly,
		savedStoriesCount,
		timeRanges,
		sortModes,
		selectedTimeRange,
		selectedSortMode,
		hideReadStories,
		themeMode,
		keyboardShortcutsEnabled,
		showKeyboardShortcuts,
		getRangeHref,
		onSelectTimeRange,
		onSelectSortMode,
		onToggleHideRead,
		onShowAllStories,
		onShowSavedStories,
		onCycleTheme,
		onToggleKeyboardShortcuts,
		onToggleKeyboardShortcutsEnabled,
		onMarkAllRead,
		onRefresh,
		hasUnreadStories,
		minutesAgo
	}: Props = $props();
</script>

<header>
	<div class="header-top">
		<h1>
			{#if showingSavedOnly}
				🔖 Saved Hacker News Stories
			{:else}
				🔥 Top {storiesLimit} Hacker News Stories
			{/if}
		</h1>
		<div class="header-actions">
			<span class="last-updated">{minutesAgo === 0 ? 'Just updated' : `Updated ${minutesAgo}m ago`}</span>
			<button
				type="button"
				class="refresh-btn"
				aria-label="Refresh stories"
				onclick={onRefresh}
			>↻</button>
			<button
				type="button"
				class="theme-toggle"
				class:active={themeMode !== 'system'}
				aria-label="Cycle theme: current is {themeMode}"
				onclick={onCycleTheme}
			>
				{THEME_LABELS[themeMode]}
			</button>
		</div>
	</div>
	<div class="view-selector" role="group" aria-label="Story scope">
		<button
			type="button"
			class="view-btn"
			class:active={!showingSavedOnly}
			aria-pressed={!showingSavedOnly}
			onclick={onShowAllStories}
		>
			All stories
		</button>
		<button
			type="button"
			class="view-btn"
			class:active={showingSavedOnly}
			aria-pressed={showingSavedOnly}
			onclick={onShowSavedStories}
		>
			Saved ({savedStoriesCount})
		</button>
	</div>
	{#if !showingSavedOnly}
		<div class="time-range-selector">
			{#each timeRanges as range (range.value)}
				<a
					href={getRangeHref(range.value)}
					class="range-btn"
					class:active={selectedTimeRange === range.value}
					aria-current={selectedTimeRange === range.value ? 'page' : undefined}
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
	{:else}
		<p class="saved-scope-note">Saved stories are stored on this browser/device.</p>
	{/if}
	<div class="preference-controls">
		<div class="sort-selector" role="group" aria-label="Sort stories">
			{#each sortModes as mode (mode.value)}
				<button
					type="button"
					class="sort-btn"
					class:active={selectedSortMode === mode.value}
					aria-pressed={selectedSortMode === mode.value}
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
		{#if hasUnreadStories && !showingSavedOnly}
			<button type="button" class="mark-all-btn" onclick={onMarkAllRead}>
				Mark all read
			</button>
		{/if}
	</div>
	<p class="keyboard-shortcuts-toggle">
		<button
			type="button"
			class="keyboard-shortcuts-enabled-toggle"
			aria-pressed={keyboardShortcutsEnabled}
			onclick={onToggleKeyboardShortcutsEnabled}
		>
			Keyboard shortcuts: {keyboardShortcutsEnabled ? 'On' : 'Off'}
		</button>
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

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 2rem;
		margin: 0;
		color: var(--color-brand);
	}

	.view-selector {
		display: inline-flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.time-range-selector {
		margin-top: 0.75rem;
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.saved-scope-note {
		margin: 0.75rem 0 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
	}

	.range-btn {
		padding: 0.5rem 1rem;
		border: 2px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface);
		cursor: pointer;
		text-decoration: none;
		color: var(--color-text-primary);
		font-size: 0.95rem;
		transition: all 0.2s;
	}

	.range-btn:hover {
		border-color: var(--color-brand);
		background: var(--color-accent-bg);
	}

	.range-btn.active {
		background: var(--color-brand);
		color: var(--color-brand-contrast-text);
		border-color: var(--color-brand);
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
	.hide-read-toggle,
	.view-btn {
		padding: 0.38rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.sort-btn:hover,
	.hide-read-toggle:hover,
	.view-btn:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
	}

	.sort-btn.active,
	.hide-read-toggle.active,
	.view-btn.active {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg);
		color: var(--color-accent-text);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.last-updated {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.refresh-btn {
		padding: 0.35rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 1rem;
		font-family: inherit;
		cursor: pointer;
		line-height: 1;
	}

	.refresh-btn:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
		color: var(--color-text-secondary);
	}

	.mark-all-btn {
		padding: 0.38rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.mark-all-btn:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
		color: var(--color-text-secondary);
	}

	.theme-toggle {
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.theme-toggle:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
		color: var(--color-text-secondary);
	}

	.theme-toggle.active {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg);
		color: var(--color-accent-text);
	}

	.keyboard-shortcuts-toggle {
		margin: 0.75rem 0 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.keyboard-shortcuts-enabled-toggle {
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.keyboard-shortcuts-enabled-toggle:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
	}

	.keyboard-shortcuts-enabled-toggle[aria-pressed='true'] {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg);
		color: var(--color-accent-text);
	}

	.keyboard-shortcuts-link {
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--color-accent-link);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		text-decoration: underline;
		cursor: pointer;
	}

	.keyboard-shortcuts-link:hover {
		color: var(--color-accent-text);
	}

	.keyboard-shortcuts-link:focus-visible {
		outline: 2px solid var(--color-accent-border);
		outline-offset: 2px;
		border-radius: 4px;
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 1.3rem;
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
