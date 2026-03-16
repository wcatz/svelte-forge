import {
	RV_W, RV_H, PLAYER_SPEED, ROAD_LEFT, ROAD_RIGHT,
	CANVAS_H, COLOR,
} from './constants.js';

export function createPlayer() {
	return {
		x: (ROAD_LEFT + ROAD_RIGHT) / 2 - RV_W / 2,
		y: CANVAS_H - 140,
		w: RV_W,
		h: RV_H,
		speed: PLAYER_SPEED,
	};
}

export function updatePlayer(player, moveX, moveY) {
	player.x += moveX * player.speed;
	player.y += moveY * player.speed;

	// Clamp to road
	player.x = Math.max(ROAD_LEFT + 4, Math.min(ROAD_RIGHT - player.w - 4, player.x));
	player.y = Math.max(80, Math.min(CANVAS_H - player.h - 10, player.y));
}

export function drawRV(ctx, player, now) {
	const { x, y, w, h } = player;
	const cx = x + w / 2;

	// --- Shadow ---
	ctx.fillStyle = 'rgba(0,0,0,0.25)';
	ctx.beginPath();
	ctx.ellipse(cx, y + h + 3, w / 2, 5, 0, 0, Math.PI * 2);
	ctx.fill();

	// --- Wheels (under body) ---
	ctx.fillStyle = '#1a1a1a';
	// Front axle
	ctx.fillRect(x - 2, y + 10, 4, 12);
	ctx.fillRect(x + w - 2, y + 10, 4, 12);
	// Rear axle
	ctx.fillRect(x - 2, y + h - 22, 4, 12);
	ctx.fillRect(x + w - 2, y + h - 22, 4, 12);
	// Wheel hubs
	ctx.fillStyle = '#444';
	ctx.fillRect(x - 1, y + 13, 2, 6);
	ctx.fillRect(x + w - 1, y + 13, 2, 6);
	ctx.fillRect(x - 1, y + h - 19, 2, 6);
	ctx.fillRect(x + w - 1, y + h - 19, 2, 6);

	// --- Main body — tan motorhome ---
	const bodyGrad = ctx.createLinearGradient(x, y, x + w, y);
	bodyGrad.addColorStop(0, COLOR.rvAccent);
	bodyGrad.addColorStop(0.15, COLOR.rv);
	bodyGrad.addColorStop(0.85, COLOR.rv);
	bodyGrad.addColorStop(1, COLOR.rvAccent);
	ctx.fillStyle = bodyGrad;
	ctx.beginPath();
	ctx.roundRect(x + 2, y, w - 4, h, 5);
	ctx.fill();

	// Body outline
	ctx.strokeStyle = COLOR.rvDark;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(x + 2, y, w - 4, h, 5);
	ctx.stroke();

	// --- Cab section (front / top) ---
	// Windshield — blue tinted
	ctx.fillStyle = COLOR.rvWindshield;
	ctx.beginPath();
	ctx.roundRect(x + 8, y + 4, w - 16, 12, 3);
	ctx.fill();
	// Windshield glare
	ctx.fillStyle = 'rgba(255,255,255,0.2)';
	ctx.fillRect(x + 10, y + 5, 8, 3);

	// --- Accent stripe (horizontal band) ---
	ctx.fillStyle = COLOR.rvDark;
	ctx.fillRect(x + 4, y + 17, w - 8, 2);

	// --- Roof section — lighter cream ---
	ctx.fillStyle = COLOR.rvRoof;
	ctx.fillRect(x + 6, y + 20, w - 12, 34);

	// --- Solar panels on roof ---
	ctx.fillStyle = COLOR.rvSolar;
	const panelGap = 2;
	const halfW = (w - 12 - panelGap) / 2; // two panels side by side

	// Two front panels — lengthwise (front-to-back)
	ctx.fillRect(x + 6, y + 22, halfW, 20);
	ctx.fillRect(x + 6 + halfW + panelGap, y + 22, halfW, 20);

	// One rear panel — sideways (full width)
	ctx.fillRect(x + 6, y + 44, w - 12, 8);

	// Grid lines on front panels (vertical lines for lengthwise panels)
	ctx.strokeStyle = '#1a3a5a88';
	ctx.lineWidth = 0.5;
	// Left front panel
	for (let gy = y + 26; gy < y + 42; gy += 5) {
		ctx.beginPath();
		ctx.moveTo(x + 6, gy);
		ctx.lineTo(x + 6 + halfW, gy);
		ctx.stroke();
	}
	ctx.beginPath();
	ctx.moveTo(x + 6 + halfW / 2, y + 22);
	ctx.lineTo(x + 6 + halfW / 2, y + 42);
	ctx.stroke();
	// Right front panel
	const rx = x + 6 + halfW + panelGap;
	for (let gy = y + 26; gy < y + 42; gy += 5) {
		ctx.beginPath();
		ctx.moveTo(rx, gy);
		ctx.lineTo(rx + halfW, gy);
		ctx.stroke();
	}
	ctx.beginPath();
	ctx.moveTo(rx + halfW / 2, y + 22);
	ctx.lineTo(rx + halfW / 2, y + 42);
	ctx.stroke();
	// Rear panel (horizontal lines for sideways panel)
	for (let gx = x + 10; gx < x + w - 10; gx += 5) {
		ctx.beginPath();
		ctx.moveTo(gx, y + 44);
		ctx.lineTo(gx, y + 52);
		ctx.stroke();
	}
	ctx.beginPath();
	ctx.moveTo(x + 6, y + 48);
	ctx.lineTo(x + w - 6, y + 48);
	ctx.stroke();

	// --- Starlink dish (between windshield and panels) ---
	ctx.fillStyle = COLOR.rvStarlink;
	ctx.beginPath();
	ctx.arc(cx, y + 19, 3, 0, Math.PI * 2);
	ctx.fill();
	// Antenna mast
	ctx.strokeStyle = '#ccc';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(cx, y + 16);
	ctx.lineTo(cx, y + 13);
	ctx.stroke();
	// Signal arcs
	const signalPulse = (Math.sin(now / 300) + 1) / 2;
	ctx.strokeStyle = `rgba(100, 200, 255, ${0.15 + signalPulse * 0.35})`;
	ctx.lineWidth = 0.7;
	for (let r = 0; r < 3; r++) {
		ctx.beginPath();
		ctx.arc(cx, y + 13, 3 + r * 3, -Math.PI * 0.75, -Math.PI * 0.25);
		ctx.stroke();
	}

	// --- Side windows (blue tinted) ---
	ctx.fillStyle = COLOR.rvWindshield + 'bb';
	ctx.fillRect(x + 4, y + 53, 5, 8);
	ctx.fillRect(x + w - 9, y + 53, 5, 8);

	// --- Rear bumper ---
	ctx.fillStyle = COLOR.rvDark;
	ctx.fillRect(x + 5, y + h - 6, w - 10, 4);

	// --- Headlights with glow ---
	ctx.fillStyle = '#fffbe6';
	ctx.beginPath();
	ctx.arc(x + 7, y + 1, 3, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(x + w - 7, y + 1, 3, 0, Math.PI * 2);
	ctx.fill();
	// Headlight beams
	ctx.fillStyle = 'rgba(255,251,230,0.06)';
	ctx.beginPath();
	ctx.moveTo(x + 4, y);
	ctx.lineTo(x - 4, y - 30);
	ctx.lineTo(x + 18, y - 30);
	ctx.closePath();
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(x + w - 4, y);
	ctx.lineTo(x + w + 4, y - 30);
	ctx.lineTo(x + w - 18, y - 30);
	ctx.closePath();
	ctx.fill();

	// --- Taillights ---
	ctx.fillStyle = '#ef4444';
	ctx.fillRect(x + 5, y + h - 3, 5, 4);
	ctx.fillRect(x + w - 10, y + h - 3, 5, 4);
	// Tail glow
	ctx.fillStyle = '#ef444433';
	ctx.fillRect(x + 3, y + h + 1, 9, 5);
	ctx.fillRect(x + w - 12, y + h + 1, 9, 5);
}
