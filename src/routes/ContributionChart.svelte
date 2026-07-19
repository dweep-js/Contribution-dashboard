<script>
	let { months = [] } = $props();

	const W = 300;
	const H = 100;

	let max = $derived(Math.max(1, ...months.map((m) => m.count)));

	let points = $derived(
		months.map((m, i) => {
			const x = months.length > 1 ? (i / (months.length - 1)) * W : W / 2;
			const y = H - (m.count / max) * (H - 10);
			return { x, y, label: m.label, count: m.count };
		})
	);

	let linePath = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));

	let areaPath = $derived(
		points.length ? `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z` : ''
	);
</script>

<div class="chart-wrap">
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="chart-svg">
		<defs>
			<linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35" />
				<stop offset="100%" stop-color="#2dd4bf" stop-opacity="0" />
			</linearGradient>
		</defs>

		<line x1="0" y1={H} x2={W} y2={H} stroke="#585b70" stroke-width="1" />

		{#if areaPath}
			<path d={areaPath} fill="url(#areaFill)" />
		{/if}

		{#if linePath}
			<path
				d={linePath}
				fill="none"
				stroke="#2dd4bf"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{/if}

		{#each points as p}
			<circle cx={p.x} cy={p.y} r="3" fill="#1e1e2e" stroke="#2dd4bf" stroke-width="2">
				<title>{p.label}: {p.count}</title>
			</circle>
		{/each}
	</svg>

	<div class="chart-labels">
		{#each months as m}
			<span>{m.label}</span>
		{/each}
	</div>
</div>

<style>
	.chart-wrap {
		width: 100%;
	}

	.chart-svg {
		width: 100%;
		height: 90px;
		overflow: visible;
	}

	.chart-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
	}

	.chart-labels span {
		flex: 1;
		text-align: center;
		font-size: 9px;
		color: var(--subtext0);
	}
</style>
