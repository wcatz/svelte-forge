import { getRankedLeaderboard, getHallOfFame, getFleetStats } from '$lib/server/leaderboard.js';

const PER_PAGE = 25;

export async function load({ url }) {
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);

	const [rankings, hallOfFame, fleetStats] = await Promise.all([
		getRankedLeaderboard(page, PER_PAGE),
		getHallOfFame(),
		getFleetStats(),
	]);

	return {
		rankings,
		hallOfFame,
		fleetStats,
		page,
		perPage: PER_PAGE,
	};
}
