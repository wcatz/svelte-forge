import {
	ENEMY_TYPES, LANE_COUNT, LANE_W, ROAD_LEFT, ROAD_RIGHT,
	CANVAS_H, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_MAX,
	PURSUER_DISTANCE, PURSUER_CHANCE, PURSUER_SPEED_MULT,
	ENEMY_BULLET_SPEED, ENEMY_BULLET_W, ENEMY_BULLET_H, ENEMY_FIRE_INTERVAL,
	COLOR,
} from './constants.js';

export function createEnemyState() {
	return {
		list: [],
		bullets: [], // enemy projectiles
		lastSpawn: 0,
		nextSpawnDelay: 1000,
	};
}

function getAvailableTypes(distance) {
	return Object.entries(ENEMY_TYPES)
		.filter(([, t]) => distance >= t.minDistance)
		.map(([key, t]) => ({ key, ...t }));
}

export function spawnEnemy(state, now, distance, roadSpeed) {
	if (now - state.lastSpawn < state.nextSpawnDelay) return;
	state.lastSpawn = now;

	const difficultyMult = Math.min(distance / 8000, 1);
	state.nextSpawnDelay = (SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN))
		* (1 - difficultyMult * 0.35);

	const available = getAvailableTypes(distance);
	if (available.length === 0) return;

	const type = available[Math.floor(Math.random() * available.length)];
	const lane = Math.floor(Math.random() * LANE_COUNT);
	const x = ROAD_LEFT + lane * LANE_W + (LANE_W - type.w) / 2;

	// Pursuing enemies come from the bottom
	const isPursuer = distance >= PURSUER_DISTANCE && Math.random() < PURSUER_CHANCE;

	state.list.push({
		x,
		y: isPursuer ? CANVAS_H + type.h : -type.h - Math.random() * 100,
		w: type.w,
		h: type.h,
		speed: isPursuer ? roadSpeed * PURSUER_SPEED_MULT : roadSpeed * type.speedMult,
		hp: type.hp,
		maxHp: type.hp,
		points: type.points,
		type: type.key,
		name: type.name,
		color: type.color,
		accent: type.accent,
		badge: type.badge,
		pursuing: isPursuer,
		lane,
		lastFireTime: 0, // for pursuer firing
		// Blocker AI: target the player's lane
		blocking: !isPursuer,
		// Spin-out state (set by black tank slick)
		spinning: false,
		spinAngle: 0,
		spinVx: 0,
		spinVy: 0,
		spinTime: 0,
	});
}

/** Update enemy positions. Blockers drift toward player lane, pursuers chase and fire. */
export function updateEnemies(state, roadSpeed, player, now) {
	// Update bullets
	state.bullets = state.bullets.filter(b => {
		b.y -= b.vy;
		return b.y > -20 && b.y < CANVAS_H + 20;
	});

	state.list = state.list.filter(e => {
		if (e.spinning) {
			e.spinAngle += 0.15;
			e.x += e.spinVx;
			e.y += e.spinVy;
			e.spinTime--;

			if (e.x + e.w < ROAD_LEFT - 30 || e.x > ROAD_RIGHT + 30) {
				e.explode = true;
				return false;
			}
			return e.spinTime > 0;
		}

		if (e.pursuing) {
			// Chase upward toward the player
			e.y -= e.speed * 0.8;

			// Drift toward player's lane
			if (player) {
				const targetX = player.x + player.w / 2 - e.w / 2;
				const dx = targetX - e.x;
				e.x += Math.sign(dx) * Math.min(Math.abs(dx), 1.2);
				// Clamp to road
				e.x = Math.max(ROAD_LEFT + 2, Math.min(ROAD_RIGHT - e.w - 2, e.x));
			}

			// Fire at player
			if (now && now - e.lastFireTime > ENEMY_FIRE_INTERVAL) {
				e.lastFireTime = now;
				state.bullets.push({
					x: e.x + e.w / 2 - ENEMY_BULLET_W / 2,
					y: e.y,
					w: ENEMY_BULLET_W,
					h: ENEMY_BULLET_H,
					vy: -ENEMY_BULLET_SPEED, // moves up toward player
				});
			}

			return e.y > -e.h - 60;
		} else {
			// Blocker: drift toward player's lane to cut them off
			if (player && e.blocking) {
				const targetX = player.x + player.w / 2 - e.w / 2;
				const dx = targetX - e.x;
				e.x += Math.sign(dx) * Math.min(Math.abs(dx), 0.6);
				e.x = Math.max(ROAD_LEFT + 2, Math.min(ROAD_RIGHT - e.w - 2, e.x));
			}

			e.y += e.speed;
			return e.y < CANVAS_H + 60;
		}
	});
}

export function startSpinOut(enemy, hitFromX) {
	enemy.spinning = true;
	enemy.spinTime = 40;
	if (hitFromX !== undefined) {
		// Spin away from the hit — hit from left pushes right, etc.
		const ecx = enemy.x + enemy.w / 2;
		enemy.spinVx = ecx > hitFromX ? 4 : -4;
	} else {
		const roadCenter = (ROAD_LEFT + ROAD_RIGHT) / 2;
		enemy.spinVx = enemy.x < roadCenter ? -4 : 4;
	}
	enemy.spinVy = enemy.pursuing ? 1 : -0.5;
}

export function drawEnemy(ctx, e, now) {
	ctx.save();

	if (e.spinning) {
		const cx = e.x + e.w / 2;
		const cy = e.y + e.h / 2;
		ctx.translate(cx, cy);
		ctx.rotate(e.spinAngle);
		ctx.translate(-cx, -cy);
	}

	const ecx = e.x + e.w / 2;

	// Shadow
	ctx.fillStyle = 'rgba(0,0,0,0.3)';
	ctx.beginPath();
	ctx.ellipse(ecx, e.y + e.h + 2, e.w / 2 - 2, 4, 0, 0, Math.PI * 2);
	ctx.fill();

	// Body with gradient
	const bodyGrad = ctx.createLinearGradient(e.x, e.y, e.x + e.w, e.y);
	bodyGrad.addColorStop(0, e.accent);
	bodyGrad.addColorStop(0.3, e.color);
	bodyGrad.addColorStop(0.7, e.color);
	bodyGrad.addColorStop(1, e.accent);
	ctx.fillStyle = bodyGrad;
	ctx.beginPath();
	ctx.roundRect(e.x + 3, e.y, e.w - 6, e.h, 5);
	ctx.fill();

	// Body outline
	ctx.strokeStyle = 'rgba(255,255,255,0.08)';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(e.x + 3, e.y, e.w - 6, e.h, 5);
	ctx.stroke();

	// Side panels
	ctx.fillStyle = e.accent;
	ctx.fillRect(e.x, e.y + 10, 4, e.h - 20);
	ctx.fillRect(e.x + e.w - 4, e.y + 10, 4, e.h - 20);

	// Windshield
	const windGrad = ctx.createLinearGradient(e.x, e.y + e.h - 18, e.x, e.y + e.h - 6);
	windGrad.addColorStop(0, '#1a1a1acc');
	windGrad.addColorStop(1, '#33333388');
	ctx.fillStyle = windGrad;
	ctx.beginPath();
	ctx.roundRect(e.x + 7, e.y + e.h - 18, e.w - 14, 12, 2);
	ctx.fill();

	// Headlights
	const headGlow = (Math.sin(now / 200 + e.x) + 1) / 2 * 0.3 + 0.7;
	ctx.fillStyle = `rgba(255, 255, 200, ${headGlow})`;
	ctx.beginPath();
	ctx.arc(e.x + 7, e.y + 2, 3, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(e.x + e.w - 7, e.y + 2, 3, 0, Math.PI * 2);
	ctx.fill();

	// Badge plate
	const labelW = e.w - 8;
	const labelH = 14;
	const labelX = e.x + 4;
	const labelY = e.y + e.h / 2 - labelH / 2;
	ctx.fillStyle = 'rgba(0,0,0,0.6)';
	ctx.beginPath();
	ctx.roundRect(labelX, labelY, labelW, labelH, 3);
	ctx.fill();
	ctx.strokeStyle = e.badge + '88';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.roundRect(labelX, labelY, labelW, labelH, 3);
	ctx.stroke();

	// Badge text
	ctx.fillStyle = '#ffffff';
	ctx.font = 'bold 10px monospace';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(e.name, ecx, e.y + e.h / 2);

	// HP indicator
	if (e.maxHp > 1) {
		const barW = e.w - 10;
		const barH = 4;
		const barX = e.x + 5;
		const barY = e.y + 4;
		ctx.fillStyle = '#00000088';
		ctx.beginPath();
		ctx.roundRect(barX, barY, barW, barH, 2);
		ctx.fill();
		ctx.fillStyle = e.hp > 1 ? COLOR.amber : COLOR.red;
		ctx.beginPath();
		ctx.roundRect(barX, barY, barW * (e.hp / e.maxHp), barH, 2);
		ctx.fill();
	}

	// Taillights
	ctx.fillStyle = '#ef4444';
	ctx.fillRect(e.x + 4, e.y + e.h - 3, 5, 4);
	ctx.fillRect(e.x + e.w - 9, e.y + e.h - 3, 5, 4);
	ctx.fillStyle = '#ef444444';
	ctx.fillRect(e.x + 2, e.y + e.h + 1, 9, 6);
	ctx.fillRect(e.x + e.w - 11, e.y + e.h + 1, 9, 6);

	// Wheels
	ctx.fillStyle = '#222';
	ctx.fillRect(e.x, e.y + 12, 3, 8);
	ctx.fillRect(e.x + e.w - 3, e.y + 12, 3, 8);
	ctx.fillRect(e.x, e.y + e.h - 20, 3, 8);
	ctx.fillRect(e.x + e.w - 3, e.y + e.h - 20, 3, 8);

	ctx.restore();
}

export function drawEnemyBullets(ctx, bullets) {
	ctx.fillStyle = COLOR.red;
	for (const b of bullets) {
		ctx.beginPath();
		ctx.roundRect(b.x, b.y, b.w, b.h, 2);
		ctx.fill();
		// Tracer glow
		ctx.fillStyle = '#ef444444';
		ctx.fillRect(b.x - 1, b.y + b.h, b.w + 2, 8);
		ctx.fillStyle = COLOR.red;
	}
}
