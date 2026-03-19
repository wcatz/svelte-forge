import { COLOR } from './constants.js';

export function createEffectsState() {
	return {
		particles: [],
		forgeRipples: [],   // expanding concentric rings from Starlink dish
		screenFlash: null,  // { color, until }
		batteryWarning: false,
	};
}

export function addExplosion(effects, x, y) {
	for (let i = 0; i < 10; i++) {
		const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
		const speed = 1.5 + Math.random() * 3;
		effects.particles.push({
			x, y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			size: 3 + Math.random() * 5,
			colorIdx: Math.floor(Math.random() * COLOR.explosion.length),
			type: 'explosion',
		});
	}
}

export function addForgeParticles(effects, cx, cy) {
	// Starlink dish is at top of RV (cy - half height + 19px offset)
	const dishY = cy - 17; // approximate dish position from center

	// Spawn staggered ripple rings from dish
	for (let i = 0; i < 5; i++) {
		effects.forgeRipples.push({
			x: cx,
			y: dishY,
			radius: 4,
			maxRadius: 80 + i * 30, // each ring travels further
			life: 1.0,
			speed: 220 + i * 40,    // px per second — fast expansion
			delay: i * 60,          // stagger 60ms apart
			born: performance.now(),
		});
	}

	// Small sparks from the dish
	for (let i = 0; i < 8; i++) {
		const angle = (Math.PI * 2 * i) / 8;
		const speed = 1.5 + Math.random() * 2;
		effects.particles.push({
			x: cx, y: dishY,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			size: 1.5 + Math.random() * 2,
			color: COLOR.forgeFlash,
			type: 'forge',
		});
	}
}

export function addShieldHit(effects, x, y) {
	// Bright sparks radiating from impact point on shield
	for (let i = 0; i < 12; i++) {
		const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
		const speed = 3 + Math.random() * 4;
		effects.particles.push({
			x, y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			size: 3 + Math.random() * 4,
			type: 'shield',
		});
	}
}

export function addEmpFlash(effects, now) {
	effects.screenFlash = { color: 'rgba(168, 85, 247, 0.3)', until: now + 600 };
}

export function addEmpKillExplosion(effects, x, y) {
	// Big purple/white burst per killed enemy
	for (let i = 0; i < 18; i++) {
		const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
		const speed = 3 + Math.random() * 6;
		effects.particles.push({
			x, y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			size: 4 + Math.random() * 7,
			type: 'emp',
		});
	}
}

export function updateEffects(effects, now, batteryPercent) {
	effects.batteryWarning = batteryPercent < 20;

	// Update particles
	effects.particles = effects.particles.filter(p => {
		p.x += p.vx;
		p.y += p.vy;
		p.life -= 0.025;
		p.vx *= 0.96;
		p.vy *= 0.96;
		return p.life > 0;
	});

	// Update forge ripples
	effects.forgeRipples = effects.forgeRipples.filter(r => {
		const age = now - r.born;
		if (age < r.delay) return true; // waiting to start
		const active = age - r.delay;
		r.radius = 4 + (r.speed * active) / 1000;
		r.life = 1 - r.radius / r.maxRadius;
		return r.life > 0;
	});

	// Clear expired screen flash
	if (effects.screenFlash && now > effects.screenFlash.until) {
		effects.screenFlash = null;
	}
}

export function drawEffects(ctx, effects, now, canvasW, canvasH) {
	// Forge ripple waves — concentric rings expanding from Starlink dish
	for (const r of effects.forgeRipples) {
		if (r.life <= 0 || now - r.born < r.delay) continue;
		ctx.globalAlpha = r.life * 0.6;
		ctx.strokeStyle = r.life > 0.5 ? '#4ade80' : '#22c55e';
		ctx.lineWidth = 2 * r.life;
		ctx.beginPath();
		ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.globalAlpha = 1;

	// Particles
	for (const p of effects.particles) {
		ctx.globalAlpha = p.life;
		if (p.type === 'shield') {
			ctx.fillStyle = p.life > 0.5 ? '#fff' : COLOR.cyan;
		} else if (p.type === 'emp') {
			ctx.fillStyle = p.life > 0.6 ? '#ffffff' : p.life > 0.3 ? '#e879f9' : '#a855f7';
		} else if (p.type === 'forge') {
			ctx.fillStyle = p.color;
		} else {
			ctx.fillStyle = COLOR.explosion[p.colorIdx];
		}
		ctx.beginPath();
		ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.globalAlpha = 1;

	// Screen flash (EMP, etc.)
	if (effects.screenFlash) {
		ctx.fillStyle = effects.screenFlash.color;
		ctx.fillRect(0, 0, canvasW, canvasH);
	}

	// Battery low warning — red edge pulse
	if (effects.batteryWarning) {
		const pulse = (Math.sin(now / 200) + 1) / 2;
		const alpha = pulse * 0.3;
		const grad = ctx.createLinearGradient(0, 0, 30, 0);
		grad.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
		grad.addColorStop(1, 'transparent');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 30, canvasH);

		const grad2 = ctx.createLinearGradient(canvasW, 0, canvasW - 30, 0);
		grad2.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
		grad2.addColorStop(1, 'transparent');
		ctx.fillStyle = grad2;
		ctx.fillRect(canvasW - 30, 0, 30, canvasH);
	}
}
