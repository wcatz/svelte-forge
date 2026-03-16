import {
	CANVAS_W, CANVAS_H, STRIPE_H, STRIPE_GAP,
	ROAD_SPEED, ENEMY_BULLET_DAMAGE, DELEGATOR_FORGE_BONUS, COLOR,
} from './constants.js';
import { createBattery, updateBattery, isDead, getPercent } from './battery.js';
import { createPlayer, updatePlayer, drawRV } from './player.js';
import { createEnemyState, spawnEnemy, updateEnemies, startSpinOut, drawEnemy, drawEnemyBullets } from './enemies.js';
import { createWeaponsState, toggleShield, updateShield, updateWeapons, updateBlackTank, fireEmp, isInShieldRange, isInEmpRange, jamShield, drawShield, drawEmpBlast, drawTankSlicks } from './weapons.js';
import { createBlockForge, updateBlockForge, attemptForge } from './block-forge.js';
import { createPowerupState, maybeSpawnPowerup, updatePowerups, collectPowerups, drawPowerups } from './powerups.js';
import { createDelegatorState, maybeSpawnDelegator, updateDelegators, collectDelegators, drawDelegators } from './delegators.js';
import { createEffectsState, addExplosion, addShieldHit, addForgeParticles, addEmpFlash, updateEffects, drawEffects } from './effects.js';
import { drawBackground, drawMobileButtons } from './renderer.js';
import { drawHUD, drawTitleScreen, drawGameOver } from './hud.js';
import { getMoveDirection, wantsEmp, wantsShield, wantsDump, wantsForge, wantsStart } from './input.js';
import {
	sfxShieldHit, sfxShieldOn, sfxShieldOff, sfxShieldJam, sfxEmp, sfxExplosion, sfxDelegator,
	sfxForgeSuccess, sfxForgeMiss, sfxPlayerHit, sfxPowerup, sfxDump,
	sfxGameOver, sfxStart, startMusic, stopMusic,
} from './audio.js';

export function createGame() {
	return {
		state: 'title', // title | playing | dying | gameover
		battery: createBattery(),
		player: createPlayer(),
		enemies: createEnemyState(),
		weapons: createWeaponsState(),
		forge: createBlockForge(),
		powerups: createPowerupState(),
		delegators: createDelegatorState(),
		effects: createEffectsState(),
		score: 0,
		highScore: 0,
		lives: 3,
		roadSpeed: ROAD_SPEED,
		stripeOffset: 0,
		distance: 0,
		lastTime: 0,
		dyingUntil: 0,
		dyingSpeed: 0,
		playerName: null,
		leaderboard: [],
		nightMultiplier: 1, // 10 for delegators, 1 for others
	};
}

export function resetGame(game) {
	game.battery = createBattery();
	game.player = createPlayer();
	game.enemies = createEnemyState();
	game.weapons = createWeaponsState();
	game.forge = createBlockForge();
	game.powerups = createPowerupState();
	game.delegators = createDelegatorState();
	game.effects = createEffectsState();
	game.score = 0;
	game.lives = 3;
	game.roadSpeed = ROAD_SPEED;
	game.stripeOffset = 0;
	game.distance = 0;
	game.lastTime = performance.now();
	game.state = 'playing';
	game.dyingUntil = 0;
	game.dyingSpeed = 0;
}

// Demo AI state — cycles through abilities on a timer
let demoPhase = 0; // 0=cruise, 1=shield, 2=tank dump, 3=emp
let demoPhaseStart = 0;
const DEMO_PHASE_DURATIONS = [3000, 2500, 2000, 800]; // ms per phase

function demoAI(game, now) {
	const px = game.player.x + game.player.w / 2;
	const py = game.player.y + game.player.h / 2;
	let moveX = 0;
	let moveY = 0;

	// Cycle through phases to showcase abilities
	if (!demoPhaseStart) demoPhaseStart = now;
	if (now - demoPhaseStart > DEMO_PHASE_DURATIONS[demoPhase]) {
		demoPhase = (demoPhase + 1) % DEMO_PHASE_DURATIONS.length;
		demoPhaseStart = now;
	}

	// Keep battery topped up so demo never dies
	game.battery.level = Math.max(game.battery.level, 600);

	// --- Threat assessment: find all nearby enemies ---
	const threats = [];
	for (const e of game.enemies.list) {
		if (e.spinning) continue;
		const ex = e.x + e.w / 2;
		const ey = e.y + e.h / 2;
		const dx = ex - px;
		const dy = ey - py;
		const d = Math.sqrt(dx * dx + dy * dy);
		if (d < 250) threats.push({ e, ex, ey, dx, dy, d });
	}

	// --- Find nearest pickup (delegator or powerup) ---
	let pickupTarget = null;
	let pickupDist = Infinity;
	// Only seek pickups when shield is off (can't collect delegators with shield on)
	if (!game.weapons.shieldActive) {
		for (const d of game.delegators.list) {
			const dx = (d.x + d.w / 2) - px;
			const dy = (d.y + d.h / 2) - py;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < pickupDist && dy < 100 && dy > -200) {
				pickupDist = dist;
				pickupTarget = { x: d.x + d.w / 2, y: d.y + d.h / 2 };
			}
		}
	}
	for (const p of game.powerups.list) {
		const dx = (p.x + p.w / 2) - px;
		const dy = (p.y + p.h / 2) - py;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < pickupDist && dy < 100 && dy > -200) {
			pickupDist = dist;
			pickupTarget = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
		}
	}

	// --- Steering: dodge enemies, seek pickups ---
	if (threats.length > 0) {
		// Compute avoidance vector — flee from all nearby threats
		let avoidX = 0;
		let avoidY = 0;
		for (const t of threats) {
			// Stronger push the closer the enemy is
			const weight = 1 - (t.d / 250);
			// Check if enemy is actually in our path (within our width)
			const lateralDist = Math.abs(t.dx);
			if (lateralDist < 50) {
				// Directly in our lane — strong dodge
				avoidX += (t.dx > 0 ? -1 : 1) * weight * 1.5;
				// If enemy is ahead and close, slow down (move down)
				if (t.dy < 0 && t.dy > -120) avoidY += weight * 0.5;
			} else {
				// Off to the side — gentle push away
				avoidX += (t.dx > 0 ? -1 : 1) * weight * 0.3;
			}
		}
		moveX = Math.max(-1, Math.min(1, avoidX));
		moveY = Math.max(-0.5, Math.min(0.5, avoidY));

		// If we have a pickup nearby and can reach it safely, blend toward it
		if (pickupTarget && pickupDist < 150) {
			const toPick = (pickupTarget.x - px) > 0 ? 0.4 : -0.4;
			// Only go for pickup if it doesn't conflict with avoidance
			if (Math.sign(toPick) === Math.sign(moveX) || Math.abs(moveX) < 0.3) {
				moveX = moveX * 0.5 + toPick;
			}
		}
	} else if (pickupTarget && pickupDist < 200) {
		// No threats — go straight for the pickup
		const dx = pickupTarget.x - px;
		const dy = pickupTarget.y - py;
		moveX = dx > 10 ? 0.8 : dx < -10 ? -0.8 : 0;
		moveY = dy > 20 ? 0.3 : dy < -20 ? -0.3 : 0;
	} else {
		// Cruise — gentle weave to look natural
		moveX = Math.sin(now / 800) * 0.5;
		moveY = Math.sin(now / 1200) * 0.25;
	}

	// --- Abilities by phase ---
	const wantsShieldOn = demoPhase === 1;
	const wantsTankDump = demoPhase === 2;
	const wantsEmpFire = demoPhase === 3 && now - demoPhaseStart < 100;

	// Reactive shield: also turn on if enemy is dangerously close head-on
	const immediateThreat = threats.some(t => t.d < 80 && Math.abs(t.dx) < 40);
	const shieldOn = wantsShieldOn || immediateThreat;

	// Shield
	toggleShield(game.weapons, game.battery, shieldOn, now);
	if (shieldOn) updateShield(game.weapons, game.battery);

	// Black tank dump
	if (wantsTankDump) {
		updateBlackTank(game.weapons, game.battery, game.player, now, true);
	}

	// EMP blast
	if (wantsEmpFire) {
		if (fireEmp(game.weapons, game.battery, now)) {
			addEmpFlash(game.effects, now);
			for (let i = game.enemies.list.length - 1; i >= 0; i--) {
				const e = game.enemies.list[i];
				if (isInEmpRange(game.player, e)) {
					addExplosion(game.effects, e.x + e.w / 2, e.y + e.h / 2);
					game.enemies.list.splice(i, 1);
				}
			}
		}
	}

	return { moveX, moveY };
}

export function tick(game, input, now) {
	if (game.state === 'title') {
		// --- Attract mode demo ---
		if (!game.lastTime) game.lastTime = now;
		const dt = Math.min(now - game.lastTime, 32);
		game.lastTime = now;

		game.roadSpeed = ROAD_SPEED;
		game.stripeOffset = (game.stripeOffset + game.roadSpeed) % (STRIPE_H + STRIPE_GAP);
		game.distance += game.roadSpeed;

		// AI-controlled player with ability showcase
		const { moveX, moveY } = demoAI(game, now);
		updatePlayer(game.player, moveX, moveY);

		// Spawn and move enemies
		spawnEnemy(game.enemies, now, game.distance, game.roadSpeed);
		updateEnemies(game.enemies, game.roadSpeed, game.player, now);

		// Update weapons (tank segment movement, EMP flash expiry)
		updateWeapons(game.weapons, now, game.roadSpeed);
		updateBattery(game.battery, now);

		// Powerups
		if (now - game.enemies.lastSpawn < 50) {
			maybeSpawnPowerup(game.powerups, game.distance);
		}
		updatePowerups(game.powerups, game.roadSpeed);

		// Delegators
		if (now - game.enemies.lastSpawn < 50) {
			maybeSpawnDelegator(game.delegators, game.distance);
		}
		updateDelegators(game.delegators, game.roadSpeed);

		// Effects
		updateEffects(game.effects, now, 80);

		// Shield destroys enemies on contact in demo
		if (game.weapons.shieldActive) {
			for (let i = game.enemies.list.length - 1; i >= 0; i--) {
				const e = game.enemies.list[i];
				if (!e.spinning && isInShieldRange(game.player, e)) {
					startSpinOut(e, game.player);
				}
			}
		}

		// Tank slick spins out enemies in demo
		for (const seg of game.weapons.tankSegments) {
			for (let i = game.enemies.list.length - 1; i >= 0; i--) {
				const e = game.enemies.list[i];
				if (e.spinning) continue;
				if (e.x < seg.x + seg.w && e.x + e.w > seg.x &&
					e.y < seg.y + seg.h && e.y + e.h > seg.y) {
					startSpinOut(e, game.player);
				}
			}
		}

		// Clean up off-screen enemies
		game.enemies.list = game.enemies.list.filter(e => e.y < CANVAS_H + 50 && e.y > -100);

		// Turn off tank dump when not in that phase
		if (demoPhase !== 2) {
			game.weapons.tankDumping = false;
		}

		if (wantsStart(input)) {
			demoPhase = 0;
			demoPhaseStart = 0;
			game.weapons.shieldActive = false;
			game.weapons.tankDumping = false;
			resetGame(game);
			sfxStart();
			input.keys[' '] = false;
			input.keys['Enter'] = false;
		}
		return;
	}

	if (game.state === 'gameover') {
		if (wantsStart(input)) {
			resetGame(game);
			sfxStart();
			startMusic();
			input.keys[' '] = false;
			input.keys['Enter'] = false;
		}
		return;
	}

	if (game.state === 'dying') {
		game.dyingSpeed = Math.max(0, game.dyingSpeed - 0.05);
		game.stripeOffset = (game.stripeOffset + game.dyingSpeed) % (STRIPE_H + STRIPE_GAP);
		updateEffects(game.effects, now, 0);

		if (now > game.dyingUntil) {
			game.state = 'gameover';
			if (game.score > game.highScore) game.highScore = game.score;
		}
		return;
	}

	// === PLAYING STATE ===
	const dt = Math.min(now - game.lastTime, 32);
	game.lastTime = now;

	// Road scroll
	game.roadSpeed = ROAD_SPEED;
	game.stripeOffset = (game.stripeOffset + game.roadSpeed) % (STRIPE_H + STRIPE_GAP);
	game.distance += game.roadSpeed;

	// Score from distance
	game.score = Math.max(game.score, Math.floor(game.distance / 10));

	// --- Battery ---
	updateBattery(game.battery, now);

	// --- Player movement ---
	const { moveX, moveY } = getMoveDirection(input);
	updatePlayer(game.player, moveX, moveY);

	// --- Weapons ---
	const shieldWasBefore = game.weapons.shieldActive;
	toggleShield(game.weapons, game.battery, wantsShield(input), now);
	updateShield(game.weapons, game.battery);
	if (game.weapons.shieldActive && !shieldWasBefore) sfxShieldOn();
	else if (!game.weapons.shieldActive && shieldWasBefore) sfxShieldOff();

	// EMP blast (E key / touch)
	if (wantsEmp(input)) {
		if (fireEmp(game.weapons, game.battery, now)) {
			addEmpFlash(game.effects, now);
			sfxEmp();
		}
		input.keys['e'] = false;
		input.keys['E'] = false;
	}

	// Black tank
	updateBlackTank(game.weapons, game.battery, game.player, now, wantsDump(input));
	updateWeapons(game.weapons, now, game.roadSpeed);

	// --- Block forge (delegators speed it up) ---
	const delegatorBonus = game.delegators.count * DELEGATOR_FORGE_BONUS;
	updateBlockForge(game.forge, now, dt, delegatorBonus);

	if (wantsForge(input) && game.forge.forgeWindow) {
		const pts = attemptForge(game.forge, game.battery, now, game.nightMultiplier);
		if (pts > 0) {
			game.score += pts;
			addForgeParticles(game.effects, game.player.x + game.player.w / 2, game.player.y + game.player.h / 2);
			sfxForgeSuccess();
		}
		input.keys['f'] = false;
		input.keys['F'] = false;
	}

	// Missed forge → lose a delegator
	if (game.forge.missed && game.delegators.count > 0) {
		// Only deduct once per miss (check if missedAt is fresh)
		if (now - game.forge.missedAt < 50) {
			game.delegators.count = Math.max(0, game.delegators.count - 1);
			sfxForgeMiss();
		}
	}

	// --- Enemies ---
	spawnEnemy(game.enemies, now, game.distance, game.roadSpeed);
	updateEnemies(game.enemies, game.roadSpeed, game.player, now);

	// --- Delegators ---
	if (now - game.enemies.lastSpawn < 50) {
		maybeSpawnDelegator(game.delegators, game.distance);
	}
	updateDelegators(game.delegators, game.roadSpeed);
	const delegatorsBefore = game.delegators.count;
	collectDelegators(game.delegators, game.player, now, game.weapons.shieldActive);
	if (game.delegators.count > delegatorsBefore) sfxDelegator();

	// --- Powerups ---
	if (now - game.enemies.lastSpawn < 50) {
		maybeSpawnPowerup(game.powerups, game.distance);
	}
	updatePowerups(game.powerups, game.roadSpeed);
	const puBefore = game.powerups.list.length;
	collectPowerups(game.powerups, game.player, game.battery, now);
	if (game.powerups.list.length < puBefore) sfxPowerup();

	// --- Collisions ---

	// Shield-enemy — spin off instead of explode
	if (game.weapons.shieldActive) {
		const pcx = game.player.x + game.player.w / 2;
		for (let j = game.enemies.list.length - 1; j >= 0; j--) {
			const enemy = game.enemies.list[j];
			if (enemy.spinning) continue;
			if (isInShieldRange(game.player, enemy)) {
				const ecx = enemy.x + enemy.w / 2;
				const ecy = enemy.y + enemy.h / 2;
				addShieldHit(game.effects, ecx, ecy);
				startSpinOut(enemy, pcx);
				game.score += enemy.points;
				sfxShieldHit();
			}
		}
	}

	// EMP blast
	if (game.weapons.empBlastActive) {
		for (let j = game.enemies.list.length - 1; j >= 0; j--) {
			const enemy = game.enemies.list[j];
			if (enemy.spinning) continue;
			if (isInEmpRange(game.player, enemy)) {
				enemy.hp = 0;
				addExplosion(game.effects, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
				game.score += enemy.points;
				game.enemies.list.splice(j, 1);
			}
		}
	}

	// Tank segment-enemy collisions
	for (const seg of game.weapons.tankSegments) {
		const scx = seg.x + seg.w / 2;
		for (let j = game.enemies.list.length - 1; j >= 0; j--) {
			const enemy = game.enemies.list[j];
			if (!enemy.spinning && rectCollide(seg, enemy)) {
				startSpinOut(enemy, scx);
				game.score += enemy.points;
			}
		}
	}

	// Chain collisions — spinning enemies knock others off the road
	for (let i = 0; i < game.enemies.list.length; i++) {
		const spinner = game.enemies.list[i];
		if (!spinner.spinning) continue;
		const scx = spinner.x + spinner.w / 2;
		for (let j = game.enemies.list.length - 1; j >= 0; j--) {
			if (i === j) continue;
			const target = game.enemies.list[j];
			if (target.spinning) continue;
			if (rectCollide(spinner, target)) {
				startSpinOut(target, scx);
				game.score += target.points;
			}
		}
	}

	// Explosions for enemies that spun off-road
	const spinningBefore = game.enemies.list.filter(e => e.spinning);
	updateEnemies(game.enemies, game.roadSpeed, game.player, now);
	for (const e of spinningBefore) {
		if (!game.enemies.list.includes(e)) {
			addExplosion(game.effects, e.x + e.w / 2, e.y + e.h / 2);
		}
	}

	// Enemy bullets hitting player
	for (let i = game.enemies.bullets.length - 1; i >= 0; i--) {
		const b = game.enemies.bullets[i];
		if (rectCollide(game.player, b)) {
			game.enemies.bullets.splice(i, 1);
			if (!game.weapons.shieldActive) {
				game.lives -= ENEMY_BULLET_DAMAGE;
				sfxPlayerHit();
				if (game.lives <= 0) {
					game.battery.level = 0;
				}
			}
		}
	}

	// Shield blocks enemy bullets
	if (game.weapons.shieldActive) {
		for (let i = game.enemies.bullets.length - 1; i >= 0; i--) {
			const b = game.enemies.bullets[i];
			const bcx = b.x + b.w / 2;
			const bcy = b.y + b.h / 2;
			const pcx = game.player.x + game.player.w / 2;
			const pcy = game.player.y + game.player.h / 2;
			const dx = pcx - bcx;
			const dy = pcy - bcy;
			if (Math.sqrt(dx * dx + dy * dy) < 48) {
				addShieldHit(game.effects, bcx, bcy);
				sfxShieldHit();
				game.enemies.bullets.splice(i, 1);
			}
		}
	}

	// Player-enemy collisions — spin off instead of explode
	const playerCx = game.player.x + game.player.w / 2;
	for (let i = game.enemies.list.length - 1; i >= 0; i--) {
		const enemy = game.enemies.list[i];
		if (enemy.spinning) continue;
		if (rectCollide(game.player, enemy)) {
			startSpinOut(enemy, playerCx);

			// Rear hit (pursuer) jams shield for 2 seconds
			if (enemy.pursuing && game.weapons.shieldActive) {
				jamShield(game.weapons, now);
				sfxShieldJam();
			} else if (!game.weapons.shieldActive) {
				game.lives--;
				sfxPlayerHit();
				if (game.lives <= 0) {
					game.battery.level = 0;
				}
			}
		}
	}

	// --- Battery death check ---
	if (isDead(game.battery)) {
		game.state = 'dying';
		game.dyingUntil = now + 2000;
		game.dyingSpeed = game.roadSpeed;
		game.weapons.shieldActive = false;
		sfxGameOver();
		stopMusic();
	}

	// --- Effects ---
	updateEffects(game.effects, now, getPercent(game.battery));
}

export function render(ctx, game, now) {
	drawBackground(ctx, game.stripeOffset);

	if (game.state === 'title') {
		drawGameEntities(ctx, game, now);
		drawTitleScreen(ctx, now, game.playerName);
		return;
	}

	if (game.state === 'gameover') {
		drawGameEntities(ctx, game, now);
		drawGameOver(ctx, game, now);
		return;
	}

	drawGameEntities(ctx, game, now);
	drawHUD(ctx, game, now);

	if (game.state === 'dying') {
		const alpha = Math.sin(now / 50) * 0.15 + 0.15;
		ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
		ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

		ctx.fillStyle = COLOR.red;
		ctx.font = 'bold 18px monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('POWER FAILURE', CANVAS_W / 2, CANVAS_H / 2);
	}
}

function drawGameEntities(ctx, game, now) {
	// Tank slicks (under everything)
	drawTankSlicks(ctx, game.weapons.tankSegments, now);

	// Powerups
	drawPowerups(ctx, game.powerups, now);

	// Enemies
	for (const e of game.enemies.list) {
		drawEnemy(ctx, e, now);
	}

	// Enemy bullets
	drawEnemyBullets(ctx, game.enemies.bullets);

	// Shield
	drawShield(ctx, game.player, game.weapons, now);

	// EMP blast
	drawEmpBlast(ctx, game.player, game.weapons, now);

	// Player RV
	const invincibleFlicker = game.lives <= 0 || (game.state === 'dying');
	if (!invincibleFlicker || Math.floor(now / 80) % 2 === 0) {
		drawRV(ctx, game.player, now);
	}

	// Delegators (drawn on top of shield so they stay visible)
	drawDelegators(ctx, game.delegators, now);

	// Effects (particles, flashes)
	drawEffects(ctx, game.effects, now, CANVAS_W, CANVAS_H);

	// Mobile buttons on grass shoulders
	drawMobileButtons(ctx, game.weapons.shieldActive, game.forge.forgeWindow, now);
}

function rectCollide(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
