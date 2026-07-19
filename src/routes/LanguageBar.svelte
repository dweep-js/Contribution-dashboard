<script>
	let { languages = [] } = $props();
</script>

<div class="lang-wrap">
	<div class="lang-bar">
		{#each languages as lang}
			<div
				class="lang-segment"
				style="width: {lang.percent}%; background: {lang.color};"
				title="{lang.name} · {lang.percent.toFixed(0)}%"
			></div>
		{/each}
	</div>
	<ul class="lang-legend">
		{#each languages as lang}
			<li>
				<span class="dot" style="background: {lang.color};"></span>
				<span class="lang-name">{lang.name}</span>
				<span class="lang-pct">{lang.percent.toFixed(0)}%</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.lang-wrap {
		width: 100%;
	}

	.lang-bar {
		display: flex;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: var(--surface1);
		margin-bottom: 10px;
	}

	.lang-segment {
		height: 100%;
		transition: width 0.6s ease;
	}

	.lang-legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px 12px;
	}

	.lang-legend li {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--subtext1);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.lang-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.lang-pct {
		color: var(--subtext0);
		font-weight: 600;
	}
</style>
