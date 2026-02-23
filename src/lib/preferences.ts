import type { TimeRange } from '$lib/hn-client';

export const SORT_MODES = ['top', 'comments'] as const;
export type SortMode = (typeof SORT_MODES)[number];

export const THEME_MODES = ['system', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DEFAULT_SORT_MODE: SortMode = 'top';
export const DEFAULT_HIDE_READ = false;
export const DEFAULT_THEME_MODE: ThemeMode = 'system';

export const PREFERENCE_STORAGE_KEYS = {
	range: 'hnrss:preferred-range',
	sortMode: 'hnrss:preferred-sort-mode',
	hideRead: 'hnrss:preferred-hide-read',
	theme: 'hnrss:preferred-theme'
} as const;

export const PREFERENCE_COOKIE_KEYS = {
	range: 'hnrss_range',
	sortMode: 'hnrss_sort_mode',
	hideRead: 'hnrss_hide_read',
	theme: 'hnrss_theme'
} as const;

export function isSortMode(value: string | null): value is SortMode {
	return value !== null && SORT_MODES.includes(value as SortMode);
}

export function isThemeMode(value: string | null): value is ThemeMode {
	return value !== null && THEME_MODES.includes(value as ThemeMode);
}

export function parseHideReadPreference(value: string | null): boolean | null {
	if (value === null) return null;
	if (value === '1' || value === 'true') return true;
	if (value === '0' || value === 'false') return false;
	return null;
}

export function isPreferredRange(value: string | null): value is TimeRange {
	return value === '24h' || value === '7d' || value === '30d';
}

export function encodeHideReadPreference(value: boolean): '1' | '0' {
	return value ? '1' : '0';
}
