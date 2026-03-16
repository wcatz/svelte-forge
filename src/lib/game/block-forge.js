import {
	BLOCK_INTERVAL_BASE, BLOCK_INTERVAL_MIN, BLOCK_INTERVAL_DECAY,
	BLOCK_FORGE_DRAIN, BLOCK_FORGE_WINDOW, BLOCK_REWARD_POINTS,
	BLOCK_REWARD_GROWTH, NIGHT_PER_BLOCK, COLOR, CANVAS_W,
} from './constants.js';
import { drain } from './battery.js';

export function createBlockForge() {
	return {
		countdown: BLOCK_INTERVAL_BASE * 1000, // ms remaining
		interval: BLOCK_INTERVAL_BASE * 1000,   // current interval in ms
		blocksForged: 0,
		nightEarned: 0,
		forgeWindow: false,    // true when "FORGE NOW!" is active
		windowStart: 0,        // timestamp when window opened
		forged: false,         // true briefly after a successful forge (for celebration)
		forgedAt: 0,
		missed: false,         // true briefly after a missed forge
		missedAt: 0,
		lastNightReward: 0,    // NIGHT earned on last forge (for HUD display)
	};
}

/**
 * @param {number} delegatorBonus — 0..1 multiplier that speeds up countdown
 */
export function updateBlockForge(forge, now, dt, delegatorBonus = 0) {
	// Clear celebration/miss state after 2s
	if (forge.forged && now - forge.forgedAt > 2000) forge.forged = false;
	if (forge.missed && now - forge.missedAt > 1500) forge.missed = false;

	if (forge.forgeWindow) {
		// Window is open — check if it expired
		if (now - forge.windowStart > BLOCK_FORGE_WINDOW) {
			// Missed the window
			forge.forgeWindow = false;
			forge.missed = true;
			forge.missedAt = now;
			resetCountdown(forge);
		}
		return;
	}

	// Count down — delegators speed this up
	const speedMult = 1 + delegatorBonus;
	forge.countdown -= dt * speedMult;
	if (forge.countdown <= 0) {
		// Open forge window
		forge.forgeWindow = true;
		forge.windowStart = now;
		forge.countdown = 0;
	}
}

/** Player pressed F during forge window. Returns points earned (0 if failed). */
export function attemptForge(forge, battery, now, nightMultiplier = 1) {
	if (!forge.forgeWindow) return 0;

	forge.forgeWindow = false;

	if (!drain(battery, BLOCK_FORGE_DRAIN)) {
		// Not enough energy (rare at 15 cost, but possible)
		forge.missed = true;
		forge.missedAt = now;
		resetCountdown(forge);
		return 0;
	}

	// Success! Delegators earn 10x NIGHT per block
	const nightReward = NIGHT_PER_BLOCK * nightMultiplier;
	forge.blocksForged++;
	forge.nightEarned += nightReward;
	forge.lastNightReward = nightReward;
	forge.forged = true;
	forge.forgedAt = now;

	const points = BLOCK_REWARD_POINTS + (forge.blocksForged - 1) * BLOCK_REWARD_GROWTH;
	resetCountdown(forge);
	return points;
}

function resetCountdown(forge) {
	// Decay interval (faster blocks as you forge more)
	const decayed = BLOCK_INTERVAL_BASE * 1000 * Math.pow(BLOCK_INTERVAL_DECAY, forge.blocksForged);
	forge.interval = Math.max(BLOCK_INTERVAL_MIN * 1000, decayed);
	forge.countdown = forge.interval;
}

export function drawForgeHUD(ctx, forge, now) {
	const cx = CANVAS_W / 2;

	if (forge.forgeWindow) {
		// FORGE NOW! flashing
		const flash = Math.sin(now / 80) > 0;
		if (flash) {
			ctx.fillStyle = COLOR.forgeFlash;
			ctx.font = 'bold 18px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('⚡ FORGE NOW! [F] ⚡', cx, 30);
		}

		// Window countdown bar
		const elapsed = now - forge.windowStart;
		const remaining = 1 - elapsed / BLOCK_FORGE_WINDOW;
		ctx.fillStyle = '#00000066';
		ctx.fillRect(cx - 60, 42, 120, 4);
		ctx.fillStyle = COLOR.forgeFlash;
		ctx.fillRect(cx - 60, 42, 120 * remaining, 4);
	} else {
		// Countdown display
		const secs = (forge.countdown / 1000).toFixed(1);
		const urgency = forge.countdown < 5000;
		ctx.fillStyle = urgency ? COLOR.amber : '#a3a3a3';
		ctx.font = `bold 13px monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(`NEXT BLOCK: ${secs}s`, cx, 22);
	}

	// Block forged celebration
	if (forge.forged) {
		const age = (now - forge.forgedAt) / 2000;
		ctx.globalAlpha = 1 - age;
		ctx.fillStyle = COLOR.forgeFlash;
		ctx.font = 'bold 22px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('BLOCK FORGED!', cx, 100 - age * 30);
		ctx.font = '12px monospace';
		ctx.fillStyle = COLOR.amber;
		ctx.fillText(`+${BLOCK_REWARD_POINTS + (forge.blocksForged - 1) * BLOCK_REWARD_GROWTH} PTS  +${forge.lastNightReward || NIGHT_PER_BLOCK} NIGHT`, cx, 125 - age * 30);
		ctx.globalAlpha = 1;
	}

	// Missed block warning
	if (forge.missed) {
		const age = (now - forge.missedAt) / 1500;
		ctx.globalAlpha = 1 - age;
		ctx.fillStyle = COLOR.red;
		ctx.font = 'bold 14px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('BLOCK MISSED', cx, 100 - age * 20);
		ctx.globalAlpha = 1;
	}
}
