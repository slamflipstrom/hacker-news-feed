import { getStoriesInTimeRange, type TimeRange } from '$lib/hn-client';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const timeRange = (url.searchParams.get('range') as TimeRange) || '24h';
	const stories = await getStoriesInTimeRange(timeRange, 10);

	return {
		stories,
		timeRange
	};
};
