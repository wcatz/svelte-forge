import {
	DELEGATOR_CHANCE, DELEGATOR_W, DELEGATOR_H,
	LANE_COUNT, LANE_W, ROAD_LEFT, CANVAS_H, COLOR,
} from './constants.js';

export function createDelegatorState() {
	return {
		list: [],
		count: 0, // total picked up this game
		flashLabel: null,
		flashUntil: 0,
	};
}

export function maybeSpawnDelegator(state, distance) {
	if (Math.random() > DELEGATOR_CHANCE) return;

	const lane = Math.floor(Math.random() * LANE_COUNT);
	const x = ROAD_LEFT + lane * LANE_W + (LANE_W - DELEGATOR_W) / 2;

	state.list.push({
		x,
		y: -DELEGATOR_H - 100 - Math.random() * 200,
		w: DELEGATOR_W,
		h: DELEGATOR_H,
		spawnTime: performance.now(),
	});
}

export function updateDelegators(state, roadSpeed) {
	state.list = state.list.filter(d => {
		d.y += roadSpeed * 0.8;
		return d.y < CANVAS_H + 40;
	});
}

export function collectDelegators(state, player, now, shieldActive) {
	if (shieldActive) return; // can't pick up with shield on — but doesn't destroy them
	for (let i = state.list.length - 1; i >= 0; i--) {
		const d = state.list[i];
		if (player.x < d.x + d.w && player.x + player.w > d.x &&
			player.y < d.y + d.h && player.y + player.h > d.y) {
			state.count++;
			state.flashLabel = `DELEGATOR #${state.count}`;
			state.flashUntil = now + 1500;
			state.list.splice(i, 1);
		}
	}
}

export function drawDelegators(ctx, state, now) {
	for (const d of state.list) {
		const cx = d.x + d.w / 2;
		const cy = d.y + d.h / 2;
		const bob = Math.sin(now / 300 + d.spawnTime) * 2;

		// Glow ring
		ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';
		ctx.beginPath();
		ctx.arc(cx, cy + bob, 12, 0, Math.PI * 2);
		ctx.fill();

		// Body (small person shape)
		ctx.fillStyle = COLOR.textBright;

		// Head
		ctx.beginPath();
		ctx.arc(cx, d.y + 3 + bob, 4, 0, Math.PI * 2);
		ctx.fill();

		// Torso
		ctx.fillRect(cx - 3, d.y + 7 + bob, 6, 6);

		// Waving arm (right arm up)
		ctx.strokeStyle = COLOR.textBright;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cx + 3, d.y + 8 + bob);
		const wave = Math.sin(now / 150 + d.spawnTime) * 0.4;
		ctx.lineTo(cx + 8, d.y + 3 + bob + wave * 3);
		ctx.stroke();

		// Left arm down
		ctx.beginPath();
		ctx.moveTo(cx - 3, d.y + 8 + bob);
		ctx.lineTo(cx - 6, d.y + 13 + bob);
		ctx.stroke();

		// Legs
		ctx.beginPath();
		ctx.moveTo(cx - 1, d.y + 13 + bob);
		ctx.lineTo(cx - 3, d.y + d.h + bob);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx + 1, d.y + 13 + bob);
		ctx.lineTo(cx + 3, d.y + d.h + bob);
		ctx.stroke();
	}

	// Flash label
	if (state.flashLabel && now < state.flashUntil) {
		const age = 1 - (state.flashUntil - now) / 1500;
		ctx.globalAlpha = 1 - age;
		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 13px monospace';
		ctx.textAlign = 'center';
		ctx.fillText(state.flashLabel, 240, 160 - age * 20);
		ctx.globalAlpha = 1;
	}
}
