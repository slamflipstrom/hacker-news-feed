<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	$effect(() => {
		if (!browser) return;
		const theme = data.theme;
		const root = document.documentElement;
		if (theme === 'system') {
			delete root.dataset.theme;
		} else {
			root.dataset.theme = theme;
		}
	});
</script>

<svelte:head>
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="shortcut icon" href="/favicon.ico" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

{@render children?.()}
