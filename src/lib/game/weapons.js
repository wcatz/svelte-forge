import {
	SHIELD_DRAIN_PER_FRAME, SHIELD_CUTOFF, SHIELD_RADIUS,
	EMP_DRAIN, EMP_COOLDOWN, EMP_RADIUS, EMP_FLASH_DURATION,
	BLACK_TANK_DRAIN_PER_FRAME, BLACK_TANK_SEGMENT_INTERVAL,
	BLACK_TANK_SEGMENT_LIFE, BLACK_TANK_W,
	CANVAS_H, COLOR,
} from './constants.js';
import { drain, canShield } from './battery.js';

export function createWeaponsState() {
	return {
		// EM Shield — primary weapon
		shieldActive: false,
		shieldTime: 0, // how long shield has been active (for color cycling)
		shieldDisabledUntil: 0, // timestamp — rear hit jams shield

		// EMP Blast — secondary weapon
		lastEmpTime: 0,
		empBlastActive: false,
		empBlastStart: 0,

		// Black tank
		tankDumping: false,
		tankSegments: [],
		lastSegmentTime: 0,
	};
}

// === EM SHIELD (primary) ===

export function toggleShield(weapons, battery, wantsOn, now = 0) {
	if (wantsOn && canShield(battery) && now >= weapons.shieldDisabledUntil) {
		weapons.shieldActive = true;
	} else {
		weapons.shieldActive = false;
		weapons.shieldTime = 0;
	}
}

/** Rear hit jams shield for 2 seconds */
export function jamShield(weapons, now) {
	weapons.shieldActive = false;
	weapons.shieldTime = 0;
	weapons.shieldDisabledUntil = now + 2000;
}

export function updateShield(weapons, battery) {
	if (weapons.shieldActive) {
		if (!drain(battery, SHIELD_DRAIN_PER_FRAME) || !canShield(battery)) {
			weapons.shieldActive = false;
			weapons.shieldTime = 0;
		} else {
			weapons.shieldTime++;
		}
	}
}

/** Get the current shield color based on how long it's been active */
function getShieldColor(weapons, now) {
	const colors = COLOR.shieldColors;
	// Cycle through colors every ~1.5 seconds
	const idx = Math.floor(weapons.shieldTime / 90) % colors.length;
	return colors[idx];
}

/** Check if an enemy center is within shield radius of player center */
export function isInShieldRange(player, enemy) {
	const pcx = player.x + player.w / 2;
	const pcy = player.y + player.h / 2;
	const ecx = enemy.x + enemy.w / 2;
	const ecy = enemy.y + enemy.h / 2;
	const dx = pcx - ecx;
	const dy = pcy - ecy;
	return Math.sqrt(dx * dx + dy * dy) < SHIELD_RADIUS;
}

export function drawShield(ctx, player, weapons, now) {
	const cx = player.x + player.w / 2;
	const cy = player.y + player.h / 2;

	// Draw "SHIELD JAMMED" warning when disabled
	if (now < weapons.shieldDisabledUntil) {
		const blink = Math.sin(now / 80) > 0;
		if (blink) {
			ctx.globalAlpha = 0.7;
			ctx.strokeStyle = COLOR.red;
			ctx.lineWidth = 2;
			ctx.setLineDash([4, 4]);
			ctx.beginPath();
			ctx.arc(cx, cy, SHIELD_RADIUS, 0, Math.PI * 2);
			ctx.stroke();
			ctx.setLineDash([]);

			ctx.fillStyle = COLOR.red;
			ctx.font = 'bold 10px monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('JAMMED', cx, cy - SHIELD_RADIUS - 10);
			ctx.globalAlpha = 1;
		}
		return;
	}

	if (!weapons.shieldActive) return;

	const color = getShieldColor(weapons, now);
	const pulse = Math.sin(now / 80) * 4;
	const r = SHIELD_RADIUS + pulse;

	// Outer glow — stronger in front
	const frontGrad = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.3, cx, cy, r + 10);
	frontGrad.addColorStop(0, 'transparent');
	frontGrad.addColorStop(0.7, color + '15');
	frontGrad.addColorStop(1, color + '30');
	ctx.fillStyle = frontGrad;
	ctx.beginPath();
	ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
	ctx.fill();

	// Strong front arc (top half — facing traffic)
	ctx.globalAlpha = 0.35 + Math.sin(now / 100) * 0.1;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(cx, cy, r, -Math.PI * 0.85, -Math.PI * 0.15);
	ctx.lineTo(cx, cy);
	ctx.closePath();
	ctx.fill();

	// Full circle fill (dimmer)
	ctx.globalAlpha = 0.15;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.fill();

	// Main ring
	ctx.globalAlpha = 0.7;
	ctx.strokeStyle = color;
	ctx.lineWidth = 2.5;
	ctx.beginPath();
	ctx.arc(cx, cy, r, 0, Math.PI * 2);
	ctx.stroke();

	// Reinforced front arc — thicker bright line
	ctx.globalAlpha = 0.9;
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(cx, cy, r, -Math.PI * 0.8, -Math.PI * 0.2);
	ctx.stroke();
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(cx, cy, r + 3, -Math.PI * 0.75, -Math.PI * 0.25);
	ctx.stroke();

	// Hex grid segments inside shield
	ctx.globalAlpha = 0.12;
	ctx.strokeStyle = color;
	ctx.lineWidth = 0.5;
	const hexSize = 12;
	for (let hx = cx - r; hx < cx + r; hx += hexSize * 1.5) {
		for (let hy = cy - r; hy < cy + r; hy += hexSize * 0.87) {
			const dx = hx - cx;
			const dy = hy - cy;
			if (dx * dx + dy * dy > r * r) continue;
			const offset = (Math.floor((hy - cy + r) / (hexSize * 0.87)) % 2) * hexSize * 0.75;
			drawHex(ctx, hx + offset, hy, hexSize * 0.4);
		}
	}

	// Crackle arcs — electromagnetic lightning
	ctx.globalAlpha = 0.5;
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 1.5;
	const arcCount = 4;
	for (let i = 0; i < arcCount; i++) {
		const angle = (now / 180) + (Math.PI * 2 * i) / arcCount;
		const ax = cx + Math.cos(angle) * r * 0.5;
		const ay = cy + Math.sin(angle) * r * 0.5;
		const mid1x = cx + Math.cos(angle + 0.15) * r * 0.75 + Math.sin(now / 50 + i) * 3;
		const mid1y = cy + Math.sin(angle + 0.15) * r * 0.75 + Math.cos(now / 50 + i) * 3;
		const bx = cx + Math.cos(angle + 0.3) * r;
		const by = cy + Math.sin(angle + 0.3) * r;
		ctx.beginPath();
		ctx.moveTo(ax, ay);
		ctx.lineTo(mid1x, mid1y);
		ctx.lineTo(bx, by);
		ctx.stroke();
	}

	ctx.globalAlpha = 1;
}

function drawHex(ctx, x, y, size) {
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 6;
		const px = x + size * Math.cos(angle);
		const py = y + size * Math.sin(angle);
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.stroke();
}

// === EMP BLAST (secondary) ===

export function fireEmp(weapons, battery, now) {
	if (now - weapons.lastEmpTime < EMP_COOLDOWN) return false;
	if (!drain(battery, EMP_DRAIN)) return false;

	weapons.lastEmpTime = now;
	weapons.empBlastActive = true;
	weapons.empBlastStart = now;
	return true;
}

export function updateEmp(weapons, now) {
	if (weapons.empBlastActive && now - weapons.empBlastStart > EMP_FLASH_DURATION) {
		weapons.empBlastActive = false;
	}
}

/** Check if enemy is within EMP blast radius */
export function isInEmpRange(player, enemy) {
	const pcx = player.x + player.w / 2;
	const pcy = player.y + player.h / 2;
	const ecx = enemy.x + enemy.w / 2;
	const ecy = enemy.y + enemy.h / 2;
	const dx = pcx - ecx;
	const dy = pcy - ecy;
	return Math.sqrt(dx * dx + dy * dy) < EMP_RADIUS;
}

export function drawEmpBlast(ctx, player, weapons, now) {
	if (!weapons.empBlastActive) return;

	const cx = player.x + player.w / 2;
	const cy = player.y + player.h / 2;
	const age = (now - weapons.empBlastStart) / EMP_FLASH_DURATION;
	const radius = EMP_RADIUS * (0.3 + age * 0.7);

	// Expanding ring
	ctx.globalAlpha = 1 - age;
	ctx.strokeStyle = COLOR.empFlash;
	ctx.lineWidth = 4 * (1 - age);
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.stroke();

	// Fill flash
	ctx.globalAlpha = (1 - age) * 0.2;
	ctx.fillStyle = COLOR.empFlash;
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, Math.PI * 2);
	ctx.fill();

	ctx.globalAlpha = 1;
}

// === BLACK TANK ===

export function updateBlackTank(weapons, battery, player, now, wantsDump) {
	if (wantsDump && drain(battery, BLACK_TANK_DRAIN_PER_FRAME)) {
		weapons.tankDumping = true;
		if (now - weapons.lastSegmentTime > BLACK_TANK_SEGMENT_INTERVAL) {
			weapons.lastSegmentTime = now;
			weapons.tankSegments.push({
				x: player.x + player.w / 2 - BLACK_TANK_W / 2,
				y: player.y + player.h + 2,
				w: BLACK_TANK_W,
				h: 14,
				expiresAt: now + BLACK_TANK_SEGMENT_LIFE,
				spawnTime: now,
			});
		}
	} else {
		weapons.tankDumping = false;
	}
}

export function updateWeapons(weapons, now, roadSpeed) {
	// Expire tank segments
	weapons.tankSegments = weapons.tankSegments.filter(s => {
		s.y += roadSpeed;
		return now < s.expiresAt && s.y < CANVAS_H + 80;
	});

	// Update EMP
	updateEmp(weapons, now);
}

export function drawTankSlicks(ctx, segments, now) {
	for (const s of segments) {
		const age = (now - s.spawnTime) / BLACK_TANK_SEGMENT_LIFE;
		const alpha = Math.max(0, 1 - age * 0.7);

		ctx.globalAlpha = alpha;
		ctx.fillStyle = COLOR.tankSlick;
		ctx.beginPath();
		ctx.roundRect(s.x, s.y, s.w, s.h, 4);
		ctx.fill();

		ctx.fillStyle = COLOR.tankBubble;
		const bx1 = s.x + 4 + ((now * 0.015 + s.spawnTime) % Math.max(1, s.w - 8));
		const bx2 = s.x + s.w - 4 - ((now * 0.02 + s.spawnTime * 0.7) % Math.max(1, s.w - 8));
		const br = 1.5 + Math.sin(now / 200 + s.spawnTime) * 0.8;
		ctx.beginPath();
		ctx.arc(bx1, s.y + s.h / 2, br, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(bx2, s.y + s.h / 2, br * 0.7, 0, Math.PI * 2);
		ctx.fill();

		ctx.globalAlpha = 1;
	}
}
