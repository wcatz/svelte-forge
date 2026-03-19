import { ROAD_LEFT, ROAD_RIGHT, CANVAS_H } from './constants.js';

const SPAWN_MIN = 250;
const SPAWN_MAX = 400;
const MAX_PROPS = 8;

// Prop type definitions with spawn weights
const PROP_TYPES = [
	{ type: 'saguaro', weight: 25, h: 55 },
	{ type: 'rock',    weight: 25, h: 22 },
	{ type: 'shrub',   weight: 20, h: 12 },
	{ type: 'barrel',  weight: 10, h: 16 },
	{ type: 'fence',   weight: 8,  h: 30 },
	{ type: 'sign',    weight: 8,  h: 48 },
	{ type: 'skull',   weight: 4,  h: 12 },
];
const TOTAL_WEIGHT = PROP_TYPES.reduce((s, p) => s + p.weight, 0);

function pickType() {
	let r = Math.random() * TOTAL_WEIGHT;
	for (const p of PROP_TYPES) {
		r -= p.weight;
		if (r <= 0) return p;
	}
	return PROP_TYPES[0];
}

export function createSceneryState() {
	return {
		props: [],
		spawnAccum: 0,
		nextSpawnDist: SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN),
	};
}

export function updateScenery(state, roadSpeed) {
	// Scroll existing props
	for (let i = state.props.length - 1; i >= 0; i--) {
		state.props[i].y += roadSpeed;
		if (state.props[i].y > CANVAS_H + 80) {
			state.props.splice(i, 1);
		}
	}

	// Spawn new props
	state.spawnAccum += roadSpeed;
	if (state.spawnAccum >= state.nextSpawnDist && state.props.length < MAX_PROPS) {
		state.spawnAccum = 0;
		state.nextSpawnDist = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);

		const def = pickType();
		const variant = Math.floor(Math.random() * 4);

		// 60% chance each side (independently)
		if (Math.random() < 0.6) {
			state.props.push({
				type: def.type,
				x: 10 + Math.random() * 60,
				y: -def.h - 10,
				variant,
				h: def.h,
			});
		}
		if (Math.random() < 0.6) {
			state.props.push({
				type: def.type,
				x: ROAD_RIGHT + 10 + Math.random() * 60,
				y: -def.h - 10,
				variant,
				h: def.h,
			});
		}
	}
}

// ── Drawing ──────────────────────────────────────────────────────────

export function drawScenery(ctx, state) {
	for (const p of state.props) {
		switch (p.type) {
			case 'saguaro': drawSaguaro(ctx, p); break;
			case 'rock':    drawRock(ctx, p);    break;
			case 'shrub':   drawShrub(ctx, p);   break;
			case 'barrel':  drawBarrel(ctx, p);  break;
			case 'fence':   drawFence(ctx, p);   break;
			case 'sign':    drawSign(ctx, p);    break;
			case 'skull':   drawSkull(ctx, p);   break;
		}
	}
}

function drawSaguaro(ctx, p) {
	const cx = p.x + 3;
	const base = p.y + p.h;

	ctx.fillStyle = '#1a2a1a';
	ctx.strokeStyle = '#142014';
	ctx.lineWidth = 1;

	// Trunk
	ctx.beginPath();
	ctx.roundRect(cx - 3, p.y, 6, p.h, 2);
	ctx.fill();
	ctx.stroke();

	// Arms based on variant
	ctx.lineCap = 'round';
	ctx.lineWidth = 4;
	ctx.strokeStyle = '#1a2a1a';

	if (p.variant === 0) {
		// One arm right at 40%
		const ay = p.y + p.h * 0.4;
		ctx.beginPath();
		ctx.moveTo(cx + 3, ay);
		ctx.lineTo(cx + 14, ay);
		ctx.lineTo(cx + 14, ay - 12);
		ctx.stroke();
	} else if (p.variant === 1) {
		// Two arms: left at 30%, right at 55%
		const ay1 = p.y + p.h * 0.3;
		ctx.beginPath();
		ctx.moveTo(cx - 3, ay1);
		ctx.lineTo(cx - 14, ay1);
		ctx.lineTo(cx - 14, ay1 - 10);
		ctx.stroke();
		const ay2 = p.y + p.h * 0.55;
		ctx.beginPath();
		ctx.moveTo(cx + 3, ay2);
		ctx.lineTo(cx + 12, ay2);
		ctx.lineTo(cx + 12, ay2 - 8);
		ctx.stroke();
	} else if (p.variant === 2) {
		// One arm left at 50%
		const ay = p.y + p.h * 0.5;
		ctx.beginPath();
		ctx.moveTo(cx - 3, ay);
		ctx.lineTo(cx - 13, ay);
		ctx.lineTo(cx - 13, ay - 11);
		ctx.stroke();
	} else {
		// Two arms: right at 35%, left at 60% (taller saguaro)
		const ay1 = p.y + p.h * 0.35;
		ctx.beginPath();
		ctx.moveTo(cx + 3, ay1);
		ctx.lineTo(cx + 15, ay1);
		ctx.lineTo(cx + 15, ay1 - 14);
		ctx.stroke();
		const ay2 = p.y + p.h * 0.6;
		ctx.beginPath();
		ctx.moveTo(cx - 3, ay2);
		ctx.lineTo(cx - 11, ay2);
		ctx.lineTo(cx - 11, ay2 - 9);
		ctx.stroke();
	}

	ctx.lineCap = 'butt';
}

function drawRock(ctx, p) {
	// Irregular polygon, vertices offset by variant
	const offsets = [
		[[-12,-8], [0,-18], [13,-14], [14,-2], [8,4], [-10,2]],
		[[-10,-6], [-3,-20], [12,-16], [15,-4], [6,3], [-8,4]],
		[[-14,-10], [2,-22], [10,-12], [12,-3], [4,2], [-11,0]],
		[[-11,-7], [-5,-16], [8,-20], [14,-8], [10,2], [-9,3]],
	];
	const verts = offsets[p.variant] || offsets[0];
	const cx = p.x + 12;
	const cy = p.y + p.h;

	ctx.fillStyle = '#2a2520';
	ctx.strokeStyle = '#352e28';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(cx + verts[0][0], cy + verts[0][1]);
	for (let i = 1; i < verts.length; i++) {
		ctx.lineTo(cx + verts[i][0], cy + verts[i][1]);
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

function drawShrub(ctx, p) {
	const cx = p.x + 10;
	const cy = p.y + p.h - 4;

	ctx.fillStyle = '#1e2818';
	const clusters = [
		[[0, 0, 5], [-6, 1, 4], [5, 2, 4]],
		[[-4, 0, 5], [4, -1, 5], [0, 3, 3]],
		[[-3, 1, 4], [5, 0, 5], [-6, -1, 3], [3, 3, 3]],
		[[0, -1, 6], [-7, 1, 4], [6, 2, 3]],
	];
	const circles = clusters[p.variant] || clusters[0];
	for (const [dx, dy, r] of circles) {
		ctx.beginPath();
		ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
		ctx.fill();
	}
}

function drawBarrel(ctx, p) {
	const cx = p.x + 7;
	const cy = p.y + p.h - 7;

	// Body
	ctx.fillStyle = '#1a2a1a';
	ctx.beginPath();
	ctx.roundRect(cx - 6, cy - 6, 12, 12, 4);
	ctx.fill();
	ctx.strokeStyle = '#142014';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(cx - 6, cy - 6, 12, 12, 4);
	ctx.stroke();

	// Spines
	ctx.strokeStyle = '#2a3a1a';
	ctx.lineWidth = 1;
	const spineAngles = [
		[-0.6, -0.9],
		[0, -1],
		[0.6, -0.9],
		[0.9, -0.3],
	];
	for (const [dx, dy] of spineAngles) {
		ctx.beginPath();
		ctx.moveTo(cx + dx * 5, cy + dy * 5);
		ctx.lineTo(cx + dx * 9, cy + dy * 9);
		ctx.stroke();
	}
}

function drawFence(ctx, p) {
	const cx = p.x + 2;
	const base = p.y + p.h;

	// Post
	ctx.fillStyle = '#3a3020';
	ctx.fillRect(cx - 1.5, p.y, 3, p.h);

	// Wire lines
	ctx.strokeStyle = 'rgba(58, 58, 58, 0.35)';
	ctx.lineWidth = 0.5;

	const wireExtend = 18;
	for (const frac of [0.33, 0.66]) {
		const wy = p.y + p.h * frac;
		ctx.beginPath();
		ctx.moveTo(cx - wireExtend, wy);
		ctx.lineTo(cx + wireExtend, wy);
		ctx.stroke();
	}

	// Post top — pointed
	ctx.fillStyle = '#3a3020';
	ctx.beginPath();
	ctx.moveTo(cx - 2, p.y);
	ctx.lineTo(cx, p.y - 3);
	ctx.lineTo(cx + 2, p.y);
	ctx.closePath();
	ctx.fill();
}

function drawSign(ctx, p) {
	const cx = p.x + 9;
	const postTop = p.y + 10;
	const base = p.y + p.h;

	// Post
	ctx.fillStyle = '#2a2a2a';
	ctx.fillRect(cx - 1, postTop, 2, p.h - 10);

	// Sign face
	ctx.fillStyle = '#3a3a3a';
	ctx.beginPath();
	ctx.roundRect(cx - 9, p.y, 18, 14, 1);
	ctx.fill();
	ctx.strokeStyle = '#4a4a4a';
	ctx.lineWidth = 0.5;
	ctx.beginPath();
	ctx.roundRect(cx - 9, p.y, 18, 14, 1);
	ctx.stroke();
}

function drawSkull(ctx, p) {
	const cx = p.x + 7;
	const cy = p.y + p.h - 5;

	// Cranium
	ctx.fillStyle = '#4a4540';
	ctx.beginPath();
	ctx.ellipse(cx, cy, 5, 4, 0, 0, Math.PI * 2);
	ctx.fill();

	// Horns
	ctx.strokeStyle = '#4a4540';
	ctx.lineWidth = 1.5;
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(cx - 4, cy - 1);
	ctx.lineTo(cx - 9, cy - 4);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(cx + 4, cy - 1);
	ctx.lineTo(cx + 9, cy - 4);
	ctx.stroke();

	// Eye sockets (tiny dark dots)
	ctx.fillStyle = '#1a1a1a';
	ctx.beginPath();
	ctx.arc(cx - 2, cy - 1, 1, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(cx + 2, cy - 1, 1, 0, Math.PI * 2);
	ctx.fill();

	ctx.lineCap = 'butt';
}
