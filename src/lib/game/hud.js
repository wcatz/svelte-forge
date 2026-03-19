import {
	CANVAS_W, CANVAS_H, BATTERY_MAX, COLOR,
	BATTERY_START, EMP_DRAIN, EMP_COOLDOWN,
	BLOCK_INTERVAL_BASE, BLOCK_FORGE_WINDOW, BLOCK_REWARD_POINTS,
	NIGHT_PER_BLOCK, DELEGATOR_FORGE_BONUS,
	ROAD_LEFT, ROAD_RIGHT,
} from './constants.js';
import { getPercent } from './battery.js';
import { drawForgeHUD } from './block-forge.js';
import { checkTouch } from './renderer.js';

// Preload logo
let logoImg = null;
let logoLoaded = false;
if (typeof window !== 'undefined') {
	logoImg = new Image();
	logoImg.onload = () => { logoLoaded = true; };
	logoImg.src = '/assets/images/sun.png';
}

// === Title screen tips ===
const TITLE_TIPS = [
	'PICK UP DELEGATORS TO FORGE BLOCKS FASTER',
	'WATCH THE COUNTDOWN — PRESS [F] TO FORGE',
	'FORGE BLOCKS TO EARN NIGHT TOKENS',
	'DELEGATORS EARN 10x NIGHT PER BLOCK',
	'REAR HITS KNOCK OUT YOUR SHIELD',
];
const TIP_CYCLE_MS = 3500;

export function drawHUD(ctx, game, now) {
	const { battery, forge, score, highScore, lives, weapons, roadSpeed, delegators } = game;
	const batteryPct = getPercent(battery);

	// === Top bar background ===
	ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
	ctx.fillRect(0, 0, CANVAS_W, 56);
	ctx.fillStyle = COLOR.roadEdge;
	ctx.fillRect(0, 56, CANVAS_W, 1);

	// === Left column: Score ===
	ctx.fillStyle = '#fff';
	ctx.font = 'bold 14px monospace';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText(`SCORE ${String(score).padStart(6, '0')}`, 10, 16);

	ctx.fillStyle = '#a3a3a3';
	ctx.font = '11px monospace';
	ctx.fillText(`HI ${String(highScore).padStart(6, '0')}`, 10, 32);

	// === Lives (small RV icons) ===
	for (let i = 0; i < lives; i++) {
		const lx = 10 + i * 16;
		ctx.fillStyle = COLOR.tan;
		ctx.beginPath();
		ctx.roundRect(lx, 42, 8, 12, 2);
		ctx.fill();
		ctx.fillStyle = '#fffbe6';
		ctx.fillRect(lx + 2, 42, 4, 3);
	}

	// === Center: Block forge countdown ===
	drawForgeHUD(ctx, forge, now);

	// === Right column: Battery gauge ===
	drawBatteryGauge(ctx, batteryPct, now);

	// === Bottom info bar ===
	ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
	ctx.fillRect(0, CANVAS_H - 28, CANVAS_W, 28);
	ctx.fillStyle = COLOR.roadEdge;
	ctx.fillRect(0, CANVAS_H - 28, CANVAS_W, 1);

	// Shield status
	ctx.font = 'bold 12px monospace';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	const shieldJammed = weapons.shieldDisabledUntil && now > 0 && now < weapons.shieldDisabledUntil;
	if (shieldJammed) {
		ctx.fillStyle = Math.sin(now / 80) > 0 ? COLOR.red : '#a3a3a3';
		ctx.fillText('SHIELD: JAMMED', 10, CANVAS_H - 14);
	} else {
		ctx.fillStyle = weapons.shieldActive ? COLOR.cyan : '#a3a3a3';
		ctx.fillText(`SHIELD: ${weapons.shieldActive ? 'ON' : 'OFF'}`, 10, CANVAS_H - 14);
	}

	// Delegators + Blocks
	ctx.textAlign = 'center';
	ctx.fillStyle = '#fff';
	ctx.fillText(`🧑 ${delegators.count}  BLOCKS: ${forge.blocksForged}`, CANVAS_W / 2, CANVAS_H - 14);

	// NIGHT tokens + multiplier (guest mode shows "GUEST MODE" label)
	ctx.textAlign = 'right';
	ctx.font = 'bold 12px monospace';
	if (game.guestMode) {
		ctx.fillStyle = COLOR.textDim;
		ctx.fillText('GUEST MODE', CANVAS_W - 10, CANVAS_H - 14);
	} else {
		ctx.fillStyle = COLOR.amber;
		const mult = game.nightMultiplier || 1;
		ctx.fillText(`NIGHT: ${forge.nightEarned}${mult > 1 ? ' (10x)' : ''}`, CANVAS_W - 10, CANVAS_H - 14);
	}
}

function drawBatteryGauge(ctx, pct, now) {
	const x = CANVAS_W - 68;
	const y = 4;
	const w = 58;
	const h = 42;

	// Label
	ctx.fillStyle = '#a3a3a3';
	ctx.font = 'bold 10px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';
	ctx.fillText('⚡ BATTERY', x + w / 2, y);

	// Outer glow when low
	if (pct < 25) {
		const glow = 0.15 + Math.sin(now / 200) * 0.1;
		ctx.fillStyle = `rgba(239, 68, 68, ${glow})`;
		ctx.beginPath();
		ctx.roundRect(x - 3, y + 9, w + 6, h - 6, 4);
		ctx.fill();
	}

	// Background
	ctx.fillStyle = '#000000aa';
	ctx.beginPath();
	ctx.roundRect(x, y + 11, w, h - 8, 3);
	ctx.fill();
	ctx.strokeStyle = pct < 25 ? COLOR.red : COLOR.roadEdge;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.roundRect(x, y + 11, w, h - 8, 3);
	ctx.stroke();

	// Battery terminal nub
	ctx.fillStyle = pct < 25 ? COLOR.red : COLOR.roadEdge;
	ctx.fillRect(x + w / 2 - 5, y + 8, 10, 4);

	// Fill color based on level
	let fillColor;
	if (pct > 50) fillColor = COLOR.text;
	else if (pct > 25) fillColor = COLOR.amber;
	else fillColor = COLOR.red;

	// Pulse when low
	let alpha = 1;
	if (pct < 20) {
		alpha = 0.4 + Math.sin(now / 120) * 0.6;
	}

	// Fill bar with segments
	const barX = x + 3;
	const barY = y + 14;
	const barW = w - 6;
	const barH = h - 14;
	const fillW = barW * (pct / 100);

	ctx.globalAlpha = alpha;
	ctx.fillStyle = fillColor;
	ctx.fillRect(barX, barY, fillW, barH);

	// Segment lines for cell look
	ctx.fillStyle = '#00000055';
	const segCount = 5;
	for (let i = 1; i < segCount; i++) {
		const sx = barX + (barW / segCount) * i;
		ctx.fillRect(sx, barY, 1, barH);
	}
	ctx.globalAlpha = 1;

	// Percentage text (large, bold)
	ctx.fillStyle = pct < 25 ? COLOR.red : '#fff';
	ctx.font = 'bold 14px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(`${pct}%`, x + w / 2, barY + barH / 2 + 1);
}

// Wallet icon image cache
const walletIconCache = new Map();

function getWalletIcon(iconSrc) {
	if (walletIconCache.has(iconSrc)) return walletIconCache.get(iconSrc);
	const img = new Image();
	img.src = iconSrc;
	walletIconCache.set(iconSrc, { img, loaded: false });
	img.onload = () => { walletIconCache.get(iconSrc).loaded = true; };
	return walletIconCache.get(iconSrc);
}

// Track clickable regions for hit testing
export let titleHitRegions = [];
export let gameOverHitRegions = [];

// Persistent star field for title screen background
let _titleStars = null;
function getTitleStars() {
	if (_titleStars) return _titleStars;
	_titleStars = [];
	for (let i = 0; i < 60; i++) {
		_titleStars.push({
			x: Math.random() * CANVAS_W,
			y: Math.random() * CANVAS_H,
			size: Math.random() * 1.5 + 0.5,
			speed: Math.random() * 0.5 + 0.2,
			phase: Math.random() * Math.PI * 2,
		});
	}
	return _titleStars;
}

// --- Drawing helpers (title screen only) ---

function drawScanlines(ctx, alpha) {
	ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
	for (let y = 0; y < CANVAS_H; y += 3) {
		ctx.fillRect(0, y, CANVAS_W, 1);
	}
}

function drawArcadeBorder(ctx, now) {
	const bdr = COLOR.roadEdge;
	// Outer frame
	ctx.strokeStyle = bdr;
	ctx.lineWidth = 2;
	ctx.strokeRect(6, 6, CANVAS_W - 12, CANVAS_H - 12);
	// Inner frame
	ctx.strokeStyle = 'rgba(34, 197, 94, 0.12)';
	ctx.lineWidth = 1;
	ctx.strokeRect(10, 10, CANVAS_W - 20, CANVAS_H - 20);
	// Corner decorations (small L-brackets)
	const cornerLen = 14;
	ctx.strokeStyle = COLOR.textBright;
	ctx.lineWidth = 2;
	const corners = [
		[12, 12, 1, 1], [CANVAS_W - 12, 12, -1, 1],
		[12, CANVAS_H - 12, 1, -1], [CANVAS_W - 12, CANVAS_H - 12, -1, -1],
	];
	for (const [cx, cy, dx, dy] of corners) {
		ctx.beginPath();
		ctx.moveTo(cx + cornerLen * dx, cy);
		ctx.lineTo(cx, cy);
		ctx.lineTo(cx, cy + cornerLen * dy);
		ctx.stroke();
	}
}

function drawStarField(ctx, now) {
	const stars = getTitleStars();
	for (const s of stars) {
		const twinkle = Math.sin(now * s.speed * 0.003 + s.phase) * 0.4 + 0.6;
		ctx.globalAlpha = twinkle * 0.8;
		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;
}

function drawHorizontalRule(ctx, y, halfW, style) {
	const cx = CANVAS_W / 2;
	if (style === 'double') {
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(cx - halfW, y);
		ctx.lineTo(cx + halfW, y);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx - halfW, y + 3);
		ctx.lineTo(cx + halfW, y + 3);
		ctx.stroke();
	} else if (style === 'dashed') {
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.lineWidth = 1;
		ctx.setLineDash([6, 4]);
		ctx.beginPath();
		ctx.moveTo(cx - halfW, y);
		ctx.lineTo(cx + halfW, y);
		ctx.stroke();
		ctx.setLineDash([]);
	} else {
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(cx - halfW, y);
		ctx.lineTo(cx + halfW, y);
		ctx.stroke();
	}
}

function drawGlowText(ctx, text, x, y, font, color, glowColor, glowBlur) {
	ctx.save();
	ctx.font = font;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.shadowColor = glowColor;
	ctx.shadowBlur = glowBlur;
	ctx.fillStyle = color;
	ctx.fillText(text, x, y);
	ctx.restore();
}

function drawFramedBox(ctx, x, y, w, h, headerText) {
	// Box background
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, 4);
	ctx.fill();
	// Box border
	ctx.strokeStyle = COLOR.roadEdge;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(x, y, w, h, 4);
	ctx.stroke();
	// Header bar
	if (headerText) {
		ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
		ctx.fillRect(x + 1, y + 1, w - 2, 22);
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.beginPath();
		ctx.moveTo(x, y + 23);
		ctx.lineTo(x + w, y + 23);
		ctx.stroke();
		ctx.fillStyle = COLOR.tan;
		ctx.font = 'bold 13px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(headerText, x + w / 2, y + 10);
	}
}

export function drawTitleScreen(ctx, now, playerName, walletState) {
	ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
	ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

	const cx = CANVAS_W / 2;

	drawArcadeBorder(ctx, now);
	titleHitRegions = [];

	const ws = walletState || {};
	const connected = ws.phase === 'ready';

	// ================================================================
	// TITLE — always shown
	// ================================================================
	drawGlowText(ctx, '🌟  STAR FORGER  ⚡', cx, 45,
		'bold 30px monospace', COLOR.amber, COLOR.amber, 10);
	drawGlowText(ctx, 'MIDNIGHT RIDER', cx, 75,
		'bold 18px monospace', COLOR.cyan, COLOR.cyan, 6);
	drawHorizontalRule(ctx, 95, 160, 'double');

	// ================================================================
	// MODE-SPECIFIC CONTENT
	// ================================================================

	if (!connected) {
		// --- WALLET CONNECT MODE ---

		if (ws.phase === 'connecting') {
			const dots = '.'.repeat(Math.floor(now / 400) % 4);
			drawGlowText(ctx, 'CONNECTING' + dots, cx, 140,
				'bold 16px monospace', COLOR.cyan, COLOR.cyan, 6);
		} else if (ws.wallets && ws.wallets.length > 0) {
			// "CONNECT WALLET" label
			ctx.fillStyle = COLOR.textDim;
			ctx.font = '11px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('CONNECT WALLET', cx, 110);

			// Error message
			if (ws.error) {
				ctx.fillStyle = COLOR.red;
				ctx.font = '10px monospace';
				ctx.fillText(ws.error, cx, 130);
			}

			// Wallet icon grid — up to 4 per row, 80x80 each
			const iconSize = 36;
			const cellW = 80;
			const cellH = 72;
			const maxPerRow = 4;
			const walletCount = Math.min(ws.wallets.length, 8);
			const rowCount = Math.ceil(walletCount / maxPerRow);
			const gridTop = ws.error ? 150 : 140;

			for (let i = 0; i < walletCount; i++) {
				const w = ws.wallets[i];
				const col = i % maxPerRow;
				const row = Math.floor(i / maxPerRow);
				const rowItems = Math.min(maxPerRow, walletCount - row * maxPerRow);
				const rowW = rowItems * cellW;
				const rowStartX = cx - rowW / 2;
				const cellX = rowStartX + col * cellW;
				const cellY = gridTop + row * (cellH + 8);
				const cellCx = cellX + cellW / 2;

				// Hover glow
				const pulse = Math.sin(now / 900 + i * 1.2) * 0.04 + 0.06;
				ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
				ctx.beginPath();
				ctx.roundRect(cellX + 4, cellY, cellW - 8, cellH, 8);
				ctx.fill();

				// Border
				ctx.strokeStyle = COLOR.roadEdge;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.roundRect(cellX + 4, cellY, cellW - 8, cellH, 8);
				ctx.stroke();

				// Icon
				const icon = getWalletIcon(w.icon);
				if (icon.loaded) {
					ctx.drawImage(icon.img, cellCx - iconSize / 2, cellY + 8, iconSize, iconSize);
				} else {
					ctx.fillStyle = COLOR.textDim;
					ctx.fillRect(cellCx - iconSize / 2, cellY + 8, iconSize, iconSize);
				}

				// Name under icon
				ctx.fillStyle = COLOR.textBright;
				ctx.font = '9px monospace';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				const label = w.name.length > 8 ? w.name.slice(0, 7) + '…' : w.name;
				ctx.fillText(label.toUpperCase(), cellCx, cellY + iconSize + 18);

				titleHitRegions.push({ x: cellX + 4, y: cellY, w: cellW - 8, h: cellH, action: 'wallet', walletId: w.id });
			}

			// Incentive banner below wallet grid
			const bannerY = gridTop + rowCount * (cellH + 8) + 30;
			ctx.fillStyle = 'rgba(251, 191, 36, 0.06)';
			ctx.beginPath();
			ctx.roundRect(40, bannerY - 14, CANVAS_W - 80, 28, 4);
			ctx.fill();
			ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(40, bannerY - 14, CANVAS_W - 80, 28, 4);
			ctx.stroke();
			drawGlowText(ctx, 'DELEGATORS EARN 10x NIGHT PER BLOCK', cx, bannerY,
				'bold 11px monospace', COLOR.amber, COLOR.amber, 4);

			// "Play as Guest" button — visually distinct from wallet buttons
			const guestY = bannerY + 44;
			const guestW = 240;
			const guestH = 36;
			const guestX = cx - guestW / 2;

			// Dashed border, dim background
			ctx.fillStyle = 'rgba(163, 163, 163, 0.04)';
			ctx.beginPath();
			ctx.roundRect(guestX, guestY, guestW, guestH, 6);
			ctx.fill();
			ctx.setLineDash([6, 4]);
			ctx.strokeStyle = 'rgba(163, 163, 163, 0.35)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(guestX, guestY, guestW, guestH, 6);
			ctx.stroke();
			ctx.setLineDash([]);

			// Label
			ctx.fillStyle = '#a3a3a3';
			ctx.font = 'bold 11px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('PLAY WITHOUT WALLET', cx, guestY + guestH / 2);

			titleHitRegions.push({ x: guestX, y: guestY, w: guestW, h: guestH, action: 'guest' });

			// Rotating tip — same as connected mode
			const tipY = guestY + guestH + 30;
			const tipIndex = Math.floor(now / TIP_CYCLE_MS) % TITLE_TIPS.length;
			const tipAge = (now % TIP_CYCLE_MS) / TIP_CYCLE_MS;
			let tipAlpha = 1;
			if (tipAge < 0.1) tipAlpha = tipAge / 0.1;
			else if (tipAge > 0.85) tipAlpha = (1 - tipAge) / 0.15;

			ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
			ctx.beginPath();
			ctx.roundRect(30, tipY - 14, CANVAS_W - 60, 28, 4);
			ctx.fill();

			ctx.globalAlpha = tipAlpha;
			drawGlowText(ctx, TITLE_TIPS[tipIndex], cx, tipY,
				'bold 11px monospace', COLOR.cyan, COLOR.cyan, 4);
			ctx.globalAlpha = 1;

		} else {
			const scanDots = '.'.repeat(Math.floor(now / 500) % 4);
			ctx.fillStyle = COLOR.textDim;
			ctx.font = '12px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('SCANNING FOR WALLETS' + scanDots, cx, 150);

			// "Play as Guest" button — available even while scanning
			const guestY = 190;
			const guestW = 240;
			const guestH = 36;
			const guestX = cx - guestW / 2;

			ctx.fillStyle = 'rgba(163, 163, 163, 0.04)';
			ctx.beginPath();
			ctx.roundRect(guestX, guestY, guestW, guestH, 6);
			ctx.fill();
			ctx.setLineDash([6, 4]);
			ctx.strokeStyle = 'rgba(163, 163, 163, 0.35)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(guestX, guestY, guestW, guestH, 6);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = '#a3a3a3';
			ctx.font = 'bold 11px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('PLAY WITHOUT WALLET', cx, guestY + guestH / 2);

			titleHitRegions.push({ x: guestX, y: guestY, w: guestW, h: guestH, action: 'guest' });
		}

	} else {
		// --- CONNECTED MODE ---

		// Player name
		if (playerName) {
			drawGlowText(ctx, playerName, cx, 120,
				'bold 14px monospace', COLOR.textBright, COLOR.textBright, 4);
		}

		// Controls box — spread out across ~160-330 range
		const ctrlBoxX = 50;
		const ctrlBoxW = CANVAS_W - 100;
		const ctrlBoxY = 155;
		const isTouch = checkTouch();
		const controls = isTouch
			? [
				['LEFT \u25BC', 'SHIELD'],
				['LEFT \u25B2', 'DUMP'],
				['RIGHT \u25B2', 'EMP'],
				['RIGHT \u25BC', 'FORGE BLOCK'],
			]
			: [
				['SPACE', 'EM SHIELD'],
				['E', 'EM PULSE'],
				['Q', 'BLACK TANK'],
				['F', 'FORGE BLOCK'],
			];
		const ctrlRowH = 34;
		const ctrlBoxH = 26 + controls.length * ctrlRowH + 38;

		drawFramedBox(ctx, ctrlBoxX, ctrlBoxY, ctrlBoxW, ctrlBoxH, 'CONTROLS');

		const keyColX = ctrlBoxX + 30;
		const descColX = ctrlBoxX + 110;
		const rowStartY = ctrlBoxY + 40;

		controls.forEach(([key, desc], i) => {
			const ry = rowStartY + i * ctrlRowH;

			// Key badge
			ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
			ctx.beginPath();
			ctx.roundRect(keyColX, ry - 10, 60, 20, 3);
			ctx.fill();
			ctx.strokeStyle = COLOR.roadEdge;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(keyColX, ry - 10, 60, 20, 3);
			ctx.stroke();

			ctx.fillStyle = COLOR.textBright;
			ctx.font = 'bold 12px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(key, keyColX + 30, ry);

			ctx.fillStyle = COLOR.text;
			ctx.font = '13px monospace';
			ctx.textAlign = 'left';
			ctx.fillText(desc, descColX, ry);
		});

		const moveY = rowStartY + controls.length * ctrlRowH + 8;
		ctx.fillStyle = COLOR.textDim;
		ctx.font = '11px monospace';
		ctx.textAlign = 'center';
		ctx.fillText(isTouch ? 'SWIPE ROAD = STEER' : 'WASD / ARROWS = MOVE', cx, moveY);

		// Rotating tip — well below controls box
		const tipY = 380;
		const tipIndex = Math.floor(now / TIP_CYCLE_MS) % TITLE_TIPS.length;
		const tipAge = (now % TIP_CYCLE_MS) / TIP_CYCLE_MS;
		let tipAlpha = 1;
		if (tipAge < 0.1) tipAlpha = tipAge / 0.1;
		else if (tipAge > 0.85) tipAlpha = (1 - tipAge) / 0.15;

		ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
		ctx.beginPath();
		ctx.roundRect(30, tipY - 14, CANVAS_W - 60, 28, 4);
		ctx.fill();

		ctx.globalAlpha = tipAlpha;
		drawGlowText(ctx, TITLE_TIPS[tipIndex], cx, tipY,
			'bold 11px monospace', COLOR.cyan, COLOR.cyan, 4);
		ctx.globalAlpha = 1;

		// Start prompt — clear gap below tip
		const startY = 435;
		const blink = Math.sin(now / 350) > 0;
		const promptGlow = Math.sin(now / 600) * 0.04 + 0.08;

		ctx.fillStyle = `rgba(34, 197, 94, ${promptGlow})`;
		ctx.beginPath();
		ctx.roundRect(cx - 170, startY - 16, 340, 34, 6);
		ctx.fill();
		ctx.strokeStyle = blink ? COLOR.textBright : COLOR.roadEdge;
		ctx.lineWidth = blink ? 2 : 1;
		ctx.beginPath();
		ctx.roundRect(cx - 170, startY - 16, 340, 34, 6);
		ctx.stroke();

		const startText = isTouch ? 'TAP TO START' : 'PRESS SPACE OR TAP TO START';
		if (blink) {
			drawGlowText(ctx, startText, cx, startY,
				'bold 15px monospace', COLOR.textBright, COLOR.textBright, 8);
		} else {
			ctx.fillStyle = COLOR.textDim;
			ctx.font = 'bold 15px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(startText, cx, startY);
		}
	}

	// ================================================================
	// LEADERBOARD — always visible, anchored to lower portion
	// ================================================================

	const lb = ws.leaderboard || [];
	const lbBoxX = 24;
	const lbBoxW = CANVAS_W - 48;
	const maxShow = Math.min(lb.length, 10);
	const lbRowH = 20;
	const lbBoxH = lb.length > 0 ? (30 + maxShow * lbRowH + 10) : 44;
	// Position leaderboard at y=490 for connected mode, bottom-anchored for wallet connect
	const lbBoxY = connected ? 490 : (CANVAS_H - lbBoxH - 26);

	drawFramedBox(ctx, lbBoxX, lbBoxY, lbBoxW, lbBoxH, 'GLOBAL TOP 10');

	if (lb.length > 0) {
		const headerY = lbBoxY + 34;
		ctx.fillStyle = COLOR.textDim;
		ctx.font = '10px monospace';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';
		ctx.fillText('#', lbBoxX + 10, headerY);
		ctx.fillText('PLAYER', lbBoxX + 32, headerY);
		ctx.textAlign = 'right';
		ctx.fillText('SCORE', lbBoxX + lbBoxW - 70, headerY);
		ctx.fillText('NIGHT', lbBoxX + lbBoxW - 12, headerY);

		ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		ctx.moveTo(lbBoxX + 8, headerY + 9);
		ctx.lineTo(lbBoxX + lbBoxW - 8, headerY + 9);
		ctx.stroke();

		for (let i = 0; i < maxShow; i++) {
			const e = lb[i];
			const rowY = headerY + 18 + i * lbRowH;
			const isMe = playerName && e.displayName === playerName;

			if (isMe) {
				ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
				ctx.fillRect(lbBoxX + 2, rowY - 9, lbBoxW - 4, lbRowH);
			}

			// Rank
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.font = 'bold 12px monospace';
			if (i === 0) ctx.fillStyle = COLOR.amber;
			else if (i === 1) ctx.fillStyle = '#c0c0c0';
			else if (i === 2) ctx.fillStyle = '#cd7f32';
			else ctx.fillStyle = COLOR.textDim;
			ctx.fillText(`${i + 1}.`, lbBoxX + 10, rowY);

			// Name
			ctx.fillStyle = isMe ? COLOR.textBright : COLOR.text;
			ctx.font = isMe ? 'bold 12px monospace' : '12px monospace';
			let name = e.displayName || '???';
			if (name.length > 18) {
				name = name.slice(0, 17) + '\u2026';
			}
			ctx.fillText(name, lbBoxX + 32, rowY);

			// Score
			ctx.textAlign = 'right';
			ctx.fillStyle = isMe ? COLOR.textBright : COLOR.text;
			ctx.font = 'bold 12px monospace';
			ctx.fillText(e.score?.toLocaleString() || '0', lbBoxX + lbBoxW - 70, rowY);

			// NIGHT
			ctx.fillStyle = COLOR.amber;
			ctx.font = 'bold 12px monospace';
			ctx.fillText(e.nightEarned || '0', lbBoxX + lbBoxW - 12, rowY);
		}
	} else {
		ctx.fillStyle = COLOR.textDim;
		ctx.font = '11px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('NO SCORES YET', cx, lbBoxY + 26);
	}

	// Scanlines
	drawScanlines(ctx, 0.06);

}

export function drawGameOver(ctx, game, now) {
	gameOverHitRegions = [];
	ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
	ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

	const cx = CANVAS_W / 2;

	// Player name
	if (game.playerName) {
		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 13px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(game.playerName, cx, 55);
	}

	ctx.fillStyle = COLOR.red;
	ctx.font = 'bold 28px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('STAKEPOOL OFFLINE', cx, 85);

	ctx.fillStyle = COLOR.textDim;
	ctx.font = '11px monospace';
	ctx.fillText(game.deathCause === 'collision' ? 'LITHIUM FIRE' : 'POWER FAILURE', cx, 110);

	// Score block
	ctx.fillStyle = COLOR.text;
	ctx.font = 'bold 18px monospace';
	ctx.fillText(`SCORE: ${game.score}`, cx, 145);

	if (game.score >= game.highScore && game.highScore > 0) {
		ctx.fillStyle = COLOR.amber;
		ctx.font = 'bold 12px monospace';
		ctx.fillText('NEW HIGH SCORE', cx, 168);
	}

	// Stats row
	ctx.font = '11px monospace';
	ctx.fillStyle = COLOR.textDim;
	ctx.fillText(`HI: ${game.highScore}   BLOCKS: ${game.forge.blocksForged}   DELEGATORS: ${game.delegators.count}`, cx, 192);

	ctx.font = 'bold 12px monospace';
	if (game.guestMode) {
		ctx.fillStyle = COLOR.textDim;
		ctx.fillText('CONNECT WALLET TO EARN NIGHT', cx, 212);
	} else {
		ctx.fillStyle = COLOR.amber;
		ctx.fillText(`NIGHT EARNED: ${game.forge.nightEarned}`, cx, 212);

		// Claim on Tosidrop button (only if NIGHT > 0)
		if (game.forge.nightEarned > 0) {
			const btnW = 200;
			const btnH = 26;
			const btnX = cx - btnW / 2;
			const btnY = 222;

			// Button background
			ctx.fillStyle = '#1a1a2e';
			ctx.strokeStyle = COLOR.amber;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.roundRect(btnX, btnY, btnW, btnH, 4);
			ctx.fill();
			ctx.stroke();

			// Button text
			ctx.fillStyle = COLOR.amber;
			ctx.font = 'bold 11px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('CLAIM ON TOSIDROP →', cx, btnY + btnH / 2);

			gameOverHitRegions.push({ x: btnX, y: btnY, w: btnW, h: btnH, action: 'tosidrop' });
		}
	}

	// === Leaderboard ===
	if (game.leaderboard && game.leaderboard.length > 0) {
		const lbTop = game.forge.nightEarned > 0 && !game.guestMode ? 260 : 240;

		// Header
		ctx.fillStyle = COLOR.tan;
		ctx.font = 'bold 12px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('— TOP SCORES —', cx, lbTop);

		// Column headers
		ctx.fillStyle = COLOR.textDim;
		ctx.font = '9px monospace';
		ctx.textAlign = 'left';
		ctx.fillText('RANK', 80, lbTop + 18);
		ctx.fillText('PLAYER', 130, lbTop + 18);
		ctx.textAlign = 'right';
		ctx.fillText('SCORE', CANVAS_W - 80, lbTop + 18);

		// Divider
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		ctx.moveTo(70, lbTop + 24);
		ctx.lineTo(CANVAS_W - 70, lbTop + 24);
		ctx.stroke();

		const entries = game.leaderboard.slice(0, 10);
		for (let i = 0; i < entries.length; i++) {
			const e = entries[i];
			const rowY = lbTop + 38 + i * 18;

			// Highlight current player
			const isMe = game.playerName && e.displayName === game.playerName;
			if (isMe) {
				ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
				ctx.fillRect(70, rowY - 8, CANVAS_W - 140, 16);
			}

			// Rank
			ctx.textAlign = 'left';
			ctx.fillStyle = i < 3 ? COLOR.amber : COLOR.textDim;
			ctx.font = 'bold 11px monospace';
			ctx.fillText(`#${i + 1}`, 80, rowY);

			// Name
			ctx.fillStyle = isMe ? COLOR.textBright : COLOR.text;
			ctx.font = '11px monospace';
			let name = e.displayName || '???';
			if (name.length > 18) {
				name = name.slice(0, 17) + '…';
			}
			ctx.fillText(name, 130, rowY);

			// Score
			ctx.textAlign = 'right';
			ctx.fillStyle = isMe ? COLOR.textBright : COLOR.text;
			ctx.font = 'bold 11px monospace';
			ctx.fillText(e.score.toLocaleString(), CANVAS_W - 80, rowY);
		}
	}

	const blink = Math.sin(now / 400) > 0;
	if (blink) {
		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 13px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('[ PRESS SPACE OR TAP TO RETRY ]', cx, CANVAS_H - 40);
	}
}

// ── First-play tutorial overlay (touch devices only) ────────────────

let _tutorialSeen = false;
let _tutorialStart = 0;
const TUTORIAL_DURATION = 3500;

export function drawTutorialOverlay(ctx, now) {
	if (!checkTouch() || _tutorialSeen) return;

	// Check localStorage on first call
	if (!_tutorialStart) {
		try {
			if (localStorage.getItem('starforge-tutorial-seen')) {
				_tutorialSeen = true;
				return;
			}
		} catch {}
		_tutorialStart = now;
	}

	const elapsed = now - _tutorialStart;
	if (elapsed > TUTORIAL_DURATION) {
		_tutorialSeen = true;
		try { localStorage.setItem('starforge-tutorial-seen', '1'); } catch {}
		return;
	}

	// Fade in/out
	const alpha = elapsed > TUTORIAL_DURATION - 500
		? (TUTORIAL_DURATION - elapsed) / 500
		: Math.min(1, elapsed / 300);

	const midY = CANVAS_H / 2;
	const shoulderW = ROAD_LEFT;
	const cx = CANVAS_W / 2;

	// Dim overlay
	ctx.globalAlpha = alpha * 0.75;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 56, shoulderW, CANVAS_H - 84);           // left shoulder
	ctx.fillRect(ROAD_RIGHT, 56, shoulderW, CANVAS_H - 84);  // right shoulder

	ctx.globalAlpha = alpha;
	ctx.font = 'bold 12px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Left shoulder labels
	ctx.fillStyle = COLOR.tankBubble;
	ctx.fillText('DUMP', shoulderW / 2, midY - 30);
	ctx.font = '9px monospace';
	ctx.fillStyle = COLOR.textDim;
	ctx.fillText('\u25B2 TAP', shoulderW / 2, midY - 16);

	ctx.font = 'bold 12px monospace';
	ctx.fillStyle = COLOR.cyan;
	ctx.fillText('SHIELD', shoulderW / 2, midY + 24);
	ctx.font = '9px monospace';
	ctx.fillStyle = COLOR.textDim;
	ctx.fillText('\u25BC TAP', shoulderW / 2, midY + 38);

	// Right shoulder labels
	ctx.font = 'bold 12px monospace';
	ctx.fillStyle = COLOR.empFlash;
	ctx.fillText('EMP', ROAD_RIGHT + shoulderW / 2, midY - 30);
	ctx.font = '9px monospace';
	ctx.fillStyle = COLOR.textDim;
	ctx.fillText('\u25B2 TAP', ROAD_RIGHT + shoulderW / 2, midY - 16);

	ctx.font = 'bold 12px monospace';
	ctx.fillStyle = COLOR.forgeFlash;
	ctx.fillText('FORGE', ROAD_RIGHT + shoulderW / 2, midY + 24);
	ctx.font = '9px monospace';
	ctx.fillStyle = COLOR.textDim;
	ctx.fillText('\u25BC TAP', ROAD_RIGHT + shoulderW / 2, midY + 38);

	// Center road — steer hint
	ctx.font = 'bold 13px monospace';
	ctx.fillStyle = COLOR.textBright;
	ctx.fillText('\u2190 SWIPE TO STEER \u2192', cx, midY);

	ctx.globalAlpha = 1;
}
