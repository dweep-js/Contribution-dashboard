<script>
    let { months = [] } = $props();

    const W = 300;
    const H = 100;

    let max = $derived(Math.max(1, ...months.map(m => m.count)));

    let points = $derived(
        months.map((m, i) => {
            const x = months.length > 1 ? (i / (months.length - 1)) * W : 0;
            const y = H - (m.count / max) * (H - 10);
            return { x, y, label: m.label, count: m.count };
        })
    );

    let linePath = $derived(
        points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    );

    let areaPath = $derived(
        points.length ? `${linePath} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z` : ""
    );
</script>

<div class="chart-wrap">
    <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" class="chart-svg">
        <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.35" />
                <stop offset="100%" stop-color="var(--teal)" stop-opacity="0" />
            </linearGradient>
        </defs>
        <line x1="0" y1={H} x2={W} y2={H} class="baseline" />
        {#if areaPath}
            <path d={areaPath} fill="url(#areaFill)" stroke="none" />
        {/if}
        {#if linePath}
            <path d={linePath} class="line" fill="none" />
        {/if}
        {#each points as p}
            <circle cx={p.x} cy={p.y} r="2.5" class="dot">
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

    .line {
        stroke: var(--teal);
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
    }

    .dot {
        fill: var(--base);
        stroke: var(--teal);
        stroke-width: 2;
    }

    .dot:hover {
        fill: var(--green);
    }

    .baseline {
        stroke: var(--border);
        stroke-width: 1;
    }

    .chart-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
    }

    .chart-labels span {
        font-size: 9px;
        color: var(--subtext0);
        flex: 1;
        text-align: center;
    }
</style>
