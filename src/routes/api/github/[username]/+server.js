import { json } from '@sveltejs/kit';

const TIERS = [
	{ min: 0, name: 'Seedling', icon: 'Sprout', color: '#a6e3a1' },
	{ min: 10, name: 'Apprentice', icon: 'BookOpen', color: '#94e2d5' },
	{ min: 20, name: 'Script Squire', icon: 'Shield', color: '#89dceb' },
	{ min: 30, name: 'Repo Explorer', icon: 'Compass', color: '#74c7ec' },
	{ min: 40, name: 'Byte Warrior', icon: 'Sword', color: '#89b4fa' },
	{ min: 50, name: 'Code Knight', icon: 'Swords', color: '#b4befe' },
	{ min: 60, name: 'Commit Sharpshooter', icon: 'Target', color: '#cba6f7' },
	{ min: 70, name: 'Merge Master', icon: 'Award', color: '#f5c2e7' },
	{ min: 80, name: 'Open Source Legend', icon: 'Trophy', color: '#f2cdcd' },
	{ min: 90, name: 'Git Grandmaster', icon: 'Star', color: '#fab387' },
	{ min: 100, name: 'Mythic Maintainer', icon: 'Crown', color: '#f9e2af' }
];

const LANGUAGE_COLORS = {
	JavaScript: '#f1e05a',
	TypeScript: '#3178c6',
	Python: '#3572A5',
	Java: '#b07219',
	'C++': '#f34b7d',
	C: '#555555',
	'C#': '#178600',
	Go: '#00ADD8',
	Rust: '#dea584',
	Ruby: '#701516',
	PHP: '#4F5D95',
	Swift: '#F05138',
	Kotlin: '#A97BFF',
	Dart: '#00B4AB',
	HTML: '#e34c26',
	CSS: '#563d7c',
	SCSS: '#c6538c',
	Vue: '#41b883',
	Svelte: '#ff3e00',
	Shell: '#89e051',
	PowerShell: '#012456',
	Lua: '#000080',
	Elixir: '#6e4a7e',
	Haskell: '#5e5086',
	Scala: '#c22d40',
	Objective_C: '#438eff',
	R: '#198CE7',
	Julia: '#a270ba',
	Zig: '#ec915c',
	Solidity: '#AA6746',
	Jupyter_Notebook: '#DA5B0B',
	Dockerfile: '#384d54',
	default: '#7f849c'
};

function langColor(name) {
	return LANGUAGE_COLORS[name] ?? LANGUAGE_COLORS.default;
}

// One request for up to 100 repos keeps this within GitHub's 60/hr unauthenticated rate limit
async function fetchLanguageStats(username) {
	const res = await fetch(
		`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`,
		{
			headers: {
				'User-Agent': 'Contribution-Pass-App'
			}
		}
	);
	if (!res.ok) {
		const reason =
			res.status === 403
				? 'GitHub API rate limit hit — try again in a bit'
				: `GitHub API error (${res.status})`;
		return { languages: [], totalStars: 0, topRepo: null, reposScanned: 0, error: reason };
	}

	const repos = await res.json();
	if (!Array.isArray(repos)) {
		return {
			languages: [],
			totalStars: 0,
			topRepo: null,
			reposScanned: 0,
			error: 'Unexpected response from GitHub'
		};
	}
	const original = repos.filter((r) => !r.fork);

	const counts = new Map();
	let totalStars = 0;
	let topRepo = null;

	for (const repo of original) {
		totalStars += repo.stargazers_count || 0;
		if (!topRepo || repo.stargazers_count > topRepo.stars) {
			topRepo = { name: repo.name, stars: repo.stargazers_count || 0 };
		}
		if (repo.language) {
			counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
		}
	}

	const totalCounted = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1;
	const languages = Array.from(counts.entries())
		.map(([name, count]) => ({
			name,
			count,
			percent: (count / totalCounted) * 100,
			color: langColor(name)
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	const error = languages.length === 0 ? "No detected languages on this user's public repos" : null;

	return { languages, totalStars, topRepo, reposScanned: original.length, error };
}

function getTier(level) {
	for (let i = TIERS.length - 1; i >= 0; i--) {
		if (level >= TIERS[i].min) return TIERS[i];
	}
	return TIERS[0];
}

function buildStats(days) {
	const now = new Date();
	const buckets = new Map();

	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		buckets.set(key, { key, label: d.toLocaleString('default', { month: 'short' }), count: 0 });
	}

	let longestStreak = 0;
	let currentStreak = 0;
	let bestDay = { date: null, count: 0 };
	let activeDays = 0;

	const sorted = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));

	for (const day of sorted) {
		const d = new Date(day.date);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		if (buckets.has(key)) {
			buckets.get(key).count += day.count;
		}
		if (day.count > 0) {
			activeDays++;
			currentStreak++;
			longestStreak = Math.max(longestStreak, currentStreak);
			if (day.count > bestDay.count) bestDay = { date: day.date, count: day.count };
		} else {
			currentStreak = 0;
		}
	}

	const monthly = Array.from(buckets.values());
	const weeklyAvg = sorted.length
		? sorted.reduce((s, d) => s + d.count, 0) / (sorted.length / 7)
		: 0;

	return { monthly, longestStreak, bestDay, activeDays, weeklyAvg };
}

export async function GET({ params }) {
	const { username } = params;

	if (!username || !username.trim()) {
		return json({ error: 'Please enter a valid username.' }, { status: 400 });
	}

	const profileResponse = await fetch(`https://api.github.com/users/${username}`, {
		headers: {
			'User-Agent': 'Contribution-Pass-App'
		}
	});

	if (!profileResponse.ok) {
		return json(
			{ error: profileResponse.status === 404 ? 'User not found!' : 'GitHub API error.' },
			{ status: profileResponse.status }
		);
	}
	const userData = await profileResponse.json();

	let yearlyContributions = 0;
	let monthly = [];
	let longestStreak = 0;
	let bestDay = { date: null, count: 0 };
	let activeDays = 0;
	let weeklyAvg = 0;

	try {
		const contribResponse = await fetch(
			`https://github-contributions-api.jogruber.de/v4/${username}?y=last`
		);
		if (contribResponse.ok) {
			const contribData = await contribResponse.json();
			yearlyContributions = contribData.total?.lastYear || 0;
			if (Array.isArray(contribData.contributions)) {
				const stats = buildStats(contribData.contributions);
				monthly = stats.monthly;
				longestStreak = stats.longestStreak;
				bestDay = stats.bestDay;
				activeDays = stats.activeDays;
				weeklyAvg = stats.weeklyAvg;
			}
		}
	} catch (e) {
		console.warn(e);
	}

	let languages = [];
	let totalStars = 0;
	let topRepo = null;
	let reposScanned = 0;
	let languageError = null;
	try {
		const langStats = await fetchLanguageStats(username);
		languages = langStats.languages;
		totalStars = langStats.totalStars;
		topRepo = langStats.topRepo;
		reposScanned = langStats.reposScanned;
		languageError = langStats.error;
		if (languageError) console.warn('Language stats:', languageError);
	} catch (e) {
		languageError = 'Failed to fetch language data';
		console.warn(e);
	}

	const xpPerContribution = 100;
	const totalXp = yearlyContributions * xpPerContribution;
	const xpPerLevel = 1000;
	let currentLevel = Math.floor(totalXp / xpPerLevel) || 1;
	if (currentLevel > 100) currentLevel = 100;
	const currentLevelProgress = currentLevel === 100 ? 100 : (totalXp % xpPerLevel) / 10;

	const tier = getTier(currentLevel);
	const nextTier = TIERS.find((t) => t.min > currentLevel) || null;

	return json({
		name: userData.name || username,
		avatarUrl: userData.avatar_url,
		publicRepos: userData.public_repos,
		followers: userData.followers,
		contributions: yearlyContributions,
		level: currentLevel,
		progress: currentLevelProgress,
		tierName: tier.name,
		tierIcon: tier.icon,
		tierColor: tier.color,
		nextTierName: nextTier?.name ?? null,
		levelsToNextTier: nextTier ? nextTier.min - currentLevel : 0,
		monthly,
		longestStreak,
		bestDay,
		activeDays,
		weeklyAvg,
		languages,
		totalStars,
		topRepo,
		reposScanned,
		languageError
	});
}
