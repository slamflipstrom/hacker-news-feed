<script lang="ts">
	interface Props {
		mutedTerms: string[];
		onAddMutedTerm: (term: string) => void;
		onRemoveMutedTerm: (term: string) => void;
	}

	let { mutedTerms, onAddMutedTerm, onRemoveMutedTerm }: Props = $props();

	let expanded = $state(false);
	let draftTerm = $state('');

	function handleSubmit(event: SubmitEvent): void {
		event.preventDefault();
		onAddMutedTerm(draftTerm);
		draftTerm = '';
	}
</script>

<div class="mute-list">
	<button
		type="button"
		class="mute-toggle"
		class:active={mutedTerms.length > 0}
		aria-expanded={expanded}
		onclick={() => (expanded = !expanded)}
	>
		Mutes ({mutedTerms.length})
	</button>
	{#if expanded}
		<div class="mute-panel">
			<p class="mute-hint">Stories whose domain or title match a muted term are hidden.</p>
			<form class="mute-form" onsubmit={handleSubmit}>
				<input
					type="text"
					class="mute-input"
					placeholder="Domain or keyword"
					aria-label="Domain or keyword to mute"
					bind:value={draftTerm}
				/>
				<button type="submit" class="mute-add-btn" disabled={!draftTerm.trim()}>Mute</button>
			</form>
			{#if mutedTerms.length > 0}
				<ul class="mute-chips">
					{#each mutedTerms as term (term)}
						<li class="mute-chip">
							<span>{term}</span>
							<button
								type="button"
								class="mute-remove-btn"
								aria-label="Unmute {term}"
								onclick={() => onRemoveMutedTerm(term)}
							>
								×
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	.mute-list {
		margin-top: 0.75rem;
	}

	.mute-toggle {
		padding: 0.38rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.mute-toggle:hover {
		border-color: var(--color-border-hover);
		background: var(--color-surface-hover);
	}

	.mute-toggle.active {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg);
		color: var(--color-accent-text);
	}

	.mute-panel {
		margin-top: 0.6rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
	}

	.mute-hint {
		margin: 0 0 0.6rem;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	.mute-form {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mute-input {
		flex: 1;
		min-width: 12rem;
		padding: 0.38rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		background: var(--color-surface);
		color: var(--color-text-primary);
		font-size: 0.85rem;
		font-family: inherit;
	}

	.mute-input:focus-visible {
		outline: 2px solid var(--color-accent-border);
		outline-offset: 1px;
	}

	.mute-add-btn {
		padding: 0.38rem 0.8rem;
		border: 1px solid var(--color-accent-border-light);
		border-radius: 6px;
		background: var(--color-accent-bg);
		color: var(--color-accent-text-strong);
		font-size: 0.8rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
	}

	.mute-add-btn:hover:not(:disabled) {
		border-color: var(--color-accent-border);
		background: var(--color-accent-bg-hover);
	}

	.mute-add-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.mute-chips {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.mute-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.3rem 0.2rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-subtle);
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		font-weight: 600;
	}

	.mute-remove-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.2rem;
		height: 1.2rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1;
		font-family: inherit;
		cursor: pointer;
	}

	.mute-remove-btn:hover {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}
</style>
