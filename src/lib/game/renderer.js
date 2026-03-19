import {
	CANVAS_W, CANVAS_H, ROAD_LEFT, ROAD_RIGHT, ROAD_W,
	LANE_COUNT, LANE_W, STRIPE_H, STRIPE_GAP, COLOR,
} from './constants.js';

// Pre-generate starfield (sparse — midnight sky on shoulders)
const STARS = [];
for (let i = 0; i < 15; i++) {
	const side = Math.random() < 0.5;
	STARS.push({
		x: side ? Math.random() * (ROAD_LEFT - 4) : ROAD_RIGHT + 4 + Math.random() * (CANVAS_W - ROAD_RIGHT - 4),
		y: Math.random() * CANVAS_H,
		size: 0.3 + Math.random() * 0.7,
		twinkleSpeed: 300 + Math.random() * 800,
		brightness: 0.2 + Math.random() * 0.4,
	});
}

export function drawBackground(ctx, stripeOffset) {
	// Sky / background
	ctx.fillStyle = COLOR.bg;
	ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

	// Grass shoulders with subtle gradient
	const grassGradL = ctx.createLinearGradient(0, 0, ROAD_LEFT, 0);
	grassGradL.addColorStop(0, COLOR.grassLight);
	grassGradL.addColorStop(1, COLOR.grass);
	ctx.fillStyle = grassGradL;
	ctx.fillRect(0, 0, ROAD_LEFT, CANVAS_H);

	const grassGradR = ctx.createLinearGradient(ROAD_RIGHT, 0, CANVAS_W, 0);
	grassGradR.addColorStop(0, COLOR.grass);
	grassGradR.addColorStop(1, COLOR.grassLight);
	ctx.fillStyle = grassGradR;
	ctx.fillRect(ROAD_RIGHT, 0, CANVAS_W - ROAD_RIGHT, CANVAS_H);

	// Stars (midnight sky)
	const now = performance.now();
	for (const s of STARS) {
		const twinkle = (Math.sin(now / s.twinkleSpeed) + 1) / 2;
		const alpha = s.brightness * (0.3 + twinkle * 0.7);
		ctx.globalAlpha = alpha;
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;

	// Grass detail stripes (scrolling terrain)
	ctx.fillStyle = COLOR.grassStripe;
	for (let y = -STRIPE_H + stripeOffset; y < CANVAS_H; y += STRIPE_H + STRIPE_GAP) {
		ctx.fillRect(6, y, 28, STRIPE_H * 0.4);
		ctx.fillRect(50, y + 15, 16, STRIPE_H * 0.3);
		ctx.fillRect(ROAD_RIGHT + 12, y + 10, 16, STRIPE_H * 0.3);
		ctx.fillRect(ROAD_RIGHT + 48, y + 22, 28, STRIPE_H * 0.4);
	}

	// Road surface
	ctx.fillStyle = COLOR.road;
	ctx.fillRect(ROAD_LEFT, 0, ROAD_W, CANVAS_H);

	// Rumble strips (amber dashes along road edge)
	ctx.fillStyle = COLOR.rumble;
	for (let y = -8 + stripeOffset; y < CANVAS_H; y += 24) {
		ctx.fillRect(ROAD_LEFT + 3, y, 4, 10);
		ctx.fillRect(ROAD_RIGHT - 7, y, 4, 10);
	}

	// Road edge lines — brighter
	ctx.fillStyle = COLOR.roadEdge;
	ctx.fillRect(ROAD_LEFT, 0, 2, CANVAS_H);
	ctx.fillRect(ROAD_RIGHT - 2, 0, 2, CANVAS_H);

	// Lane stripes (dashed, slightly wider)
	ctx.fillStyle = COLOR.stripe;
	for (let lane = 1; lane < LANE_COUNT; lane++) {
		const lx = ROAD_LEFT + lane * LANE_W;
		for (let y = -STRIPE_H + stripeOffset; y < CANVAS_H; y += STRIPE_H + STRIPE_GAP) {
			ctx.fillRect(lx - 1, y, 2, STRIPE_H);
		}
	}

	// Pinstripe border around game view
	ctx.strokeStyle = COLOR.roadEdge;
	ctx.lineWidth = 1;
	ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);
	ctx.strokeStyle = COLOR.amber + '33';
	ctx.strokeRect(4, 4, CANVAS_W - 8, CANVAS_H - 8);
}

/** True if the device supports touch input */
let isTouchDevice = null;
export function checkTouch() {
	if (isTouchDevice === null) {
		isTouchDevice = 'ontouchstart' in globalThis || navigator.maxTouchPoints > 0;
	}
	return isTouchDevice;
}

/**
 * Draw touch buttons on the grass shoulders (mobile only).
 * Layout:
 *   Left shoulder:  DUMP (top) | SHIELD (bottom) — primary
 *   Right shoulder: EMP (top)  | FORGE (bottom)
 */
export function drawMobileButtons(ctx, shieldActive, forgeWindowActive, now) {
	if (!checkTouch()) return; // hide on desktop

	const shoulderW = ROAD_LEFT; // 90px
	const rightStart = ROAD_RIGHT;
	const midY = CANVAS_H / 2;
	const pad = 4;
	const btnW = shoulderW - pad * 2;
	const btnH = 54;

	ctx.font = 'bold 10px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// === LEFT SHOULDER ===

	// DUMP button (top-left)
	const dumpY = midY - btnH - 8;
	ctx.fillStyle = 'rgba(92, 64, 51, 0.25)';
	ctx.fillRect(pad, dumpY, btnW, btnH);
	ctx.strokeStyle = COLOR.tankBubble;
	ctx.lineWidth = 1;
	ctx.strokeRect(pad, dumpY, btnW, btnH);
	ctx.fillStyle = COLOR.tankBubble;
	ctx.fillText('DUMP', pad + btnW / 2, dumpY + btnH / 2);

	// SHIELD button (bottom-left) — primary weapon
	ctx.font = 'bold 10px monospace';
	const shieldY = midY + 8;
	const shieldBg = shieldActive ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.08)';
	const shieldColor = shieldActive ? COLOR.cyan : COLOR.shieldGlow;
	ctx.fillStyle = shieldBg;
	ctx.fillRect(pad, shieldY, btnW, btnH);
	ctx.strokeStyle = shieldColor;
	ctx.lineWidth = shieldActive ? 2 : 1;
	ctx.strokeRect(pad, shieldY, btnW, btnH);
	ctx.fillStyle = shieldColor;
	ctx.fillText('SHIELD', pad + btnW / 2, shieldY + btnH / 2);

	// === RIGHT SHOULDER ===

	// EMP button (top-right) — secondary weapon
	ctx.font = 'bold 10px monospace';
	const empY = midY - btnH - 8;
	ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
	ctx.fillRect(rightStart + pad, empY, btnW, btnH);
	ctx.strokeStyle = COLOR.empFlash;
	ctx.lineWidth = 1;
	ctx.strokeRect(rightStart + pad, empY, btnW, btnH);
	ctx.fillStyle = COLOR.empFlash;
	ctx.fillText('EMP', rightStart + pad + btnW / 2, empY + btnH / 2);

	// FORGE button (bottom-right) — pulses when forge window is active
	ctx.font = 'bold 10px monospace';
	const forgeY = midY + 8;
	let forgeBg, forgeColor, forgeBorder;
	if (forgeWindowActive) {
		const pulse = (Math.sin(now / 100) + 1) / 2;
		forgeBg = `rgba(74, 222, 128, ${0.15 + pulse * 0.2})`;
		forgeColor = COLOR.forgeFlash;
		forgeBorder = 2;
	} else {
		forgeBg = 'rgba(34, 197, 94, 0.06)';
		forgeColor = COLOR.textDim;
		forgeBorder = 1;
	}
	ctx.fillStyle = forgeBg;
	ctx.fillRect(rightStart + pad, forgeY, btnW, btnH);
	ctx.strokeStyle = forgeWindowActive ? COLOR.forgeFlash : COLOR.roadEdge;
	ctx.lineWidth = forgeBorder;
	ctx.strokeRect(rightStart + pad, forgeY, btnW, btnH);
	ctx.fillStyle = forgeColor;
	ctx.fillText('FORGE', rightStart + pad + btnW / 2, forgeY + btnH / 2);
}
