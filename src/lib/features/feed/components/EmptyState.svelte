<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<p class="no-stories">{message}</p>

<style>
	.no-stories {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-faint);
		font-size: 1.125rem;
	}
</style>
