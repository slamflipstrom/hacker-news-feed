import type { HNStory, TimeRange } from '$lib/hn-client';
import type { SortMode, ThemeMode } from '$lib/preferences';

export interface FeedPreferences {
	timeRange: TimeRange;
	sortMode: SortMode;
	hideRead: boolean;
	themeMode: ThemeMode;
}

export interface StoryActions {
	onOpen: (story: HNStory) => void;
	onOpenComments: (story: HNStory) => void;
	onToggleSave: (storyId: string) => void;
	onMarkRead: (storyId: string) => void;
	onSkip: (storyId: string) => void;
}

export interface StoryFlags {
	isRead: (storyId: string) => boolean;
	isSaved: (storyId: string) => boolean;
}

export interface TimeRangeOption {
	value: TimeRange;
	label: string;
}

export interface SortModeOption {
	value: SortMode;
	label: string;
}
