<script lang="ts">
	interface Props {
		show: boolean;
	}

	let { show }: Props = $props();
</script>

{#if show}
	<p class="keyboard-hint">Keyboard: j/k navigate • o/Enter open • c comments • s save • m mark read</p>
{/if}

<style>
	.keyboard-hint {
		margin: 0.35rem 0 0;
		font-size: 0.78rem;
		color: #7b7b7b;
	}
</style>
