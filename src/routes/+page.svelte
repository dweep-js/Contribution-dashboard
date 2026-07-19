<script>
	import './Theme.css';
	import ContributionChart from './ContributionChart.svelte';
	import LanguageBar from './LanguageBar.svelte';
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import {
		Sprout,
		BookOpen,
		Shield,
		Compass,
		Sword,
		Swords,
		Target,
		Award,
		Trophy,
		Star,
		Crown,
		Download,
		Flame,
		Users,
		GitBranch,
		Sparkles,
		ArrowLeft,
		Search,
		Loader2
	} from 'lucide-svelte';

	const iconMap = {
		Sprout,
		BookOpen,
		Shield,
		Compass,
		Sword,
		Swords,
		Target,
		Award,
		Trophy,
		Star,
		Crown
	};

	let username = $state('');
	let passData = $state(null);
	let errorMessage = $state('');
	let loading = $state(false);
	let downloading = $state(false);
	let cardEl = $state(null);
	let recentSearches = $state([]);

	let TierIcon = $derived(passData ? iconMap[passData.tierIcon] : null);

	onMount(() => {
		try {
			const saved = localStorage.getItem('recentSearches');
			if (saved) {
				recentSearches = JSON.parse(saved);
			}
		} catch (e) {
			console.error('Could not load recent searches', e);
		}
	});

	function saveRecentSearch(name) {
		if (!name) return;
		let updated = [
			name,
			...recentSearches.filter((n) => n.toLowerCase() !== name.toLowerCase())
		].slice(0, 5);
		recentSearches = updated;
		try {
			localStorage.setItem('recentSearches', JSON.stringify(updated));
		} catch (e) {
			console.error('Could not save recent searches', e);
		}
	}

	async function handleSubmit() {
		errorMessage = '';
		passData = null;
		if (!username.trim()) {
			errorMessage = 'Please enter a username.';
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/github/${encodeURIComponent(username)}`);
			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to fetch stats.');
			}
			passData = data;
			saveRecentSearch(data.name || username);
		} catch (error) {
			errorMessage = error.message;
		} finally {
			loading = false;
		}
	}

	// Action to autofocus input
	function autofocus(node) {
		node.focus();
	}

	function reset() {
		passData = null;
		errorMessage = '';
		username = '';
	}

	async function downloadCard() {
		if (!cardEl) return;
		downloading = true;
		try {
			const { toPng } = await import('html-to-image');
			const dataUrl = await toPng(cardEl, {
				backgroundColor: getComputedStyle(document.documentElement)
					.getPropertyValue('--bg-tertiary')
					.trim(),
				pixelRatio: 2
			});
			const link = document.createElement('a');
			link.download = `${passData.name.replace(/\s+/g, '_')}_battlepass.png`;
			link.href = dataUrl;
			link.click();
		} catch (error) {
			console.error('Download failed:', error);
			errorMessage = "Couldn't generate the image. Try again.";
		} finally {
			downloading = false;
		}
	}
</script>

<div class="page">
	{#if !passData}
		<section class="hero" in:fade={{ duration: 300 }}>
			<p class="eyebrow">GitHub Battle Pass</p>
			<h1 class="hero-title">Track your progression</h1>
			<p class="hero-sub">
				Enter a GitHub username to generate a season pass from their contributions.
			</p>

			<div class="search-row">
				<div class="input-container">
					<input
						type="text"
						id="username"
						class="modern-input"
						placeholder=" "
						required
						autocomplete="off"
						bind:value={username}
						use:autofocus
						onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
					/>
					<label for="username" class="floating-label">Username</label>
				</div>
				<button class="btn-primary" onclick={handleSubmit} disabled={loading}>
					{#if loading}
						<Loader2 size={18} strokeWidth={2.4} class="spin" />
						Generating...
					{:else}
						<Search size={18} strokeWidth={2.4} />
						Generate
					{/if}
				</button>
			</div>

			{#if errorMessage}
				<p class="error" transition:slide={{ duration: 300 }}>{errorMessage}</p>
			{/if}

			{#if recentSearches.length > 0}
				<div class="recent-searches" transition:fade={{ duration: 300 }}>
					<span class="recent-label">Recent:</span>
					<div class="recent-pills">
						{#each recentSearches as search}
							<button
								class="recent-pill"
								onclick={() => {
									username = search;
									handleSubmit();
								}}
							>
								{search}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</section>
	{:else}
		<section class="dashboard" in:fade={{ duration: 400 }}>
			<button class="back-link" onclick={reset}>
				<ArrowLeft size={14} strokeWidth={2.4} />
				New search
			</button>

			<div class="capture-area" bind:this={cardEl} style="--tier-color: {passData.tierColor}">
				<div class="dash-header">
					<img class="avatar-lg" src={passData.avatarUrl} alt="Avatar" />
					<div class="dash-header-info">
						<h2>{passData.name}</h2>
						<div class="tier-pill">
							{#if TierIcon}
								<TierIcon size={15} strokeWidth={2.4} />
							{/if}
							{passData.tierName}
						</div>
					</div>
					<div class="level-badge">
						<span class="level-num">{passData.level}</span>
						<span class="level-label">LVL</span>
					</div>
				</div>

				<div class="xp-row">
					<div class="progress-labels">
						<span>
							{passData.level === 100
								? 'Max level reached'
								: `Next: ${passData.nextTierName} · ${passData.levelsToNextTier} lvl${passData.levelsToNextTier === 1 ? '' : 's'} away`}
						</span>
						<span>{passData.level === 100 ? 'MAX' : `${Math.floor(passData.progress)}%`}</span>
					</div>
					<div class="progress-bar-bg">
						<div class="progress-bar-fill" style="width: {passData.progress}%"></div>
					</div>
				</div>

				<div class="stat-tiles">
					<div class="tile">
						<span class="tile-label">Contributions</span>
						<span class="tile-value">{passData.contributions}</span>
					</div>
					<div class="tile">
						<Flame size={14} strokeWidth={2.2} />
						<span class="tile-label">Longest streak</span>
						<span class="tile-value">{passData.longestStreak}d</span>
					</div>
					<div class="tile">
						<GitBranch size={14} strokeWidth={2.2} />
						<span class="tile-label">Public repos</span>
						<span class="tile-value">{passData.publicRepos}</span>
					</div>
					<div class="tile">
						<Users size={14} strokeWidth={2.2} />
						<span class="tile-label">Followers</span>
						<span class="tile-value">{passData.followers}</span>
					</div>
					<div class="tile">
						<Star size={14} strokeWidth={2.2} />
						<span class="tile-label">Total stars</span>
						<span class="tile-value">{passData.totalStars}</span>
					</div>
					{#if passData.topRepo}
						<div class="tile">
							<Sparkles size={14} strokeWidth={2.2} />
							<span class="tile-label">Top repo</span>
							<span class="tile-value truncate">{passData.topRepo.name}</span>
						</div>
					{/if}
				</div>

				<div class="panels">
					{#if passData.monthly?.length}
						<div class="panel">
							<div class="panel-header">
								<span>Contributions · 12mo</span>
								<span>avg {passData.weeklyAvg.toFixed(1)}/wk</span>
							</div>
							<ContributionChart months={passData.monthly} />
						</div>
					{/if}
					{#if passData.languages?.length}
						<div class="panel">
							<div class="panel-header">
								<span>Top languages</span>
								<span>{passData.reposScanned} repos</span>
							</div>
							<LanguageBar languages={passData.languages} />
						</div>
					{:else if passData.languageError}
						<div class="panel">
							<div class="panel-header">
								<span>Top languages</span>
							</div>
							<p class="panel-empty">{passData.languageError}</p>
						</div>
					{/if}
				</div>
			</div>

			<button class="download-btn" onclick={downloadCard} disabled={downloading}>
				<Download size={18} strokeWidth={2.4} />
				{downloading ? 'Preparing image...' : 'Download as image'}
			</button>
		</section>
	{/if}
</div>

<style>
	:global(.spin) {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
