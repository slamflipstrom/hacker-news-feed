import { DEFAULT_THEME_MODE, isThemeMode, PREFERENCE_COOKIE_KEYS } from '$lib/preferences';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	const raw = cookies.get(PREFERENCE_COOKIE_KEYS.theme) ?? null;
	return { theme: isThemeMode(raw) ? raw : DEFAULT_THEME_MODE };
};
