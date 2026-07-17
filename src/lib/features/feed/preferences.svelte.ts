import { browser } from '$app/environment';
import { goto, replaceState } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import type { TimeRange } from '$lib/hn-client';
import {
	DEFAULT_KEYBOARD_SHORTCUTS_ENABLED,
	PREFERENCE_COOKIE_KEYS,
	PREFERENCE_STORAGE_KEYS,
	THEME_MODES,
	encodeEnabledPreference,
	encodeHideReadPreference,
	isSortMode,
	isThemeMode,
	isTimeRange,
	normalizeMutedTerm,
	parseEnabledPreference,
	parseHideReadPreference,
	parseMutedTermsPreference,
	type SortMode,
	type ThemeMode
} from '$lib/preferences';
import {
	PREFERENCE_COOKIE_MAX_AGE_SECONDS
} from '$lib/features/feed/constants';
import type { FeedPreferences } from '$lib/features/feed/types';

export function createPreferencesController(initial: FeedPreferences) {
	const state = $state({
		selectedTimeRange: initial.timeRange,
		selectedSortMode: initial.sortMode,
		hideReadStories: initial.hideRead,
		selectedThemeMode: initial.themeMode,
		keyboardShortcutsEnabled: DEFAULT_KEYBOARD_SHORTCUTS_ENABLED,
		mutedTerms: [] as string[],
		hasHydratedPreferences: false
	});

	function getQueryForPreferences(
		timeRange: TimeRange,
		sortMode: SortMode,
		hideRead: boolean,
		themeMode: ThemeMode
	): string {
		const params = new URLSearchParams();
		params.set('range', timeRange);
		params.set('sort', sortMode);
		if (hideRead) {
			params.set('hideRead', '1');
		}
		params.set('theme', themeMode);
		return params.toString();
	}

	function getRangeHref(timeRange: TimeRange): string {
		const query = getQueryForPreferences(
			timeRange,
			state.selectedSortMode,
			state.hideReadStories,
			state.selectedThemeMode
		);
		return `${resolve('/')}?${query}`;
	}

	function setPreferenceCookie(key: string, value: string): void {
		document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
	}

	function persistPreferenceState(): void {
		try {
			localStorage.setItem(PREFERENCE_STORAGE_KEYS.range, state.selectedTimeRange);
			localStorage.setItem(PREFERENCE_STORAGE_KEYS.sortMode, state.selectedSortMode);
			localStorage.setItem(
				PREFERENCE_STORAGE_KEYS.hideRead,
				encodeHideReadPreference(state.hideReadStories)
			);
			localStorage.setItem(PREFERENCE_STORAGE_KEYS.theme, state.selectedThemeMode);
			localStorage.setItem(
				PREFERENCE_STORAGE_KEYS.keyboardShortcutsEnabled,
				encodeEnabledPreference(state.keyboardShortcutsEnabled)
			);
			// Muted terms are a client-only preference: the server never filters
			// on them, so no cookie or URL round-trip.
			localStorage.setItem(PREFERENCE_STORAGE_KEYS.mutedTerms, JSON.stringify(state.mutedTerms));
		} catch {
			// localStorage may throw in private browsing mode or when quota is exceeded.
		}

		setPreferenceCookie(PREFERENCE_COOKIE_KEYS.range, state.selectedTimeRange);
		setPreferenceCookie(PREFERENCE_COOKIE_KEYS.sortMode, state.selectedSortMode);
		setPreferenceCookie(
			PREFERENCE_COOKIE_KEYS.hideRead,
			encodeHideReadPreference(state.hideReadStories)
		);
		setPreferenceCookie(PREFERENCE_COOKIE_KEYS.theme, state.selectedThemeMode);
	}

	function applyThemeToDom(theme: ThemeMode): void {
		if (theme === 'system') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	function cycleTheme(): void {
		const nextIndex = (THEME_MODES.indexOf(state.selectedThemeMode) + 1) % THEME_MODES.length;
		state.selectedThemeMode = THEME_MODES[nextIndex];
		applyThemeToDom(state.selectedThemeMode);
		if (!browser || !state.hasHydratedPreferences) return;
		replacePreferenceQueryWithoutReload();
		persistPreferenceState();
	}

	function replacePreferenceQueryWithoutReload(): void {
		const nextUrl = new URL(window.location.href);
		const query = getQueryForPreferences(
			state.selectedTimeRange,
			state.selectedSortMode,
			state.hideReadStories,
			state.selectedThemeMode
		);
		nextUrl.search = query;
		try {
			replaceState(nextUrl, page.state);
			return;
		} catch {
			// Router can be uninitialized during hydration; fall back to the browser API.
			history.replaceState(history.state, '', nextUrl);
		}
	}

	async function selectTimeRange(timeRange: TimeRange): Promise<void> {
		if (timeRange === state.selectedTimeRange) return;

		state.selectedTimeRange = timeRange;
		await goto(getRangeHref(timeRange), {
			keepFocus: true,
			noScroll: true
		});
	}

	function selectSortMode(sortMode: SortMode): void {
		if (sortMode === state.selectedSortMode) return;
		state.selectedSortMode = sortMode;
		if (!browser || !state.hasHydratedPreferences) return;

		replacePreferenceQueryWithoutReload();
	}

	function toggleHideRead(): void {
		state.hideReadStories = !state.hideReadStories;
		if (!browser || !state.hasHydratedPreferences) return;

		replacePreferenceQueryWithoutReload();
	}

	function toggleKeyboardShortcutsEnabled(): void {
		state.keyboardShortcutsEnabled = !state.keyboardShortcutsEnabled;
	}

	function addMutedTerm(term: string): void {
		const normalized = normalizeMutedTerm(term);
		if (!normalized || state.mutedTerms.includes(normalized)) return;
		state.mutedTerms = [...state.mutedTerms, normalized];
	}

	function removeMutedTerm(term: string): void {
		state.mutedTerms = state.mutedTerms.filter((existing) => existing !== term);
	}

	function syncFromServer(next: FeedPreferences): void {
		state.selectedTimeRange = next.timeRange;
		state.selectedSortMode = next.sortMode;
		state.hideReadStories = next.hideRead;
		state.selectedThemeMode = next.themeMode;
	}

	$effect(() => {
		if (!browser || state.hasHydratedPreferences) return;

		const searchParams = new URLSearchParams(window.location.search);
		const storedRange = localStorage.getItem(PREFERENCE_STORAGE_KEYS.range);
		const storedSortMode = localStorage.getItem(PREFERENCE_STORAGE_KEYS.sortMode);
		const storedHideRead = localStorage.getItem(PREFERENCE_STORAGE_KEYS.hideRead);
		const storedTheme = localStorage.getItem(PREFERENCE_STORAGE_KEYS.theme);
		const storedKeyboardShortcutsEnabled = localStorage.getItem(
			PREFERENCE_STORAGE_KEYS.keyboardShortcutsEnabled
		);

		let shouldNavigate = false;
		if (
			!searchParams.has('range') &&
			isTimeRange(storedRange) &&
			storedRange !== state.selectedTimeRange
		) {
			state.selectedTimeRange = storedRange;
			shouldNavigate = true;
		}

		if (!searchParams.has('sort') && isSortMode(storedSortMode)) {
			state.selectedSortMode = storedSortMode;
		}

		const parsedStoredHideRead = parseHideReadPreference(storedHideRead);
		if (!searchParams.has('hideRead') && parsedStoredHideRead !== null) {
			state.hideReadStories = parsedStoredHideRead;
		}

		if (!searchParams.has('theme') && isThemeMode(storedTheme) && storedTheme !== state.selectedThemeMode) {
			state.selectedThemeMode = storedTheme;
		}

		const parsedKeyboardShortcutsEnabled = parseEnabledPreference(storedKeyboardShortcutsEnabled);
		if (parsedKeyboardShortcutsEnabled !== null) {
			state.keyboardShortcutsEnabled = parsedKeyboardShortcutsEnabled;
		}

		const parsedMutedTerms = parseMutedTermsPreference(
			localStorage.getItem(PREFERENCE_STORAGE_KEYS.mutedTerms)
		);
		if (parsedMutedTerms !== null) {
			state.mutedTerms = parsedMutedTerms;
		}

		applyThemeToDom(state.selectedThemeMode);

		state.hasHydratedPreferences = true;
		persistPreferenceState();

		if (shouldNavigate) {
			void goto(getRangeHref(state.selectedTimeRange), {
				keepFocus: true,
				noScroll: true,
				replaceState: true
			});
			return;
		}

		replacePreferenceQueryWithoutReload();
	});

	$effect(() => {
		if (!browser || !state.hasHydratedPreferences) return;
		persistPreferenceState();
	});

	return {
		state,
		getRangeHref,
		selectTimeRange,
		selectSortMode,
		toggleHideRead,
		toggleKeyboardShortcutsEnabled,
		addMutedTerm,
		removeMutedTerm,
		cycleTheme,
		syncFromServer
	};
}
