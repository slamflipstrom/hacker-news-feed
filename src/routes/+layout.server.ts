import { DEFAULT_THEME_MODE, isThemeMode, PREFERENCE_COOKIE_KEYS } from '$lib/preferences';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies, url }) => {
	const rawQueryTheme = url.searchParams.get('theme');
	const rawCookieTheme = url.searchParams.has('theme')
		? null
		: cookies.get(PREFERENCE_COOKIE_KEYS.theme) ?? null;
	const theme =
		(isThemeMode(rawQueryTheme) && rawQueryTheme) ||
		(isThemeMode(rawCookieTheme) && rawCookieTheme) ||
		DEFAULT_THEME_MODE;

	return { theme };
};
