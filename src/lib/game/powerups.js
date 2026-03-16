import {
	POWERUP_W, POWERUP_H, POWERUP_CHANCE,
	LANE_COUNT, LANE_W, ROAD_LEFT, CANVAS_H,
	SOLAR_BOOST_DURATION, BATTERY_PACK_RESTORE,
	COLOR,
} from './constants.js';
import { activateSolarBoost, addCharge } from './battery.js';

const TYPES = {
	solar: { icon: '☀', color: COLOR.amber, glow: '#fbbf2444', label: 'SOLAR FLARE' },
	battery: { icon: '⚡', color: '#4ade80', glow: '#4ade8044', label: 'BATTERY PACK' },
};

export function createPowerupState() {
	return {
		list: [],
		flashLabel: null,
		flashUntil: 0,
	};
}

export function maybeSpawnPowerup(state, distance) {
	if (Math.random() > POWERUP_CHANCE) return;

	const lane = Math.floor(Math.random() * LANE_COUNT);
	const x = ROAD_LEFT + lane * LANE_W + (LANE_W - POWERUP_W) / 2;
	const type = Math.random() > 0.5 ? 'solar' : 'battery';

	state.list.push({
		x,
		y: -POWERUP_H - 200 - Math.random() * 300,
		w: POWERUP_W,
		h: POWERUP_H,
		type,
	});
}

export function updatePowerups(state, roadSpeed) {
	state.list = state.list.filter(p => {
		p.y += roadSpeed * 0.8;
		return p.y < CANVAS_H + 60;
	});
}

/**
 * Check player-powerup collisions.
 * Returns list of collected powerup types.
 */
export function collectPowerups(state, player, battery, now) {
	for (let i = state.list.length - 1; i >= 0; i--) {
		const p = state.list[i];
		if (rectCollide(player, p)) {
			applyPowerup(p.type, battery, now, state);
			state.list.splice(i, 1);
		}
	}
}

function applyPowerup(type, battery, now, state) {
	const info = TYPES[type];
	state.flashLabel = info.label;
	state.flashUntil = now + 1500;

	switch (type) {
		case 'solar':
			activateSolarBoost(battery, now, SOLAR_BOOST_DURATION);
			break;
		case 'battery':
			addCharge(battery, BATTERY_PACK_RESTORE);
			break;
	}
}

export function drawPowerups(ctx, state, now) {
	for (const p of state.list) {
		const info = TYPES[p.type];
		const pulse = Math.sin(now / 200) * 0.3 + 0.7;

		// Glow
		ctx.fillStyle = info.glow;
		ctx.beginPath();
		ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 16 * pulse, 0, Math.PI * 2);
		ctx.fill();

		// Circle
		ctx.fillStyle = info.color;
		ctx.globalAlpha = pulse;
		ctx.beginPath();
		ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 10, 0, Math.PI * 2);
		ctx.fill();
		ctx.globalAlpha = 1;

		// Icon
		ctx.font = '12px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(info.icon, p.x + p.w / 2, p.y + p.h / 2 + 1);
	}

	// Flash label
	if (state.flashLabel && now < state.flashUntil) {
		const age = 1 - (state.flashUntil - now) / 1500;
		ctx.globalAlpha = 1 - age;
		ctx.fillStyle = COLOR.amber;
		ctx.font = 'bold 14px monospace';
		ctx.textAlign = 'center';
		ctx.fillText(state.flashLabel, 240, 140 - age * 20);
		ctx.globalAlpha = 1;
	}
}

function rectCollide(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
