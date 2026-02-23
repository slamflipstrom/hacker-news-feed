import { SORT_MODES, type SortMode } from '$lib/preferences';
import type { TimeRangeOption, SortModeOption } from '$lib/features/feed/types';

export const READ_STORAGE_KEY = 'hnrss:read-story-ids';
export const SAVED_STORAGE_KEY = 'hnrss:saved-story-ids';
export const QUEUE_SIZE = 3;
export const PREFERENCE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
	{ value: '24h', label: 'Last 24 Hours' },
	{ value: '7d', label: 'Last 7 Days' },
	{ value: '30d', label: 'Last 30 Days' }
];

export const SORT_MODE_LABELS: Record<SortMode, string> = {
	top: 'Top',
	new: 'Newest',
	comments: 'Most Commented'
};

export const SORT_MODE_OPTIONS: SortModeOption[] = SORT_MODES.map((mode) => ({
	value: mode,
	label: SORT_MODE_LABELS[mode]
}));
