import { COLOR } from './constants.js';

export function createEffectsState() {
	return {
		particles: [],
		screenFlash: null, // { color, until }
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
	for (let i = 0; i < 16; i++) {
		const angle = (Math.PI * 2 * i) / 16;
		const speed = 2 + Math.random() * 2;
		effects.particles.push({
			x: cx, y: cy,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life: 1.0,
			size: 2 + Math.random() * 3,
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
	effects.screenFlash = { color: '#ef444444', until: now + 300 };
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

	// Clear expired screen flash
	if (effects.screenFlash && now > effects.screenFlash.until) {
		effects.screenFlash = null;
	}
}

export function drawEffects(ctx, effects, now, canvasW, canvasH) {
	// Particles
	for (const p of effects.particles) {
		ctx.globalAlpha = p.life;
		if (p.type === 'shield') {
			ctx.fillStyle = p.life > 0.5 ? '#fff' : COLOR.cyan;
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
