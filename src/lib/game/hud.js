import {
	CANVAS_W, CANVAS_H, BATTERY_MAX, COLOR,
	BATTERY_START, EMP_DRAIN, EMP_COOLDOWN,
	BLOCK_INTERVAL_BASE, BLOCK_FORGE_WINDOW, BLOCK_REWARD_POINTS,
	NIGHT_PER_BLOCK, DELEGATOR_FORGE_BONUS,
} from './constants.js';
import { getPercent } from './battery.js';
import { drawForgeHUD } from './block-forge.js';

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
	'FORGE A BLOCK TO EARN NIGHT TOKENS',
	'DELEGATORS EARN 10x NIGHT PER BLOCK',
	'REAR HITS JAM YOUR SHIELD FOR 2 SECONDS',
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

	// Speed
	const speedDisplay = Math.floor(roadSpeed * 30);
	ctx.fillText(`${speedDisplay} KPH`, 10, 44);

	// === Center: Block forge countdown ===
	drawForgeHUD(ctx, forge, now);

	// === Right column: Battery gauge ===
	drawBatteryGauge(ctx, batteryPct, now);

	// === Lives (small RV icons, left side) ===
	for (let i = 0; i < lives; i++) {
		const lx = 120 + i * 16;
		ctx.fillStyle = COLOR.tan;
		ctx.beginPath();
		ctx.roundRect(lx, 30, 8, 12, 2);
		ctx.fill();
		ctx.fillStyle = '#fffbe6';
		ctx.fillRect(lx + 2, 30, 4, 3);
	}

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

	// NIGHT tokens + multiplier
	ctx.textAlign = 'right';
	ctx.fillStyle = COLOR.amber;
	ctx.font = 'bold 12px monospace';
	const mult = game.nightMultiplier || 1;
	ctx.fillText(`NIGHT: ${forge.nightEarned}${mult > 1 ? ' (10x)' : ''}`, CANVAS_W - 10, CANVAS_H - 14);
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

export function drawTitleScreen(ctx, now, playerName) {
	// Semi-transparent overlay — lets attract-mode demo gameplay show through
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

	const cx = CANVAS_W / 2;

	// --- Logo centered at top ---
	const logoSize = 70;
	if (logoLoaded && logoImg) {
		const pulse = Math.sin(now / 500) * 0.1 + 0.9;
		ctx.globalAlpha = pulse;
		ctx.drawImage(logoImg, cx - logoSize / 2, 24, logoSize, logoSize);
		ctx.globalAlpha = 1;
	}

	// --- Title block ---
	ctx.fillStyle = '#f5c842';
	ctx.font = 'bold 32px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText('🌟 STAR FORGER ⚡', cx, 115);

	// --- Player name (ada handle) ---
	if (playerName) {
		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 14px monospace';
		ctx.fillText(playerName, cx, 140);
	}

	// Midnight Rider subtitle — cyan
	ctx.fillStyle = COLOR.cyan;
	ctx.font = 'bold 22px monospace';
	ctx.fillText('MIDNIGHT RIDER', cx, playerName ? 162 : 148);

	// Divider line
	ctx.strokeStyle = COLOR.roadEdge;
	ctx.lineWidth = 1;
	ctx.beginPath();
	const divY = playerName ? 178 : 164;
	ctx.moveTo(cx - 100, divY);
	ctx.lineTo(cx + 100, divY);
	ctx.stroke();

	// Tagline
	ctx.fillStyle = COLOR.textDim;
	ctx.font = '12px monospace';
	ctx.fillText('FORGE BLOCKS  ·  EARN NIGHT', cx, divY + 16);

	// --- Controls section ---
	ctx.fillStyle = COLOR.text;
	ctx.font = '14px monospace';
	const controls = [
		['SPACE', 'EM SHIELD'],
		['E', 'EMP PULSE'],
		['Q', 'BLACK TANK'],
		['F', 'FORGE BLOCK'],
	];
	const ctrlY = 225;
	controls.forEach(([key, desc], i) => {
		const ly = ctrlY + i * 26;
		// Key badge
		ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
		ctx.beginPath();
		ctx.roundRect(cx - 120, ly - 10, 60, 20, 3);
		ctx.fill();
		ctx.strokeStyle = COLOR.roadEdge;
		ctx.lineWidth = 1;
		ctx.stroke();
		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 13px monospace';
		ctx.textAlign = 'center';
		ctx.fillText(key, cx - 90, ly);
		// Description
		ctx.fillStyle = COLOR.text;
		ctx.font = '14px monospace';
		ctx.textAlign = 'left';
		ctx.fillText(desc, cx - 50, ly);
	});

	// Movement note
	ctx.textAlign = 'center';
	ctx.fillStyle = COLOR.textDim;
	ctx.font = '12px monospace';
	ctx.fillText('WASD / ARROWS — MOVE', cx, ctrlY + 115);

	// --- Rotating tip ---
	const tipIndex = Math.floor(now / TIP_CYCLE_MS) % TITLE_TIPS.length;
	const tipAge = (now % TIP_CYCLE_MS) / TIP_CYCLE_MS;
	let tipAlpha = 1;
	if (tipAge < 0.1) tipAlpha = tipAge / 0.1;
	else if (tipAge > 0.85) tipAlpha = (1 - tipAge) / 0.15;

	ctx.globalAlpha = tipAlpha;
	ctx.fillStyle = COLOR.cyan;
	ctx.font = 'bold 15px monospace';
	ctx.textAlign = 'center';
	ctx.fillText(TITLE_TIPS[tipIndex], cx, 400);
	ctx.globalAlpha = 1;

	// --- Start prompt ---
	const blink = Math.sin(now / 400) > 0;
	if (blink) {
		// Button-style prompt
		ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
		ctx.beginPath();
		ctx.roundRect(cx - 150, 520, 300, 32, 6);
		ctx.fill();
		ctx.strokeStyle = COLOR.textBright;
		ctx.lineWidth = 1;
		ctx.stroke();

		ctx.fillStyle = COLOR.textBright;
		ctx.font = 'bold 16px monospace';
		ctx.textAlign = 'center';
		ctx.fillText('PRESS SPACE OR TAP TO START', cx, 537);
	}
}

export function drawGameOver(ctx, game, now) {
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
	ctx.fillText('LITHIUM FIRE', cx, 110);

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

	ctx.fillStyle = COLOR.amber;
	ctx.font = 'bold 12px monospace';
	ctx.fillText(`NIGHT EARNED: ${game.forge.nightEarned}`, cx, 212);

	// === Leaderboard ===
	if (game.leaderboard && game.leaderboard.length > 0) {
		const lbTop = 240;

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
			const name = e.displayName.length > 18 ? e.displayName.slice(0, 17) + '…' : e.displayName;
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
